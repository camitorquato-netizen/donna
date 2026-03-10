"use client";
import { useState } from "react";
import Md from "./Md";

interface MdBoxProps {
  content: string;
  title?: string;
  maxHeight?: string;
}

export default function MdBox({
  content,
  title,
  maxHeight = "max-h-[70vh]",
}: MdBoxProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const textarea = document.createElement("textarea");
      textarea.value = content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="border border-st-border rounded-lg sm:rounded-xl bg-white shadow-sm overflow-hidden">
      {(title || true) && (
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 border-b border-st-border bg-st-light">
          {title && (
            <span className="font-serif text-sm font-bold text-st-dark truncate mr-2">
              {title}
            </span>
          )}
          {!title && <span />}
          <button
            onClick={handleCopy}
            className="text-xs font-sans text-st-muted hover:text-st-dark transition-colors cursor-pointer shrink-0"
          >
            {copied ? "Copiado!" : "Copiar"}
          </button>
        </div>
      )}
      <div className={`p-3 sm:p-5 overflow-y-auto ${maxHeight}`}>
        <Md content={content} />
      </div>
    </div>
  );
}
