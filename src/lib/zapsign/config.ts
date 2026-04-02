/**
 * Configuração centralizada da integração ZapSign.
 * Todas as credenciais vêm de variáveis de ambiente.
 * Canais sem credenciais são silenciosamente desabilitados.
 */

export const zapsignConfig = {
  /** Token de validação do webhook ZapSign (header x-zapsign-token) */
  webhookToken: process.env.ZAPSIGN_WEBHOOK_TOKEN || "",

  /** Evolution API — WhatsApp */
  whatsapp: {
    enabled: !!(
      process.env.EVOLUTION_API_URL && process.env.EVOLUTION_API_KEY
    ),
    apiUrl: process.env.EVOLUTION_API_URL || "",
    apiKey: process.env.EVOLUTION_API_KEY || "",
    instance: process.env.EVOLUTION_INSTANCE || "patrimonial",
  },

  /** Nodemailer — E-mail SMTP */
  email: {
    enabled: !!(process.env.SMTP_HOST && process.env.SMTP_USER),
    host: process.env.SMTP_HOST || "",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from:
      process.env.SMTP_FROM ||
      '"Escritório Patrimonial" <noreply@patrimonial.com.br>',
  },

  /** Zenvia — SMS */
  sms: {
    enabled: !!(process.env.ZENVIA_API_TOKEN),
    apiToken: process.env.ZENVIA_API_TOKEN || "",
    from: process.env.ZENVIA_FROM || "Patrimonial",
  },

  /** Nome do remetente em todos os canais */
  senderName: "Silveira Torquato Reverbel Advogados",

  /**
   * Filtro de documentos — só processa docs cujo nome contenha
   * pelo menos uma dessas palavras-chave (case-insensitive).
   * Configurável via env var (separado por vírgula).
   * Se vazio, processa TODOS os documentos.
   */
  docFilter: (process.env.ZAPSIGN_DOC_FILTER || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
};

export type ChannelResult = {
  channel: "whatsapp" | "email" | "sms";
  success: boolean;
  error?: string;
};
