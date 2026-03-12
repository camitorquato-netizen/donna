export type StageNumber = 1 | 2 | 3 | 4 | 5 | 6;

export interface CaseFile {
  name: string;
  type: string;
  base64: string;
  mediaType: string;
  /** Texto extraído do PDF (quando disponível, enviado como texto em vez de base64) */
  extractedText?: string;
  /** Metadados de processamento — visíveis na UI para debugging sem F12 */
  processingInfo?: string;
}

export interface Case {
  id: string;
  clientName: string;
  professional: string;
  createdAt: string;
  step: StageNumber;

  // Etapa 0 — Diagnóstico Preliminar
  preliminaryOutput: string;

  // Etapa 1 — Intake
  transcript: string;
  intakeFiles: CaseFile[];
  intakeOutput: string;

  // Etapa 2 — Validação A
  caseFocus: string;
  intakeNotes: string;

  // Etapa 3 — Diagnóstico
  diagExtraInfo: string;
  diagFiles: CaseFile[];
  diagnosticOutput: string;

  // Etapa 4 — Validação B
  diagnosticNotes: string;

  // Etapa 5 — Proposta
  proposalOutput: string;

  // Etapa 6 — Slides
  diagJSON: DiagJSON | null;
  clienteJSON: ClienteJSON | null;

  // Campos AppSheet (opcionais — preenchidos via integração)
  appsheetTicketId?: string;
  tipo?: string;
  consultorRef?: string;
  consultoriaRef?: string;
  breveResumoDemanda?: string;
  sugestaoAgenda?: string;
  docsUrl?: string;
  statusAppsheet?: string;
  propostaEnviada?: boolean;
  contratoFechado?: boolean;
  updatedAtAppsheet?: string;
}

export interface DiagJSON {
  patrimonio: {
    imoveis: string[];
    empresas: string[];
    investimentos: string[];
  };
  tributario: string[];
  sucessorio: string[];
  riscos: { nivel: string; descricao: string; acao: string }[];
  oportunidades: string[];
  documentos_faltantes: string[];
  resumo_caso: string;
  simulacao: {
    patrimonio_total: number;
    renda_anual_pf: number;
    ir_atual_pf: number;
    ir_com_holding: number;
    economia_anual: number;
    descricao_calculo: string;
  };
}

export interface ClienteJSON {
  resumo: string;
  situacao_atual: string[];
  riscos: { titulo: string; descricao: string }[];
  oportunidades: string[];
  projetos: {
    nome: string;
    objetivo: string;
    prazo: string;
    urgencia: string;
  }[];
  proximos_passos: string[];
  arquitetura: {
    nome_holding: string;
    socios: string[];
    ativos_integrar: string[];
    estrutura_descricao: string;
  };
  simulacao: {
    renda_anual_pf: number;
    ir_atual_pf: number;
    ir_com_holding: number;
    economia_anual: number;
    descricao: string;
  };
}

export interface Documento {
  id?: string;
  casoId: string;
  nome: string;
  tipo: "irpf" | "contrato_social" | "balancete" | "outro";
  textoExtraido: string;
  storagePath: string;
  createdAt?: string;
}

export interface Atendimento {
  appsheetAtendimentoId: string;
  appsheetTicketId: string;
  timestampAtendimento: string;
  tipo: string;
  usuario: string;
  breveRelato: string;
  url: string;
  file: string;
  mes: string;
  origem: string;
}

export const STAGE_LABELS: Record<StageNumber, string> = {
  1: "Intake",
  2: "Validação A",
  3: "Diagnóstico",
  4: "Validação B",
  5: "Proposta",
  6: "Slides",
};

/* ------------------------------------------------------------------ */
/*  Tipos — Gestão do Escritório                                       */
/* ------------------------------------------------------------------ */

export type StatusPipeline =
  | "lead"
  | "em_atendimento"
  | "proposta_enviada"
  | "contrato_enviado"
  | "contrato_assinado"
  | "onboarding"
  | "em_execucao"
  | "concluido"
  | "inativo";

