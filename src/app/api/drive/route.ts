import { NextRequest, NextResponse } from "next/server";

/* ------------------------------------------------------------------ */
/*  POST /api/drive                                                    */
/*                                                                    */
/*  Recebe markdown + clientName via JSON, converte para HTML         */
/*  estilizado, faz upload ao Google Drive convertendo para           */
/*  Google Docs automaticamente. Retorna URL do documento.            */
/*                                                                    */
/*  Body JSON: { markdown: string, clientName: string }               */
/* ------------------------------------------------------------------ */

/* ── Paleta ST (Silveira Torquato Reverbel) ───────────────────────── */
/*                                                                    */
/*  Fonte principal: Literata                                         */
/*  #F9F5EF — Creme claro (fundo)                                    */
/*  #D89C55 — Dourado (destaques)                                    */
/*  #3D4356 — Azul escuro (elementos visuais, linhas)                */
/*  #232535 — Quase preto (texto)                                    */
/*                                                                    */
/*  Caixas visuais:                                                   */
/*    Padrão A: fundo #3D4356 + texto #D89C55                        */
/*    Padrão B: fundo #F9F5EF + texto #232535                        */
/* ------------------------------------------------------------------ */

const C_BLACK = "232535";     // texto principal
const C_BLUE = "3D4356";     // elementos visuais, linhas, caixas
const C_GOLD = "D89C55";     // destaques, acentos
const C_CREAM = "F9F5EF";    // fundos claros
const FONT = "Literata";     // fonte principal ST

/* ── OAuth: refresh → access token ────────────────────────────────── */

async function getAccessToken(): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Google Drive não configurado. Defina GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET e GOOGLE_REFRESH_TOKEN no .env.local"
    );
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Falha ao obter access token: ${err}`);
  }

  const data = await res.json();
  return data.access_token;
}

/* ── Helpers HTML ─────────────────────────────────────────────────── */

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Converte inline markdown (**bold**, *italic*, `code`) para HTML */
function fmt(text: string): string {
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)|([^*`]+)/g;
  let result = "";
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match[2]) {
      result += `<b>${esc(match[2])}</b>`;
    } else if (match[4]) {
      result += `<i style="color:#${C_BLUE}">${esc(match[4])}</i>`;
    } else if (match[6]) {
      result += `<code style="font-family:'Courier New',monospace;font-size:10pt;background-color:#${C_CREAM};padding:1pt 3pt">${esc(match[6])}</code>`;
    } else if (match[7]) {
      result += esc(match[7]);
    }
  }

  return result || esc(text);
}

