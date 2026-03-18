-- =============================================================
-- Auth & Permissions Setup for Donna
-- Run this in Supabase SQL Editor
-- =============================================================

-- 1. Add auth_id column to link Supabase Auth → usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS auth_id uuid UNIQUE;

-- 2. Trigger: auto-link auth_id when a Google user signs up
CREATE OR REPLACE FUNCTION public.link_auth_to_usuario()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.usuarios
  SET auth_id = NEW.id
  WHERE email = NEW.email AND auth_id IS NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.link_auth_to_usuario();

-- 3. Helper: check if current auth user is a registered, active usuario
CREATE OR REPLACE FUNCTION public.is_registered_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE auth_id = auth.uid() AND ativo = true
  );
$$;

-- 4. Helper: get current usuario's permission level
CREATE OR REPLACE FUNCTION public.get_my_permissao()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT permissao FROM public.usuarios
  WHERE auth_id = auth.uid() AND ativo = true
  LIMIT 1;
$$;

-- =============================================================
-- 5. RLS Policies — Drop old "anon full access" and create new
-- =============================================================

-- Pattern:
--   SELECT  → any registered user
--   INSERT  → total or restrita
--   UPDATE  → total or restrita
--   DELETE  → total only

-- Helper macro-style: we repeat per table.

-- ---- USUARIOS ----
DROP POLICY IF EXISTS "anon full access" ON usuarios;
CREATE POLICY "select_registered" ON usuarios FOR SELECT USING (public.is_registered_user());
CREATE POLICY "modify_total" ON usuarios FOR INSERT WITH CHECK (public.get_my_permissao() = 'total');
CREATE POLICY "update_total" ON usuarios FOR UPDATE USING (public.get_my_permissao() = 'total');
CREATE POLICY "delete_total" ON usuarios FOR DELETE USING (public.get_my_permissao() = 'total');

-- ---- CLIENTES ----
DROP POLICY IF EXISTS "anon full access" ON clientes;
CREATE POLICY "select_registered" ON clientes FOR SELECT USING (public.is_registered_user());
CREATE POLICY "insert_editors" ON clientes FOR INSERT WITH CHECK (public.get_my_permissao() IN ('total', 'restrita'));
CREATE POLICY "update_editors" ON clientes FOR UPDATE USING (public.get_my_permissao() IN ('total', 'restrita'));
CREATE POLICY "delete_admin" ON clientes FOR DELETE USING (public.get_my_permissao() = 'total');

-- ---- CONTRATOS ----
DROP POLICY IF EXISTS "anon full access" ON contratos;
CREATE POLICY "select_registered" ON contratos FOR SELECT USING (public.is_registered_user());
CREATE POLICY "insert_editors" ON contratos FOR INSERT WITH CHECK (public.get_my_permissao() IN ('total', 'restrita'));
CREATE POLICY "update_editors" ON contratos FOR UPDATE USING (public.get_my_permissao() IN ('total', 'restrita'));
CREATE POLICY "delete_admin" ON contratos FOR DELETE USING (public.get_my_permissao() = 'total');

-- ---- PASTAS ----
DROP POLICY IF EXISTS "anon full access" ON pastas;
CREATE POLICY "select_registered" ON pastas FOR SELECT USING (public.is_registered_user());
CREATE POLICY "insert_editors" ON pastas FOR INSERT WITH CHECK (public.get_my_permissao() IN ('total', 'restrita'));
CREATE POLICY "update_editors" ON pastas FOR UPDATE USING (public.get_my_permissao() IN ('total', 'restrita'));
CREATE POLICY "delete_admin" ON pastas FOR DELETE USING (public.get_my_permissao() = 'total');

