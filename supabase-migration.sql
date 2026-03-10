-- ============================================================
-- Patrimonial AI — Migração Supabase
-- Recria tabela cases + cria atendimentos + documentos
-- ATENÇÃO: DROP TABLE apaga todos os dados existentes!
-- ============================================================

-- 1) Limpar tabela existente (apaga os 3 casos de teste)
DROP TABLE IF EXISTS cases CASCADE;

-- 2) Recriar cases com colunas originais + AppSheet
CREATE TABLE cases (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz DEFAULT now(),

  -- Campos do app (já existiam)
  client_name       text DEFAULT '',
  responsible       text DEFAULT '',
  status            int  DEFAULT 1,
  transcription     text DEFAULT '',
  intake_result     text DEFAULT '',
  diagnosis_result  text DEFAULT '',
  proposal_result   text DEFAULT '',
  case_focus        text DEFAULT '',
  intake_notes      text DEFAULT '',
  diag_extra_info   text DEFAULT '',
  diagnostic_notes  text DEFAULT '',
  diag_json         jsonb,
  cliente_json      jsonb,

  -- Campos AppSheet (novos)
  appsheet_ticket_id   text UNIQUE,
  tipo                 text DEFAULT '',
  consultor_ref        text DEFAULT '',
  consultoria_ref      text DEFAULT '',
  breve_resumo_demanda text DEFAULT '',
  sugestao_agenda      timestamptz,
  docs_url             text DEFAULT '',
  status_appsheet      text DEFAULT '',
  proposta_enviada     boolean DEFAULT false,
  contrato_fechado     boolean DEFAULT false,
  updated_at_appsheet  timestamptz
);

-- 3) Atendimentos (espelho AppSheet)
CREATE TABLE atendimentos (
  appsheet_atendimento_id  text PRIMARY KEY,
  appsheet_ticket_id       text REFERENCES cases(appsheet_ticket_id) ON DELETE CASCADE,
  timestamp_atendimento    timestamptz,
  tipo                     text DEFAULT '',
  usuario                  text DEFAULT '',
  breve_relato             text DEFAULT '',
  url                      text DEFAULT '',
  file                     text DEFAULT '',
  mes                      text DEFAULT '',
  origem                   text DEFAULT 'appsheet'
);

-- 4) Documentos (textos extraídos de PDFs)
CREATE TABLE documentos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id         uuid REFERENCES cases(id) ON DELETE CASCADE,
  nome            text NOT NULL,
  tipo            text DEFAULT 'outro',   -- 'irpf','contrato_social','balancete','outro'
  texto_extraido  text DEFAULT '',
  storage_path    text DEFAULT '',
  created_at      timestamptz DEFAULT now()
);

-- 5) Índices
CREATE INDEX idx_atendimentos_ticket ON atendimentos(appsheet_ticket_id);
CREATE INDEX idx_documentos_caso ON documentos(caso_id);
CREATE INDEX idx_cases_appsheet ON cases(appsheet_ticket_id);

-- 6) RLS — acesso aberto (sem auth)
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_cases" ON cases FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE atendimentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_atendimentos" ON atendimentos FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_documentos" ON documentos FOR ALL USING (true) WITH CHECK (true);
