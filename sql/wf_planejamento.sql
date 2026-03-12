-- Workflow Planejamento Tributário
-- Cada pasta do tipo "Planejamento Tributário" tem 6 etapas de workflow

CREATE TABLE IF NOT EXISTS wf_planejamento (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pasta_id UUID NOT NULL REFERENCES pastas(id) ON DELETE CASCADE,
  tarefa TEXT NOT NULL DEFAULT '',
  responsavel_id UUID REFERENCES usuarios(id),
  status TEXT NOT NULL DEFAULT 'pendente',
  url TEXT DEFAULT '',
  prompt TEXT DEFAULT '',
  observacoes TEXT DEFAULT '',
  prazo TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE wf_planejamento ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon full access" ON wf_planejamento FOR ALL USING (true) WITH CHECK (true);
