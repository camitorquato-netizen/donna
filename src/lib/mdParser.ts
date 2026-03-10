export type BlockToken =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "orderedList"; items: string[] }
  | { type: "quote"; text: string }
  | { type: "codeBlock"; text: string }
  | { type: "hr" }
  | { type: "labelValue"; label: string; value: string };

export function parseMarkdown(input: string): BlockToken[] {
  const lines = input.split("\n");
  const tokens: BlockToken[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trimEnd();

    // Empty line — skip
    if (trimmed === "") {
      i++;
      continue;
    }

    // Horizontal rule
    if (/^(---|___|\*\*\*|─{3,})\s*$/.test(trimmed)) {
      tokens.push({ type: "hr" });
      i++;
      continue;
    }

    // Code block
    if (trimmed.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimEnd().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      tokens.push({ type: "codeBlock", text: codeLines.join("\n") });
      i++; // skip closing ```
      continue;
    }

    // Heading
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      tokens.push({
        type: "heading",
        level: headingMatch[1].length,
        text: headingMatch[2],
      });
      i++;
      continue;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trimEnd().startsWith("> ")) {
        quoteLines.push(lines[i].trimEnd().slice(2));
        i++;
      }
      tokens.push({ type: "quote", text: quoteLines.join("\n") });
      continue;
    }

    // Unordered list
    if (/^[\s]*[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[\s]*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[\s]*[-*]\s+/, "").trimEnd());
        i++;
      }
      tokens.push({ type: "list", items });
      continue;
    }

    // Ordered list
    if (/^[\s]*\d+[.)]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[\s]*\d+[.)]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[\s]*\d+[.)]\s+/, "").trimEnd());
        i++;
      }
      tokens.push({ type: "orderedList", items });
      continue;
    }

    // Label: Value pattern (e.g., **Nome**: João)
    const labelMatch = trimmed.match(/^\*\*(.+?)\*\*:\s*(.+)$/);
    if (labelMatch) {
      tokens.push({
        type: "labelValue",
        label: labelMatch[1],
        value: labelMatch[2],
      });
      i++;
      continue;
    }

    // Paragraph — collect consecutive non-special lines
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trimEnd() !== "" &&
      !lines[i].trimEnd().startsWith("#") &&
      !lines[i].trimEnd().startsWith("```") &&
      !lines[i].trimEnd().startsWith("> ") &&
      !/^[\s]*[-*]\s+/.test(lines[i]) &&
      !/^[\s]*\d+[.)]\s+/.test(lines[i]) &&
      !/^(---|___|\*\*\*|─{3,})\s*$/.test(lines[i].trimEnd())
    ) {
      paraLines.push(lines[i].trimEnd());
      i++;
    }
    if (paraLines.length > 0) {
      tokens.push({ type: "paragraph", text: paraLines.join("\n") });
    }
  }

  return tokens;
}
