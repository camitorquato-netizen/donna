/**
 * Webhook ZapSign — POST /api/webhook/zapsign
 *
 * Recebe eventos da ZapSign quando um documento é assinado.
 * 1. Valida o token
 * 2. Cria/atualiza contrato no Donna
 * 3. Vincula ao cliente pelo email ou CPF/CNPJ do signatário
 * 4. Dispara notificações (WhatsApp, Email, SMS)
 *
 * Eventos processados: "doc_signed"
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { zapsignConfig } from "@/lib/zapsign/config";
import { sendWhatsApp } from "@/lib/zapsign/whatsapp";
import { sendEmail } from "@/lib/zapsign/email";
import { sendSMS } from "@/lib/zapsign/sms";
import { logNotification } from "@/lib/zapsign/logger";
import type { ChannelResult } from "@/lib/zapsign/config";

/* ------------------------------------------------------------------ */
/*  Supabase admin client (bypass RLS for webhook)                     */
/* ------------------------------------------------------------------ */

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/* ------------------------------------------------------------------ */
/*  Tipos do payload ZapSign (formato real da API)                     */
/* ------------------------------------------------------------------ */

interface ZapSignSigner {
  token?: string;
  name?: string;
  email?: string;
  phone_country?: string;
  phone_number?: string;
  cpf?: string;
  cnpj?: string;
  status?: string;
  signed_at?: string;
  external_id?: string;
}

interface ZapSignPayload {
  event_type?: string;
  token?: string;
  name?: string;
  external_id?: string;
  status?: string;
  signed_file?: string;
  original_file?: string;
  created_at?: string;
  signers?: ZapSignSigner[];
  signer_who_signed?: ZapSignSigner;
  // Formato antigo (doc wrapper) — retrocompatibilidade
  doc?: {
    name?: string;
    token?: string;
    signers?: ZapSignSigner[];
  };
  signer?: ZapSignSigner;
  [key: string]: unknown;
}

/* ------------------------------------------------------------------ */
/*  Eventos que nos interessam                                         */
/* ------------------------------------------------------------------ */

const VALID_EVENTS = new Set(["doc_signed", "signed", "signer_signed"]);

