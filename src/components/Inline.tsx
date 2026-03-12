import React from "react";

interface InlineProps {
  text: string;
}

export default function Inline({ text }: InlineProps) {
  return <>{parseInline(text)}</>;
}

function parseInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Combined regex for inline patterns
  const regex =
    /\[([^\]]+)\]\(([^)]+)\)|\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`|\[inferência\]|\[incompleto\]|\[estimativa\]|\[URGENTE\]|\bBAIXO\b|\bMÉDIO\b|\bMEDIO\b|\bALTO\b/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    // Text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[1] && match[2]) {
      // Link: [text](url)
      parts.push(
        <a
          key={key++}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-st-gold underline hover:brightness-110"
        >
          {match[1]}
        </a>
      );
    } else if (match[3]) {
      // Bold: **text**
      parts.push(
        <strong key={key++} className="font-bold text-st-dark">
          {match[3]}
        </strong>
      );
    } else if (match[4]) {
      // Italic: *text*
      parts.push(
        <em key={key++} className="italic">
          {match[4]}
        </em>
      );
    } else if (match[5]) {
      // Code: `text`
      parts.push(
        <code
          key={key++}
          className="bg-st-dark/5 px-1.5 py-0.5 rounded text-sm font-mono text-st-dark"
        >
          {match[5]}
        </code>
      );
    } else if (match[0] === "[inferência]" || match[0] === "[estimativa]") {
      parts.push(
        <span
          key={key++}
          className="inline-block bg-amber-100 text-amber-700 text-xs font-sans px-1.5 py-0.5 rounded"
        >
          {match[0]}
        </span>
      );
    } else if (match[0] === "[incompleto]") {
      parts.push(
        <span
          key={key++}
          className="inline-block bg-red-100 text-st-red text-xs font-sans px-1.5 py-0.5 rounded"
        >
          {match[0]}
        </span>
      );
    } else if (match[0] === "[URGENTE]") {
      parts.push(
        <span
          key={key++}
          className="inline-block bg-st-red text-white text-xs font-sans font-bold px-1.5 py-0.5 rounded"
        >
          URGENTE
        </span>
      );
    } else if (match[0] === "BAIXO") {
      parts.push(
        <span
          key={key++}
          className="inline-block bg-st-green/15 text-st-green text-xs font-sans font-bold px-2 py-0.5 rounded"
        >
          BAIXO
        </span>
      );
    } else if (match[0] === "MÉDIO" || match[0] === "MEDIO") {
      parts.push(
        <span
          key={key++}
          className="inline-block bg-st-gold/15 text-st-gold text-xs font-sans font-bold px-2 py-0.5 rounded"
        >
          MÉDIO
        </span>
      );
    } else if (match[0] === "ALTO") {
      parts.push(
        <span
          key={key++}
          className="inline-block bg-st-red/15 text-st-red text-xs font-sans font-bold px-2 py-0.5 rounded"
        >
          ALTO
        </span>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}
