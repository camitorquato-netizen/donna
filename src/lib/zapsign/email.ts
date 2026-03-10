/**
 * Canal E-mail — envia via Nodemailer/SMTP.
 * Layout HTML responsivo profissional.
 */

import nodemailer from "nodemailer";
import { zapsignConfig, ChannelResult } from "./config";

/** Gera HTML do e-mail com branding ST */
function buildHTML(
  signerName: string,
  documentName: string,
  signedAt: string
): string {
  const firstName = signerName.split(" ")[0];
  const dateStr = signedAt
    ? new Date(signedAt).toLocaleString("pt-BR", {
        dateStyle: "long",
        timeStyle: "short",
      })
    : new Date().toLocaleString("pt-BR", {
        dateStyle: "long",
        timeStyle: "short",
      });

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:#232535;padding:28px 32px;text-align:center;">
            <div style="color:#c89b5f;font-size:28px;font-weight:bold;font-family:Georgia,serif;letter-spacing:2px;">ST</div>
            <div style="color:#c89b5f;font-size:10px;font-family:Arial,sans-serif;letter-spacing:3px;margin-top:4px;">SILVEIRA TORQUATO ADVOGADOS</div>
          </td>
        </tr>
        <!-- Gold accent bar -->
        <tr><td style="background:#c89b5f;height:4px;"></td></tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <h2 style="color:#232535;font-family:Georgia,serif;font-size:20px;margin:0 0 16px;">
              Confirma\u00e7\u00e3o de Assinatura
            </h2>
            <p style="color:#343434;font-size:15px;line-height:1.6;margin:0 0 20px;">
              Ol\u00e1, <strong>${signerName}</strong>,
            </p>
            <p style="color:#343434;font-size:15px;line-height:1.6;margin:0 0 20px;">
              \u00c9 com satisfa\u00e7\u00e3o que confirmamos o recebimento da sua assinatura no documento <strong>${documentName}</strong>. A partir deste momento, seu projeto conosco tem in\u00edcio formalmente e nossa equipe estar\u00e1 inteiramente dedicada a voc\u00ea.
            </p>

            <!-- Proximos Passos -->
            <h3 style="color:#232535;font-family:Georgia,serif;font-size:16px;margin:28px 0 16px;">
              Pr\u00f3ximos Passos
            </h3>

            <!-- Passo 1 -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;">
              <tr>
                <td style="background:#fcf9f5;border-left:4px solid #c89b5f;padding:14px 20px;border-radius:0 6px 6px 0;">
                  <div style="color:#232535;font-size:14px;font-weight:bold;font-family:Georgia,serif;margin-bottom:4px;">
                    1. Registro do Contrato
                  </div>
                  <div style="color:#343434;font-size:13px;line-height:1.5;font-family:Georgia,serif;">
                    Sua documenta\u00e7\u00e3o ser\u00e1 encaminhada \u00e0 nossa Controladoria, respons\u00e1vel pelo registro e formaliza\u00e7\u00e3o do contrato com todo o rigor que o seu caso merece.
                  </div>
                </td>
              </tr>
            </table>

            <!-- Passo 2 -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;">
              <tr>
                <td style="background:#fcf9f5;border-left:4px solid #c89b5f;padding:14px 20px;border-radius:0 6px 6px 0;">
                  <div style="color:#232535;font-size:14px;font-weight:bold;font-family:Georgia,serif;margin-bottom:4px;">
                    2. Reuni\u00e3o de Onboarding
                  </div>
                  <div style="color:#343434;font-size:13px;line-height:1.5;font-family:Georgia,serif;">
                    Em breve, nossa equipe entrar\u00e1 em contato para agendar sua reuni\u00e3o de onboarding com os especialistas dedicados ao seu planejamento. Nesse encontro, apresentaremos o time respons\u00e1vel pelo seu caso e alinharemos, juntos, os pr\u00f3ximos passos do seu projeto.
                  </div>
                </td>
              </tr>
            </table>

            <!-- Passo 3 -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
              <tr>
                <td style="background:#fcf9f5;border-left:4px solid #c89b5f;padding:14px 20px;border-radius:0 6px 6px 0;">
                  <div style="color:#232535;font-size:14px;font-weight:bold;font-family:Georgia,serif;margin-bottom:4px;">
                    3. Canal de Atendimento
                  </div>
                  <div style="color:#343434;font-size:13px;line-height:1.5;font-family:Georgia,serif;">
                    Qualquer d\u00favida que surgir at\u00e9 l\u00e1, estamos \u00e0 disposi\u00e7\u00e3o pelo nosso atendimento direto: (51) 99294-2848 (WhatsApp).
                  </div>
                </td>
              </tr>
            </table>

            <p style="color:#343434;font-size:15px;line-height:1.6;margin:0 0 8px;">
              Agradecemos a confian\u00e7a depositada no nosso escrit\u00f3rio. \u00c9 uma honra t\u00ea-lo como cliente.
            </p>
            <p style="color:#888880;font-size:13px;font-style:italic;margin:24px 0 0;">
              Atenciosamente,<br>
              <strong style="color:#232535;">\u00c1rea de Planejamento Patrimonial</strong><br>
              <span style="color:#343434;">Silveira Torquato Advogados</span>
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#232535;padding:16px 32px;text-align:center;">
            <div style="color:#c89b5f;font-size:9px;font-family:Arial,sans-serif;letter-spacing:2px;">
              SILVEIRA TORQUATO ADVOGADOS &nbsp;|&nbsp; CONFIDENCIAL
            </div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendEmail(
  to: string,
  signerName: string,
  documentName: string,
  signedAt: string
): Promise<ChannelResult> {
  const cfg = zapsignConfig.email;

  if (!cfg.enabled) {
    return { channel: "email", success: false, error: "Canal desabilitado" };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: {
        user: cfg.user,
        pass: cfg.pass,
      },
    });

    await transporter.sendMail({
      from: cfg.from,
      to,
      subject: `Documento Assinado — ${documentName}`,
      html: buildHTML(signerName, documentName, signedAt),
    });

    return { channel: "email", success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { channel: "email", success: false, error: msg };
  }
}