-- ---- PROCESSOS ----
DROP POLICY IF EXISTS "anon full access" ON processos;
CREATE POLICY "select_registered" ON processos FOR SELECT USING (public.is_registered_user());
CREATE POLICY "insert_editors" ON processos FOR INSERT WITH CHECK (public.get_my_permissao() IN ('total', 'restrita'));
CREATE POLICY "update_editors" ON processos FOR UPDATE USING (public.get_my_permissao() IN ('total', 'restrita'));
CREATE POLICY "delete_admin" ON processos FOR DELETE USING (public.get_my_permissao() = 'total');

-- ---- CREDITOS ----
DROP POLICY IF EXISTS "anon full access" ON creditos;
CREATE POLICY "select_registered" ON creditos FOR SELECT USING (public.is_registered_user());
CREATE POLICY "insert_editors" ON creditos FOR INSERT WITH CHECK (public.get_my_permissao() IN ('total', 'restrita'));
CREATE POLICY "update_editors" ON creditos FOR UPDATE USING (public.get_my_permissao() IN ('total', 'restrita'));
CREATE POLICY "delete_admin" ON creditos FOR DELETE USING (public.get_my_permissao() = 'total');

-- ---- PONTOS ----
DROP POLICY IF EXISTS "anon full access" ON pontos;
CREATE POLICY "select_registered" ON pontos FOR SELECT USING (public.is_registered_user());
CREATE POLICY "insert_editors" ON pontos FOR INSERT WITH CHECK (public.get_my_permissao() IN ('total', 'restrita'));
CREATE POLICY "update_editors" ON pontos FOR UPDATE USING (public.get_my_permissao() IN ('total', 'restrita'));
CREATE POLICY "delete_admin" ON pontos FOR DELETE USING (public.get_my_permissao() = 'total');

-- ---- WF_RCT ----
DROP POLICY IF EXISTS "anon full access" ON wf_rct;
CREATE POLICY "select_registered" ON wf_rct FOR SELECT USING (public.is_registered_user());
CREATE POLICY "insert_editors" ON wf_rct FOR INSERT WITH CHECK (public.get_my_permissao() IN ('total', 'restrita'));
CREATE POLICY "update_editors" ON wf_rct FOR UPDATE USING (public.get_my_permissao() IN ('total', 'restrita'));
CREATE POLICY "delete_admin" ON wf_rct FOR DELETE USING (public.get_my_permissao() = 'total');

-- ---- WF_PLANEJAMENTO ----
DROP POLICY IF EXISTS "anon full access" ON wf_planejamento;
CREATE POLICY "select_registered" ON wf_planejamento FOR SELECT USING (public.is_registered_user());
CREATE POLICY "insert_editors" ON wf_planejamento FOR INSERT WITH CHECK (public.get_my_permissao() IN ('total', 'restrita'));
CREATE POLICY "update_editors" ON wf_planejamento FOR UPDATE USING (public.get_my_permissao() IN ('total', 'restrita'));
CREATE POLICY "delete_admin" ON wf_planejamento FOR DELETE USING (public.get_my_permissao() = 'total');

-- ---- CONTROLE_RCT ----
DROP POLICY IF EXISTS "anon full access" ON controle_rct;
CREATE POLICY "select_registered" ON controle_rct FOR SELECT USING (public.is_registered_user());
CREATE POLICY "insert_editors" ON controle_rct FOR INSERT WITH CHECK (public.get_my_permissao() IN ('total', 'restrita'));
CREATE POLICY "update_editors" ON controle_rct FOR UPDATE USING (public.get_my_permissao() IN ('total', 'restrita'));
CREATE POLICY "delete_admin" ON controle_rct FOR DELETE USING (public.get_my_permissao() = 'total');

-- ---- TAREFAS ----
DROP POLICY IF EXISTS "anon full access" ON tarefas;
CREATE POLICY "select_registered" ON tarefas FOR SELECT USING (public.is_registered_user());
CREATE POLICY "insert_editors" ON tarefas FOR INSERT WITH CHECK (public.get_my_permissao() IN ('total', 'restrita'));
CREATE POLICY "update_editors" ON tarefas FOR UPDATE USING (public.get_my_permissao() IN ('total', 'restrita'));
CREATE POLICY "delete_admin" ON tarefas FOR DELETE USING (public.get_my_permissao() = 'total');

