import {
  Case,
  StageNumber,
  Documento,
  Atendimento,
  Cliente,
  StatusPipeline,
  Parceiro,
  Contrato,
  ContratoStatus,
  Lancamento,
  LancamentoStatus,
  DashboardSummary,
  Pasta,
  PastaStatus,
  Processo,
  Credito,
  CreditoFase,
  WfRct,
  WfRctTarefa,
  ControleRct,
  Tarefa,
  TarefaStatus,
  TarefaPrioridade,
  Publicacao,
  PublicacaoStatus,
  Ponto,
  PontoStatusCliente,
  PilotoRct,
  Usuario,
  UsuarioPermissao,
  CreditoView,
  WfPlanejamento,
  WfPlanejamentoTarefa,
  WfPatrimonial,
  WfPatrimonialTarefa,
  WfPatrimonialDoc,
  WfPatrimonialAnalise,
  WfPatrimonialAnaliseTipo,
  WfPatrimonialSubtarefa,
  Historico,
} from "./types";
import { supabase } from "./supabase";

/* ------------------------------------------------------------------ */
/*  Usuarios                                                           */
/* ------------------------------------------------------------------ */

interface UsuarioRow {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  permissao: string;
  foto_url: string;
  ativo: boolean;
  created_at?: string;
}

function rowToUsuario(r: UsuarioRow): Usuario {
  return {
    id: r.id,
    nome: r.nome || "",
    email: r.email || "",
    cargo: r.cargo || "",
    permissao: (r.permissao as UsuarioPermissao) || "restrita",
    fotoUrl: r.foto_url || "",
    ativo: r.ativo ?? true,
    createdAt: r.created_at,
  };
}

function usuarioToRow(u: Usuario): Omit<UsuarioRow, "created_at"> {
  return {
    id: u.id,
    nome: u.nome,
    email: u.email,
    cargo: u.cargo || "",
    permissao: u.permissao || "restrita",
    foto_url: u.fotoUrl || "",
    ativo: u.ativo,
  };
}

export async function getAllUsuarios(onlyActive = true): Promise<Usuario[]> {
  let query = supabase
    .from("usuarios")
    .select("*")
    .order("nome", { ascending: true });
  if (onlyActive) query = query.eq("ativo", true);
  const { data, error } = await query;
  if (error) {
    console.error("[Store] Erro ao carregar usuarios:", error);
    return [];
  }
  return (data || []).map((r) => rowToUsuario(r as UsuarioRow));
}

export async function getUsuario(id: string): Promise<Usuario | null> {
  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("[Store] Erro ao carregar usuario:", error);
    return null;
  }
  return data ? rowToUsuario(data as UsuarioRow) : null;
}

export async function saveUsuario(u: Usuario): Promise<void> {
  const { error } = await supabase
    .from("usuarios")
    .upsert(usuarioToRow(u), { onConflict: "id", ignoreDuplicates: false });
  if (error) console.error("[Store] Erro ao salvar usuario:", error.message, "| code:", error.code, "| details:", error.details, "| hint:", error.hint);
}

export async function deleteUsuario(id: string): Promise<void> {
  const { error } = await supabase.from("usuarios").delete().eq("id", id);
  if (error) console.error("[Store] Erro ao excluir usuario:", error);
}

/* ------------------------------------------------------------------ */
/*  Mapeamento Case ↔ Row (banco Supabase)                           */
/* ------------------------------------------------------------------ */

interface CaseRow {
  id: string;
  created_at: string;
  client_name: string;
  responsible: string;
  status: number;
  transcription: string;
  intake_result: string;
  diagnosis_result: string;
  proposal_result: string;
  case_focus: string;
  intake_notes: string;
  diag_extra_info: string;
  diagnostic_notes: string;
  preliminary_output: string;
  diag_json: unknown;
  cliente_json: unknown;
  // Campos AppSheet
  appsheet_ticket_id: string | null;
  tipo: string;
  consultor_ref: string;
  consultoria_ref: string;
  breve_resumo_demanda: string;
  sugestao_agenda: string | null;
  docs_url: string;
  status_appsheet: string;
  proposta_enviada: boolean;
  contrato_fechado: boolean;
  updated_at_appsheet: string | null;
}

function caseToRow(c: Case): CaseRow {
  return {
    id: c.id,
    created_at: c.createdAt,
    client_name: c.clientName,
    responsible: c.professional,
    status: c.step,
    preliminary_output: c.preliminaryOutput || "",
    transcription: c.transcript,
    intake_result: c.intakeOutput,
    diagnosis_result: c.diagnosticOutput,
    proposal_result: c.proposalOutput,
    case_focus: c.caseFocus,
    intake_notes: c.intakeNotes,
    diag_extra_info: c.diagExtraInfo,
    diagnostic_notes: c.diagnosticNotes,
    diag_json: c.diagJSON,
    cliente_json: c.clienteJSON,
    // AppSheet
    appsheet_ticket_id: c.appsheetTicketId || null,
    tipo: c.tipo || "",
    consultor_ref: c.consultorRef || "",
    consultoria_ref: c.consultoriaRef || "",
    breve_resumo_demanda: c.breveResumoDemanda || "",
    sugestao_agenda: c.sugestaoAgenda || null,
    docs_url: c.docsUrl || "",
    status_appsheet: c.statusAppsheet || "",
    proposta_enviada: c.propostaEnviada ?? false,
    contrato_fechado: c.contratoFechado ?? false,
    updated_at_appsheet: c.updatedAtAppsheet || null,
  };
}

function rowToCase(r: CaseRow): Case {
  return {
    id: r.id,
    createdAt: r.created_at,
    clientName: r.client_name || "",
    professional: r.responsible || "",
    step: (r.status || 1) as StageNumber,
    preliminaryOutput: r.preliminary_output || "",
    transcript: r.transcription || "",
    intakeFiles: [],
    intakeOutput: r.intake_result || "",
    caseFocus: r.case_focus || "",
    intakeNotes: r.intake_notes || "",
    diagExtraInfo: r.diag_extra_info || "",
    diagFiles: [],
    diagnosticOutput: r.diagnosis_result || "",
    diagnosticNotes: r.diagnostic_notes || "",
    proposalOutput: r.proposal_result || "",
    diagJSON: (r.diag_json as Case["diagJSON"]) ?? null,
    clienteJSON: (r.cliente_json as Case["clienteJSON"]) ?? null,
    // AppSheet
    appsheetTicketId: r.appsheet_ticket_id || undefined,
    tipo: r.tipo || undefined,
    consultorRef: r.consultor_ref || undefined,
    consultoriaRef: r.consultoria_ref || undefined,
    breveResumoDemanda: r.breve_resumo_demanda || undefined,
    sugestaoAgenda: r.sugestao_agenda || undefined,
    docsUrl: r.docs_url || undefined,
    statusAppsheet: r.status_appsheet || undefined,
    propostaEnviada: r.proposta_enviada ?? false,
    contratoFechado: r.contrato_fechado ?? false,
    updatedAtAppsheet: r.updated_at_appsheet || undefined,
  };
}

/* ------------------------------------------------------------------ */
/*  Mapeamento Documento ↔ Row                                        */
/* ------------------------------------------------------------------ */

interface DocumentoRow {
  id: string;
  caso_id: string;
  nome: string;
  tipo: string;
  texto_extraido: string;
  storage_path: string;
  created_at: string;
}

function documentoToRow(d: Documento): Omit<DocumentoRow, "id" | "created_at"> & { id?: string } {
  return {
    ...(d.id ? { id: d.id } : {}),
    caso_id: d.casoId,
    nome: d.nome,
    tipo: d.tipo,
    texto_extraido: d.textoExtraido,
    storage_path: d.storagePath,
  };
}

function rowToDocumento(r: DocumentoRow): Documento {
  return {
    id: r.id,
    casoId: r.caso_id,
    nome: r.nome || "",
    tipo: (r.tipo as Documento["tipo"]) || "outro",
    textoExtraido: r.texto_extraido || "",
    storagePath: r.storage_path || "",
    createdAt: r.created_at,
  };
}

/* ------------------------------------------------------------------ */
/*  Mapeamento Atendimento ↔ Row                                      */
/* ------------------------------------------------------------------ */

interface AtendimentoRow {
  appsheet_atendimento_id: string;
  appsheet_ticket_id: string;
  timestamp_atendimento: string;
  tipo: string;
  usuario: string;
  breve_relato: string;
  url: string;
  file: string;
  mes: string;
  origem: string;
}

function rowToAtendimento(r: AtendimentoRow): Atendimento {
  return {
    appsheetAtendimentoId: r.appsheet_atendimento_id,
    appsheetTicketId: r.appsheet_ticket_id || "",
    timestampAtendimento: r.timestamp_atendimento || "",
    tipo: r.tipo || "",
    usuario: r.usuario || "",
    breveRelato: r.breve_relato || "",
    url: r.url || "",
    file: r.file || "",
    mes: r.mes || "",
    origem: r.origem || "appsheet",
  };
}

/* ------------------------------------------------------------------ */
/*  API pública — Cases                                                */
/* ------------------------------------------------------------------ */

export async function getAllCases(): Promise<Case[]> {
  const { data, error } = await supabase
    .from("cases")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Store] Erro ao carregar casos:", error);
    return [];
  }

  return (data || []).map((r) => rowToCase(r as CaseRow));
}

export async function getCase(id: string): Promise<Case | null> {
  const { data, error } = await supabase
    .from("cases")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[Store] Erro ao carregar caso:", error);
    return null;
  }

  return data ? rowToCase(data as CaseRow) : null;
}

