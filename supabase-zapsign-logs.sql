-- ============================================================
-- Tabela de logs do webhook ZapSign
-- Executar no Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS zapsign_logs (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type    text NOT NULL,
  document_name text NOT NULL,
  signer_name   text NOT NULL,
  signer_email  text DEFAULT '',
  signer_phone  text DEFAULT '',
  results       jsonb DEFAULT '[]'::jsonb,
  payload_raw   text,
  created_at    timestamptz DEFAULT now()
);

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_zapsign_logs_created
  ON zapsign_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_zapsign_logs_signer
  ON zapsign_logs (signer_name);

-- RLS: permitir insert via anon (webhook não tem auth)
ALTER TABLE zapsign_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Webhook pode inserir logs"
  ON zapsign_logs FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Leitura de logs autenticada"
  ON zapsign_logs FOR SELECT
  TO anon
  USING (true);

-- Limpeza automática: manter apenas últimos 1000 registros
-- (executar via pg_cron ou manualmente)
-- DELETE FROM zapsign_logs
-- WHERE id NOT IN (
--   SELECT id FROM zapsign_logs ORDER BY created_at DESC LIMIT 1000
-- );