function stripMarkdown(text: string): string {
  return text.replace(/\*\*/g, "").replace(/\*/g, "").replace(/`/g, "");
}

/* ── Tenta converter lista de "**Label**: Valor" em pares para tabela ── */

function tryParseDataPairs(
  items: string[]
): { label: string; value: string }[] | null {
  const pairs: { label: string; value: string }[] = [];
  for (const item of items) {
    const clean = item.replace(/^\s*[-*]\s+/, "").trim();
    const m = clean.match(/^\*\*(.+?)\*\*\s*[:—–\-]\s*(.+)/);
    if (m) pairs.push({ label: m[1].trim(), value: m[2].trim() });
  }
  if (pairs.length >= 3 && pairs.length >= items.length * 0.6) return pairs;
  return null;
}

/* ── Markdown → HTML estilizado para Google Docs ──────────────────── */

function markdownToStyledHtml(markdown: string, clientName: string): string {
  const dateStr = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  let html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Literata:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
</head>
<body style="font-family:'${FONT}',Georgia,serif;color:#${C_BLACK};font-size:11pt;line-height:1.6;max-width:680px;margin:0 auto">

<!-- ══════ CAPA ══════ -->
<div style="text-align:center;padding-top:140pt">
  <p style="color:#${C_BLUE};font-size:9pt;letter-spacing:3px;margin:0">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</p>
  <p style="font-family:'${FONT}',Georgia,serif;font-size:22pt;font-weight:bold;color:#${C_BLACK};margin:24pt 0 8pt">DIAGNÓSTICO PATRIMONIAL PRELIMINAR</p>
  <p style="color:#${C_BLUE};font-size:9pt;letter-spacing:3px;margin:0">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</p>
  <p style="font-family:'${FONT}',Georgia,serif;font-size:15pt;color:#${C_BLACK};margin:36pt 0 8pt">${esc(clientName || "Cliente")}</p>
  <p style="color:#${C_BLUE};font-size:11pt;margin:0">${dateStr}</p>
  <br><br><br>
  <p style="font-family:'${FONT}',Georgia,serif;font-weight:bold;color:#${C_GOLD};letter-spacing:2px;font-size:11pt;margin:0">SILVEIRA TORQUATO REVERBEL ADVOGADOS</p>
  <p style="color:#${C_BLUE};font-size:9pt;margin:4pt 0 0">Planejamento Patrimonial, Tributário e Sucessório</p>
  <br><br><br>
  <p style="color:#${C_BLUE};font-size:8pt;letter-spacing:4px;margin:0">CONFIDENCIAL</p>
</div>
<div style="page-break-after:always"></div>

<!-- ══════ CONTEÚDO ══════ -->
`;

  const lines = markdown.split("\n");
  let isFirstSection = true;
  let blockquoteLines: string[] = [];
  let inBlockquote = false;
  let listBuffer: string[] = [];

  function flushBlockquote() {
    if (blockquoteLines.length === 0) return;

    // Padrão A: fundo azul escuro + texto dourado (caixas de destaque)
    html += `<table style="width:100%;border-collapse:collapse;margin:10pt 0"><tr>
      <td style="background-color:#${C_BLUE};padding:10pt 14pt;border:none">`;
    for (const line of blockquoteLines) {
      html += `<p style="margin:3pt 0;font-size:10.5pt;color:#${C_GOLD};font-family:'${FONT}',Georgia,serif">${fmt(line).replace(/color:#${C_BLACK}/g, `color:#${C_GOLD}`)}</p>`;
    }
    html += `</td></tr></table>`;
    blockquoteLines = [];
    inBlockquote = false;
  }

  function flushListBuffer() {
    if (listBuffer.length === 0) return;

    const dataPairs = tryParseDataPairs(listBuffer);
    if (dataPairs) {
      // Tabela de dados — Padrão B: fundo creme + texto escuro
      html += `<table style="width:100%;border-collapse:collapse;margin:8pt 0">`;
      for (const pair of dataPairs) {
        html += `<tr>
          <td style="font-weight:bold;background-color:#${C_CREAM};padding:6pt 12pt;border:1px solid #${C_BLUE};width:35%;vertical-align:top;font-size:10.5pt;color:#${C_BLACK};font-family:'${FONT}',Georgia,serif">${esc(pair.label)}</td>
          <td style="padding:6pt 12pt;border:1px solid #${C_BLUE};font-size:10.5pt;color:#${C_BLACK};font-family:'${FONT}',Georgia,serif">${fmt(pair.value)}</td>
        </tr>`;
      }
      html += `</table>`;
    } else {
      html += `<ul style="margin:6pt 0;padding-left:24pt">`;
      for (const item of listBuffer) {
        const text = item.replace(/^\s*[-*]\s+/, "");
        html += `<li style="margin:3pt 0;font-size:10.5pt;font-family:'${FONT}',Georgia,serif">${fmt(text)}</li>`;
      }
      html += `</ul>`;
    }
    listBuffer = [];
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // ── Blockquote ──
    if (line.trim().startsWith(">")) {
      flushListBuffer();
      const content = line.replace(/^>\s*/, "").trim();
      if (content) {
        blockquoteLines.push(content);
        inBlockquote = true;
      }
      continue;
    }
    if (inBlockquote && line.trim() === "") {
      flushBlockquote();
      continue;
    }
    if (inBlockquote) {
      flushBlockquote();
    }

    // ── Linha vazia ──
    if (!line.trim()) {
      flushListBuffer();
      continue;
    }

    // ── Horizontal rule ──
    if (line.match(/^[-─━═]{3,}$/)) {
      flushListBuffer();
      html += `<hr style="border:none;border-top:1.5px solid #${C_BLUE};margin:12pt 0">`;
      continue;
    }

    // ── ## Seção (H2) — page break antes (exceto primeira) ──
    if (line.startsWith("## ")) {
      flushListBuffer();
      const text = stripMarkdown(line.slice(3));

      if (!isFirstSection) {
        html += `<div style="page-break-before:always"></div>`;
      }
      isFirstSection = false;

      html += `<h2 style="font-family:'${FONT}',Georgia,serif;color:#${C_BLACK};font-size:14pt;border-bottom:2.5px solid #${C_BLUE};padding-bottom:5pt;margin:20pt 0 10pt">${esc(text).toUpperCase()}</h2>`;
      continue;
    }

    // ── # Título principal ──
    if (line.startsWith("# ")) {
      flushListBuffer();
      const text = stripMarkdown(line.slice(2));
      html += `<h1 style="font-family:'${FONT}',Georgia,serif;color:#${C_BLACK};font-size:18pt;margin:24pt 0 12pt">${esc(text)}</h1>`;
      continue;
    }

    // ── #### Sub-subheading com ícone ──
    if (line.startsWith("#### ")) {
      flushListBuffer();
      const text = stripMarkdown(line.slice(5));
      html += `<p style="font-weight:bold;font-size:11pt;color:#${C_BLACK};border-left:3pt solid #${C_GOLD};padding-left:10pt;margin:14pt 0 4pt;font-family:'${FONT}',Georgia,serif"><span style="color:#${C_GOLD}">◆</span> ${esc(text)}</p>`;
      continue;
    }

    // ── ### Subheading — Padrão B: fundo creme + texto escuro ──
    if (line.startsWith("### ")) {
      flushListBuffer();
      const text = stripMarkdown(line.slice(4));
      html += `<table style="width:100%;border-collapse:collapse;margin:14pt 0 6pt"><tr>
        <td style="background-color:#${C_CREAM};padding:5pt 10pt;border:none">
          <p style="font-weight:bold;font-size:12pt;color:#${C_BLACK};margin:0;font-family:'${FONT}',Georgia,serif">${esc(text)}</p>
        </td>
      </tr></table>`;
      continue;
    }

    // ── Lista bullet ──
    if (line.match(/^\s*[-*]\s/)) {
      listBuffer.push(line);
      continue;
    }

    // ── Lista numerada ──
    const numMatch = line.match(/^\s*(\d+(?:\.\d+)?)[.)]\s/);
    if (numMatch) {
      flushListBuffer();
      const text = line.replace(/^\s*\d+(?:\.\d+)?[.)]\s+/, "");
      html += `<p style="margin:3pt 0 3pt 24pt;font-size:10.5pt;font-family:'${FONT}',Georgia,serif"><b style="color:#${C_GOLD}">${esc(numMatch[1])}.</b> ${fmt(text)}</p>`;
      continue;
    }

    // ── Parágrafo normal ──
    flushListBuffer();
    html += `<p style="margin:4pt 0;font-size:10.5pt;font-family:'${FONT}',Georgia,serif">${fmt(line)}</p>`;
  }

  // Flush remaining
  flushBlockquote();
  flushListBuffer();

  // ── Rodapé final ──
  html += `
<br>
<hr style="border:none;border-top:1.5px solid #${C_BLUE};margin:20pt 0 8pt">
<p style="text-align:center;color:#${C_BLUE};font-size:8pt;margin:0;font-family:'${FONT}',Georgia,serif">Confidencial — Silveira Torquato Reverbel Advogados</p>
<p style="text-align:center;color:#${C_BLUE};font-size:8pt;margin:2pt 0;font-family:'${FONT}',Georgia,serif">Planejamento Patrimonial, Tributário e Sucessório</p>

</body>
</html>`;

  return html;
}