export async function saveCase(c: Case): Promise<void> {
  const row = caseToRow(c);

  const { error } = await supabase
    .from("cases")
    .upsert(row, { onConflict: "id" });

  if (error) {
    // Se a coluna preliminary_output não existir ainda, tentar sem ela
    if (
      error.message?.includes("preliminary_output") ||
      error.code === "PGRST204"
    ) {
      console.warn(
        "[Store] Coluna preliminary_output não encontrada. Salvando sem ela."
      );
      const { preliminary_output, ...rowWithout } = row;
      void preliminary_output; // suppress unused warning
      const { error: retryError } = await supabase
        .from("cases")
        .upsert(rowWithout as CaseRow, { onConflict: "id" });
      if (retryError) {
        console.error("[Store] Erro ao salvar caso (retry):", retryError);
      }
      return;
    }
    console.error("[Store] Erro ao salvar caso:", error);
  }
}

export async function deleteCase(id: string): Promise<void> {
  const { error } = await supabase.from("cases").delete().eq("id", id);

  if (error) {
    console.error("[Store] Erro ao excluir caso:", error);
  }
}

export async function getCaseByTicket(ticketId: string): Promise<Case | null> {
  const { data, error } = await supabase
    .from("cases")
    .select("*")
    .eq("appsheet_ticket_id", ticketId)
    .maybeSingle();

  if (error) {
    console.error("[Store] Erro ao buscar caso por ticket:", error);
    return null;
  }

  return data ? rowToCase(data as CaseRow) : null;
}

export function newCaseId(): string {
  return crypto.randomUUID();
}

/* ------------------------------------------------------------------ */
/*  API pública — Documentos                                           */
/* ------------------------------------------------------------------ */

export async function getDocumentos(casoId: string): Promise<Documento[]> {
  const { data, error } = await supabase
    .from("documentos")
    .select("*")
    .eq("caso_id", casoId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[Store] Erro ao carregar documentos:", error);
    return [];
  }

  return (data || []).map((r) => rowToDocumento(r as DocumentoRow));
}

export async function saveDocumento(doc: Documento): Promise<Documento | null> {
  const row = documentoToRow(doc);

  const { data, error } = await supabase
    .from("documentos")
    .upsert(row, { onConflict: "id" })
    .select()
    .single();

  if (error) {
    console.error("[Store] Erro ao salvar documento:", error);
    return null;
  }

  return data ? rowToDocumento(data as DocumentoRow) : null;
}

export async function deleteDocumento(id: string): Promise<void> {
  const { error } = await supabase.from("documentos").delete().eq("id", id);

  if (error) {
    console.error("[Store] Erro ao excluir documento:", error);
  }
}

/* ------------------------------------------------------------------ */
/*  API pública — Atendimentos (leitura — AppSheet gerencia escrita)   */
/* ------------------------------------------------------------------ */

export async function getAtendimentos(ticketId: string): Promise<Atendimento[]> {
  const { data, error } = await supabase
    .from("atendimentos")
    .select("*")
    .eq("appsheet_ticket_id", ticketId)
    .order("timestamp_atendimento", { ascending: false });

  if (error) {
    console.error("[Store] Erro ao carregar atendimentos:", error);
    return [];
  }

  return (data || []).map((r) => rowToAtendimento(r as AtendimentoRow));
}

/* ------------------------------------------------------------------ */
/*  Mapeamento Cliente ↔ Row                                           */
/* ------------------------------------------------------------------ */

interface ClienteRow {
  id: string;
  nome: string;
  apelido: string;
  tipo_pessoa: string;
  cpf: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  contato_empresa: string;
  observacoes: string;
  status_pipeline: string;
  origem: string;
  responsavel_id: string | null;
  parceiro_id: string | null;
  created_at: string;
  updated_at: string;
  parceiros?: { razao_social: string } | null;
}

function clienteToRow(c: Cliente): Omit<ClienteRow, "created_at" | "updated_at" | "parceiros"> {
  return {
    id: c.id,
    nome: c.nome,
    apelido: c.apelido || "",
    tipo_pessoa: c.tipoPessoa,
    cpf: c.cpf || "",
    cnpj: c.cnpj || "",
    email: c.email || "",
    telefone: c.telefone || "",
    endereco: c.endereco || "",
    contato_empresa: c.contatoEmpresa || "",
    observacoes: c.observacoes || "",
    status_pipeline: c.statusPipeline || "lead",
    origem: c.origem || "",
    responsavel_id: c.responsavelId || null,
    parceiro_id: c.parceiroId || null,
  };
}

function rowToCliente(r: ClienteRow): Cliente {
  return {
    id: r.id,
    nome: r.nome || "",
    apelido: r.apelido || "",
    tipoPessoa: (r.tipo_pessoa as "PF" | "PJ") || "PF",
    cpf: r.cpf || "",
    cnpj: r.cnpj || "",
    email: r.email || "",
    telefone: r.telefone || "",
    endereco: r.endereco || "",
    contatoEmpresa: r.contato_empresa || "",
    observacoes: r.observacoes || "",
    statusPipeline: (r.status_pipeline as StatusPipeline) || "lead",
    origem: r.origem || "",
    responsavelId: r.responsavel_id || undefined,
    parceiroId: r.parceiro_id || undefined,
    parceiroNome: r.parceiros?.razao_social || undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/* ------------------------------------------------------------------ */
/*  API pública — Clientes                                             */
/* ------------------------------------------------------------------ */

export async function getAllClientes(): Promise<Cliente[]> {
  const { data, error } = await supabase
    .from("clientes")
    .select("*, parceiros(razao_social)")
    .order("nome", { ascending: true });

  if (error) {
    // Fallback: tentar sem join de parceiros
    console.warn("[Store] Erro com join parceiros, tentando sem:", error.message);
    const { data: d2, error: e2 } = await supabase
      .from("clientes")
      .select("*")
      .order("nome", { ascending: true });
    if (e2) { console.error("[Store] Erro ao carregar clientes:", e2); return []; }
    return (d2 || []).map((r) => rowToCliente(r as ClienteRow));
  }

  return (data || []).map((r) => rowToCliente(r as ClienteRow));
}

export async function getCliente(id: string): Promise<Cliente | null> {
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[Store] Erro ao carregar cliente:", error);
    return null;
  }

  return data ? rowToCliente(data as ClienteRow) : null;
}

export async function saveCliente(c: Cliente): Promise<void> {
  const row = clienteToRow(c);

  const { error } = await supabase
    .from("clientes")
    .upsert(row, { onConflict: "id" });

  if (error) {
    console.error("[Store] Erro ao salvar cliente:", error);
  }
}

export async function deleteCliente(id: string): Promise<void> {
  const { error } = await supabase.from("clientes").delete().eq("id", id);

  if (error) {
    console.error("[Store] Erro ao excluir cliente:", error);
  }
}

export async function getRecentClientes(limit = 5): Promise<Cliente[]> {
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[Store] Erro ao carregar clientes recentes:", error);
    return [];
  }

  return (data || []).map((r) => rowToCliente(r as ClienteRow));
}

/* ------------------------------------------------------------------ */
/*  Mapeamento Parceiro ↔ Row                                          */
/* ------------------------------------------------------------------ */

