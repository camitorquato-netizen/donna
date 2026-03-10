# Donna — Silveira Torquato Advogados

Sistema de gestão jurídica com IA para planejamento patrimonial.

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript 5
- **Supabase** (PostgreSQL + Storage) — anon key, RLS habilitado
- **TailwindCSS 4** com tokens ST (`st-dark`, `st-gold`, `st-green`, `st-red`, `st-muted`, `st-border`, `st-light`)
- **Claude API** via `/api/anthropic` (streaming)
- **ZapSign** para assinatura digital de contratos

## Estrutura

```
src/
├── app/(app)/          # Rotas protegidas (dashboard, clientes, contratos, pastas, financeiro, casos)
├── app/(public)/       # Rota pública (ticket do cliente)
├── app/api/            # API routes (anthropic proxy, zapsign webhook)
├── components/         # ~47 componentes React ("use client")
├── components/pastas/  # Tabs dinâmicas por tipo de pasta + workflow steps
├── hooks/              # Custom hooks
├── lib/store.ts        # CRUD centralizado Supabase (~46KB)
├── lib/types.ts        # Interfaces TypeScript (~14KB)
├── lib/prompts.ts      # System prompts para IA (~20KB)
├── lib/supabase.ts     # Cliente Supabase
├── lib/docxExport.ts   # Geração de DOCX
└── lib/zapsign/        # Integração ZapSign
```

## Módulos principais

1. **Caso IA** (`/caso/[id]`) — Workflow 6 etapas de planejamento patrimonial com Claude
2. **Clientes** (`/clientes`) — CRM com pipeline (lead → concluído)
3. **Contratos** (`/contratos`) — Gestão + assinatura via ZapSign
4. **Pastas** (`/pastas`) — Unidade central de trabalho
   - Tipo `servico` (RCT, assessoria, planejamento) ou `processo` (judicial)
   - Tabs dinâmicas conforme tipo
5. **Workflow RCT** — 6 etapas por crédito (Levantamento → Faturamento) com pontos de crédito
6. **Financeiro** (`/financeiro`) — Contas a receber/pagar

## Padrões de código

- Todos os componentes são Client Components (`"use client"`)
- CRUD via `lib/store.ts` (funções tipadas)
- Tipos em `lib/types.ts`
- Inputs de formulário: estado local + save on blur (evita perda de cursor)
- Path alias: `@/*` → `src/*`

## Banco de dados (Supabase)

Tabelas principais: `usuarios`, `clientes`, `contratos`, `pastas`, `processos`, `creditos`, `pontos`, `wf_rct`, `controle_rct`, `tarefas`, `publicacoes`, `financeiro`, `anotacoes`, `mensagens`, `etiquetas`, `cases` (IA), `documentos`

Views: `v_pastas`, `v_financeiro`, `v_tarefas`, `v_creditos`, `v_pipeline`

## Variáveis de ambiente (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
ANTHROPIC_API_KEY
ZAPSIGN_API_KEY (opcional)
```

## Comandos

```bash
npm run dev      # Dev server (porta 3000)
npm run build    # Build produção
npm run lint     # ESLint
```
