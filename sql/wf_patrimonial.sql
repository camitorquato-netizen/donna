-- =============================================================
-- Workflow Planejamento Patrimonial — 4 tabelas
-- Run this in Supabase SQL Editor
-- =============================================================

-- 1. Main workflow steps (9 per pasta)
CREATE TABLE IF NOT EXISTS wf_patrimonial (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pasta_id UUID NOT NULL REFERENCES pastas(id) ON DELETE CASCADE,
  tarefa TEXT NOT NULL DEFAULT '',
  responsavel_id UUID REFERENCES usuarios(id),
  status TEXT NOT NULL DEFAULT 'pendente',
  url TEXT DEFAULT '',
  observacoes TEXT DEFAULT '',
  prazo TIMESTAMPTZ,
  decisao TEXT DEFAULT '',
  revisoes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE wf_patrimonial ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_registered" ON wf_patrimonial FOR SELECT USING (public.is_registered_user());
CREATE POLICY "insert_editors" ON wf_patrimonial FOR INSERT WITH CHECK (public.get_my_permissao() IN ('total', 'restrita'));
CREATE POLICY "update_editors" ON wf_patrimonial FOR UPDATE USING (public.get_my_permissao() IN ('total', 'restrita'));
CREATE POLICY "delete_admin" ON wf_patrimonial FOR DELETE USING (public.get_my_permissao() = 'total');

-- 2. Document checklist (step 3)
CREATE TABLE IF NOT EXISTS wf_patrimonial_docs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pasta_id UUID NOT NULL REFERENCES pastas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  observacoes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE wf_patrimonial_docs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_registered" ON wf_patrimonial_docs FOR SELECT USING (public.is_registered_user());
CREATE POLICY "insert_editors" ON wf_patrimonial_docs FOR INSERT WITH CHECK (public.get_my_permissao() IN ('total', 'restrita'));
CREATE POLICY "update_editors" ON wf_patrimonial_docs FOR UPDATE USING (public.get_my_permissao() IN ('total', 'restrita'));
CREATE POLICY "delete_admin" ON wf_patrimonial_docs FOR DELETE USING (public.get_my_permissao() = 'total');

-- 3. Specialist analyses (step 4 — 3 per pasta)
CREATE TABLE IF NOT EXISTS wf_patrimonial_analise (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pasta_id UUID NOT NULL REFERENCES pastas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  responsavel_id UUID REFERENCES usuarios(id),
  status TEXT NOT NULL DEFAULT 'pendente',
  url TEXT DEFAULT '',
  observacoes TEXT DEFAULT '',
  prazo TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE wf_patrimonial_analise ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_registered" ON wf_patrimonial_analise FOR SELECT USING (public.is_registered_user());
CREATE POLICY "insert_editors" ON wf_patrimonial_analise FOR INSERT WITH CHECK (public.get_my_permissao() IN ('total', 'restrita'));
CREATE POLICY "update_editors" ON wf_patrimonial_analise FOR UPDATE USING (public.get_my_permissao() IN ('total', 'restrita'));
CREATE POLICY "delete_admin" ON wf_patrimonial_analise FOR DELETE USING (public.get_my_permissao() = 'total');

-- 4. Execution sub-tasks (step 8)
CREATE TABLE IF NOT EXISTS wf_patrimonial_subtarefas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pasta_id UUID NOT NULL REFERENCES pastas(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  responsavel_id UUID REFERENCES usuarios(id),
  status TEXT NOT NULL DEFAULT 'pendente',
  prazo TIMESTAMPTZ,
  observacoes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE wf_patrimonial_subtarefas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_registered" ON wf_patrimonial_subtarefas FOR SELECT USING (public.is_registered_user());
CREATE POLICY "insert_editors" ON wf_patrimonial_subtarefas FOR INSERT WITH CHECK (public.get_my_permissao() IN ('total', 'restrita'));
CREATE POLICY "update_editors" ON wf_patrimonial_subtarefas FOR UPDATE USING (public.get_my_permissao() IN ('total', 'restrita'));
CREATE POLICY "delete_admin" ON wf_patrimonial_subtarefas FOR DELETE USING (public.get_my_permissao() = 'total');
