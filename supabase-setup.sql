-- ============================================
-- Patrimonial AI — Tabela de Casos
-- Execute este SQL no Supabase SQL Editor:
-- https://supabase.com/dashboard/project/volhuxrekdjwzhtjxndn/sql/new
-- ============================================

CREATE TABLE IF NOT EXISTS cases (
  id text PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  client_name text DEFAULT '',
  responsible text DEFAULT '',
  status smallint DEFAULT 1,
  transcription text DEFAULT '',
  intake_result text DEFAULT '',
  diagnosis_result text DEFAULT '',
  proposal_result text DEFAULT '',
  -- Campos extras necessários para o pipeline do app
  case_focus text DEFAULT '',
  intake_notes text DEFAULT '',
  diag_extra_info text DEFAULT '',
  diagnostic_notes text DEFAULT '',
  diag_json jsonb,
  cliente_json jsonb
);

-- Habilitar RLS e permitir acesso público (todos os usuários veem todos os casos)
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_select" ON cases FOR SELECT USING (true);
CREATE POLICY "allow_all_insert" ON cases FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_all_update" ON cases FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_delete" ON cases FOR DELETE USING (true);
