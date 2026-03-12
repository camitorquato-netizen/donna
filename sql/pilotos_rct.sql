-- Tabela para histórico de análises Piloto RCT
CREATE TABLE pilotos_rct (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_nome TEXT NOT NULL DEFAULT '',
  cliente_cnpj TEXT DEFAULT '',
  arquivos_info JSONB DEFAULT '[]',
  resultado TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE pilotos_rct ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon full access" ON pilotos_rct FOR ALL USING (true) WITH CHECK (true);
