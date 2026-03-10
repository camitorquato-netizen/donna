-- ============================================================
-- Patrimonial AI — Supabase Storage: bucket para documentos
-- Bucket PRIVADO — arquivos só acessíveis via SDK (signed URLs)
-- ============================================================

-- 1) Criar bucket privado
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos', 'documentos', false);

-- 2) Permitir upload via anon key (portal do cliente)
CREATE POLICY "allow_anon_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documentos');

-- 3) Permitir leitura via SDK (app interno gera signed URLs)
CREATE POLICY "allow_anon_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'documentos');
