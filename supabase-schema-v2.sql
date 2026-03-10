-- ============================================================
-- SILVEIRA TORQUATO — Schema V2
-- Sistema Completo de Gestão do Escritório
-- ============================================================
-- Executar no Supabase SQL Editor (em ordem)
--
-- Tabelas existentes preservadas:
--   cases, documentos, atendimentos, zapsign_logs
--
-- Novas tabelas (17):
--   usuarios, parceiros, clientes, contratos, pastas,
--   processos, creditos, pontos, controle_rct, wf_rct,
--   tarefas, publicacoes, financeiro, anotacoes,
--   mensagens, etiquetas, etiquetas_vinculos
-- ============================================================


-- ============================================================
-- 1. USUARIOS — equipe do escritório
-- ============================================================
-- Equivale a "Usuários" no Donna/AppSheet
-- Futuramente vinculado a auth.users do Supabase (Google OAuth)

CREATE TABLE IF NOT EXISTS usuarios (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome          text NOT NULL,
  email         text UNIQUE NOT NULL,
  cargo         text DEFAULT '',
  -- Permissões: total, restrita, somente_leitura
  permissao     text DEFAULT 'restrita',
  foto_url      text DEFAULT '',
  ativo         boolean DEFAULT true,
  -- Ref futura ao auth.users do Supabase
  auth_user_id  uuid,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios (email);
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON usuarios (ativo);


-- ============================================================
-- 2. PARCEIROS — parceiros comerciais externos
-- ============================================================
-- Equivale a "Parceiros" no Donna

CREATE TABLE IF NOT EXISTS parceiros (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome                  text NOT NULL,
  email                 text DEFAULT '',
  chave_pix             text DEFAULT '',
  percentual_parceria   decimal(5,4) DEFAULT 0,
  observacoes           text DEFAULT '',
  ativo                 boolean DEFAULT true,
  created_at            timestamptz DEFAULT now()
);


-- ============================================================
-- 3. CLIENTES — todos os contatos/clientes
-- ============================================================
-- Equivale a "Contato" no Donna
-- Unifica Pessoa Física e Jurídica

CREATE TABLE IF NOT EXISTS clientes (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome              text NOT NULL,
  apelido           text DEFAULT '',
  -- PF ou PJ
  tipo_pessoa       text NOT NULL DEFAULT 'PF'
                    CHECK (tipo_pessoa IN ('PF', 'PJ')),
  cpf               text DEFAULT '',
  cnpj              text DEFAULT '',
  email             text DEFAULT '',
  telefone          text DEFAULT '',
  endereco          text DEFAULT '',
  -- Para PJ: nome do contato dentro da empresa
  contato_empresa   text DEFAULT '',
  observacoes       text DEFAULT '',
  -- Pipeline comercial → operacional
  -- lead, em_atendimento, proposta_enviada, contrato_enviado,
  -- contrato_assinado, onboarding, em_execucao, concluido, inativo
  status_pipeline   text DEFAULT 'lead',
  -- Origem do lead
  origem            text DEFAULT '',
  -- Responsável comercial
  responsavel_id    uuid,
  -- Ref ao Donna/AppSheet (migração)
  donna_id          text,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes (nome);
CREATE INDEX IF NOT EXISTS idx_clientes_cpf ON clientes (cpf) WHERE cpf != '';
CREATE INDEX IF NOT EXISTS idx_clientes_cnpj ON clientes (cnpj) WHERE cnpj != '';
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes (email) WHERE email != '';
CREATE INDEX IF NOT EXISTS idx_clientes_pipeline ON clientes (status_pipeline);
CREATE INDEX IF NOT EXISTS idx_clientes_responsavel ON clientes (responsavel_id);


-- ============================================================
-- 4. CONTRATOS — vínculo formal com o cliente
-- ============================================================
-- Equivale a "Contrato" no Donna
-- + integração com ZapSign

CREATE TABLE IF NOT EXISTS contratos (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id            uuid NOT NULL REFERENCES clientes(id),
  -- Tipo/objeto do contrato
  -- RCT, Plan. Tributário, Transação, Assessoria,
  -- Plan. Patrimonial, Mandado de Segurança, Societário,
  -- Rec. Crédito Tributário, etc.
  objeto                text NOT NULL DEFAULT '',
  titulo                text NOT NULL DEFAULT '',
  arquivo_url           text DEFAULT '',
  -- Financeiro
  valor                 decimal(15,2),
  percentual_honorarios decimal(5,4) DEFAULT 0.20,
  data_entrada          date,
  vigencia              date,
  -- Responsáveis
  comercial_resp_id     uuid REFERENCES usuarios(id),
  parceiro_id           uuid REFERENCES parceiros(id),
  percentual_parceiro   decimal(5,4) DEFAULT 0,
  -- Integração ZapSign
  zapsign_doc_token     text,
  zapsign_signed_at     timestamptz,
  zapsign_signer_name   text,
  zapsign_signer_email  text,
  -- Status: rascunho, enviado_assinatura, assinado, vigente, encerrado
  status                text DEFAULT 'rascunho',
  -- Link ao caso do Patrimonial AI (se houver)
  caso_ia_id            text,
  -- Ref ao Donna/AppSheet (migração)
  donna_id              text,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contratos_cliente ON contratos (cliente_id);
CREATE INDEX IF NOT EXISTS idx_contratos_status ON contratos (status);
CREATE INDEX IF NOT EXISTS idx_contratos_objeto ON contratos (objeto);
CREATE INDEX IF NOT EXISTS idx_contratos_zapsign ON contratos (zapsign_doc_token)
  WHERE zapsign_doc_token IS NOT NULL;


-- ============================================================
-- 5. PASTAS — unidade central de trabalho
-- ============================================================
-- Equivale a "Pasta" no Donna
-- Cada pasta é um "Serviço" ou um "Processo"
-- Conceito central: toda atividade do escritório tem uma pasta

CREATE TABLE IF NOT EXISTS pastas (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Número sequencial legível: 20240125/001
  numero            text UNIQUE,
  contrato_id       uuid REFERENCES contratos(id),
  cliente_id        uuid NOT NULL REFERENCES clientes(id),
  titulo            text NOT NULL DEFAULT '',
  -- servico ou processo
  tipo              text NOT NULL DEFAULT 'servico'
                    CHECK (tipo IN ('servico', 'processo')),
  -- Responsáveis
  responsavel_id    uuid REFERENCES usuarios(id),
  comercial_resp_id uuid REFERENCES usuarios(id),
  -- Subtipo do serviço (se tipo=servico):
  -- RCT, Transação, Assessoria, Plan. Patrimonial,
  -- Plan. Tributário, Societário, etc.
  tipo_servico      text DEFAULT '',
  -- Status genérico
  status            text DEFAULT 'ativo',
  -- Link ao caso do Patrimonial AI (se houver)
  caso_ia_id        text,
  -- Abrangência (se aplicável)
  abrangencia       text DEFAULT '',
  -- Ref ao Donna/AppSheet (migração)
  donna_id          text,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pastas_cliente ON pastas (cliente_id);
CREATE INDEX IF NOT EXISTS idx_pastas_contrato ON pastas (contrato_id);
CREATE INDEX IF NOT EXISTS idx_pastas_tipo ON pastas (tipo);
CREATE INDEX IF NOT EXISTS idx_pastas_status ON pastas (status);
CREATE INDEX IF NOT EXISTS idx_pastas_responsavel ON pastas (responsavel_id);
CREATE INDEX IF NOT EXISTS idx_pastas_caso_ia ON pastas (caso_ia_id)
  WHERE caso_ia_id IS NOT NULL;


-- ============================================================
-- 6. PROCESSOS — detalhes judiciais (quando pasta.tipo = 'processo')
-- ============================================================
-- Campos específicos de processos judiciais
-- Equivale aos campos "se tipo processo" na Pasta do Donna

CREATE TABLE IF NOT EXISTS processos (
  id                      uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  pasta_id                uuid NOT NULL UNIQUE REFERENCES pastas(id),
  numero_cnj              text DEFAULT '',
  numero_processo          text DEFAULT '',
  -- tributario, civel, trabalhista
  area                    text DEFAULT '',
  -- judicial, administrativo
  esfera                  text DEFAULT 'judicial',
  rito                    text DEFAULT '',
  materia                 text DEFAULT '',
  -- ativo, passivo
  polo                    text DEFAULT '',
  data_ajuizamento        date,
  valor_causa             decimal(15,2),
  jurisdicao              text DEFAULT '',
  data_transito_julgado   date,
  observacoes             text DEFAULT '',
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_processos_cnj ON processos (numero_cnj)
  WHERE numero_cnj != '';
CREATE INDEX IF NOT EXISTS idx_processos_area ON processos (area);


-- ============================================================
-- 7. CREDITOS — créditos tributários apresentados (RCT)
-- ============================================================
-- Equivale a "Créditos Apresentados" no Donna

CREATE TABLE IF NOT EXISTS creditos (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  pasta_id              uuid NOT NULL REFERENCES pastas(id),
  titulo                text NOT NULL DEFAULT '',
  -- PIS/COFINS, IRPJ/CSLL, ISSQN, INSS, ICMS, IPI, PERSE
  tributo               text NOT NULL DEFAULT '',
  credito_apresentado   decimal(15,2) DEFAULT 0,
  credito_validado      decimal(15,2) DEFAULT 0,
  saldo                 decimal(15,2) DEFAULT 0,
  -- Fases (workflow):
  -- 1_analise, 2_parecer, 3_apresentacao,
  -- 4_aguardando_aprovacao, 5_utilizacao, 6_findo,
  -- nao_autorizado, extinto
  fase                  text DEFAULT '1_analise',
  responsavel_id        uuid REFERENCES usuarios(id),
  apresentacao_url      text DEFAULT '',
  parecer_url           text DEFAULT '',
  -- Ref ao Donna (migração)
  donna_id              text,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_creditos_pasta ON creditos (pasta_id);
CREATE INDEX IF NOT EXISTS idx_creditos_fase ON creditos (fase);
CREATE INDEX IF NOT EXISTS idx_creditos_tributo ON creditos (tributo);


-- ============================================================
-- 8. PONTOS — itens individuais de cada crédito
-- ============================================================
-- Equivale a "Pontos Apresentados" no Donna

CREATE TABLE IF NOT EXISTS pontos (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  credito_id      uuid NOT NULL REFERENCES creditos(id),
  descricao       text NOT NULL DEFAULT '',
  periodo         text DEFAULT '',
  valor           decimal(15,2) DEFAULT 0,
  aprovado        boolean DEFAULT false,
  -- Líquidos e Certos, Em Discussão, etc.
  categoria       text DEFAULT '',
  observacao       text DEFAULT '',
  -- Ref ao Donna (migração)
  donna_id        text,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pontos_credito ON pontos (credito_id);


-- ============================================================
-- 9. CONTROLE_RCT — compensações e utilizações de crédito
-- ============================================================
-- Equivale a "Controle - RCT" no Donna

CREATE TABLE IF NOT EXISTS controle_rct (
  id                      uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  credito_id              uuid NOT NULL REFERENCES creditos(id),
  valor_principal         decimal(15,2) DEFAULT 0,
  selic                   decimal(15,2) DEFAULT 0,
  valor_compensado        decimal(15,2) DEFAULT 0,
  tributo_compensado      text DEFAULT '',
  data_compensacao        date,
  -- ESCRITURAL, PER/DCOMP, JUDICIAL, etc.
  forma_utilizacao        text DEFAULT '',
  comprovantes_url        text DEFAULT '',
  honorarios_percentual   decimal(5,4) DEFAULT 0,
  boleto_valor            decimal(15,2) DEFAULT 0,
  perdcomp_web            text DEFAULT '',
  -- Ref ao Donna (migração)
  donna_id                text,
  created_at              timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_controle_rct_credito ON controle_rct (credito_id);


-- ============================================================
-- 10. WF_RCT — workflow de 6 etapas por crédito
-- ============================================================
-- Equivale a "WF RCT" no Donna
-- Etapas: 1.Levantamento, 2.Parecer, 3.Apresentação,
--          4.Retificações, 5.Compensações, 6.Faturamento

CREATE TABLE IF NOT EXISTS wf_rct (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  credito_id      uuid NOT NULL REFERENCES creditos(id),
  -- 1_levantamento, 2_parecer, 3_apresentacao,
  -- 4_retificacoes, 5_compensacoes, 6_faturamento
  tarefa          text NOT NULL DEFAULT '',
  responsavel_id  uuid REFERENCES usuarios(id),
  -- pendente (0) ou concluido (1)
  status          text DEFAULT 'pendente',
  url             text DEFAULT '',
  prazo           date,
  -- Ref ao Donna (migração)
  donna_id        text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wf_rct_credito ON wf_rct (credito_id);
CREATE INDEX IF NOT EXISTS idx_wf_rct_responsavel ON wf_rct (responsavel_id);


-- ============================================================
-- 11. TAREFAS — gestão de tarefas genérica
-- ============================================================
-- Equivale a "Tarefas" no Donna

CREATE TABLE IF NOT EXISTS tarefas (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  pasta_id          uuid REFERENCES pastas(id),
  -- Enum: Tarefas, Prazos, etc.
  natureza          text DEFAULT 'tarefa',
  -- Plan. Patrim., Monitorar Servico, Confeccionar Inicial,
  -- Audiência, Prazo Processual, etc.
  tipo              text DEFAULT '',
  titulo            text NOT NULL DEFAULT '',
  descricao         text DEFAULT '',
  solicitante_id    uuid REFERENCES usuarios(id),
  responsavel_id    uuid REFERENCES usuarios(id),
  executante_id     uuid REFERENCES usuarios(id),
  prazo             date,
  -- pendente, em_andamento, concluida, cancelada
  status            text DEFAULT 'pendente',
  doc_url           text DEFAULT '',
  prioridade        text DEFAULT 'normal',
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tarefas_pasta ON tarefas (pasta_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_responsavel ON tarefas (responsavel_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_prazo ON tarefas (prazo);
CREATE INDEX IF NOT EXISTS idx_tarefas_status ON tarefas (status);


-- ============================================================
-- 12. PUBLICACOES — intimações e despachos judiciais
-- ============================================================
-- Equivale a "Publicações" no Donna
-- Recebimento via integração com tribunais (eproc, etc.)

CREATE TABLE IF NOT EXISTS publicacoes (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  pasta_id          uuid REFERENCES pastas(id),
  data_hora         timestamptz,
  tribunal          text DEFAULT '',
  sistema           text DEFAULT '',
  processo_cnj      text DEFAULT '',
  parte             text DEFAULT '',
  assunto           text DEFAULT '',
  teor              text DEFAULT '',
  link_processo     text DEFAULT '',
  -- nova, lida, respondida
  status            text DEFAULT 'nova',
  responsavel_id    uuid REFERENCES usuarios(id),
  prazo             date,
  tarefa_criada_id  uuid REFERENCES tarefas(id),
  observacoes       text DEFAULT '',
  -- Ref ao Donna (migração)
  donna_id          text,
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_publicacoes_pasta ON publicacoes (pasta_id);
CREATE INDEX IF NOT EXISTS idx_publicacoes_prazo ON publicacoes (prazo);
CREATE INDEX IF NOT EXISTS idx_publicacoes_status ON publicacoes (status);
CREATE INDEX IF NOT EXISTS idx_publicacoes_cnj ON publicacoes (processo_cnj)
  WHERE processo_cnj != '';


-- ============================================================
-- 13. FINANCEIRO — contas a receber e a pagar
-- ============================================================
-- Equivale a "Financeiro" no Donna

CREATE TABLE IF NOT EXISTS financeiro (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id            uuid REFERENCES clientes(id),
  pasta_id              uuid REFERENCES pastas(id),
  credito_id            uuid REFERENCES creditos(id),
  -- a_receber ou a_pagar
  tipo                  text NOT NULL DEFAULT 'a_receber'
                        CHECK (tipo IN ('a_receber', 'a_pagar')),
  valor                 decimal(15,2) NOT NULL DEFAULT 0,
  data_vencimento       date,
  valor_pago            decimal(15,2) DEFAULT 0,
  data_pagamento        date,
  -- honorarios, repasse_parceiro, custas, despesas, etc.
  plano_contas          text DEFAULT 'honorarios',
  boleto_url            text DEFAULT '',
  descricao             text DEFAULT '',
  comercial_resp_id     uuid REFERENCES usuarios(id),
  repasse_parceiro      decimal(15,2) DEFAULT 0,
  -- pendente, pago, vencido, cancelado
  status                text DEFAULT 'pendente',
  -- Ref ao Donna (migração)
  donna_id              text,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_financeiro_cliente ON financeiro (cliente_id);
CREATE INDEX IF NOT EXISTS idx_financeiro_pasta ON financeiro (pasta_id);
CREATE INDEX IF NOT EXISTS idx_financeiro_tipo ON financeiro (tipo);
CREATE INDEX IF NOT EXISTS idx_financeiro_status ON financeiro (status);
CREATE INDEX IF NOT EXISTS idx_financeiro_vencimento ON financeiro (data_vencimento);


-- ============================================================
-- 14. ANOTACOES — notas vinculadas a qualquer entidade
-- ============================================================
-- Equivale a "Anotações" no Donna

CREATE TABLE IF NOT EXISTS anotacoes (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id      uuid REFERENCES usuarios(id),
  -- Pode vincular a qualquer entidade (todos opcionais)
  cliente_id      uuid REFERENCES clientes(id),
  contrato_id     uuid REFERENCES contratos(id),
  pasta_id        uuid REFERENCES pastas(id),
  credito_id      uuid REFERENCES creditos(id),
  texto           text NOT NULL DEFAULT '',
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_anotacoes_pasta ON anotacoes (pasta_id)
  WHERE pasta_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_anotacoes_cliente ON anotacoes (cliente_id)
  WHERE cliente_id IS NOT NULL;


-- ============================================================
-- 15. MENSAGENS — comunicação interna (chat)
-- ============================================================
-- Substitui "Recado" + "Resposta" do Donna
-- Modelo hierárquico: respostas vinculam via parent_id

CREATE TABLE IF NOT EXISTS mensagens (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  pasta_id          uuid REFERENCES pastas(id),
  remetente_id      uuid NOT NULL REFERENCES usuarios(id),
  destinatario_id   uuid NOT NULL REFERENCES usuarios(id),
  titulo            text DEFAULT '',
  texto             text NOT NULL DEFAULT '',
  url               text DEFAULT '',
  -- Para respostas (thread)
  parent_id         uuid REFERENCES mensagens(id),
  lido              boolean DEFAULT false,
  lido_em           timestamptz,
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mensagens_destinatario
  ON mensagens (destinatario_id, lido);
CREATE INDEX IF NOT EXISTS idx_mensagens_pasta ON mensagens (pasta_id)
  WHERE pasta_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mensagens_parent ON mensagens (parent_id)
  WHERE parent_id IS NOT NULL;


-- ============================================================
-- 16. ETIQUETAS — sistema de tags
-- ============================================================
-- Equivale a "Etiquetas" no Donna

CREATE TABLE IF NOT EXISTS etiquetas (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome        text NOT NULL,
  cor         text DEFAULT 'Blue',
  -- Em quais entidades pode ser usada
  tipo        text DEFAULT 'pasta',
  created_at  timestamptz DEFAULT now()
);


-- ============================================================
-- 17. ETIQUETAS_VINCULOS — ligação N:N entre etiquetas e entidades
-- ============================================================
-- Equivale a "Etiquetas Pasta" + "Etiquetas Vinculos" no Donna

CREATE TABLE IF NOT EXISTS etiquetas_vinculos (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  etiqueta_id     uuid NOT NULL REFERENCES etiquetas(id),
  -- Tipo da entidade: pasta, credito, contrato, cliente, etc.
  entidade_tipo   text NOT NULL DEFAULT 'pasta',
  -- UUID da entidade referenciada
  entidade_id     uuid NOT NULL,
  created_at      timestamptz DEFAULT now(),
  -- Evitar duplicatas
  UNIQUE (etiqueta_id, entidade_tipo, entidade_id)
);

CREATE INDEX IF NOT EXISTS idx_etiquetas_vinculos_entidade
  ON etiquetas_vinculos (entidade_tipo, entidade_id);


-- ============================================================
-- ALTERAÇÃO: Adicionar pasta_id na tabela cases existente
-- ============================================================
-- Vincula o workflow do Patrimonial AI à pasta do escritório

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cases' AND column_name = 'pasta_id'
  ) THEN
    ALTER TABLE cases ADD COLUMN pasta_id uuid;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cases' AND column_name = 'cliente_id'
  ) THEN
    ALTER TABLE cases ADD COLUMN cliente_id uuid;
  END IF;
END $$;


-- ============================================================
-- RLS — Row Level Security
-- ============================================================
-- Por enquanto: anon pode ler/escrever tudo
-- Quando tivermos auth, restringir por usuario

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE parceiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pastas ENABLE ROW LEVEL SECURITY;
ALTER TABLE processos ENABLE ROW LEVEL SECURITY;
ALTER TABLE creditos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pontos ENABLE ROW LEVEL SECURITY;
ALTER TABLE controle_rct ENABLE ROW LEVEL SECURITY;
ALTER TABLE wf_rct ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE publicacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE financeiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE anotacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE etiquetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE etiquetas_vinculos ENABLE ROW LEVEL SECURITY;

-- Políticas temporárias (anon acesso total — trocar quando tiver auth)
DO $$
DECLARE
  tbl text;
  pol text;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'usuarios','parceiros','clientes','contratos','pastas',
      'processos','creditos','pontos','controle_rct','wf_rct',
      'tarefas','publicacoes','financeiro','anotacoes',
      'mensagens','etiquetas','etiquetas_vinculos'
    ])
  LOOP
    -- SELECT
    pol := 'anon_select_' || tbl;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = tbl AND policyname = pol) THEN
      EXECUTE format('CREATE POLICY %I ON %I FOR SELECT TO anon USING (true)', pol, tbl);
    END IF;
    -- INSERT
    pol := 'anon_insert_' || tbl;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = tbl AND policyname = pol) THEN
      EXECUTE format('CREATE POLICY %I ON %I FOR INSERT TO anon WITH CHECK (true)', pol, tbl);
    END IF;
    -- UPDATE
    pol := 'anon_update_' || tbl;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = tbl AND policyname = pol) THEN
      EXECUTE format('CREATE POLICY %I ON %I FOR UPDATE TO anon USING (true) WITH CHECK (true)', pol, tbl);
    END IF;
    -- DELETE
    pol := 'anon_delete_' || tbl;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = tbl AND policyname = pol) THEN
      EXECUTE format('CREATE POLICY %I ON %I FOR DELETE TO anon USING (true)', pol, tbl);
    END IF;
  END LOOP;
END $$;


-- ============================================================
-- VIEWS ÚTEIS
-- ============================================================

-- View: Pastas com nome do cliente e responsável
CREATE OR REPLACE VIEW v_pastas AS
SELECT
  p.id,
  p.numero,
  p.titulo,
  p.tipo,
  p.tipo_servico,
  p.status,
  p.created_at,
  c.nome AS cliente_nome,
  c.tipo_pessoa AS cliente_tipo,
  u.nome AS responsavel_nome,
  u.email AS responsavel_email,
  ct.titulo AS contrato_titulo,
  ct.objeto AS contrato_objeto
FROM pastas p
LEFT JOIN clientes c ON c.id = p.cliente_id
LEFT JOIN usuarios u ON u.id = p.responsavel_id
LEFT JOIN contratos ct ON ct.id = p.contrato_id;

-- View: Financeiro com nomes
CREATE OR REPLACE VIEW v_financeiro AS
SELECT
  f.id,
  f.tipo,
  f.valor,
  f.data_vencimento,
  f.valor_pago,
  f.data_pagamento,
  f.plano_contas,
  f.status,
  f.descricao,
  c.nome AS cliente_nome,
  p.titulo AS pasta_titulo,
  p.numero AS pasta_numero
FROM financeiro f
LEFT JOIN clientes c ON c.id = f.cliente_id
LEFT JOIN pastas p ON p.id = f.pasta_id;

-- View: Tarefas com nomes
CREATE OR REPLACE VIEW v_tarefas AS
SELECT
  t.id,
  t.titulo,
  t.tipo,
  t.prazo,
  t.status,
  t.prioridade,
  t.created_at,
  p.titulo AS pasta_titulo,
  p.numero AS pasta_numero,
  r.nome AS responsavel_nome,
  e.nome AS executante_nome,
  cl.nome AS cliente_nome
FROM tarefas t
LEFT JOIN pastas p ON p.id = t.pasta_id
LEFT JOIN usuarios r ON r.id = t.responsavel_id
LEFT JOIN usuarios e ON e.id = t.executante_id
LEFT JOIN clientes cl ON cl.id = p.cliente_id;

-- View: Créditos RCT com totais
CREATE OR REPLACE VIEW v_creditos AS
SELECT
  cr.id,
  cr.titulo,
  cr.tributo,
  cr.fase,
  cr.credito_apresentado,
  cr.credito_validado,
  cr.saldo,
  cr.created_at,
  p.titulo AS pasta_titulo,
  p.numero AS pasta_numero,
  cl.nome AS cliente_nome,
  u.nome AS responsavel_nome
FROM creditos cr
LEFT JOIN pastas p ON p.id = cr.pasta_id
LEFT JOIN clientes cl ON cl.id = p.cliente_id
LEFT JOIN usuarios u ON u.id = cr.responsavel_id;


-- View: Pipeline comercial (funil de vendas)
CREATE OR REPLACE VIEW v_pipeline AS
SELECT
  cl.id,
  cl.nome,
  cl.tipo_pessoa,
  cl.email,
  cl.telefone,
  cl.status_pipeline,
  cl.origem,
  cl.created_at,
  u.nome AS responsavel_nome,
  -- Dados do case (Patrimonial AI), se houver
  ca.id AS caso_ia_id,
  ca.status AS caso_etapa,
  ca.proposta_enviada,
  ca.contrato_fechado,
  -- Contrato mais recente
  ct.id AS contrato_id,
  ct.titulo AS contrato_titulo,
  ct.objeto AS contrato_objeto,
  ct.status AS contrato_status,
  ct.zapsign_signed_at
FROM clientes cl
LEFT JOIN usuarios u ON u.id = cl.responsavel_id
LEFT JOIN cases ca ON ca.cliente_id = cl.id
LEFT JOIN LATERAL (
  SELECT * FROM contratos c2
  WHERE c2.cliente_id = cl.id
  ORDER BY c2.created_at DESC LIMIT 1
) ct ON true;


-- ============================================================
-- FIM DA MIGRAÇÃO V2
-- ============================================================
-- Próximos passos:
-- 1. Executar este SQL no Supabase SQL Editor
-- 2. Migrar dados do Donna (AppSheet) para as novas tabelas
-- 3. Vincular cases existentes a clientes/pastas
-- 4. Implementar interfaces no Patrimonial AI
-- ============================================================
