/**
 * Webhook ZapSign — POST /api/webhook/zapsign
 *
 * Recebe eventos da ZapSign quando um documento é assinado.
 * Valida o token, extrai dados do signatário, e dispara
 * notificações em paralelo via WhatsApp, E-mail e SMS.
 *
 * Eventos processados: "signed", "signer_signed"
 */

import { NextRequest, NextResponse } from "next/server";
import { zapsignConfig } from "@/lib/zapsign/config";
import { sendWhatsApp } from "@/lib/zapsign/whatsapp";
import { sendEmail } from "@/lib/zapsign/email";
import { sendSMS } from "@/lib/zapsign/sms";
import { logNotification } from "@/lib/zapsign/logger";
import type { ChannelResult } from "@/lib/zapsign/config";

/* ------------------------------------------------------------------ */
/*  Tipos do payload ZapSign                                           */
/* ------------------------------------------------------------------ */

interface ZapSignSigner {
  name?: string;
  email?: string;
  phone_country?: string;
  phone_number?: string;
  signed?: boolean;
  signed_at?: string;
}

interface ZapSignPayload {
  event_type?: string;
  doc?: {
    name?: string;
    token?: string;
    signers?: ZapSignSigner[];
  };
  signer?: ZapSignSigner;
  // O payload pode ter campos adicionais
  [key: string]: unknown;
}

/* ------------------------------------------------------------------ */
/*  Eventos que nos interessam                                         */
/* ------------------------------------------------------------------ */

const VALID_EVENTS = new Set(["signed", "signer_signed"]);

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

    console.log(`[ZapSign] Evento recebido: ${eventType}`);

    // 3) Filtrar apenas eventos de assinatura
    if (!VALID_EVENTS.has(eventType)) {
      return NextResponse.json({
        status: "ignored",
        reason: `Evento "${eventType}" não requer notificação`,
      });
    }

    // 4) Filtrar por nome do documento (só patrimonial)
    const documentName = payload.doc?.name || "Documento";
    const docNameLower = documentName.toLowerCase();
    const { docFilter } = zapsignConfig;

    if (docFilter.length > 0 && !docFilter.some((kw) => docNameLower.includes(kw))) {
      console.log(`[ZapSign] Documento "${documentName}" não é patrimonial — ignorado`);
      return NextResponse.json({
        status: "ignored",
        reason: `Documento não contém palavras-chave do filtro`,
        document: documentName,
        filter: docFilter,
      });
    }

    // 5) Extrair dados do signatário
    const signer = extractSigner(payload);

    if (!signer.name) {
      console.warn("[ZapSign] Signatário sem nome no payload");
      return NextResponse.json(
        { error: "Signatário sem nome" },
        { status: 400 }
      );
    }

    console.log(
      `[ZapSign] Notificando ${signer.name} sobre "${documentName}"`
    );

    // 5) Disparar notificações em paralelo (Promise.allSettled)
    const results = await Promise.allSettled([
      // WhatsApp
      signer.phone
        ? sendWhatsApp(signer.phone, signer.name, documentName)
        : Promise.resolve({
            channel: "whatsapp" as const,
            success: false,
            error: "Sem telefone",
          }),

      // E-mail
      signer.email
        ? sendEmail(
            signer.email,
            signer.name,
            documentName,
            signer.signedAt
          )
        : Promise.resolve({
            channel: "email" as const,
            success: false,
            error: "Sem e-mail",
          }),

      // SMS
      signer.phone
        ? sendSMS(signer.phone, signer.name, documentName)
        : Promise.resolve({
            channel: "sms" as const,
            success: false,
            error: "Sem telefone",
          }),
    ]);

    // 6) Coletar resultados
    const channelResults: ChannelResult[] = results.map((r) => {
      if (r.status === "fulfilled") return r.value;
      return {
        channel: "whatsapp" as const,
        success: false,
        error: r.reason?.message || "Erro desconhecido",
      };
    });

    // 7) Log no Supabase (fire-and-forget)
    logNotification({
      event_type: eventType,
      document_name: documentName,
      signer_name: signer.name,
      signer_email: signer.email || "",
      signer_phone: signer.phone || "",
      results: channelResults,
      payload_raw: JSON.stringify(payload).slice(0, 5000),
    });

    // 8) Responder 200 para a ZapSign
    const summary = channelResults.map(
      (r) => `${r.channel}: ${r.success ? "OK" : r.error}`
    );

    console.log(`[ZapSign] Resultados: ${summary.join(" | ")}`);

    return NextResponse.json({
      status: "processed",
      signer: signer.name,
      document: documentName,
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
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * Extrai dados do signatário do payload.
 * A ZapSign pode enviar o signer no nível raiz ou dentro de doc.signers[].
 */
function extractSigner(payload: ZapSignPayload): {
  name: string;
  email: string;
  phone: string;
  signedAt: string;
} {
  // Tentar primeiro o campo signer direto
  if (payload.signer?.name) {
    return {
      name: payload.signer.name,
      email: payload.signer.email || "",
      phone: payload.signer.phone_number || "",
      signedAt: payload.signer.signed_at || "",
    };
  }

  // Fallback: buscar no array doc.signers o que assinou
  const signers = payload.doc?.signers || [];
  const signed = signers.find((s) => s.signed);

  if (signed) {
    return {
      name: signed.name || "",
      email: signed.email || "",
      phone: signed.phone_number || "",
      signedAt: signed.signed_at || "",
    };
  }

  // Último fallback: primeiro signer disponível
  const first = signers[0];
  return {
    name: first?.name || "",
    email: first?.email || "",
    phone: first?.phone_number || "",
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
    channels: {
      whatsapp: zapsignConfig.whatsapp.enabled,
      email: zapsignConfig.email.enabled,
      sms: zapsignConfig.sms.enabled,
    },
  });
}
