/**
 * Canal WhatsApp — envia mensagem via Evolution API.
 * POST /message/sendText/:instance
 */

import { zapsignConfig, ChannelResult } from "./config";

/** Formata telefone brasileiro para E.164 (5511999999999) */
function toE164(phone: string): string {
  // Remove tudo que não é dígito
  let digits = phone.replace(/\D/g, "");

  // Se não começa com 55, adiciona DDI Brasil
  if (!digits.startsWith("55")) {
    digits = "55" + digits;
  }

  // Garantir que tem 13 dígitos (55 + DDD 2 + celular 9)
  // Se tem 12, provavelmente falta o 9 do celular
  if (digits.length === 12) {
    digits = digits.slice(0, 4) + "9" + digits.slice(4);
  }

  return digits;
}

/** Monta mensagem WhatsApp com formatação markdown */
function buildMessage(signerName: string, documentName: string): string {
  const firstName = signerName.split(" ")[0];
  return [
    `*${zapsignConfig.senderName}*`,
    "",
    `Olá, *${firstName}*! `,
    "",
    `Confirmamos que o documento *"${documentName}"* foi assinado com sucesso.`,
    "",
    "Agradecemos pela confiança.",
    "",
    `_${zapsignConfig.senderName}_`,
  ].join("\n");
}

export async function sendWhatsApp(
  phone: string,
  signerName: string,
  documentName: string
): Promise<ChannelResult> {
  const cfg = zapsignConfig.whatsapp;

  if (!cfg.enabled) {
    return { channel: "whatsapp", success: false, error: "Canal desabilitado" };
  }

  try {
    const number = toE164(phone);
    const text = buildMessage(signerName, documentName);

    const url = `${cfg.apiUrl}/message/sendText/${cfg.instance}`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: cfg.apiKey,
      },
      body: JSON.stringify({
        number,
        text,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`HTTP ${res.status}: ${body}`);
    }

    return { channel: "whatsapp", success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { channel: "whatsapp", success: false, error: msg };
  }
}
