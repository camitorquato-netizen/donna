import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Footer,
  Header,
  PageNumber,
  NumberFormat,
  Packer,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  ShadingType,
  WidthType,
  VerticalAlign,
  PageBreak,
} from "docx";
import { saveAs } from "file-saver";

/* ------------------------------------------------------------------ */
/*  Cores ST                                                           */
/* ------------------------------------------------------------------ */

const ST_DARK = "232535";
const ST_GOLD = "C89B5F";
const ST_MUTED = "888880";
const ST_LIGHT = "FCF9F5";

// Cores para caixas coloridas
const BOX_ALERT = "FDECEA";    // Vermelho claro — ⚠️ ATENÇÃO
const BOX_INFO = "EBF0F7";     // Azul claro — Nota / Esclarecimento
const BOX_OPPORTUNITY = "F5EDD8"; // Dourado claro — Oportunidades
const BOX_CLOSING = "F0EDE4";  // Bege — Fechamento

/* ------------------------------------------------------------------ */
/*  Parser: markdown → paragraphs docx                                 */
/* ------------------------------------------------------------------ */

function parseMarkdownToDocx(markdown: string): Paragraph[] {
  const lines = markdown.split("\n");
  const paragraphs: Paragraph[] = [];
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code blocks — tratar como texto mono
    if (line.trim().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line,
              font: "Courier New",
              size: 18,
              color: ST_DARK,
            }),
          ],
          spacing: { after: 40 },
        })
      );
      continue;
    }

    // Linha vazia
    if (!line.trim()) {
      paragraphs.push(new Paragraph({ spacing: { after: 80 } }));
      continue;
    }

    // Headings
    if (line.startsWith("## ")) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: cleanInline(line.slice(3)),
              bold: true,
              font: "Georgia",
              size: 26,
              color: ST_DARK,
            }),
          ],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 120 },
          border: {
            bottom: {
              style: BorderStyle.SINGLE,
              size: 4,
              color: ST_GOLD,
              space: 4,
            },
          },
        })
      );
      continue;
    }

    if (line.startsWith("# ")) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: cleanInline(line.slice(2)),
              bold: true,
              font: "Georgia",
              size: 32,
              color: ST_DARK,
            }),
          ],
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 160 },
        })
      );
      continue;
    }

    if (line.startsWith("### ")) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: cleanInline(line.slice(4)),
              bold: true,
              font: "Arial",
              size: 22,
              color: ST_DARK,
            }),
          ],
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 80 },
        })
      );
      continue;
    }

    // Horizontal rule
    if (line.match(/^[-─═]{3,}$/)) {
      paragraphs.push(
        new Paragraph({
          border: {
            bottom: {
              style: BorderStyle.SINGLE,
              size: 2,
              color: ST_GOLD,
              space: 6,
            },
          },
          spacing: { before: 120, after: 120 },
        })
      );
      continue;
    }

    // Lista com bullet (- ou *)
    if (line.match(/^\s*[-*]\s/)) {
      const text = line.replace(/^\s*[-*]\s+/, "");
      paragraphs.push(
        new Paragraph({
          children: formatInlineRuns(text),
          bullet: { level: 0 },
          spacing: { after: 60 },
        })
      );
      continue;
    }

    // Lista numerada
    const numMatch = line.match(/^\s*(\d+)[.)]\s/);
    if (numMatch) {
      const text = line.replace(/^\s*\d+[.)]\s+/, "");
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${numMatch[1]}. `,
              bold: true,
              font: "Arial",
              size: 20,
              color: ST_GOLD,
            }),
            ...formatInlineRuns(text),
          ],
          spacing: { after: 60 },
          indent: { left: 360 },
        })
      );
      continue;
    }

    // Parágrafo normal
    paragraphs.push(
      new Paragraph({
        children: formatInlineRuns(line),
        spacing: { after: 100 },
      })
    );
  }

  return paragraphs;
}

/* ------------------------------------------------------------------ */
/*  Inline formatting: **bold**, *italic*, `code`                      */
/* ------------------------------------------------------------------ */

function formatInlineRuns(text: string): TextRun[] {
  const runs: TextRun[] = [];
  // Regex para capturar **bold**, *italic*, `code`, e texto normal
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)|([^*`]+)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match[2]) {
      // **bold**
      runs.push(
        new TextRun({
          text: match[2],
          bold: true,
          font: "Arial",
          size: 20,
          color: ST_DARK,
        })
      );
    } else if (match[4]) {
      // *italic*
      runs.push(
        new TextRun({
          text: match[4],
          italics: true,
          font: "Arial",
          size: 20,
          color: ST_MUTED,
        })
      );
    } else if (match[6]) {
      // `code`
      runs.push(
        new TextRun({
          text: match[6],
          font: "Courier New",
          size: 18,
          color: ST_DARK,
        })
      );
    } else if (match[7]) {
      // texto normal
      runs.push(
        new TextRun({
          text: match[7],
          font: "Arial",
          size: 20,
          color: ST_DARK,
        })
      );
    }
  }

  if (runs.length === 0) {
    runs.push(
      new TextRun({ text: text, font: "Arial", size: 20, color: ST_DARK })
    );
  }

  return runs;
}

