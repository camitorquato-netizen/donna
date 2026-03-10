import { supabase } from "./supabase";
import { saveDocumento } from "./store";
import { Documento } from "./types";

/**
 * Faz upload de um arquivo para o Supabase Storage e cria o registro
 * na tabela `documentos`.
 *
 * Path no Storage: documentos/{ticketId}/{nomeArquivo}
 */
export async function uploadDocumento(
  file: File,
  casoId: string,
  ticketId: string
): Promise<Documento | null> {
  // 1) Upload para Storage — sanitizar nome para evitar "Invalid key"
  const safeName = sanitizeFileName(file.name);
  const path = `${ticketId}/${safeName}`;
  const { error: uploadErr } = await supabase.storage
    .from("documentos")
    .upload(path, file, { upsert: true });

  if (uploadErr) {
    console.error("[Storage] Erro no upload:", uploadErr);
    throw new Error(`Falha ao enviar "${file.name}": ${uploadErr.message}`);
  }

  // 2) Detectar tipo pelo nome do arquivo
  const tipo = detectTipo(file.name);

  // 3) Inserir registro na tabela documentos
  return saveDocumento({
    casoId,
    nome: file.name,
    tipo,
    textoExtraido: "",
    storagePath: path,
  });
}

/**
 * Gera URL temporária assinada (1h) para visualizar um arquivo do Storage.
 * Uso interno — equipe do escritório.
 */
export async function getSignedUrl(storagePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("documentos")
    .createSignedUrl(storagePath, 3600);

  if (error) {
    console.error("[Storage] Erro ao gerar URL assinada:", error);
    return null;
  }

  return data.signedUrl;
}

/**
 * Sanitiza o nome do arquivo para o Supabase Storage.
 * Remove acentos, substitui espaços e caracteres especiais por underscores.
 */
function sanitizeFileName(name: string): string {
  return name
    .normalize("NFD")                       // decompõe acentos
    .replace(/[\u0300-\u036f]/g, "")        // remove diacríticos
    .replace(/[^a-zA-Z0-9._-]/g, "_")       // troca caracteres especiais por _
    .replace(/_+/g, "_")                     // colapsa múltiplos underscores
    .replace(/^_|_$/g, "");                  // remove _ no início/fim
}

/**
 * Detecta o tipo do documento pelo nome do arquivo.
 */
function detectTipo(name: string): Documento["tipo"] {
  const lower = name.toLowerCase();

  if (
    lower.includes("irpf") ||
    lower.includes("declaracao") ||
    lower.includes("declaração") ||
    lower.includes("imposto de renda")
  ) {
    return "irpf";
  }

  if (
    lower.includes("contrato social") ||
    lower.includes("contratosocial") ||
    lower.includes("contrato_social")
  ) {
    return "contrato_social";
  }

  if (
    lower.includes("balancete") ||
    lower.includes("balanço") ||
    lower.includes("balanco") ||
    lower.includes("demonstracao") ||
    lower.includes("demonstração")
  ) {
    return "balancete";
  }

  return "outro";
}