/* ------------------------------------------------------------------ */
/*  Handler POST                                                       */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  try {
    // 1) Validar token do webhook
    const token = req.headers.get("x-zapsign-token") || "";

    if (
      zapsignConfig.webhookToken &&
      token !== zapsignConfig.webhookToken
    ) {
      console.warn("[ZapSign] Token inválido recebido");
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 401 }
      );
    }

    // 2) Parsear payload
    const payload: ZapSignPayload = await req.json();
    const eventType = payload.event_type || "";

    console.log(`[ZapSign] Evento: ${eventType}`);

    // 3) Aceitar qualquer evento de assinatura
    if (!VALID_EVENTS.has(eventType)) {
      return NextResponse.json({
        status: "ignored",
        reason: `Evento "${eventType}" não requer processamento`,
      });
    }

    // 4) Extrair dados do documento e signatário
    const docName = payload.name || payload.doc?.name || "Documento";
    const docToken = payload.token || payload.doc?.token || "";
    const signedFileUrl = payload.signed_file || "";
    const signer = extractSigner(payload);

    // 6) Criar/atualizar contrato no Donna + vincular cliente
    const contratoResult = await upsertContrato({
      docName,
      docToken,
      signedFileUrl,
      externalId: payload.external_id || "",
      signer,
    });

    // 7) Disparar notificações em paralelo
    const results = await Promise.allSettled([
      signer.phone
        ? sendWhatsApp(signer.phone, signer.name, docName)
        : Promise.resolve({
            channel: "whatsapp" as const,
            success: false,
            error: "Sem telefone",
          }),
      signer.email
        ? sendEmail(signer.email, signer.name, docName, signer.signedAt)
        : Promise.resolve({
            channel: "email" as const,
            success: false,
            error: "Sem e-mail",
          }),
      signer.phone
        ? sendSMS(signer.phone, signer.name, docName)
        : Promise.resolve({
            channel: "sms" as const,
            success: false,
            error: "Sem telefone",
          }),
    ]);

    // 8) Coletar resultados
    const channelResults: ChannelResult[] = results.map((r) => {
      if (r.status === "fulfilled") return r.value;
      return {
        channel: "whatsapp" as const,
        success: false,
        error: r.reason?.message || "Erro desconhecido",
      };
    });

    // 9) Log no Supabase
    logNotification({
      event_type: eventType,
      document_name: docName,
      signer_name: signer.name,
      signer_email: signer.email || "",
      signer_phone: signer.phone || "",
      results: channelResults,
      payload_raw: JSON.stringify(payload).slice(0, 5000),
    });

    // 10) Responder 200
    const summary = channelResults.map(
      (r) => `${r.channel}: ${r.success ? "OK" : r.error}`
    );
    console.log(`[ZapSign] Notificações: ${summary.join(" | ")}`);

    return NextResponse.json({
      status: "processed",
      signer: signer.name,
      document: docName,
      contrato: contratoResult,
      channels: channelResults,
    });
  } catch (err) {
    console.error("[ZapSign] Erro no webhook:", err);
    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/*  Criar/atualizar contrato no Donna                                  */
/* ------------------------------------------------------------------ */

async function upsertContrato(params: {
  docName: string;
  docToken: string;
  signedFileUrl: string;
  externalId: string;
  signer: ReturnType<typeof extractSigner>;
}): Promise<{ action: string; contratoId: string; clienteId: string | null }> {
  const { docName, docToken, signedFileUrl, externalId, signer } = params;
  const supabase = getSupabase();

  try {
    // 1) Verificar se já existe contrato com este token ZapSign
    let contratoId: string | null = null;

    if (docToken) {
      const { data: existing } = await supabase
        .from("contratos")
        .select("id")
        .eq("zapsign_doc_token", docToken)
        .maybeSingle();

      if (existing) {
        contratoId = existing.id;
      }
    }

    // 2) Se external_id foi definido, pode ser o ID do contrato no Donna
    if (!contratoId && externalId) {
      const { data: existing } = await supabase
        .from("contratos")
        .select("id")
        .eq("id", externalId)
        .maybeSingle();

      if (existing) {
        contratoId = existing.id;
      }
    }

    // 3) Buscar cliente pelo email ou CPF/CNPJ do signatário
    const clienteId = await findClienteBySignerInfo(signer);

    // 4) Criar ou atualizar contrato
    const now = new Date().toISOString();

    if (contratoId) {
      // Atualizar contrato existente
      const { error } = await supabase
        .from("contratos")
        .update({
          status: "assinado",
          zapsign_doc_token: docToken || undefined,
          zapsign_signed_at: signer.signedAt || now,
          zapsign_signer_name: signer.name,
          zapsign_signer_email: signer.email || null,
          arquivo_url: signedFileUrl || undefined,
          cliente_id: clienteId || undefined,
          updated_at: now,
        })
        .eq("id", contratoId);

      if (error) {
        console.error("[ZapSign] Erro ao atualizar contrato:", error.message);
      } else {
        console.log(`[ZapSign] Contrato atualizado: ${contratoId}`);
      }

      return { action: "updated", contratoId, clienteId };
    } else {
      // Criar novo contrato
      contratoId = crypto.randomUUID();

      const { error } = await supabase.from("contratos").insert({
        id: contratoId,
        cliente_id: clienteId || null,
        titulo: docName,
        objeto: "",
        arquivo_url: signedFileUrl || "",
        valor: null,
        percentual_honorarios: 0.2,
        data_entrada: now.slice(0, 10),
        vigencia: null,
        comercial_resp_id: null,
        parceiro_id: null,
        percentual_parceiro: 0,
        zapsign_doc_token: docToken,
        zapsign_signed_at: signer.signedAt || now,
        zapsign_signer_name: signer.name,
        zapsign_signer_email: signer.email || null,
        status: "assinado",
        caso_ia_id: null,
      });

      if (error) {
        console.error("[ZapSign] Erro ao criar contrato:", error.message);
      } else {
        console.log(
          `[ZapSign] Contrato criado: ${contratoId} | Cliente: ${clienteId || "não vinculado"}`
        );
      }

      return { action: "created", contratoId, clienteId };
    }
  } catch (err) {
    console.error("[ZapSign] Erro no upsertContrato:", err);
    return { action: "error", contratoId: "", clienteId: null };
  }
}

/* ------------------------------------------------------------------ */
/*  Buscar cliente pelo email ou CPF/CNPJ do signatário                */
/* ------------------------------------------------------------------ */

async function findClienteBySignerInfo(
  signer: ReturnType<typeof extractSigner>
): Promise<string | null> {
  const supabase = getSupabase();

  // Tentar por email
  if (signer.email) {
    const { data } = await supabase
      .from("clientes")
      .select("id")
      .eq("email", signer.email)
      .maybeSingle();

    if (data) {
      console.log(`[ZapSign] Cliente encontrado por email: ${signer.email}`);
      return data.id;
    }
  }

  // Tentar por CPF
  if (signer.cpf) {
    const cpfClean = signer.cpf.replace(/\D/g, "");
    const { data } = await supabase
      .from("clientes")
      .select("id")
      .eq("cpf", cpfClean)
      .maybeSingle();

    if (data) {
      console.log(`[ZapSign] Cliente encontrado por CPF`);
      return data.id;
    }
  }

  // Tentar por CNPJ
  if (signer.cnpj) {
    const cnpjClean = signer.cnpj.replace(/\D/g, "");
    const { data } = await supabase
      .from("clientes")
      .select("id")
      .eq("cnpj", cnpjClean)
      .maybeSingle();

    if (data) {
      console.log(`[ZapSign] Cliente encontrado por CNPJ`);
      return data.id;
    }
  }

  console.log(`[ZapSign] Cliente não encontrado para signatário: ${signer.name}`);
  return null;
}

/* ------------------------------------------------------------------ */
/*  Extrair dados do signatário do payload                             */
/* ------------------------------------------------------------------ */

function extractSigner(payload: ZapSignPayload): {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  cnpj: string;
  signedAt: string;
} {
  // Formato novo: signer_who_signed no root
  if (payload.signer_who_signed?.name) {
    return {
      name: payload.signer_who_signed.name,
      email: payload.signer_who_signed.email || "",
      phone: payload.signer_who_signed.phone_number || "",
      cpf: payload.signer_who_signed.cpf || "",
      cnpj: payload.signer_who_signed.cnpj || "",
      signedAt: payload.signer_who_signed.signed_at || "",
    };
  }

  // Formato antigo: signer no root
  if (payload.signer?.name) {
    return {
      name: payload.signer.name,
      email: payload.signer.email || "",
      phone: payload.signer.phone_number || "",
      cpf: payload.signer.cpf || "",
      cnpj: payload.signer.cnpj || "",
      signedAt: payload.signer.signed_at || "",
    };
  }

  // Fallback: buscar nos signers array
  const signers = payload.signers || payload.doc?.signers || [];
  const signed = signers.find((s) => s.status === "signed" || s.signed_at);

  if (signed) {
    return {
      name: signed.name || "",
      email: signed.email || "",
      phone: signed.phone_number || "",
      cpf: signed.cpf || "",
      cnpj: signed.cnpj || "",
      signedAt: signed.signed_at || "",
    };
  }

  const first = signers[0];
  return {
    name: first?.name || "",
    email: first?.email || "",
    phone: first?.phone_number || "",
    cpf: first?.cpf || "",
    cnpj: first?.cnpj || "",
    signedAt: first?.signed_at || "",
  };
}

/* ------------------------------------------------------------------ */
/*  GET — health check                                                 */
/* ------------------------------------------------------------------ */

export async function GET() {
  return NextResponse.json({
    service: "ZapSign Webhook",
    status: "active",
    features: ["contrato_auto_create", "client_auto_link", "notifications"],
    channels: {
      whatsapp: zapsignConfig.whatsapp.enabled,
      email: zapsignConfig.email.enabled,
      sms: zapsignConfig.sms.enabled,
    },
  });
}