function cleanInline(text: string): string {
  return text.replace(/\*\*/g, "").replace(/\*/g, "").replace(/`/g, "");
}

/* ------------------------------------------------------------------ */
/*  Exportar .docx                                                     */
/* ------------------------------------------------------------------ */

export async function downloadDocx(
  markdown: string,
  clientName: string,
  docType: "diagnostico" | "proposta" | "preliminar"
) {
  const titleMap: Record<typeof docType, string> = {
    preliminar: "Diagnóstico Patrimonial Preliminar",
    diagnostico: "Diagnóstico Patrimonial",
    proposta: "Proposta de Planejamento Patrimonial",
  };
  const fileMap: Record<typeof docType, string> = {
    preliminar: `Diagnostico_Preliminar_${sanitize(clientName)}.docx`,
    diagnostico: `Diagnostico_${sanitize(clientName)}.docx`,
    proposta: `Proposta_${sanitize(clientName)}.docx`,
  };
  const title = titleMap[docType];
  const fileName = fileMap[docType];

  // Capa
  const coverParagraphs: Paragraph[] = [
    new Paragraph({ spacing: { before: 2000 } }),
    new Paragraph({
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          font: "Georgia",
          size: 36,
          color: ST_DARK,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
          font: "Arial",
          size: 20,
          color: ST_GOLD,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: clientName || "Cliente",
          font: "Georgia",
          size: 28,
          color: ST_DARK,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: new Date().toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          }),
          font: "Arial",
          size: 20,
          color: ST_MUTED,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "Silveira Torquato Advogados",
          bold: true,
          font: "Georgia",
          size: 22,
          color: ST_GOLD,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "Planejamento Patrimonial e Tributário",
          font: "Arial",
          size: 18,
          color: ST_MUTED,
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),
  ];

  // Conteúdo
  const contentParagraphs = parseMarkdownToDocx(markdown);

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
            pageNumbers: {
              start: 1,
              formatType: NumberFormat.DECIMAL,
            },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Confidencial — Silveira Torquato Advogados   |   Página ",
                    font: "Arial",
                    size: 14,
                    color: ST_MUTED,
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: "Arial",
                    size: 14,
                    color: ST_MUTED,
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children: [...coverParagraphs, ...contentParagraphs],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, fileName);
}

/* ================================================================== */
/*  DIAGNÓSTICO PRELIMINAR — Export dedicado com layout profissional   */
/* ================================================================== */

/**
 * Cria uma caixa colorida (Table 1×1 com shading) para blockquotes
 */
function makeColoredBox(
  lines: string[],
  bgColor: string,
  borderColor: string
): Table {
  const children: Paragraph[] = lines.map(
    (line) =>
      new Paragraph({
        children: formatInlineRuns(line),
        spacing: { after: 60 },
        indent: { left: 100, right: 100 },
      })
  );

  return new Table({
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children,
            width: { size: 100, type: WidthType.PERCENTAGE },
            shading: {
              type: ShadingType.CLEAR,
              fill: bgColor,
              color: bgColor,
            },
            verticalAlign: VerticalAlign.CENTER,
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: borderColor },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: borderColor },
              left: { style: BorderStyle.SINGLE, size: 6, color: borderColor },
              right: { style: BorderStyle.SINGLE, size: 1, color: borderColor },
            },
            margins: {
              top: 120,
              bottom: 120,
              left: 200,
              right: 200,
            },
          }),
        ],
      }),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

/**
 * Cria uma tabela de dados estruturados (label → valor) tipo Seção 1/2
 */
function makeDataTable(
  rows: { label: string; value: string }[]
): Table {
  const tableRows = rows.map(
    (row) =>
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: row.label,
                    bold: true,
                    font: "Arial",
                    size: 19,
                    color: ST_DARK,
                  }),
                ],
                indent: { left: 80 },
              }),
            ],
            width: { size: 35, type: WidthType.PERCENTAGE },
            shading: {
              type: ShadingType.CLEAR,
              fill: "F7F6F3",
              color: "F7F6F3",
            },
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 60, bottom: 60, left: 120, right: 80 },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "E0DDD7" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "E0DDD7" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "E0DDD7" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "E0DDD7" },
            },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: formatInlineRuns(row.value),
                indent: { left: 80 },
              }),
            ],
            width: { size: 65, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 60, bottom: 60, left: 120, right: 120 },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "E0DDD7" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "E0DDD7" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "E0DDD7" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "E0DDD7" },
            },
          }),
        ],
      })
  );

  return new Table({
    rows: tableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

/**
 * Determina a cor de uma caixa blockquote pelo conteúdo
 */
function getBoxColors(text: string): { bg: string; border: string } {
  const lower = text.toLowerCase();
  if (lower.includes("⚠️") || lower.includes("atenção") || lower.includes("atencao") || lower.includes("risco"))
    return { bg: BOX_ALERT, border: "E8B4B0" };
  if (lower.includes("esclarecimento"))
    return { bg: BOX_INFO, border: "B8C8E0" };
  if (lower.includes("nota:") || lower.includes("observação"))
    return { bg: BOX_INFO, border: "B8C8E0" };
  if (lower.includes("benefício") || lower.includes("oportunidade") || lower.includes("economia"))
    return { bg: BOX_OPPORTUNITY, border: ST_GOLD };
  if (lower.includes("continuidade") || lower.includes("contato") || lower.includes("silveira torquato"))
    return { bg: BOX_CLOSING, border: ST_GOLD };
  return { bg: BOX_INFO, border: "B8C8E0" };
}

/**
 * Tenta parsear lista de "**Label**: Valor" em pares para tabela
 */
function tryParseDataList(
  lines: string[]
): { label: string; value: string }[] | null {
  const pairs: { label: string; value: string }[] = [];
  for (const line of lines) {
    const clean = line.replace(/^\s*[-*]\s+/, "").trim();
    // Match: **Label**: Value  or  **Label** — Value
    const m = clean.match(/^\*\*(.+?)\*\*\s*[:—–-]\s*(.+)/);
    if (m) {
      pairs.push({ label: m[1].trim(), value: m[2].trim() });
    }
  }
  // Só retorna se a maioria das linhas era data-list
  if (pairs.length >= 3 && pairs.length >= lines.length * 0.6) return pairs;
  return null;
}

/**
 * Parser avançado de markdown para Diagnóstico Preliminar
 * Reconhece seções, blockquotes coloridos, listas de dados → tabelas
 */
function parsePreliminaryMarkdown(
  markdown: string
): (Paragraph | Table)[] {
  const lines = markdown.split("\n");
  const elements: (Paragraph | Table)[] = [];
  let isFirstSection = true;
  let inBlockquote = false;
  let blockquoteLines: string[] = [];

  function flushBlockquote() {
    if (blockquoteLines.length === 0) return;
    const fullText = blockquoteLines.join(" ");
    const colors = getBoxColors(fullText);
    elements.push(
      new Paragraph({ spacing: { after: 80 } }) // spacer before
    );
    elements.push(makeColoredBox(blockquoteLines, colors.bg, colors.border));
    elements.push(
      new Paragraph({ spacing: { after: 120 } }) // spacer after
    );
    blockquoteLines = [];
    inBlockquote = false;
  }

  // Coleta linhas de lista para tentar converter em tabela
  let listBuffer: string[] = [];

  function flushListBuffer() {
    if (listBuffer.length === 0) return;
    const dataPairs = tryParseDataList(listBuffer);
    if (dataPairs) {
      elements.push(
        new Paragraph({ spacing: { after: 60 } })
      );
      elements.push(makeDataTable(dataPairs));
      elements.push(
        new Paragraph({ spacing: { after: 120 } })
      );
    } else {
      // Render como bullets normais
      for (const item of listBuffer) {
        const text = item.replace(/^\s*[-*]\s+/, "");
        elements.push(
          new Paragraph({
            children: formatInlineRuns(text),
            bullet: { level: 0 },
            spacing: { after: 60 },
          })
        );
      }
    }
    listBuffer = [];
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Blockquote
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
      // Don't continue — process this line normally
    }

    // Linha vazia
    if (!line.trim()) {
      flushListBuffer();
      elements.push(new Paragraph({ spacing: { after: 60 } }));
      continue;
    }

    // Horizontal rule (--- or ━━━ or ═══)
    if (line.match(/^[-─━═]{3,}$/)) {
      flushListBuffer();
      elements.push(
        new Paragraph({
          border: {
            bottom: {
              style: BorderStyle.SINGLE,
              size: 2,
              color: ST_GOLD,
              space: 6,
            },
          },
          spacing: { before: 80, after: 80 },
        })
      );
      continue;
    }

    // ## SEÇÃO heading — page break before (exceto a primeira)
    if (line.startsWith("## ")) {
      flushListBuffer();
      const text = cleanInline(line.slice(3));

      if (!isFirstSection) {
        elements.push(
          new Paragraph({
            children: [new PageBreak()],
          })
        );
      }
      isFirstSection = false;

      // Header com barra lateral dourada
      elements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: text.toUpperCase(),
              bold: true,
              font: "Georgia",
              size: 26,
              color: ST_DARK,
            }),
          ],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
          border: {
            bottom: {
              style: BorderStyle.SINGLE,
              size: 6,
              color: ST_GOLD,
              space: 6,
            },
          },
        })
      );
      continue;
    }

    // # Heading 1
    if (line.startsWith("# ")) {
      flushListBuffer();
      elements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: cleanInline(line.slice(2)),
              bold: true,
              font: "Georgia",
              size: 32,
              color: ST_DARK,
            }),
          ],
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 300, after: 140 },
        })
      );
      continue;
    }

    // #### Sub-subheading (oportunidades)
    if (line.startsWith("#### ")) {
      flushListBuffer();
      const text = cleanInline(line.slice(5));
      elements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "◆ ",
              font: "Arial",
              size: 20,
              color: ST_GOLD,
            }),
            new TextRun({
              text,
              bold: true,
              font: "Arial",
              size: 21,
              color: ST_DARK,
            }),
          ],
          spacing: { before: 200, after: 60 },
          border: {
            left: {
              style: BorderStyle.SINGLE,
              size: 8,
              color: ST_GOLD,
              space: 8,
            },
          },
          indent: { left: 120 },
        })
      );
      continue;
    }

    // ### Subheading (3.1, 3.2... ou Patrimônio Imobilizado)
    if (line.startsWith("### ")) {
      flushListBuffer();
      const text = cleanInline(line.slice(4));
      elements.push(
        new Paragraph({
          children: [
            new TextRun({
              text,
              bold: true,
              font: "Arial",
              size: 22,
              color: ST_DARK,
            }),
          ],
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 240, after: 80 },
          shading: {
            type: ShadingType.CLEAR,
            fill: ST_LIGHT,
            color: ST_LIGHT,
          },
        })
      );
      continue;
    }

    // Lista com bullet (- ou *)
    if (line.match(/^\s*[-*]\s/)) {
      listBuffer.push(line);
      continue;
    }

    // Lista numerada (1. ou 1) ou 3.1 subtópicos)
    const numMatch = line.match(/^\s*(\d+(?:\.\d+)?)[.)]\s/);
    if (numMatch) {
      flushListBuffer();
      const text = line.replace(/^\s*\d+(?:\.\d+)?[.)]\s+/, "");
      elements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${numMatch[1]}. `,
              bold: true,
              font: "Arial",
              size: 20,
              color: ST_GOLD,
            }),
            ...formatInlineRuns(text),
          ],
          spacing: { after: 60 },
          indent: { left: 360 },
        })
      );
      continue;
    }

    // Parágrafo normal
    flushListBuffer();
    elements.push(
      new Paragraph({
        children: formatInlineRuns(line),
        spacing: { after: 100 },
      })
    );
  }

  // Flush remaining
  flushBlockquote();
  flushListBuffer();

  return elements;
}