-- ---- PUBLICACOES ----
DROP POLICY IF EXISTS "anon full access" ON publicacoes;
CREATE POLICY "select_registered" ON publicacoes FOR SELECT USING (public.is_registered_user());
CREATE POLICY "insert_editors" ON publicacoes FOR INSERT WITH CHECK (public.get_my_permissao() IN ('total', 'restrita'));
CREATE POLICY "update_editors" ON publicacoes FOR UPDATE USING (public.get_my_permissao() IN ('total', 'restrita'));
CREATE POLICY "delete_admin" ON publicacoes FOR DELETE USING (public.get_my_permissao() = 'total');

-- ---- CASES (IA) ----
DROP POLICY IF EXISTS "anon full access" ON cases;
CREATE POLICY "select_registered" ON cases FOR SELECT USING (public.is_registered_user());
CREATE POLICY "insert_editors" ON cases FOR INSERT WITH CHECK (public.get_my_permissao() IN ('total', 'restrita'));
CREATE POLICY "update_editors" ON cases FOR UPDATE USING (public.get_my_permissao() IN ('total', 'restrita'));
CREATE POLICY "delete_admin" ON cases FOR DELETE USING (public.get_my_permissao() = 'total');

-- ---- DOCUMENTOS ----
DROP POLICY IF EXISTS "anon full access" ON documentos;
CREATE POLICY "select_registered" ON documentos FOR SELECT USING (public.is_registered_user());
CREATE POLICY "insert_editors" ON documentos FOR INSERT WITH CHECK (public.get_my_permissao() IN ('total', 'restrita'));
CREATE POLICY "update_editors" ON documentos FOR UPDATE USING (public.get_my_permissao() IN ('total', 'restrita'));
CREATE POLICY "delete_admin" ON documentos FOR DELETE USING (public.get_my_permissao() = 'total');

-- ---- ATENDIMENTOS ----
DROP POLICY IF EXISTS "anon full access" ON atendimentos;
CREATE POLICY "select_registered" ON atendimentos FOR SELECT USING (public.is_registered_user());
CREATE POLICY "insert_editors" ON atendimentos FOR INSERT WITH CHECK (public.get_my_permissao() IN ('total', 'restrita'));
CREATE POLICY "update_editors" ON atendimentos FOR UPDATE USING (public.get_my_permissao() IN ('total', 'restrita'));
CREATE POLICY "delete_admin" ON atendimentos FOR DELETE USING (public.get_my_permissao() = 'total');

-- ---- PILOTOS_RCT ----
DROP POLICY IF EXISTS "anon full access" ON pilotos_rct;
CREATE POLICY "select_registered" ON pilotos_rct FOR SELECT USING (public.is_registered_user());
CREATE POLICY "insert_editors" ON pilotos_rct FOR INSERT WITH CHECK (public.get_my_permissao() IN ('total', 'restrita'));
CREATE POLICY "update_editors" ON pilotos_rct FOR UPDATE USING (public.get_my_permissao() IN ('total', 'restrita'));
CREATE POLICY "delete_admin" ON pilotos_rct FOR DELETE USING (public.get_my_permissao() = 'total');

-- ---- FINANCEIRO (somente total) ----
DROP POLICY IF EXISTS "anon full access" ON financeiro;
CREATE POLICY "select_total" ON financeiro FOR SELECT USING (public.get_my_permissao() = 'total');
CREATE POLICY "insert_total" ON financeiro FOR INSERT WITH CHECK (public.get_my_permissao() = 'total');
CREATE POLICY "update_total" ON financeiro FOR UPDATE USING (public.get_my_permissao() = 'total');
CREATE POLICY "delete_total" ON financeiro FOR DELETE USING (public.get_my_permissao() = 'total');
