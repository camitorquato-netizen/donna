/**
 * Parser client-side de arquivos SPED (.txt)
 *
 * Detecta o tipo de SPED (EFD-Contribuições, EFD-ICMS/IPI, ECF) pelo registro |0000|
 * e filtra apenas os registros-chave necessários para a Radiografia Fiscal.
 *
 * Não faz parsing completo de cada campo — Claude conhece o layout SPED e interpreta
 * os registros pipe-delimited diretamente.
 */

export type SpedTipo = "EFD-Contribuições" | "EFD-ICMS/IPI" | "ECF" | "Desconhecido";

export interface SpedResumo {
  tipo: SpedTipo;
  cnpj: string;
  nome: string;
  periodo: string;
  totalLinhas: number;
  linhasFiltradas: number;
  registrosFiltrados: string;
}

/** Registros relevantes por tipo de SPED */
const REGISTROS_EFD_CONTRIBUICOES = new Set([
  "0000", "0140",
  "M100", "M105", "M110",          // Crédito PIS
  "M200", "M210",                   // PIS contribuição devida
  "M500", "M505", "M510",          // Crédito COFINS
  "M600", "M610",                   // COFINS contribuição devida
  "1001", "1010", "1011",          // Receita bruta / apuração regime
]);

const REGISTROS_EFD_ICMS_IPI = new Set([
  "0000", "0100", "0150", "0200",
  "E100", "E110", "E111", "E116",  // ICMS apuração
  "E200", "E210",                   // ICMS-ST
  "E500", "E510", "E520", "E530",  // IPI apuração
  "H005", "H010",                   // Inventário
  "1010",                           // Obrigações do ICMS
]);

const REGISTROS_ECF = new Set([
  "0000", "0010", "0020", "0030",
  "L100", "L200", "L300",          // Balanço / DRE
  "M300", "M350",                   // LALUR / LACS
  "N500", "N600", "N610", "N620", "N630",  // IRPJ cálculo
  "N650", "N660", "N670",          // CSLL cálculo
]);

/**
 * Detecta o tipo de SPED a partir do registro |0000|
 *
 * EFD-Contribuições: COD_FIN no campo 2 + |0000| tem 19+ campos
 * EFD-ICMS/IPI: |0000| contém "LEIAUTE" ou IND_PERFIL (A/B/C)
 * ECF: |0000| contém "LECF" ou COD_VER específico
 */
function detectarTipo(linhas0000: string[]): SpedTipo {
  for (const linha of linhas0000) {
    const campos = linha.split("|").filter((c) => c !== "");

    // Checa se é registro 0000
    if (campos[0] !== "0000") continue;

    const raw = linha.toUpperCase();

    // ECF tem "LECF" ou "ECF" no conteúdo
    if (raw.includes("LECF") || raw.includes("|ECF|")) {
      return "ECF";
    }

    // EFD-Contribuições: campo COD_VER geralmente começa com "0" seguido de versão
    // e tem campo IND_SIT_ESP, ou tem mais de 15 campos
    // O tipo é identificável pelo campo 7 (TIPO_ESCRIT) em EFD-Contribuições
    // ou pelo número de campos: EFD-Contribuições ~19 campos, ICMS/IPI ~15 campos

    // Verifica por padrão de versão/layout
    if (campos.length >= 15) {
      // EFD-ICMS/IPI tem IND_PERFIL (A/B/C) geralmente no campo 12
      const hasPerfilICMS = campos.some(
        (c) => c === "A" || c === "B" || c === "C"
      );
      // EFD-Contribuições tem TIPO_ESCRIT (0=original, 1=retificadora) no campo ~7
      // e IND_ATIV (0=industrial, 1=prestador, etc.)

      if (campos.length >= 18) {
        return "EFD-Contribuições";
      }
      if (hasPerfilICMS) {
        return "EFD-ICMS/IPI";
      }
    }

    // Fallback: tenta detectar por registros presentes no arquivo
    return "Desconhecido";
  }
  return "Desconhecido";
}

/**
 * Detecta tipo com base nos registros presentes no arquivo inteiro.
 * Fallback quando |0000| não é suficiente.
 */
function detectarTipoPorRegistros(registros: Set<string>): SpedTipo {
  // M100/M200/M500/M600 são exclusivos de EFD-Contribuições
  if (registros.has("M200") || registros.has("M600") || registros.has("M100")) {
    return "EFD-Contribuições";
  }
  // E110/E520 são exclusivos de EFD-ICMS/IPI
  if (registros.has("E110") || registros.has("E520")) {
    return "EFD-ICMS/IPI";
  }
  // N620/N660/L300 são exclusivos de ECF
  if (registros.has("N620") || registros.has("N660") || registros.has("L300")) {
    return "ECF";
  }
  return "Desconhecido";
}

/**
 * Extrai CNPJ e nome do registro |0000|
 */