export const STATUS_PIPELINE_LABELS: Record<StatusPipeline, string> = {
  lead: "Lead",
  em_atendimento: "Em Atendimento",
  proposta_enviada: "Proposta Enviada",
  contrato_enviado: "Contrato Enviado",
  contrato_assinado: "Contrato Assinado",
  onboarding: "Onboarding",
  em_execucao: "Em Execução",
  concluido: "Concluído",
  inativo: "Inativo",
};

export interface Cliente {
  id: string;
  nome: string;
  apelido: string;
  tipoPessoa: "PF" | "PJ";
  cpf: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  contatoEmpresa: string;
  observacoes: string;
  statusPipeline: StatusPipeline;
  origem: string;
  responsavelId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ContratoStatus =
  | "rascunho"
  | "enviado_assinatura"
  | "assinado"
  | "vigente"
  | "encerrado";

export const CONTRATO_STATUS_LABELS: Record<ContratoStatus, string> = {
  rascunho: "Rascunho",
  enviado_assinatura: "Enviado p/ Assinatura",
  assinado: "Assinado",
  vigente: "Vigente",
  encerrado: "Encerrado",
};

export const CONTRATO_OBJETOS = [
  "RCT",
  "Planejamento Tributário",
  "Transação",
  "Assessoria",
  "Planejamento Patrimonial",
  "Mandado de Segurança",
  "Societário",
  "Rec. Crédito Tributário",
] as const;

export interface Contrato {
  id: string;
  clienteId: string;
  objeto: string;
  titulo: string;
  arquivoUrl: string;
  valor: number | null;
  percentualHonorarios: number;
  dataEntrada: string | null;
  vigencia: string | null;
  comercialRespId?: string;
  parceiroId?: string;
  percentualParceiro: number;
  zapsignDocToken?: string;
  zapsignSignedAt?: string;
  zapsignSignerName?: string;
  zapsignSignerEmail?: string;
  status: ContratoStatus;
  casoIaId?: string;
  clienteNome?: string; // join — vem do select
  createdAt?: string;
  updatedAt?: string;
}

export type LancamentoStatus = "pendente" | "pago" | "vencido" | "cancelado";

export const LANCAMENTO_STATUS_LABELS: Record<LancamentoStatus, string> = {
  pendente: "Pendente",
  pago: "Pago",
  vencido: "Vencido",
  cancelado: "Cancelado",
};

export const PLANO_CONTAS_OPTIONS = [
  "honorarios",
  "repasse_parceiro",
  "custas",
  "despesas",
  "impostos",
  "outros",
] as const;

export interface Lancamento {
  id: string;
  clienteId?: string;
  pastaId?: string;
  creditoId?: string;
  tipo: "a_receber" | "a_pagar";
  valor: number;
  dataVencimento: string | null;
  valorPago: number;
  dataPagamento: string | null;
  planoContas: string;
  boletoUrl: string;
  descricao: string;
  comercialRespId?: string;
  repasseParceiro: number;
  status: LancamentoStatus;
  clienteNome?: string; // join
  pastaTitulo?: string; // join
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardSummary {
  totalClientes: number;
  contratosAtivos: number;
  totalAReceber: number;
  totalAPagar: number;
}

/* ------------------------------------------------------------------ */
/*  Tipos — Pastas de Trabalho                                         */
/* ------------------------------------------------------------------ */

export type PastaTipo = "servico" | "processo";

export type PastaStatus = "ativo" | "suspenso" | "arquivado" | "encerrado";

export const PASTA_STATUS_LABELS: Record<PastaStatus, string> = {
  ativo: "Ativo",
  suspenso: "Suspenso",
  arquivado: "Arquivado",
  encerrado: "Encerrado",
};

export const TIPO_SERVICO_OPTIONS = [
  "RCT",
  "Assessoria",
  "Planejamento Patrimonial",
  "Planejamento Tributário",
  "Transação",
  "Societário",
  "Mandado de Segurança",
  "Outro",
] as const;

export interface Pasta {
  id: string;
  numero: string;
  contratoId?: string;
  clienteId: string;
  titulo: string;
  tipo: PastaTipo;
  responsavelId?: string;
  comercialRespId?: string;
  tipoServico: string;
  status: PastaStatus;
  casoIaId?: string;
  abrangencia: string;
  createdAt?: string;
  updatedAt?: string;
  // Join fields
  clienteNome?: string;
  responsavelNome?: string;
  contratoTitulo?: string;
  contratoObjeto?: string;
}

/* -- Processo -- */

export interface Processo {
  id: string;
  pastaId: string;
  numeroCnj: string;
  numeroProcesso: string;
  area: string;
  esfera: "judicial" | "administrativo";
  rito: string;
  materia: string;
  polo: "ativo" | "passivo" | "";
  dataAjuizamento: string | null;
  valorCausa: number | null;
  jurisdicao: string;
  dataTransitoJulgado: string | null;
  observacoes: string;
  createdAt?: string;
  updatedAt?: string;
}

/* -- Créditos RCT -- */

export const TRIBUTO_OPTIONS = [
  "PIS/COFINS",
  "IRPJ/CSLL",
  "ISSQN",
  "INSS",
  "ICMS",
  "IPI",
  "PERSE",
] as const;

export type CreditoFase =
  | "1_analise"
  | "2_parecer"
  | "3_apresentacao"
  | "4_aguardando_aprovacao"
  | "5_utilizacao"
  | "6_findo"
  | "nao_autorizado"
  | "extinto";

export const CREDITO_FASE_LABELS: Record<CreditoFase, string> = {
  "1_analise": "1. Análise",
  "2_parecer": "2. Parecer",
  "3_apresentacao": "3. Apresentação",
  "4_aguardando_aprovacao": "4. Aguardando Aprovação",
  "5_utilizacao": "5. Utilização",
  "6_findo": "6. Findo",
  nao_autorizado: "Não Autorizado",
  extinto: "Extinto",
};

export interface Credito {
  id: string;
  pastaId: string;
  titulo: string;
  tributo: string;
  creditoApresentado: number;
  creditoValidado: number;
  saldo: number;
  fase: CreditoFase;
  responsavelId?: string;
  apresentacaoUrl: string;
  parecerUrl: string;
  createdAt?: string;
  updatedAt?: string;
}

/* -- Workflow RCT -- */

export type WfRctTarefa =
  | "1_levantamento"
  | "2_parecer"
  | "3_apresentacao"
  | "4_retificacoes"
  | "5_compensacoes"
  | "6_faturamento";

export const WF_RCT_TAREFA_LABELS: Record<WfRctTarefa, string> = {
  "1_levantamento": "Levantamento",
  "2_parecer": "Revisão Analista",
  "3_apresentacao": "Apresentação",
  "4_retificacoes": "Retificações",
  "5_compensacoes": "Compensações",
  "6_faturamento": "Faturamento",
};

export interface WfRct {
  id: string;
  creditoId: string;
  tarefa: WfRctTarefa;
  responsavelId?: string;
  status: "pendente" | "concluido";
  url: string;
  observacoes: string;
  prazo: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/* -- Pontos de Crédito -- */

export type PontoStatusCliente = "sim" | "nao" | "stand_by";

export interface Ponto {
  id: string;
  creditoId: string;
  descricao: string;
  periodo: string;
  valor: number;
  aprovado: boolean;
  statusCliente: PontoStatusCliente | null;
  categoria: string;
  observacao: string;
  createdAt?: string;
}

/* -- Controle RCT (Compensações) -- */

export interface ControleRct {
  id: string;
  creditoId: string;
  valorPrincipal: number;
  selic: number;
  valorCompensado: number;
  tributoCompensado: string;
  dataCompensacao: string | null;
  formaUtilizacao: string;
  comprovantesUrl: string;
  honorariosPercentual: number;
  boletoValor: number;
  perdcompWeb: string;
  createdAt?: string;
}

/* -- Tarefas -- */

export type TarefaStatus = "pendente" | "em_andamento" | "concluida" | "cancelada";

export const TAREFA_STATUS_LABELS: Record<TarefaStatus, string> = {
  pendente: "Pendente",
  em_andamento: "Em Andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

export type TarefaPrioridade = "baixa" | "normal" | "alta" | "urgente";

export const TAREFA_PRIORIDADE_LABELS: Record<TarefaPrioridade, string> = {
  baixa: "Baixa",
  normal: "Normal",
  alta: "Alta",
  urgente: "Urgente",
};

export interface Tarefa {
  id: string;
  pastaId?: string;
  natureza: string;
  tipo: string;
  titulo: string;
  descricao: string;
  solicitanteId?: string;
  responsavelId?: string;
  executanteId?: string;
  prazo: string | null;
  status: TarefaStatus;
  docUrl: string;
  prioridade: TarefaPrioridade;
  createdAt?: string;
  updatedAt?: string;
}

/* -- Publicações -- */

export type PublicacaoStatus = "nova" | "lida" | "respondida";

export const PUBLICACAO_STATUS_LABELS: Record<PublicacaoStatus, string> = {
  nova: "Nova",
  lida: "Lida",
  respondida: "Respondida",
};

export interface Publicacao {
  id: string;
  pastaId?: string;
  dataHora: string | null;
  tribunal: string;
  sistema: string;
  processoCnj: string;
  parte: string;
  assunto: string;
  teor: string;
  linkProcesso: string;
  status: PublicacaoStatus;
  responsavelId?: string;
  prazo: string | null;
  tarefaCriadaId?: string;
  observacoes: string;
  createdAt?: string;
}

/* -- Config de Abas por Tipo -- */

export type PastaTabKey =
  | "geral"
  | "processo"
  | "publicacoes"
  | "tarefas"
  | "creditos"
  | "radiografia"
  | "workflow"
  | "compensacoes"
  | "financeiro";

export interface PastaTabConfig {
  key: PastaTabKey;
  label: string;
}

export function getPastaTabsConfig(
  pasta: Pasta,
  processo?: Processo | null
): PastaTabConfig[] {
  if (pasta.tipo === "processo") {
    const tabs: PastaTabConfig[] = [
      { key: "geral", label: "Geral" },
      { key: "processo", label: "Processo" },
    ];
    if (!processo || processo.esfera === "judicial") {
      tabs.push({ key: "publicacoes", label: "Publicações" });
    }
    tabs.push({ key: "tarefas", label: "Tarefas" });
    tabs.push({ key: "financeiro", label: "Financeiro" });
    return tabs;
  }

  if (pasta.tipoServico === "RCT") {
    return [
      { key: "geral", label: "Geral" },
      { key: "creditos", label: "Créditos" },
      { key: "workflow", label: "Workflow" },
      { key: "compensacoes", label: "Compensações" },
      { key: "financeiro", label: "Financeiro" },
    ];
  }

  // Assessoria, Planejamento Patrimonial/Tributário, Outro
  return [
    { key: "geral", label: "Geral" },
    { key: "tarefas", label: "Tarefas" },
    { key: "financeiro", label: "Financeiro" },
  ];
}

export function createEmptyCliente(id: string): Cliente {
  return {
    id,
    nome: "",
    apelido: "",
    tipoPessoa: "PF",
    cpf: "",
    cnpj: "",
    email: "",
    telefone: "",
    endereco: "",
    contatoEmpresa: "",
    observacoes: "",
    statusPipeline: "lead",
    origem: "",
  };
}

export function createEmptyCase(id: string): Case {
  return {
    id,
    clientName: "",
    professional: "",
    createdAt: new Date().toISOString(),
    step: 1,
    preliminaryOutput: "",
    transcript: "",
    intakeFiles: [],
    intakeOutput: "",
    caseFocus: "",
    intakeNotes: "",
    diagExtraInfo: "",
    diagFiles: [],
    diagnosticOutput: "",
    diagnosticNotes: "",
    proposalOutput: "",
    diagJSON: null,
    clienteJSON: null,
    propostaEnviada: false,
    contratoFechado: false,
  };
}