/* ── Sanitize filename ────────────────────────────────────────────── */

function sanitize(name: string): string {
  return (name || "Cliente")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

/* ── POST handler ─────────────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  try {
    const { markdown, clientName } = await req.json();

    if (!markdown) {
      return NextResponse.json(
        { error: "Markdown não fornecido" },
        { status: 400 }
      );
    }

    // 1. Access token
    const accessToken = await getAccessToken();

    // 2. Converter markdown → HTML
    const htmlContent = markdownToStyledHtml(markdown, clientName);
    const docName = `Diagnostico_Preliminar_${sanitize(clientName)}`;

    // 3. Preparar metadados
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || undefined;
    const metadata: { name: string; mimeType: string; parents?: string[] } = {
      name: docName,
      mimeType: "application/vnd.google-apps.document",
    };
    if (folderId) {
      metadata.parents = [folderId];
    }

    // 4. Montar multipart body (metadata JSON + HTML content)
    const boundary = "----DocUploadBoundary" + Date.now();

    const body =
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      JSON.stringify(metadata) +
      `\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: text/html; charset=UTF-8\r\n\r\n` +
      htmlContent +
      `\r\n--${boundary}--`;

    // 5. Upload ao Google Drive (converte HTML → Google Docs)
    const uploadRes = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body,
      }
    );

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(`Google Drive API erro ${uploadRes.status}: ${errText}`);
    }

    const data = await uploadRes.json();
    const fileId = data.id;
    const webViewLink =
      data.webViewLink || `https://docs.google.com/document/d/${fileId}/edit`;

    return NextResponse.json({
      success: true,
      fileId,
      fileName: data.name,
      url: webViewLink,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[Drive Upload]", message);

    if (message.includes("não configurado")) {
      return NextResponse.json(
        { error: message, code: "NOT_CONFIGURED" },
        { status: 501 }
      );
    }

    return NextResponse.json(
      { error: `Erro ao enviar para o Drive: ${message}` },
      { status: 500 }
    );
  }
}
