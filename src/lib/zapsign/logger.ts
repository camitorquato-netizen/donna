/**
 * Logger de notificações — salva no Supabase.
 * Tabela: zapsign_logs
 *
 * No Vercel (serverless) não existe filesystem persistente,
 * então usamos o Supabase como destino dos logs.
 */

import { supabase } from "@/lib/supabase";
import { ChannelResult } from "./config";

export interface NotificationLog {
  event_type: string;
  document_name: string;
  signer_name: string;
  signer_email: string;
  signer_phone: string;
  results: ChannelResult[];
  payload_raw?: string;
}

/**
 * Salva log da notificação no Supabase.
 * Fire-and-forget — erros são logados mas não quebram o fluxo.
 */
export async function logNotification(log: NotificationLog): Promise<void> {
  try {
    const { error } = await supabase.from("zapsign_logs").insert({
      event_type: log.event_type,
      document_name: log.document_name,
      signer_name: log.signer_name,
      signer_email: log.signer_email,
      signer_phone: log.signer_phone,
      results: log.results,
      payload_raw: log.payload_raw || null,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("[ZapSign Logger] Erro ao salvar log:", error.message);
    }
  } catch (err) {
    console.error("[ZapSign Logger] Exceção:", err);
  }
}
