/**
 * Canal SMS — envia via Zenvia API v2.
 * POST https://api.zenvia.com/v2/channels/sms/messages
 */

import { zapsignConfig, ChannelResult } from "./config";

/** Formata telefone para E.164 com DDI 55 */
function toE164(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (!digits.startsWith("55")) {
    digits = "55" + digits;
  }
  if (digits.length === 12) {
    digits = digits.slice(0, 4) + "9" + digits.slice(4);
  }
  return digits;
}

/** Mensagem curta para SMS (limite ~160 chars) */
function buildMessage(signerName: string, documentName: string): string {
  const firstName = signerName.split(" ")[0];
  // Truncar nome do documento se necessário
  const docShort =
    documentName.length > 60
      ? documentName.slice(0, 57) + "..."
      : documentName;
  return `${firstName}, confirmamos a assinatura do documento "${docShort}". Obrigado pela confianca! - Escritorio Patrimonial`;
}

export async function sendSMS(
  phone: string,
  signerName: string,
  documentName: string
): Promise<ChannelResult> {
  const cfg = zapsignConfig.sms;

  if (!cfg.enabled) {
    return { channel: "sms", success: false, error: "Canal desabilitado" };
  }

  try {
    const number = toE164(phone);
    const text = buildMessage(signerName, documentName);

    const res = await fetch("https://api.zenvia.com/v2/channels/sms/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-TOKEN": cfg.apiToken,
      },
      body: JSON.stringify({
        from: cfg.from,
        to: number,
        contents: [
          {
            type: "text",
            text,
          },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`HTTP ${res.status}: ${body}`);
    }

    return { channel: "sms", success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { channel: "sms", success: false, error: msg };
  }
}