/**
 * Gera o blob .docx do Diagnóstico Preliminar (sem baixar).
 * Usado tanto pelo download local quanto pelo upload ao Google Drive.
 */
export async function buildPreliminaryDocxBlob(
  markdown: string,
  clientName: string
): Promise<{ blob: Blob; fileName: string }> {
  const title = "Diagnóstico Patrimonial Preliminar";
  const fileName = `Diagnostico_Preliminar_${sanitize(clientName)}.docx`;
  const dateStr = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // ─── Capa (seção 1) ─────────────────────────────────────────────
  const coverChildren: Paragraph[] = [
    new Paragraph({ spacing: { before: 3000 } }),
    new Paragraph({
      children: [new TextRun({ text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", font: "Arial", size: 16, color: ST_GOLD })],
      alignment: AlignmentType.CENTER, spacing: { after: 400 },
    }),
    new Paragraph({
      children: [new TextRun({ text: title.toUpperCase(), bold: true, font: "Georgia", size: 40, color: ST_DARK })],
      alignment: AlignmentType.CENTER, spacing: { after: 300 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", font: "Arial", size: 16, color: ST_GOLD })],
      alignment: AlignmentType.CENTER, spacing: { after: 500 },
    }),
    new Paragraph({
      children: [new TextRun({ text: clientName || "Cliente", font: "Georgia", size: 30, color: ST_DARK })],
      alignment: AlignmentType.CENTER, spacing: { after: 120 },
    }),
    new Paragraph({
      children: [new TextRun({ text: dateStr, font: "Arial", size: 20, color: ST_MUTED })],
      alignment: AlignmentType.CENTER, spacing: { after: 800 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "SILVEIRA TORQUATO ADVOGADOS", bold: true, font: "Georgia", size: 22, color: ST_GOLD, characterSpacing: 60 })],
      alignment: AlignmentType.CENTER, spacing: { after: 40 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Planejamento Patrimonial, Tributário e Sucessório", font: "Arial", size: 18, color: ST_MUTED })],
      alignment: AlignmentType.CENTER, spacing: { after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "CONFIDENCIAL", bold: true, font: "Arial", size: 16, color: ST_MUTED, characterSpacing: 80 })],
      alignment: AlignmentType.CENTER, spacing: { before: 600 },
    }),
  ];

  // ─── Conteúdo (seção 2, com header/footer) ──────────────────────
  const contentElements = parsePreliminaryMarkdown(markdown);

  const doc = new Document({
    styles: { default: { document: { run: { font: "Arial", size: 20, color: ST_DARK } } } },
    sections: [
      // Capa — sem header/footer
      { properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } }, children: coverChildren },
      // Conteúdo — com header e footer
      {
        properties: { page: { margin: { top: 1800, right: 1440, bottom: 1440, left: 1440 }, pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } } },
        headers: {
          default: new Header({
            children: [new Paragraph({
              children: [
                new TextRun({ text: "Silveira Torquato Advogados", bold: true, font: "Georgia", size: 16, color: ST_GOLD }),
                new TextRun({ text: `   |   ${title}`, font: "Arial", size: 14, color: ST_MUTED }),
              ],
              border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: ST_GOLD, space: 6 } },
              spacing: { after: 200 },
            })],
          }),
        },
        footers: {
          default: new Footer({
            children: [new Paragraph({
              border: { top: { style: BorderStyle.SINGLE, size: 2, color: ST_GOLD, space: 6 } },
              children: [
                new TextRun({ text: "Confidencial — Silveira Torquato Advogados", font: "Arial", size: 14, color: ST_MUTED }),
                new TextRun({ text: "   |   Página ", font: "Arial", size: 14, color: ST_MUTED }),
                new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 14, color: ST_MUTED }),
              ],
              alignment: AlignmentType.CENTER,
            })],
          }),
        },
        children: contentElements as Paragraph[],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  return { blob, fileName };
}

/**
 * Exportar Diagnóstico Preliminar — baixa .docx localmente
 */
export async function downloadPreliminaryDocx(
  markdown: string,
  clientName: string
) {
  const { blob, fileName } = await buildPreliminaryDocxBlob(markdown, clientName);
  saveAs(blob, fileName);
}

function sanitize(name: string): string {
  return (name || "Cliente")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}
