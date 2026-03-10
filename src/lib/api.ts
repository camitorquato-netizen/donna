import { CaseFile } from "./types";
import { buildContentBlocks } from "./fileUtils";

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 30_000;

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Parse Anthropic SSE stream and concatenate all text deltas.
 */
async function readStream(res: Response): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) throw new Error("Sem body na resposta de streaming.");

  const decoder = new TextDecoder();
  let fullText = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Process complete lines from buffer
    const lines = buffer.split("\n");
    // Keep last incomplete line in buffer
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") continue;

      try {
        const event = JSON.parse(payload);

        // Text delta — the main content
        if (
          event.type === "content_block_delta" &&
          event.delta?.type === "text_delta"
        ) {
          fullText += event.delta.text;
        }

        // Error inside stream
        if (event.type === "error") {
          throw new Error(
            event.error?.message || "Erro durante streaming da API."
          );
        }
      } catch (e) {
        // Skip unparseable lines (event: lines, empty lines)
        if (e instanceof SyntaxError) continue;
        throw e;
      }
    }
  }

  return fullText;
}

// Vercel Hobby limit is 4.5MB for request body
const MAX_PAYLOAD_BYTES = 4 * 1024 * 1024; // 4MB safety margin

export async function callAnthropic(
  systemPrompt: string,
  userText: string,
  files: CaseFile[] = [],
  maxTokens: number = 4000
): Promise<string> {
  const content = buildContentBlocks(userText, files);

  const payload = {
    model: "claude-sonnet-4-20250514",
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content }],
  };

  // Pre-flight payload size check — catch 413 before it happens
  const payloadJson = JSON.stringify(payload);
  const payloadSize = new Blob([payloadJson]).size;
  console.log(`[API] Payload size: ${(payloadSize / 1024 / 1024).toFixed(2)}MB`);

  if (payloadSize > MAX_PAYLOAD_BYTES) {
    const sizeMB = (payloadSize / 1024 / 1024).toFixed(1);
    throw new Error(
      `Payload de ${sizeMB}MB excede o limite de 4MB. ` +
      `Reduza o tamanho dos arquivos ou remova imagens grandes. ` +
      `Dica: PDFs de texto funcionam melhor que imagens.`
    );
  }

  let lastError = "";

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch("/api/anthropic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // Streaming success — parse SSE
    if (res.ok && res.headers.get("content-type")?.includes("text/event-stream")) {
      const text = await readStream(res);
      if (!text) throw new Error("A API retornou resposta vazia.");
      return text;
    }

    // Non-streaming success (shouldn't happen, but handle gracefully)
    if (res.ok) {
      let data: Record<string, unknown>;
      const rawText = await res.text();
      try {
        data = JSON.parse(rawText);
      } catch {
        return rawText;
      }
      const textBlock = (
        data.content as Array<{ type: string; text?: string }>
      )?.find((b) => b.type === "text");
      return textBlock?.text || "";
    }

    // Error handling — parse JSON error response
    let errType = "";
    let errMsg = `Erro da API: ${res.status}`;

    try {
      const rawText = await res.text();
      const data = JSON.parse(rawText);
      const errObj = data?.error as Record<string, string> | undefined;
      errType = errObj?.type || "";
      errMsg = errObj?.message || errMsg;
    } catch {
      // Non-JSON error (Vercel infra)
      if (res.status === 413) {
        throw new Error(
          "Payload muito grande. Reduza o número ou tamanho dos arquivos anexados."
        );
      }
      if (res.status === 504) {
        throw new Error(
          "A requisição demorou demais e expirou. Tente novamente."
        );
      }
    }

    console.error(
      `[Anthropic] status=${res.status} type=${errType} msg=${errMsg} attempt=${attempt + 1}`
    );

    // Retriable errors
    const isRetriable =
      res.status === 429 ||
      res.status === 529 ||
      errType === "overloaded_error";

    if (isRetriable && attempt < MAX_RETRIES) {
      const retryMatch = errMsg.match(/try again in (\d+)/);
      const waitMs = retryMatch
        ? parseInt(retryMatch[1], 10) * 1000 + 2000
        : BASE_DELAY_MS * (attempt + 1);
      console.warn(
        `[Anthropic] Retry ${attempt + 1}/${MAX_RETRIES}, aguardando ${Math.round(waitMs / 1000)}s…`
      );
      await sleep(waitMs);
      continue;
    }

    // Non-retriable
    lastError = errMsg;
    if (res.status === 429 || errType === "rate_limit_error") {
      throw new Error(
        `Limite da API excedido: ${errMsg}. Aguarde ~60s e tente novamente.`
      );
    }
    throw new Error(errMsg);
  }

  throw new Error(
    lastError || "Limite de requisições excedido após múltiplas tentativas."
  );
}

export function extractJSON<T>(text: string): T {
  let clean = text.trim();
  if (clean.startsWith("```")) {
    clean = clean.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?\s*```$/, "");
  }
  return JSON.parse(clean);
}
