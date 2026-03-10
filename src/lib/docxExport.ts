import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Footer,
  PageNumber,
  NumberFormat,
  Packer,
  BorderStyle,
} from "docx";
import { saveAs } from "file-saver";

/* ------------------------------------------------------------------ */
/*  Cores ST                                                           */
/* ------------------------------------------------------------------ */

const ST_DARK = "232535";
const ST_GOLD = "C89B5F";
const ST_MUTED = "888880";

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
  docType: "diagnostico" | "proposta"
) {
  const title =
    docType === "diagnostico"
      ? "Diagnóstico Patrimonial Preliminar"
      : "Proposta de Planejamento Patrimonial";

  const fileName =
    docType === "diagnostico"
      ? `Diagnostico_${sanitize(clientName)}.docx`
      : `Proposta_${sanitize(clientName)}.docx`;

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

function sanitize(name: string): string {
  return (name || "Cliente")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}
