import { CaseFile } from "./types";

/**
 * Extrai texto de um PDF usando pdf.js (client-side).
 * Retorna { text, error } — se falhar, text="" e error descreve o motivo.
 */
async function extractPdfText(
  arrayBuffer: ArrayBuffer
): Promise<{ text: string; error: string }> {
  try {
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

    // Copiar buffer — pdf.js pode "detach" o original ao transferir para o worker
    const originalData = new Uint8Array(arrayBuffer).slice();

    // Tentar abrir PDF — primeiro sem senha, depois com senha vazia
    let pdf;
    try {
      const task = pdfjsLib.getDocument({
        data: originalData.slice(),
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
      });
      pdf = await task.promise;
    } catch (openErr: unknown) {
      const msg =
        openErr instanceof Error ? openErr.message : String(openErr);
      if (msg.includes("password") || msg.includes("encrypt")) {
        try {
          const task2 = pdfjsLib.getDocument({
            data: originalData.slice(),
            password: "",
            useWorkerFetch: false,
            isEvalSupported: false,
            useSystemFonts: true,
          });
          pdf = await task2.promise;
        } catch (pwErr: unknown) {
          const pwMsg =
            pwErr instanceof Error ? pwErr.message : String(pwErr);
          return { text: "", error: `Protegido: ${pwMsg}` };
        }
      } else {
        return { text: "", error: `Abrir falhou: ${msg}` };
      }
    }

    if (!pdf) {
      return { text: "", error: "PDF não carregou" };
    }

    const pages: string[] = [];
    const maxPages = Math.min(pdf.numPages, 20);

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);

      // Extrair texto normal da página
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ");

      // Extrair campos de formulário (AcroForms — IRPF)
      let formText = "";
      try {
        const annotations = await page.getAnnotations();
        const fields: string[] = [];
        for (const ann of annotations) {
          if (ann.fieldType && ann.fieldValue) {
            const label = ann.alternativeText || ann.fieldName || "";
            const val = String(ann.fieldValue).trim();
            if (val) fields.push(label ? `${label}: ${val}` : val);
          }
        }
        if (fields.length > 0) formText = fields.join(" | ");
      } catch {
        // sem annotations
      }

      const combined = [pageText.trim(), formText.trim()]
        .filter(Boolean)
        .join("\n");

      if (combined) {
        pages.push(`--- Página ${i} ---\n${combined}`);
      }
    }

    let fullText = pages.join("\n\n");

    // Truncar para evitar payload muito grande
    const MAX_CHARS = 30_000;
    if (fullText.length > MAX_CHARS) {
      fullText =
        fullText.slice(0, MAX_CHARS) +
        "\n\n[... truncado por limite de tamanho ...]";
    }

    if (fullText.length < 50) {
      return {
        text: fullText,
        error: `Apenas ${fullText.length} chars em ${maxPages} páginas`,
      };
    }

    return { text: fullText, error: "" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { text: "", error: `Exceção: ${msg}` };
  }
}

/**
 * Converte um File para CaseFile.
 * Para PDFs: tenta extrair o texto (muito mais leve em tokens).
 * Para imagens: mantém base64.
 */
export async function fileToBase64(file: File): Promise<CaseFile> {
  if (file.type === "application/pdf") {
    const arrayBuffer = await file.arrayBuffer();
    // Guardar cópia para fallback base64 (pdf.js pode detachar o original)
    const bufferBackup = arrayBuffer.slice(0);
    const { text: extractedText, error } = await extractPdfText(arrayBuffer);
    const sizeMB = (file.size / 1024 / 1024).toFixed(1);

    // Extração bem sucedida
    if (extractedText && extractedText.length > 100) {
      const kChars = (extractedText.length / 1000).toFixed(1);
      return {
        name: file.name,
        type: file.type,
        base64: "",
        mediaType: file.type,
        extractedText,
        processingInfo: `✅ ${kChars}k chars extraídos de ${sizeMB}MB`,
      };
    }

    // Falhou — mostrar o motivo real na tela
    const reason = error || "nenhum texto encontrado";

    // Fallback base64 para PDFs pequenos (< 2MB)
    const MAX_BASE64 = 2 * 1024 * 1024;
    if (file.size <= MAX_BASE64) {
      const base64 = arrayBufferToBase64(bufferBackup);
      return {
        name: file.name,
        type: file.type,
        base64,
        mediaType: file.type,
        processingInfo: `⚠️ Sem texto (${reason}) — enviado como doc ${sizeMB}MB`,
      };
    }

    // PDF grande sem texto — não cabe como base64
    return {
      name: file.name,
      type: file.type,
      base64: "",
      mediaType: file.type,
      extractedText: `[PDF "${file.name}" — sem texto extraível (${reason}). ${sizeMB}MB. Cole dados manualmente.]`,
      processingInfo: `❌ ${sizeMB}MB — ${reason}`,
    };
  }

  // Imagens
  return compressImage(file);
}

/**
 * Comprime imagens grandes para caber no payload da Vercel.
 */
async function compressImage(file: File): Promise<CaseFile> {
  const MAX_IMAGE_BYTES = 500 * 1024;

  if (file.size <= MAX_IMAGE_BYTES) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        resolve({
          name: file.name,
          type: file.type,
          base64,
          mediaType: file.type,
          processingInfo: `✅ Imagem: ${(file.size / 1024).toFixed(0)}KB`,
        });
      };
      reader.onerror = () => reject(new Error(`Erro ao ler ${file.name}`));
      reader.readAsDataURL(file);
    });
  }

  try {
    const bitmap = await createImageBitmap(file);
    const MAX_W = 1600;
    const MAX_H = 1200;
    let { width, height } = bitmap;
    if (width > MAX_W || height > MAX_H) {
      const ratio = Math.min(MAX_W / width, MAX_H / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas não suportado");
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await canvas.convertToBlob({
      type: "image/jpeg",
      quality: 0.7,
    });
    const ab = await blob.arrayBuffer();
    const base64 = arrayBufferToBase64(ab);

    return {
      name: file.name,
      type: "image/jpeg",
      base64,
      mediaType: "image/jpeg",
      processingInfo: `✅ Comprimida: ${(file.size / 1024).toFixed(0)}KB → ${(blob.size / 1024).toFixed(0)}KB`,
    };
  } catch {
    // Fallback: usar original sem compressão
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        resolve({
          name: file.name,
          type: file.type,
          base64,
          mediaType: file.type,
          processingInfo: `✅ Imagem: ${(file.size / 1024).toFixed(0)}KB`,
        });
      };
      reader.onerror = () => reject(new Error(`Erro ao ler ${file.name}`));
      reader.readAsDataURL(file);
    });
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Monta os content blocks para a API da Anthropic.
 */
export function buildContentBlocks(
  text: string,
  files: CaseFile[]
): Record<string, unknown>[] {
  const blocks: Record<string, unknown>[] = [];

  for (const f of files) {
    if (f.extractedText) {
      blocks.push({
        type: "text",
        text: `\n===== DOCUMENTO: ${f.name} =====\n${f.extractedText}\n===== FIM: ${f.name} =====\n`,
      });
    } else if (f.type.startsWith("image/")) {
      blocks.push({
        type: "image",
        source: {
          type: "base64",
          media_type: f.mediaType,
          data: f.base64,
        },
      });
    } else if (f.type === "application/pdf" && f.base64) {
      blocks.push({
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: f.base64,
        },
      });
    }
  }

  blocks.push({ type: "text", text });
  return blocks;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
