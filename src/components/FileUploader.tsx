"use client";
import { useState, useRef } from "react";
import { CaseFile } from "@/lib/types";
import { fileToBase64, formatFileSize } from "@/lib/fileUtils";

interface FileUploaderProps {
  files: CaseFile[];
  onFilesChange: (files: CaseFile[]) => void;
  disabled?: boolean;
}

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
];
const MAX_SIZE = 20 * 1024 * 1024; // 20MB — texto será extraído e truncado

export default function FileUploader({
  files,
  onFilesChange,
  disabled,
}: FileUploaderProps) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function processFiles(fileList: FileList) {
    setError("");
    const newFiles: CaseFile[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError(`Tipo não suportado: ${file.name}. Use PDF, PNG ou JPG.`);
        continue;
      }
      if (file.size > MAX_SIZE) {
        setError(`Arquivo muito grande: ${file.name} (${formatFileSize(file.size)}). Máximo: 10MB.`);
        continue;
      }
      try {
        const cf = await fileToBase64(file);
        newFiles.push(cf);
      } catch (err) {
        // Mesmo se falhar, adiciona o arquivo com aviso (para o usuário ver)
        const msg = err instanceof Error ? err.message : String(err);
        if (file.type === "application/pdf" && file.size <= 2 * 1024 * 1024) {
          // PDF pequeno: tentar enviar como base64 mesmo sem texto
          try {
            const buf = await file.arrayBuffer();
            const bytes = new Uint8Array(buf);
            let bin = "";
            for (let j = 0; j < bytes.byteLength; j++) bin += String.fromCharCode(bytes[j]);
            const b64 = btoa(bin);
            newFiles.push({
              name: file.name,
              type: file.type,
              base64: b64,
              mediaType: file.type,
              processingInfo: `⚠️ Extração falhou (${msg.slice(0, 60)}) — enviado como doc`,
            });
          } catch {
            newFiles.push({
              name: file.name,
              type: file.type,
              base64: "",
              mediaType: file.type,
              processingInfo: `❌ Falha: ${msg.slice(0, 80)}`,
            });
          }
        } else {
          newFiles.push({
            name: file.name,
            type: file.type,
            base64: "",
            mediaType: file.type,
            processingInfo: `❌ Falha: ${msg.slice(0, 80)}`,
          });
        }
      }
    }
    if (newFiles.length > 0) {
      onFilesChange([...files, ...newFiles]);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (!disabled && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    e.target.value = "";
  }

  function removeFile(idx: number) {
    onFilesChange(files.filter((_, i) => i !== idx));
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-4 sm:p-6 text-center transition-colors cursor-pointer ${
          disabled
            ? "border-st-border bg-gray-50 cursor-not-allowed opacity-50"
            : dragging
            ? "border-st-gold bg-st-gold/5"
            : "border-st-border hover:border-st-gold/50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />
        <div className="text-st-muted text-sm font-sans">
          <span className="text-2xl block mb-2">📎</span>
          <span className="hidden sm:inline">Arraste PDFs ou imagens aqui, ou clique para selecionar</span>
          <span className="sm:hidden">Toque para selecionar PDFs ou imagens</span>
        </div>
      </div>

      {error && (
        <p className="text-st-red text-xs font-sans mt-2">{error}</p>
      )}

      {files.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {files.map((f, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-xs font-sans bg-white border border-st-border rounded-lg px-3 py-2 sm:py-1.5"
            >
              <span className="text-st-muted">
                {f.type === "application/pdf" ? "📄" : "🖼️"}
              </span>
              <div className="flex-1 min-w-0">
                <span className="truncate block text-st-dark">{f.name}</span>
                {f.processingInfo && (
                  <span className="text-[10px] text-st-muted block mt-0.5">
                    {f.processingInfo}
                  </span>
                )}
              </div>
              {!disabled && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(i);
                  }}
                  className="text-st-muted hover:text-st-red transition-colors cursor-pointer shrink-0"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