interface ParceiroRow {
  id: string;
  razao_social: string;
  cpf_cnpj: string;
  endereco: string;
  email: string;
  telefone: string;
  dados_bancarios: string;
  percentual_parceria: number;
  observacoes: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

function parceiroToRow(p: Parceiro): Omit<ParceiroRow, "created_at" | "updated_at"> {
  return {
    id: p.id,
    razao_social: p.razaoSocial,
    cpf_cnpj: p.cpfCnpj || "",
    endereco: p.endereco || "",
    email: p.email || "",
    telefone: p.telefone || "",
    dados_bancarios: p.dadosBancarios || "",
    percentual_parceria: p.percentualParceria ?? 0,
    observacoes: p.observacoes || "",
    ativo: p.ativo ?? true,
  };
}

function rowToParceiro(r: ParceiroRow): Parceiro {
  return {
    id: r.id,
    razaoSocial: r.razao_social || "",
    cpfCnpj: r.cpf_cnpj || "",
    endereco: r.endereco || "",
    email: r.email || "",
    telefone: r.telefone || "",
    dadosBancarios: r.dados_bancarios || "",
    percentualParceria: r.percentual_parceria ?? 0,
    observacoes: r.observacoes || "",
    ativo: r.ativo ?? true,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/* ------------------------------------------------------------------ */
/*  API pública — Parceiros                                            */
/* ------------------------------------------------------------------ */

export async function getAllParceiros(): Promise<Parceiro[]> {
  const { data, error } = await supabase
    .from("parceiros")
    .select("*")
    .order("razao_social", { ascending: true });

  if (error) {
    console.error("[Store] Erro ao carregar parceiros:", error);
    return [];
  }

  return (data || []).map((r) => rowToParceiro(r as ParceiroRow));
}

export async function getParceiro(id: string): Promise<Parceiro | null> {
  const { data, error } = await supabase
    .from("parceiros")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[Store] Erro ao carregar parceiro:", error);
    return null;
  }

  return data ? rowToParceiro(data as ParceiroRow) : null;
}

export async function saveParceiro(p: Parceiro): Promise<void> {
  const row = parceiroToRow(p);
  console.log("[Store] Salvando parceiro:", JSON.stringify(row));

  const { error } = await supabase
    .from("parceiros")
    .upsert(row, { onConflict: "id" });

  if (error) {
    console.error("[Store] Erro ao salvar parceiro:", error);
    throw new Error(`Erro ao salvar parceiro: ${error.message}`);
  }
  console.log("[Store] Parceiro salvo com sucesso");
}

export async function deleteParceiro(id: string): Promise<void> {
  const { error } = await supabase.from("parceiros").delete().eq("id", id);

  if (error) {
    console.error("[Store] Erro ao excluir parceiro:", error);
  }
}

/* ------------------------------------------------------------------ */
/*  Mapeamento Contrato ↔ Row                                          */
/* ------------------------------------------------------------------ */

interface ContratoRow {
  id: string;
  cliente_id: string;
  objeto: string;
  titulo: string;
  arquivo_url: string;
  valor: number | null;
  percentual_honorarios: number;
  data_entrada: string | null;
  vigencia: string | null;
  comercial_resp_id: string | null;
  parceiro_id: string | null;
  percentual_parceiro: number;
  zapsign_doc_token: string | null;
  zapsign_signed_at: string | null;
  zapsign_signer_name: string | null;
  zapsign_signer_email: string | null;
  status: string;
  quantidade_parcelas: number;
  datas_pagamento: string[] | null;
  caso_ia_id: string | null;
  created_at: string;
  updated_at: string;
  // Join fields
  clientes?: { nome: string } | null;
  parceiros?: { razao_social: string } | null;
}

function contratoToRow(c: Contrato): Omit<ContratoRow, "created_at" | "updated_at" | "clientes" | "parceiros"> {
  return {
    id: c.id,
    cliente_id: c.clienteId,
    objeto: c.objeto || "",
    titulo: c.titulo || "",
    arquivo_url: c.arquivoUrl || "",
    valor: c.valor,
    percentual_honorarios: c.percentualHonorarios ?? 0.20,
    data_entrada: c.dataEntrada || null,
    vigencia: c.vigencia || null,
    comercial_resp_id: c.comercialRespId || null,
    parceiro_id: c.parceiroId || null,
    percentual_parceiro: c.percentualParceiro ?? 0,
    zapsign_doc_token: c.zapsignDocToken || null,
    zapsign_signed_at: c.zapsignSignedAt || null,
    zapsign_signer_name: c.zapsignSignerName || null,
    zapsign_signer_email: c.zapsignSignerEmail || null,
    status: c.status || "rascunho",
    quantidade_parcelas: c.quantidadeParcelas || 1,
    datas_pagamento: c.datasPagamento?.length ? c.datasPagamento : null,
    caso_ia_id: c.casoIaId || null,
  };
}

function rowToContrato(r: ContratoRow): Contrato {
  return {
    id: r.id,
    clienteId: r.cliente_id,
    objeto: r.objeto || "",
    titulo: r.titulo || "",
    arquivoUrl: r.arquivo_url || "",
    valor: r.valor,
    percentualHonorarios: r.percentual_honorarios ?? 0.20,
    dataEntrada: r.data_entrada || null,
    vigencia: r.vigencia || null,
    comercialRespId: r.comercial_resp_id || undefined,
    parceiroId: r.parceiro_id || undefined,
    percentualParceiro: r.percentual_parceiro ?? 0,
    zapsignDocToken: r.zapsign_doc_token || undefined,
    zapsignSignedAt: r.zapsign_signed_at || undefined,
    zapsignSignerName: r.zapsign_signer_name || undefined,
    zapsignSignerEmail: r.zapsign_signer_email || undefined,
    status: (r.status as ContratoStatus) || "rascunho",
    quantidadeParcelas: r.quantidade_parcelas || 1,
    datasPagamento: (r.datas_pagamento as string[]) || [],
    casoIaId: r.caso_ia_id || undefined,
    clienteNome: r.clientes?.nome || undefined,
    parceiroNome: r.parceiros?.razao_social || undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/* ------------------------------------------------------------------ */
/*  API pública — Contratos                                            */
/* ------------------------------------------------------------------ */

export async function getAllContratos(): Promise<Contrato[]> {
  const { data, error } = await supabase
    .from("contratos")
    .select("*, clientes(nome), parceiros(razao_social)")
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("[Store] Erro com join parceiros em contratos, tentando sem:", error.message);
    const { data: d2, error: e2 } = await supabase
      .from("contratos")
      .select("*, clientes(nome)")
      .order("created_at", { ascending: false });
    if (e2) { console.error("[Store] Erro ao carregar contratos:", e2); return []; }
    return (d2 || []).map((r) => rowToContrato(r as ContratoRow));
  }

  return (data || []).map((r) => rowToContrato(r as ContratoRow));
}

export async function getContrato(id: string): Promise<Contrato | null> {
  const { data, error } = await supabase
    .from("contratos")
    .select("*, clientes(nome), parceiros(razao_social)")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.warn("[Store] Erro com join parceiros, tentando sem:", error.message);
    const { data: d2, error: e2 } = await supabase
      .from("contratos")
      .select("*, clientes(nome)")
      .eq("id", id)
      .maybeSingle();
    if (e2) { console.error("[Store] Erro ao carregar contrato:", e2); return null; }
    return d2 ? rowToContrato(d2 as ContratoRow) : null;
  }

  return data ? rowToContrato(data as ContratoRow) : null;
}

export async function saveContrato(c: Contrato): Promise<void> {
  const row = contratoToRow(c);

  const { error } = await supabase
    .from("contratos")
    .upsert(row, { onConflict: "id" });

  if (error) {
    console.error("[Store] Erro ao salvar contrato:", error);
  }
}

export async function deleteContrato(id: string): Promise<void> {
  const { error } = await supabase.from("contratos").delete().eq("id", id);

  if (error) {
    console.error("[Store] Erro ao excluir contrato:", error);
  }
}

export async function getContratosByCliente(clienteId: string): Promise<Contrato[]> {
  const { data, error } = await supabase
    .from("contratos")
    .select("*, clientes(nome), parceiros(razao_social)")
    .eq("cliente_id", clienteId)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("[Store] Erro com join parceiros, tentando sem:", error.message);
    const { data: d2, error: e2 } = await supabase
      .from("contratos")
      .select("*, clientes(nome)")
      .eq("cliente_id", clienteId)
      .order("created_at", { ascending: false });
    if (e2) { console.error("[Store] Erro ao carregar contratos do cliente:", e2); return []; }
    return (d2 || []).map((r) => rowToContrato(r as ContratoRow));
  }

  return (data || []).map((r) => rowToContrato(r as ContratoRow));
}

/* ------------------------------------------------------------------ */
/*  Mapeamento Lancamento (Financeiro) ↔ Row                           */
/* ------------------------------------------------------------------ */

interface LancamentoRow {
  id: string;
  cliente_id: string | null;
  pasta_id: string | null;
  credito_id: string | null;
  tipo: string;
  valor: number;
  data_vencimento: string | null;
  valor_pago: number;
  data_pagamento: string | null;
  plano_contas: string;
  boleto_url: string;
  descricao: string;
  comercial_resp_id: string | null;
  repasse_parceiro: number;
  status: string;
  created_at: string;
  updated_at: string;
  // Join fields
  clientes?: { nome: string } | null;
  pastas?: { titulo: string } | null;
}

function lancamentoToRow(l: Lancamento): Omit<LancamentoRow, "created_at" | "updated_at" | "clientes" | "pastas"> {
  return {
    id: l.id,
    cliente_id: l.clienteId || null,
    pasta_id: l.pastaId || null,
    credito_id: l.creditoId || null,
    tipo: l.tipo,
    valor: l.valor,
    data_vencimento: l.dataVencimento || null,
    valor_pago: l.valorPago ?? 0,
    data_pagamento: l.dataPagamento || null,
    plano_contas: l.planoContas || "honorarios",
    boleto_url: l.boletoUrl || "",
    descricao: l.descricao || "",
    comercial_resp_id: l.comercialRespId || null,
    repasse_parceiro: l.repasseParceiro ?? 0,
    status: l.status || "pendente",
  };
}

function rowToLancamento(r: LancamentoRow): Lancamento {
  return {
    id: r.id,
    clienteId: r.cliente_id || undefined,
    pastaId: r.pasta_id || undefined,
    creditoId: r.credito_id || undefined,
    tipo: (r.tipo as "a_receber" | "a_pagar") || "a_receber",
    valor: r.valor ?? 0,
    dataVencimento: r.data_vencimento || null,
    valorPago: r.valor_pago ?? 0,
    dataPagamento: r.data_pagamento || null,
    planoContas: r.plano_contas || "honorarios",
    boletoUrl: r.boleto_url || "",
    descricao: r.descricao || "",
    comercialRespId: r.comercial_resp_id || undefined,
    repasseParceiro: r.repasse_parceiro ?? 0,
    status: (r.status as LancamentoStatus) || "pendente",
    clienteNome: r.clientes?.nome || undefined,
    pastaTitulo: r.pastas?.titulo || undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/* ------------------------------------------------------------------ */
/*  API pública — Financeiro (Lançamentos)                             */
/* ------------------------------------------------------------------ */

export async function getAllLancamentos(): Promise<Lancamento[]> {
  const { data, error } = await supabase
    .from("financeiro")
    .select("*, clientes(nome), pastas(titulo)")
    .order("data_vencimento", { ascending: false });

  if (error) {
    console.error("[Store] Erro ao carregar lançamentos:", error);
    return [];
  }

  return (data || []).map((r) => rowToLancamento(r as LancamentoRow));
}

export async function getLancamento(id: string): Promise<Lancamento | null> {
  const { data, error } = await supabase
    .from("financeiro")
    .select("*, clientes(nome), pastas(titulo)")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[Store] Erro ao carregar lançamento:", error);
    return null;
  }

  return data ? rowToLancamento(data as LancamentoRow) : null;
}

export async function saveLancamento(l: Lancamento): Promise<void> {
  const row = lancamentoToRow(l);

  const { error } = await supabase
    .from("financeiro")
    .upsert(row, { onConflict: "id" });

  if (error) {
    console.error("[Store] Erro ao salvar lançamento:", error);
  }
}

export async function deleteLancamento(id: string): Promise<void> {
  const { error } = await supabase.from("financeiro").delete().eq("id", id);

  if (error) {
    console.error("[Store] Erro ao excluir lançamento:", error);
  }
}

/* ------------------------------------------------------------------ */
/*  API pública — Dashboard                                            */
/* ------------------------------------------------------------------ */

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [clientesRes, contratosRes, aReceberRes, aPagarRes] = await Promise.all([
    supabase.from("clientes").select("id", { count: "exact", head: true }),
    supabase
      .from("contratos")
      .select("id", { count: "exact", head: true })
      .in("status", ["assinado", "vigente"]),
    supabase
      .from("financeiro")
      .select("valor")
      .eq("tipo", "a_receber")
      .eq("status", "pendente"),
    supabase
      .from("financeiro")
      .select("valor")
      .eq("tipo", "a_pagar")
      .eq("status", "pendente"),
  ]);

  const totalAReceber = (aReceberRes.data || []).reduce(
    (sum, r) => sum + (Number((r as { valor: number }).valor) || 0),
    0
  );
  const totalAPagar = (aPagarRes.data || []).reduce(
    (sum, r) => sum + (Number((r as { valor: number }).valor) || 0),
    0
  );

  return {
    totalClientes: clientesRes.count ?? 0,
    contratosAtivos: contratosRes.count ?? 0,
    totalAReceber,
    totalAPagar,
  };
}

/* ================================================================== */
/*  PASTAS DE TRABALHO                                                 */
/* ================================================================== */

/* ------------------------------------------------------------------ */
/*  Mapeamento Pasta ↔ Row                                             */
/* ------------------------------------------------------------------ */

interface PastaRow {
  id: string;
  numero: string;
  contrato_id: string | null;
  cliente_id: string;
  titulo: string;
  tipo: string;
  responsavel_id: string | null;
  comercial_resp_id: string | null;
  tipo_servico: string;
  status: string;
  caso_ia_id: string | null;
  abrangencia: string;
  created_at: string;
  updated_at: string;
  clientes?: { nome: string } | null;
  contratos?: { titulo: string; objeto: string } | null;
}

function pastaToRow(p: Pasta): Omit<PastaRow, "created_at" | "updated_at" | "clientes" | "contratos"> {
  return {
    id: p.id,
    numero: p.numero || "",
    contrato_id: p.contratoId || null,
    cliente_id: p.clienteId,
    titulo: p.titulo || "",
    tipo: p.tipo || "servico",
    responsavel_id: p.responsavelId || null,
    comercial_resp_id: p.comercialRespId || null,
    tipo_servico: p.tipoServico || "",
    status: p.status || "ativo",
    caso_ia_id: p.casoIaId || null,
    abrangencia: p.abrangencia || "",
  };
}

function rowToPasta(r: PastaRow): Pasta {
  return {
    id: r.id,
    numero: r.numero || "",
    contratoId: r.contrato_id || undefined,
    clienteId: r.cliente_id,
    titulo: r.titulo || "",
    tipo: (r.tipo as Pasta["tipo"]) || "servico",
    responsavelId: r.responsavel_id || undefined,
    comercialRespId: r.comercial_resp_id || undefined,
    tipoServico: r.tipo_servico || "",
    status: (r.status as PastaStatus) || "ativo",
    casoIaId: r.caso_ia_id || undefined,
    abrangencia: r.abrangencia || "",
    clienteNome: r.clientes?.nome || undefined,
    contratoTitulo: r.contratos?.titulo || undefined,
    contratoObjeto: r.contratos?.objeto || undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

const PASTA_SELECT = "*, clientes(nome), contratos(titulo, objeto)";

export async function getAllPastas(): Promise<Pasta[]> {
  const { data, error } = await supabase
    .from("pastas")
    .select(PASTA_SELECT)
    .order("created_at", { ascending: false });
  if (error) { console.error("[Store] Erro pastas:", error); return []; }
  return (data || []).map((r) => rowToPasta(r as PastaRow));
}

export async function getPasta(id: string): Promise<Pasta | null> {
  const { data, error } = await supabase
    .from("pastas")
    .select(PASTA_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) { console.error("[Store] Erro pasta:", error); return null; }
  return data ? rowToPasta(data as PastaRow) : null;
}

export async function savePasta(p: Pasta): Promise<void> {
  const { error } = await supabase.from("pastas").upsert(pastaToRow(p), { onConflict: "id" });
  if (error) console.error("[Store] Erro salvar pasta:", error);
}

export async function deletePasta(id: string): Promise<void> {
  // Excluir registros dependentes primeiro (ordem importa por FKs internas)
  await supabase.from("wf_patrimonial_subtarefas").delete().eq("pasta_id", id);
  await supabase.from("wf_patrimonial_docs").delete().eq("pasta_id", id);
  await supabase.from("wf_patrimonial_analise").delete().eq("pasta_id", id);
  await supabase.from("wf_patrimonial").delete().eq("pasta_id", id);
  await supabase.from("wf_planejamento").delete().eq("pasta_id", id);
  await supabase.from("pontos").delete().eq("pasta_id", id);
  await supabase.from("controle_rct").delete().eq("pasta_id", id);
  await supabase.from("wf_rct").delete().eq("pasta_id", id);
  await supabase.from("creditos").delete().eq("pasta_id", id);
  await supabase.from("financeiro").delete().eq("pasta_id", id);
  await supabase.from("tarefas").delete().eq("pasta_id", id);
  await supabase.from("anotacoes").delete().eq("pasta_id", id);
  await supabase.from("publicacoes").delete().eq("pasta_id", id);
  await supabase.from("historico").delete().eq("pasta_id", id);
  await supabase.from("documentos").delete().eq("pasta_id", id);
  await supabase.from("processos").delete().eq("pasta_id", id);
  const { error } = await supabase.from("pastas").delete().eq("id", id);
  if (error) throw new Error(`Erro ao excluir pasta: ${error.message}`);
}

export async function getPastasByContrato(contratoId: string): Promise<Pasta[]> {
  const { data, error } = await supabase
    .from("pastas").select(PASTA_SELECT).eq("contrato_id", contratoId).order("created_at", { ascending: false });
  if (error) { console.error("[Store] Erro pastas contrato:", error); return []; }
  return (data || []).map((r) => rowToPasta(r as PastaRow));
}

export async function getPastaByContrato(contratoId: string): Promise<Pasta | null> {
  const pastas = await getPastasByContrato(contratoId);
  return pastas.length > 0 ? pastas[0] : null;
}

export async function getPastasByCliente(clienteId: string): Promise<Pasta[]> {
  const { data, error } = await supabase
    .from("pastas").select(PASTA_SELECT).eq("cliente_id", clienteId).order("created_at", { ascending: false });
  if (error) { console.error("[Store] Erro pastas cliente:", error); return []; }
  return (data || []).map((r) => rowToPasta(r as PastaRow));
}

/* ------------------------------------------------------------------ */
/*  Mapeamento Processo ↔ Row                                          */
/* ------------------------------------------------------------------ */

interface ProcessoRow {
  id: string;
  pasta_id: string;
  numero_cnj: string;
  numero_processo: string;
  area: string;
  esfera: string;
  rito: string;
  materia: string;
  polo: string;
  data_ajuizamento: string | null;
  valor_causa: number | null;
  jurisdicao: string;
  data_transito_julgado: string | null;
  observacoes: string;
  created_at: string;
  updated_at: string;
}

function processoToRow(p: Processo): Omit<ProcessoRow, "created_at" | "updated_at"> {
  return {
    id: p.id,
    pasta_id: p.pastaId,
    numero_cnj: p.numeroCnj || "",
    numero_processo: p.numeroProcesso || "",
    area: p.area || "",
    esfera: p.esfera || "judicial",
    rito: p.rito || "",
    materia: p.materia || "",
    polo: p.polo || "",
    data_ajuizamento: p.dataAjuizamento || null,
    valor_causa: p.valorCausa,
    jurisdicao: p.jurisdicao || "",
    data_transito_julgado: p.dataTransitoJulgado || null,
    observacoes: p.observacoes || "",
  };
}

function rowToProcesso(r: ProcessoRow): Processo {
  return {
    id: r.id,
    pastaId: r.pasta_id,
    numeroCnj: r.numero_cnj || "",
    numeroProcesso: r.numero_processo || "",
    area: r.area || "",
    esfera: (r.esfera as Processo["esfera"]) || "judicial",
    rito: r.rito || "",
    materia: r.materia || "",
    polo: (r.polo as Processo["polo"]) || "",
    dataAjuizamento: r.data_ajuizamento || null,
    valorCausa: r.valor_causa,
    jurisdicao: r.jurisdicao || "",
    dataTransitoJulgado: r.data_transito_julgado || null,
    observacoes: r.observacoes || "",
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function getProcessoByPasta(pastaId: string): Promise<Processo | null> {
  const { data, error } = await supabase
    .from("processos").select("*").eq("pasta_id", pastaId).maybeSingle();
  if (error) { console.error("[Store] Erro processo:", error); return null; }
  return data ? rowToProcesso(data as ProcessoRow) : null;
}

export async function saveProcesso(p: Processo): Promise<void> {
  const { error } = await supabase.from("processos").upsert(processoToRow(p), { onConflict: "id" });
  if (error) console.error("[Store] Erro salvar processo:", error);
}

/* ------------------------------------------------------------------ */
/*  Mapeamento Credito ↔ Row                                           */
/* ------------------------------------------------------------------ */

interface CreditoRow {
  id: string;
  pasta_id: string;
  titulo: string;
  tributo: string;
  credito_apresentado: number;
  credito_validado: number;
  saldo: number;
  fase: string;
  responsavel_id: string | null;
  apresentacao_url: string;
  parecer_url: string;
  created_at: string;
  updated_at: string;
}

function creditoToRow(c: Credito): Omit<CreditoRow, "created_at" | "updated_at"> {
  return {
    id: c.id,
    pasta_id: c.pastaId,
    titulo: c.titulo || "",
    tributo: c.tributo || "",
    credito_apresentado: c.creditoApresentado ?? 0,
    credito_validado: c.creditoValidado ?? 0,
    saldo: c.saldo ?? 0,
    fase: c.fase || "1_analise",
    responsavel_id: c.responsavelId || null,
    apresentacao_url: c.apresentacaoUrl || "",
    parecer_url: c.parecerUrl || "",
  };
}

function rowToCredito(r: CreditoRow): Credito {
  return {
    id: r.id,
    pastaId: r.pasta_id,
    titulo: r.titulo || "",
    tributo: r.tributo || "",
    creditoApresentado: r.credito_apresentado ?? 0,
    creditoValidado: r.credito_validado ?? 0,
    saldo: r.saldo ?? 0,
    fase: (r.fase as CreditoFase) || "1_analise",
    responsavelId: r.responsavel_id || undefined,
    apresentacaoUrl: r.apresentacao_url || "",
    parecerUrl: r.parecer_url || "",
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function getCreditosByPasta(pastaId: string): Promise<Credito[]> {
  const { data, error } = await supabase
    .from("creditos").select("*").eq("pasta_id", pastaId).order("created_at", { ascending: true });
  if (error) { console.error("[Store] Erro creditos:", error); return []; }
  return (data || []).map((r) => rowToCredito(r as CreditoRow));
}

export async function saveCredito(c: Credito): Promise<void> {
  const { error } = await supabase.from("creditos").upsert(creditoToRow(c), { onConflict: "id" });
  if (error) console.error("[Store] Erro salvar credito:", error);
}

export async function deleteCredito(id: string): Promise<void> {
  // Deletar dependências na ordem correta (FK constraints)
  await supabase.from("pontos").delete().eq("credito_id", id);
  await supabase.from("controle_rct").delete().eq("credito_id", id);
  await supabase.from("wf_rct").delete().eq("credito_id", id);
  // Limpar referências nullable
  await supabase.from("financeiro").update({ credito_id: null }).eq("credito_id", id);
  await supabase.from("documentos").update({ credito_id: null }).eq("credito_id", id);
  // Deletar o crédito
  const { error } = await supabase.from("creditos").delete().eq("id", id);
  if (error) console.error("[Store] Erro excluir credito:", error);
}

export async function getAllCreditosView(): Promise<CreditoView[]> {
  const { data, error } = await supabase
    .from("creditos")
    .select("id, titulo, tributo, fase, credito_apresentado, credito_validado, saldo, created_at, pasta_id, pastas(titulo, numero, clientes(nome)), usuarios(nome)")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[Store] Erro ao carregar creditos view:", error);
    // Fallback: tentar via v_creditos (sem pasta_id)
    const { data: vData, error: vErr } = await supabase
      .from("v_creditos")
      .select("*")
      .order("created_at", { ascending: false });
    if (vErr) {
      console.error("[Store] Fallback v_creditos também falhou:", vErr);
      return [];
    }
    return (vData || []).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      titulo: (r.titulo as string) || "",
      tributo: (r.tributo as string) || "",
      fase: (r.fase as string) || "1_analise",
      creditoApresentado: (r.credito_apresentado as number) || 0,
      creditoValidado: (r.credito_validado as number) || 0,
      saldo: (r.saldo as number) || 0,
      createdAt: (r.created_at as string) || "",
      pastaTitulo: (r.pasta_titulo as string) || "",
      pastaNumero: (r.pasta_numero as string) || "",
      pastaId: "",
      clienteNome: (r.cliente_nome as string) || "",
      responsavelNome: (r.responsavel_nome as string) || "",
    })) as CreditoView[];
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((r: any) => ({
    id: r.id as string,
    titulo: (r.titulo as string) || "",
    tributo: (r.tributo as string) || "",
    fase: (r.fase as string) || "1_analise",
    creditoApresentado: (r.credito_apresentado as number) || 0,
    creditoValidado: (r.credito_validado as number) || 0,
    saldo: (r.saldo as number) || 0,
    createdAt: (r.created_at as string) || "",
    pastaTitulo: r.pastas?.titulo || "",
    pastaNumero: r.pastas?.numero || "",
    pastaId: (r.pasta_id as string) || "",
    clienteNome: r.pastas?.clientes?.nome || "",
    responsavelNome: r.usuarios?.nome || "",
  })) as CreditoView[];
}

/* ------------------------------------------------------------------ */
/*  Mapeamento WfRct ↔ Row                                             */
/* ------------------------------------------------------------------ */

interface WfRctRow {
  id: string;
  credito_id: string;
  tarefa: string;
  responsavel_id: string | null;
  status: string;
  url: string;
  observacoes: string;
  prazo: string | null;
  created_at: string;
  updated_at: string;
}

function wfRctToRow(w: WfRct): Omit<WfRctRow, "created_at" | "updated_at"> {
  return {
    id: w.id,
    credito_id: w.creditoId,
    tarefa: w.tarefa,
    responsavel_id: w.responsavelId || null,
    status: w.status || "pendente",
    url: w.url || "",
    observacoes: w.observacoes || "",
    prazo: w.prazo || null,
  };
}

function rowToWfRct(r: WfRctRow): WfRct {
  return {
    id: r.id,
    creditoId: r.credito_id,
    tarefa: r.tarefa as WfRctTarefa,
    responsavelId: r.responsavel_id || undefined,
    status: (r.status as WfRct["status"]) || "pendente",
    url: r.url || "",
    observacoes: r.observacoes || "",
    prazo: r.prazo || null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function getWfRctByCredito(creditoId: string): Promise<WfRct[]> {
  const { data, error } = await supabase
    .from("wf_rct").select("*").eq("credito_id", creditoId).order("tarefa", { ascending: true });
  if (error) { console.error("[Store] Erro wf_rct:", error); return []; }
  return (data || []).map((r) => rowToWfRct(r as WfRctRow));
}

export async function saveWfRct(w: WfRct): Promise<void> {
  const { error } = await supabase.from("wf_rct").upsert(wfRctToRow(w), { onConflict: "id" });
  if (error) console.error("[Store] Erro salvar wf_rct:", error);
}

export async function initWfRctForCredito(creditoId: string): Promise<void> {
  const tarefas: WfRctTarefa[] = [
    "1_levantamento", "2_parecer", "3_apresentacao",
    "4_retificacoes", "5_compensacoes", "6_faturamento",
  ];
  const rows = tarefas.map((t) => ({
    id: crypto.randomUUID(),
    credito_id: creditoId,
    tarefa: t,
    status: "pendente",
    url: "",
    observacoes: "",
  }));
  const { error } = await supabase.from("wf_rct").insert(rows);
  if (error) console.error("[Store] Erro init wf_rct:", error);
}

/* ------------------------------------------------------------------ */
/*  Mapeamento WfPlanejamento ↔ Row                                     */
/* ------------------------------------------------------------------ */

interface WfPlanejamentoRow {
  id: string;
  pasta_id: string;
  tarefa: string;
  responsavel_id: string | null;
  status: string;
  url: string;
  prompt: string;
  observacoes: string;
  prazo: string | null;
  created_at: string;
  updated_at: string;
}

function wfPlanejamentoToRow(
  w: WfPlanejamento
): Omit<WfPlanejamentoRow, "created_at" | "updated_at"> {
  return {
    id: w.id,
    pasta_id: w.pastaId,
    tarefa: w.tarefa,
    responsavel_id: w.responsavelId || null,
    status: w.status || "pendente",
    url: w.url || "",
    prompt: w.prompt || "",
    observacoes: w.observacoes || "",
    prazo: w.prazo || null,
  };
}

function rowToWfPlanejamento(r: WfPlanejamentoRow): WfPlanejamento {
  return {
    id: r.id,
    pastaId: r.pasta_id,
    tarefa: r.tarefa as WfPlanejamentoTarefa,
    responsavelId: r.responsavel_id || undefined,
    status: (r.status as WfPlanejamento["status"]) || "pendente",
    url: r.url || "",
    prompt: r.prompt || "",
    observacoes: r.observacoes || "",
    prazo: r.prazo || null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function getWfPlanejamentoByPasta(pastaId: string): Promise<WfPlanejamento[]> {
  const { data, error } = await supabase
    .from("wf_planejamento")
    .select("*")
    .eq("pasta_id", pastaId)
    .order("tarefa", { ascending: true });
  if (error) { console.error("[Store] Erro wf_planejamento:", error); return []; }
  return (data || []).map((r) => rowToWfPlanejamento(r as WfPlanejamentoRow));
}

export async function saveWfPlanejamento(w: WfPlanejamento): Promise<void> {
  const { error } = await supabase
    .from("wf_planejamento")
    .upsert(wfPlanejamentoToRow(w), { onConflict: "id" });
  if (error) console.error("[Store] Erro salvar wf_planejamento:", error);
}

export async function initWfPlanejamentoForPasta(pastaId: string): Promise<void> {
  const tarefas: WfPlanejamentoTarefa[] = [
    "1_onboarding", "2_coleta_documental", "3_diagnostico",
    "4_cenarios", "5_apresentacao", "6_implementacao",
  ];
  const rows = tarefas.map((t) => ({
    id: crypto.randomUUID(),
    pasta_id: pastaId,
    tarefa: t,
    status: "pendente",
    url: "",
    prompt: "",
    observacoes: "",
  }));
  const { error } = await supabase.from("wf_planejamento").insert(rows);
  if (error) console.error("[Store] Erro init wf_planejamento:", error);
}

/* ------------------------------------------------------------------ */
/*  Workflow Patrimonial                                                */
/* ------------------------------------------------------------------ */

interface WfPatrimonialRow {
  id: string;
  pasta_id: string;
  tarefa: string;
  responsavel_id: string | null;
  status: string;
  url: string;
  observacoes: string;
  prazo: string | null;
  decisao: string;
  revisoes: number;
  created_at: string;
  updated_at: string;
}

function wfPatrimonialToRow(
  w: WfPatrimonial
): Omit<WfPatrimonialRow, "created_at" | "updated_at"> {
  return {
    id: w.id,
    pasta_id: w.pastaId,
    tarefa: w.tarefa,
    responsavel_id: w.responsavelId || null,
    status: w.status || "pendente",
    url: w.url || "",
    observacoes: w.observacoes || "",
    prazo: w.prazo || null,
    decisao: w.decisao || "",
    revisoes: w.revisoes || 0,
  };
}

function rowToWfPatrimonial(r: WfPatrimonialRow): WfPatrimonial {
  return {
    id: r.id,
    pastaId: r.pasta_id,
    tarefa: r.tarefa as WfPatrimonialTarefa,
    responsavelId: r.responsavel_id || undefined,
    status: (r.status as WfPatrimonial["status"]) || "pendente",
    url: r.url || "",
    observacoes: r.observacoes || "",
    prazo: r.prazo || null,
    decisao: r.decisao || "",
    revisoes: r.revisoes || 0,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function getWfPatrimonialByPasta(pastaId: string): Promise<WfPatrimonial[]> {
  const { data, error } = await supabase
    .from("wf_patrimonial")
    .select("*")
    .eq("pasta_id", pastaId)
    .order("tarefa", { ascending: true });
  if (error) { console.error("[Store] Erro wf_patrimonial:", error); return []; }
  return (data || []).map((r) => rowToWfPatrimonial(r as WfPatrimonialRow));
}

export async function saveWfPatrimonial(w: WfPatrimonial): Promise<void> {
  const { error } = await supabase
    .from("wf_patrimonial")
    .upsert(wfPatrimonialToRow(w), { onConflict: "id" });
  if (error) console.error("[Store] Erro salvar wf_patrimonial:", error);
}

export async function initWfPatrimonialForPasta(pastaId: string): Promise<void> {
  const tarefas: WfPatrimonialTarefa[] = [
    "1_abertura", "2_onboarding", "3_coleta", "4_analise",
    "5_consolidacao", "6_devolutiva", "7_gate", "8_execucao",
    "9_monitoramento",
  ];
  const rows = tarefas.map((t) => ({
    id: crypto.randomUUID(),
    pasta_id: pastaId,
    tarefa: t,
    status: "pendente",
    url: "",
    observacoes: "",
    decisao: "",
    revisoes: 0,
  }));
  const { error } = await supabase.from("wf_patrimonial").insert(rows);
  if (error) console.error("[Store] Erro init wf_patrimonial:", error);

  // Also create 3 specialist analyses
  const tipos: WfPatrimonialAnaliseTipo[] = ["tributario", "societario", "familia"];
  const analiseRows = tipos.map((t) => ({
    id: crypto.randomUUID(),
    pasta_id: pastaId,
    tipo: t,
    status: "pendente",
    url: "",
    observacoes: "",
  }));
  const { error: e2 } = await supabase.from("wf_patrimonial_analise").insert(analiseRows);
  if (e2) console.error("[Store] Erro init wf_patrimonial_analise:", e2);
}

/* -- Patrimonial Docs (step 3 checklist) -- */

interface WfPatrimonialDocRow {
  id: string;
  pasta_id: string;
  nome: string;
  status: string;
  observacoes: string;
  created_at: string;
}

export async function getWfPatrimonialDocs(pastaId: string): Promise<WfPatrimonialDoc[]> {
  const { data, error } = await supabase
    .from("wf_patrimonial_docs")
    .select("*")
    .eq("pasta_id", pastaId)
    .order("created_at", { ascending: true });
  if (error) { console.error("[Store] Erro wf_patrimonial_docs:", error); return []; }
  return (data || []).map((r: WfPatrimonialDocRow) => ({
    id: r.id,
    pastaId: r.pasta_id,
    nome: r.nome,
    status: r.status as WfPatrimonialDoc["status"],
    observacoes: r.observacoes || "",
    createdAt: r.created_at,
  }));
}

export async function saveWfPatrimonialDoc(doc: WfPatrimonialDoc): Promise<void> {
  const { error } = await supabase
    .from("wf_patrimonial_docs")
    .upsert({ id: doc.id, pasta_id: doc.pastaId, nome: doc.nome, status: doc.status, observacoes: doc.observacoes }, { onConflict: "id" });
  if (error) console.error("[Store] Erro salvar wf_patrimonial_docs:", error);
}

export async function addWfPatrimonialDoc(pastaId: string, nome: string): Promise<WfPatrimonialDoc | null> {
  const id = crypto.randomUUID();
  const { error } = await supabase
    .from("wf_patrimonial_docs")
    .insert({ id, pasta_id: pastaId, nome, status: "pendente", observacoes: "" });
  if (error) { console.error("[Store] Erro add wf_patrimonial_docs:", error); return null; }
  return { id, pastaId, nome, status: "pendente", observacoes: "" };
}

export async function deleteWfPatrimonialDoc(id: string): Promise<void> {
  const { error } = await supabase.from("wf_patrimonial_docs").delete().eq("id", id);
  if (error) console.error("[Store] Erro delete wf_patrimonial_docs:", error);
}

/* -- Patrimonial Análises (step 4 specialists) -- */

interface WfPatrimonialAnaliseRow {
  id: string;
  pasta_id: string;
  tipo: string;
  responsavel_id: string | null;
  status: string;
  url: string;
  observacoes: string;
  prazo: string | null;
  created_at: string;
  updated_at: string;
}

export async function getWfPatrimonialAnalises(pastaId: string): Promise<WfPatrimonialAnalise[]> {
  const { data, error } = await supabase
    .from("wf_patrimonial_analise")
    .select("*")
    .eq("pasta_id", pastaId)
    .order("tipo", { ascending: true });
  if (error) { console.error("[Store] Erro wf_patrimonial_analise:", error); return []; }
  return (data || []).map((r: WfPatrimonialAnaliseRow) => ({
    id: r.id,
    pastaId: r.pasta_id,
    tipo: r.tipo as WfPatrimonialAnaliseTipo,
    responsavelId: r.responsavel_id || undefined,
    status: (r.status as WfPatrimonialAnalise["status"]) || "pendente",
    url: r.url || "",
    observacoes: r.observacoes || "",
    prazo: r.prazo || null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function saveWfPatrimonialAnalise(a: WfPatrimonialAnalise): Promise<void> {
  const { error } = await supabase
    .from("wf_patrimonial_analise")
    .upsert({
      id: a.id, pasta_id: a.pastaId, tipo: a.tipo,
      responsavel_id: a.responsavelId || null,
      status: a.status, url: a.url || "", observacoes: a.observacoes || "",
      prazo: a.prazo || null,
    }, { onConflict: "id" });
  if (error) console.error("[Store] Erro salvar wf_patrimonial_analise:", error);
}

/* -- Patrimonial Subtarefas (step 8) -- */

interface WfPatrimonialSubtarefaRow {
  id: string;
  pasta_id: string;
  descricao: string;
  responsavel_id: string | null;
  status: string;
  prazo: string | null;
  observacoes: string;
  created_at: string;
}

export async function getWfPatrimonialSubtarefas(pastaId: string): Promise<WfPatrimonialSubtarefa[]> {
  const { data, error } = await supabase
    .from("wf_patrimonial_subtarefas")
    .select("*")
    .eq("pasta_id", pastaId)
    .order("created_at", { ascending: true });
  if (error) { console.error("[Store] Erro wf_patrimonial_subtarefas:", error); return []; }
  return (data || []).map((r: WfPatrimonialSubtarefaRow) => ({
    id: r.id,
    pastaId: r.pasta_id,
    descricao: r.descricao,
    responsavelId: r.responsavel_id || undefined,
    status: (r.status as WfPatrimonialSubtarefa["status"]) || "pendente",
    prazo: r.prazo || null,
    observacoes: r.observacoes || "",
    createdAt: r.created_at,
  }));
}

export async function saveWfPatrimonialSubtarefa(s: WfPatrimonialSubtarefa): Promise<void> {
  const { error } = await supabase
    .from("wf_patrimonial_subtarefas")
    .upsert({
      id: s.id, pasta_id: s.pastaId, descricao: s.descricao,
      responsavel_id: s.responsavelId || null,
      status: s.status, prazo: s.prazo || null, observacoes: s.observacoes || "",
    }, { onConflict: "id" });
  if (error) console.error("[Store] Erro salvar wf_patrimonial_subtarefas:", error);
}

export async function addWfPatrimonialSubtarefa(pastaId: string, descricao: string): Promise<WfPatrimonialSubtarefa | null> {
  const id = crypto.randomUUID();
  const { error } = await supabase
    .from("wf_patrimonial_subtarefas")
    .insert({ id, pasta_id: pastaId, descricao, status: "pendente", observacoes: "" });
  if (error) { console.error("[Store] Erro add wf_patrimonial_subtarefas:", error); return null; }
  return { id, pastaId, descricao, status: "pendente", prazo: null, observacoes: "" };
}

export async function deleteWfPatrimonialSubtarefa(id: string): Promise<void> {
  const { error } = await supabase.from("wf_patrimonial_subtarefas").delete().eq("id", id);
  if (error) console.error("[Store] Erro delete wf_patrimonial_subtarefas:", error);
}

/* ------------------------------------------------------------------ */
/*  Mapeamento ControleRct ↔ Row                                       */
/* ------------------------------------------------------------------ */

interface ControleRctRow {
  id: string;
  credito_id: string;
  valor_principal: number;
  selic: number;
  valor_compensado: number;
  tributo_compensado: string;
  data_compensacao: string | null;
  forma_utilizacao: string;
  comprovantes_url: string;
  honorarios_percentual: number;
  boleto_valor: number;
  perdcomp_web: string;
  created_at: string;
}

function controleRctToRow(c: ControleRct): Omit<ControleRctRow, "created_at"> {
  return {
    id: c.id,
    credito_id: c.creditoId,
    valor_principal: c.valorPrincipal ?? 0,
    selic: c.selic ?? 0,
    valor_compensado: c.valorCompensado ?? 0,
    tributo_compensado: c.tributoCompensado || "",
    data_compensacao: c.dataCompensacao || null,
    forma_utilizacao: c.formaUtilizacao || "",
    comprovantes_url: c.comprovantesUrl || "",
    honorarios_percentual: c.honorariosPercentual ?? 0,
    boleto_valor: c.boletoValor ?? 0,
    perdcomp_web: c.perdcompWeb || "",
  };
}

function rowToControleRct(r: ControleRctRow): ControleRct {
  return {
    id: r.id,
    creditoId: r.credito_id,
    valorPrincipal: r.valor_principal ?? 0,
    selic: r.selic ?? 0,
    valorCompensado: r.valor_compensado ?? 0,
    tributoCompensado: r.tributo_compensado || "",
    dataCompensacao: r.data_compensacao || null,
    formaUtilizacao: r.forma_utilizacao || "",
    comprovantesUrl: r.comprovantes_url || "",
    honorariosPercentual: r.honorarios_percentual ?? 0,
    boletoValor: r.boleto_valor ?? 0,
    perdcompWeb: r.perdcomp_web || "",
    createdAt: r.created_at,
  };
}

export async function getControleRctByCredito(creditoId: string): Promise<ControleRct[]> {
  const { data, error } = await supabase
    .from("controle_rct").select("*").eq("credito_id", creditoId).order("created_at", { ascending: true });
  if (error) { console.error("[Store] Erro controle_rct:", error); return []; }
  return (data || []).map((r) => rowToControleRct(r as ControleRctRow));
}

export async function saveControleRct(c: ControleRct): Promise<void> {
  const row = controleRctToRow(c);
  console.log("[Store] saveControleRct row:", JSON.stringify(row));
  const { error } = await supabase.from("controle_rct").upsert(row, { onConflict: "id" });
  if (error) console.error("[Store] Erro salvar controle_rct:", error.message, error.details, error.hint, error.code);
}

export async function deleteControleRct(id: string): Promise<void> {
  const { error } = await supabase.from("controle_rct").delete().eq("id", id);
  if (error) console.error("[Store] Erro excluir controle_rct:", error);
}

export async function updateCreditoSaldo(creditoId: string): Promise<void> {
  // Load crédito
  const { data: creditoData, error: creditoError } = await supabase
    .from("creditos")
    .select("credito_validado")
    .eq("id", creditoId)
    .maybeSingle();

  if (creditoError || !creditoData) {
    console.error("[Store] Erro ao buscar crédito para atualizar saldo:", creditoError);
    return;
  }

  // Sum all compensações for this crédito
  const { data: compData, error: compError } = await supabase
    .from("controle_rct")
    .select("valor_compensado")
    .eq("credito_id", creditoId);

  if (compError) {
    console.error("[Store] Erro ao somar compensações:", compError);
    return;
  }

  const totalCompensado = (compData || []).reduce(
    (sum, r) => sum + (r.valor_compensado ?? 0),
    0
  );

  const novoSaldo = (creditoData.credito_validado ?? 0) - totalCompensado;

  const { error: updateError } = await supabase
    .from("creditos")
    .update({ saldo: novoSaldo })
    .eq("id", creditoId);

  if (updateError) {
    console.error("[Store] Erro ao atualizar saldo do crédito:", updateError);
  }
}

/* ------------------------------------------------------------------ */
/*  Mapeamento Ponto ↔ Row                                             */
/* ------------------------------------------------------------------ */

interface PontoRow {
  id: string;
  credito_id: string;
  descricao: string;
  periodo: string;
  valor: number;
  aprovado: boolean;
  status_cliente: string | null;
  categoria: string;
  observacao: string;
  created_at: string;
}

function pontoToRow(p: Ponto): Omit<PontoRow, "created_at"> {
  return {
    id: p.id,
    credito_id: p.creditoId,
    descricao: p.descricao || "",
    periodo: p.periodo || "",
    valor: p.valor ?? 0,
    aprovado: p.aprovado ?? false,
    status_cliente: p.statusCliente || null,
    categoria: p.categoria || "",
    observacao: p.observacao || "",
  };
}

function rowToPonto(r: PontoRow): Ponto {
  return {
    id: r.id,
    creditoId: r.credito_id,
    descricao: r.descricao || "",
    periodo: r.periodo || "",
    valor: r.valor ?? 0,
    aprovado: r.aprovado ?? false,
    statusCliente: (r.status_cliente as PontoStatusCliente) || null,
    categoria: r.categoria || "",
    observacao: r.observacao || "",
    createdAt: r.created_at,
  };
}

export async function getPontosByCredito(creditoId: string): Promise<Ponto[]> {
  const { data, error } = await supabase
    .from("pontos").select("*").eq("credito_id", creditoId).order("created_at", { ascending: true });
  if (error) { console.error("[Store] Erro pontos:", error); return []; }
  return (data || []).map((r) => rowToPonto(r as PontoRow));
}

export async function savePonto(p: Ponto): Promise<void> {
  const { error } = await supabase.from("pontos").upsert(pontoToRow(p), { onConflict: "id" });
  if (error) console.error("[Store] Erro salvar ponto:", error);
}

export async function deletePonto(id: string): Promise<void> {
  const { error } = await supabase.from("pontos").delete().eq("id", id);
  if (error) console.error("[Store] Erro excluir ponto:", error);
}

export async function recalcCreditoApresentado(creditoId: string): Promise<void> {
  const { data, error } = await supabase
    .from("pontos").select("valor").eq("credito_id", creditoId);
  if (error) { console.error("[Store] Erro recalc apresentado:", error); return; }
  const total = (data || []).reduce((sum, r) => sum + (r.valor ?? 0), 0);
  const { error: upErr } = await supabase
    .from("creditos").update({ credito_apresentado: total }).eq("id", creditoId);
  if (upErr) console.error("[Store] Erro update apresentado:", upErr);
}

export async function recalcCreditoValidado(creditoId: string): Promise<void> {
  const { data, error } = await supabase
    .from("pontos").select("valor, status_cliente").eq("credito_id", creditoId);
  if (error) { console.error("[Store] Erro recalc validado:", error); return; }
  const totalAprovado = (data || [])
    .filter((r) => r.status_cliente === "sim")
    .reduce((sum, r) => sum + (r.valor ?? 0), 0);

  // Also get total compensado to calc saldo
  const { data: compData } = await supabase
    .from("controle_rct").select("valor_compensado").eq("credito_id", creditoId);
  const totalCompensado = (compData || []).reduce((sum, r) => sum + (r.valor_compensado ?? 0), 0);
  const saldo = totalAprovado - totalCompensado;

  const { error: upErr } = await supabase
    .from("creditos").update({ credito_validado: totalAprovado, saldo }).eq("id", creditoId);
  if (upErr) console.error("[Store] Erro update validado:", upErr);
}

/* ------------------------------------------------------------------ */
/*  Mapeamento Tarefa ↔ Row                                            */
/* ------------------------------------------------------------------ */

interface TarefaRow {
  id: string;
  pasta_id: string | null;
  natureza: string;
  tipo: string;
  titulo: string;
  descricao: string;
  solicitante_id: string | null;
  responsavel_id: string | null;
  executante_id: string | null;
  prazo: string | null;
  status: string;
  doc_url: string;
  prioridade: string;
  created_at: string;
  updated_at: string;
}

function tarefaToRow(t: Tarefa): Omit<TarefaRow, "created_at" | "updated_at"> {
  return {
    id: t.id,
    pasta_id: t.pastaId || null,
    natureza: t.natureza || "tarefa",
    tipo: t.tipo || "",
    titulo: t.titulo || "",
    descricao: t.descricao || "",
    solicitante_id: t.solicitanteId || null,
    responsavel_id: t.responsavelId || null,
    executante_id: t.executanteId || null,
    prazo: t.prazo || null,
    status: t.status || "pendente",
    doc_url: t.docUrl || "",
    prioridade: t.prioridade || "normal",
  };
}

function rowToTarefa(r: TarefaRow): Tarefa {
  return {
    id: r.id,
    pastaId: r.pasta_id || undefined,
    natureza: r.natureza || "tarefa",
    tipo: r.tipo || "",
    titulo: r.titulo || "",
    descricao: r.descricao || "",
    solicitanteId: r.solicitante_id || undefined,
    responsavelId: r.responsavel_id || undefined,
    executanteId: r.executante_id || undefined,
    prazo: r.prazo || null,
    status: (r.status as TarefaStatus) || "pendente",
    docUrl: r.doc_url || "",
    prioridade: (r.prioridade as TarefaPrioridade) || "normal",
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function getTarefasByPasta(pastaId: string): Promise<Tarefa[]> {
  const { data, error } = await supabase
    .from("tarefas").select("*").eq("pasta_id", pastaId).order("created_at", { ascending: false });
  if (error) { console.error("[Store] Erro tarefas:", error); return []; }
  return (data || []).map((r) => rowToTarefa(r as TarefaRow));
}

export async function getAllTarefas(): Promise<(Tarefa & { pastaTitulo?: string; pastaNumero?: string })[]> {
  const { data, error } = await supabase
    .from("tarefas")
    .select("*, pastas(titulo, numero)")
    .order("prazo", { ascending: true, nullsFirst: false });
  if (error) { console.error("[Store] Erro todas tarefas:", error); return []; }
  return (data || []).map((r: TarefaRow & { pastas?: { titulo: string; numero: string } | null }) => ({
    ...rowToTarefa(r),
    pastaTitulo: r.pastas?.titulo || undefined,
    pastaNumero: r.pastas?.numero || undefined,
  }));
}

export async function saveTarefa(t: Tarefa): Promise<void> {
  const { error } = await supabase.from("tarefas").upsert(tarefaToRow(t), { onConflict: "id" });
  if (error) console.error("[Store] Erro salvar tarefa:", error);
}

export async function deleteTarefa(id: string): Promise<void> {
  const { error } = await supabase.from("tarefas").delete().eq("id", id);
  if (error) console.error("[Store] Erro excluir tarefa:", error);
}

/* ------------------------------------------------------------------ */
/*  Mapeamento Publicacao ↔ Row                                        */
/* ------------------------------------------------------------------ */

interface PublicacaoRow {
  id: string;
  pasta_id: string | null;
  data_hora: string | null;
  tribunal: string;
  sistema: string;
  processo_cnj: string;
  parte: string;
  assunto: string;
  teor: string;
  link_processo: string;
  status: string;
  responsavel_id: string | null;
  prazo: string | null;
  tarefa_criada_id: string | null;
  observacoes: string;
  created_at: string;
}

function publicacaoToRow(p: Publicacao): Omit<PublicacaoRow, "created_at"> {
  return {
    id: p.id,
    pasta_id: p.pastaId || null,
    data_hora: p.dataHora || null,
    tribunal: p.tribunal || "",
    sistema: p.sistema || "",
    processo_cnj: p.processoCnj || "",
    parte: p.parte || "",
    assunto: p.assunto || "",
    teor: p.teor || "",
    link_processo: p.linkProcesso || "",
    status: p.status || "nova",
    responsavel_id: p.responsavelId || null,
    prazo: p.prazo || null,
    tarefa_criada_id: p.tarefaCriadaId || null,
    observacoes: p.observacoes || "",
  };
}

function rowToPublicacao(r: PublicacaoRow): Publicacao {
  return {
    id: r.id,
    pastaId: r.pasta_id || undefined,
    dataHora: r.data_hora || null,
    tribunal: r.tribunal || "",
    sistema: r.sistema || "",
    processoCnj: r.processo_cnj || "",
    parte: r.parte || "",
    assunto: r.assunto || "",
    teor: r.teor || "",
    linkProcesso: r.link_processo || "",
    status: (r.status as PublicacaoStatus) || "nova",
    responsavelId: r.responsavel_id || undefined,
    prazo: r.prazo || null,
    tarefaCriadaId: r.tarefa_criada_id || undefined,
    observacoes: r.observacoes || "",
    createdAt: r.created_at,
  };
}

export async function getPublicacoesByPasta(pastaId: string): Promise<Publicacao[]> {
  const { data, error } = await supabase
    .from("publicacoes").select("*").eq("pasta_id", pastaId).order("data_hora", { ascending: false });
  if (error) { console.error("[Store] Erro publicacoes:", error); return []; }
  return (data || []).map((r) => rowToPublicacao(r as PublicacaoRow));
}

export async function savePublicacao(p: Publicacao): Promise<void> {
  const { error } = await supabase.from("publicacoes").upsert(publicacaoToRow(p), { onConflict: "id" });
  if (error) console.error("[Store] Erro salvar publicacao:", error);
}

/* ------------------------------------------------------------------ */
/*  Lançamentos por Pasta                                              */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Piloto RCT — Histórico de análises fiscais                         */
/* ------------------------------------------------------------------ */

interface PilotoRctRow {
  id: string;
  cliente_nome: string;
  cliente_cnpj: string;
  arquivos_info: unknown;
  resultado: string;
  created_at: string;
}

function pilotoRctToRow(p: PilotoRct): PilotoRctRow {
  return {
    id: p.id,
    cliente_nome: p.clienteNome,
    cliente_cnpj: p.clienteCnpj,
    arquivos_info: p.arquivosInfo,
    resultado: p.resultado,
    created_at: p.createdAt,
  };
}

function rowToPilotoRct(r: PilotoRctRow): PilotoRct {
  return {
    id: r.id,
    clienteNome: r.cliente_nome,
    clienteCnpj: r.cliente_cnpj,
    arquivosInfo: (r.arquivos_info as PilotoRct["arquivosInfo"]) || [],
    resultado: r.resultado || "",
    createdAt: r.created_at,
  };
}

export async function getAllPilotosRct(): Promise<PilotoRct[]> {
  const { data, error } = await supabase
    .from("pilotos_rct")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[Store] Erro ao carregar pilotos RCT:", error);
    return [];
  }
  return (data || []).map((r) => rowToPilotoRct(r as PilotoRctRow));
}

export async function getPilotoRct(id: string): Promise<PilotoRct | null> {
  const { data, error } = await supabase
    .from("pilotos_rct")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    console.error("[Store] Erro ao carregar piloto RCT:", error);
    return null;
  }
  return data ? rowToPilotoRct(data as PilotoRctRow) : null;
}

export async function savePilotoRct(p: PilotoRct): Promise<void> {
  const { error } = await supabase
    .from("pilotos_rct")
    .upsert(pilotoRctToRow(p), { onConflict: "id" });
  if (error) console.error("[Store] Erro ao salvar piloto RCT:", error);
}

export async function deletePilotoRct(id: string): Promise<void> {
  const { error } = await supabase.from("pilotos_rct").delete().eq("id", id);
  if (error) console.error("[Store] Erro ao excluir piloto RCT:", error);
}

/* ------------------------------------------------------------------ */
/*  Lançamentos por Pasta                                              */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Histórico                                                           */
/* ------------------------------------------------------------------ */

interface HistoricoRow {
  id: string;
  pasta_id: string;
  usuario_id: string;
  texto: string;
  link: string | null;
  created_at: string;
  usuarios?: { nome: string } | null;
}

function rowToHistorico(r: HistoricoRow): Historico {
  return {
    id: r.id,
    pastaId: r.pasta_id,
    usuarioId: r.usuario_id,
    usuarioNome: r.usuarios?.nome || undefined,
    texto: r.texto,
    link: r.link || undefined,
    createdAt: r.created_at,
  };
}

export async function getHistoricoByPasta(pastaId: string): Promise<Historico[]> {
  const { data, error } = await supabase
    .from("historico")
    .select("*, usuarios(nome)")
    .eq("pasta_id", pastaId)
    .order("created_at", { ascending: false });
  if (error) { console.error("[Store] Erro historico:", error); return []; }
  return (data || []).map((r) => rowToHistorico(r as HistoricoRow));
}

export async function saveHistorico(h: Historico): Promise<void> {
  const row = {
    id: h.id,
    pasta_id: h.pastaId,
    usuario_id: h.usuarioId,
    texto: h.texto,
    link: h.link || null,
  };
  const { error } = await supabase.from("historico").upsert(row, { onConflict: "id" });
  if (error) throw new Error(`Erro ao salvar histórico: ${error.message}`);
}

export async function deleteHistorico(id: string): Promise<void> {
  const { error } = await supabase.from("historico").delete().eq("id", id);
  if (error) throw new Error(`Erro ao excluir histórico: ${error.message}`);
}

export async function getLancamentosByPasta(pastaId: string): Promise<Lancamento[]> {
  const { data, error } = await supabase
    .from("financeiro")
    .select("*, clientes(nome), pastas(titulo)")
    .eq("pasta_id", pastaId)
    .order("data_vencimento", { ascending: false });
  if (error) { console.error("[Store] Erro lancamentos pasta:", error); return []; }
  return (data || []).map((r) => rowToLancamento(r as LancamentoRow));
}