function extrairDadosEmpresa(linha0000: string): {
  cnpj: string;
  nome: string;
  periodo: string;
} {
  const campos = linha0000.split("|").filter((c) => c !== "");
  // Layout geral do |0000|:
  // EFD-Contribuições: 0000|COD_VER|TIPO_ESCRIT|IND_SIT_ESP|NUM_REC_ANTERIOR|DT_INI|DT_FIN|NOME|CNPJ|...
  // EFD-ICMS/IPI: 0000|COD_VER|COD_FIN|DT_INI|DT_FIN|NOME|CNPJ|CPF|UF|IE|COD_MUN|IM|SUFRAMA|IND_PERFIL|IND_ATIV
  // ECF: 0000|HASH|...

  let cnpj = "";
  let nome = "";
  let dtIni = "";
  let dtFin = "";

  // Procura padrões de CNPJ (14 dígitos) e datas (ddmmaaaa)
  for (const campo of campos) {
    if (/^\d{14}$/.test(campo) && !cnpj) {
      cnpj = campo.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        "$1.$2.$3/$4-$5"
      );
    }
    if (/^\d{8}$/.test(campo) && campo.length === 8) {
      const possibleDate = campo;
      // Datas no SPED: ddmmaaaa
      if (parseInt(possibleDate.slice(0, 2)) <= 31) {
        if (!dtIni) dtIni = possibleDate;
        else if (!dtFin) dtFin = possibleDate;
      }
    }
    // Nome: campo com mais de 5 caracteres que não é número
    if (campo.length > 5 && !/^\d+$/.test(campo) && !nome && campo !== "0000") {
      nome = campo;
    }
  }

  const periodo =
    dtIni && dtFin
      ? `${dtIni.slice(0, 2)}/${dtIni.slice(2, 4)}/${dtIni.slice(4)} a ${dtFin.slice(0, 2)}/${dtFin.slice(2, 4)}/${dtFin.slice(4)}`
      : "";

  return { cnpj, nome, periodo };
}

/**
 * Faz o parse de um arquivo SPED e retorna apenas os registros relevantes.
 */
export function parseSped(content: string, filename: string): SpedResumo {
  const linhas = content.split(/\r?\n/).filter((l) => l.trim() !== "");
  const totalLinhas = linhas.length;

  // Coleta todos os códigos de registro presentes
  const registrosPresentes = new Set<string>();
  const linhas0000: string[] = [];

  for (const linha of linhas) {
    const match = linha.match(/^\|?(\w{4})\|/);
    if (match) {
      registrosPresentes.add(match[1]);
      if (match[1] === "0000") linhas0000.push(linha);
    }
  }

  // Detecta tipo
  let tipo = detectarTipo(linhas0000);
  if (tipo === "Desconhecido") {
    tipo = detectarTipoPorRegistros(registrosPresentes);
  }

  // Seleciona registros relevantes
  let registrosAlvo: Set<string>;
  switch (tipo) {
    case "EFD-Contribuições":
      registrosAlvo = REGISTROS_EFD_CONTRIBUICOES;
      break;
    case "EFD-ICMS/IPI":
      registrosAlvo = REGISTROS_EFD_ICMS_IPI;
      break;
    case "ECF":
      registrosAlvo = REGISTROS_ECF;
      break;
    default:
      // Se desconhecido, pega tudo que parece relevante
      registrosAlvo = new Set([
        ...REGISTROS_EFD_CONTRIBUICOES,
        ...REGISTROS_EFD_ICMS_IPI,
        ...REGISTROS_ECF,
      ]);
  }

  // Filtra linhas
  const linhasFiltradas: string[] = [];
  for (const linha of linhas) {
    const match = linha.match(/^\|?(\w{4})\|/);
    if (match && registrosAlvo.has(match[1])) {
      linhasFiltradas.push(linha);
    }
  }

  // Extrai dados da empresa
  const { cnpj, nome, periodo } = linhas0000.length > 0
    ? extrairDadosEmpresa(linhas0000[0])
    : { cnpj: "", nome: "", periodo: "" };

  // Formata saída
  const header = `=== ${filename} ===\nTipo: ${tipo} | CNPJ: ${cnpj || "N/I"} | Empresa: ${nome || "N/I"} | Período: ${periodo || "N/I"}\nTotal de linhas: ${totalLinhas} | Registros relevantes: ${linhasFiltradas.length}\n---`;

  const registrosFiltrados = header + "\n" + linhasFiltradas.join("\n");

  return {
    tipo,
    cnpj,
    nome,
    periodo,
    totalLinhas,
    linhasFiltradas: linhasFiltradas.length,
    registrosFiltrados,
  };
}

/**
 * Processa múltiplos arquivos SPED e consolida os resumos.
 */
export function parseMultiplosSped(
  arquivos: { content: string; filename: string }[]
): {
  resumos: SpedResumo[];
  textoConsolidado: string;
} {
  const resumos = arquivos.map((a) => parseSped(a.content, a.filename));

  const textoConsolidado = resumos
    .map((r) => r.registrosFiltrados)
    .join("\n\n");

  return { resumos, textoConsolidado };
}
