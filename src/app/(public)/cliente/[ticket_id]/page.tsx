"use client";

import { useEffect, useState, useCallback, use } from "react";
import { getCaseByTicket } from "@/lib/store";
import { uploadDocumento } from "@/lib/storage";
import { Case } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Tipos internos                                                     */
/* ------------------------------------------------------------------ */

interface FileStatus {
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

/* ------------------------------------------------------------------ */
/*  Formatador de tamanho                                              */
/* ------------------------------------------------------------------ */

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ------------------------------------------------------------------ */
/*  Componente principal                                               */
/* ------------------------------------------------------------------ */

export default function ClientePortalPage({
  params,
}: {
  params: Promise<{ ticket_id: string }>;
}) {
  const { ticket_id } = use(params);

  const [caso, setCaso] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [files, setFiles] = useState<FileStatus[]>([]);
  const [uploading, setUploading] = useState(false);
  const [allDone, setAllDone] = useState(false);

  // Carregar caso pelo ticket
  useEffect(() => {
    let cancelled = false;
    getCaseByTicket(ticket_id).then((c) => {
      if (cancelled) return;
      if (c) {
        setCaso(c);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [ticket_id]);

  // Adicionar arquivos
  const handleFiles = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files;
      if (!selected) return;
      const newFiles: FileStatus[] = Array.from(selected).map((f) => ({
        file: f,
        status: "pending",
      }));
      setFiles((prev) => [...prev, ...newFiles]);
      setAllDone(false);
      // Reset input para permitir re-selecionar mesmo arquivo
      e.target.value = "";
    },
    []
  );

  // Remover arquivo da lista
  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Enviar todos os arquivos
  const handleUpload = useCallback(async () => {
    if (!caso || files.length === 0) return;
    setUploading(true);
    setAllDone(false);

    const updated = [...files];

    for (let i = 0; i < updated.length; i++) {
      if (updated[i].status === "done") continue;

      updated[i] = { ...updated[i], status: "uploading" };
      setFiles([...updated]);

      try {
        await uploadDocumento(updated[i].file, caso.id, ticket_id);
        updated[i] = { ...updated[i], status: "done" };
      } catch (err) {
        updated[i] = {
          ...updated[i],
          status: "error",
          error: err instanceof Error ? err.message : "Erro desconhecido",
        };
      }
      setFiles([...updated]);
    }

    setUploading(false);
    const allSuccess = updated.every((f) => f.status === "done");
    setAllDone(allSuccess);
  }, [caso, files, ticket_id]);

  // ---------- Estados de carregamento ----------

  if (loading) {
    return (
      <Shell>
        <p className="text-center text-sm text-st-muted animate-pulse py-20">
          Carregando...
        </p>
      </Shell>
    );
  }

  if (notFound || !caso) {
    return (
      <Shell>
        <div className="max-w-lg mx-auto text-center py-20">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-serif text-st-dark mb-2">
              Link inválido
            </h2>
            <p className="text-sm text-st-muted font-sans">
              Não encontramos um caso associado a este link. Verifique com seu
              consultor se o endereço está correto.
            </p>
          </div>
        </div>
      </Shell>
    );
  }

  // ---------- Contadores ----------
  const pendingCount = files.filter(
    (f) => f.status === "pending" || f.status === "error"
  ).length;
  const doneCount = files.filter((f) => f.status === "done").length;

  // ---------- Render principal ----------
  return (
    <Shell>
      <div className="max-w-lg mx-auto py-8 px-4 space-y-6">
        {/* Saudação */}
        <div className="text-center space-y-1">
          <h2 className="text-xl font-serif text-st-dark">
            Olá, {caso.clientName || "Cliente"}
          </h2>
          <p className="text-sm text-st-muted font-sans">
            Envie seus documentos de forma segura pelo formulário abaixo.
          </p>
        </div>

        {/* Instruções */}
        <div className="bg-white border border-st-border rounded-lg p-5 space-y-3">
          <h3 className="text-sm font-semibold text-st-dark font-sans">
            Documentos solicitados:
          </h3>
          <ul className="text-sm text-st-muted font-sans space-y-1.5 list-disc list-inside">
            <li>Declaração de Imposto de Renda (IRPF) — últimos 2 anos</li>
            <li>Contrato Social das empresas</li>
            <li>Matrículas de imóveis</li>
            <li>Extratos de investimentos</li>
            <li>Outros documentos relevantes ao caso</li>
          </ul>
          <p className="text-xs text-st-muted font-sans">
            Aceitos: PDF, PNG, JPG — até 50 MB por arquivo.
          </p>
        </div>

        {/* Upload */}
        <div className="bg-white border border-st-border rounded-lg p-5 space-y-4">
          <label
            className="block w-full cursor-pointer border-2 border-dashed border-st-border
                       hover:border-st-gold rounded-lg p-6 text-center transition-colors"
          >
            <input
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFiles}
              className="hidden"
              disabled={uploading}
            />
            <div className="space-y-1">
              <p className="text-sm font-sans text-st-dark">
                Clique para selecionar arquivos
              </p>
              <p className="text-xs text-st-muted font-sans">
                ou arraste até aqui
              </p>
            </div>
          </label>

          {/* Lista de arquivos */}
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((f, i) => (
                <div
                  key={`${f.file.name}-${i}`}
                  className="flex items-center gap-3 bg-gray-50 rounded px-3 py-2"
                >
                  {/* Ícone de status */}
                  <span className="text-sm shrink-0">
                    {f.status === "done" && "✓"}
                    {f.status === "error" && "✗"}
                    {f.status === "uploading" && (
                      <span className="inline-block w-3 h-3 border-2 border-st-gold border-t-transparent rounded-full animate-spin" />
                    )}
                    {f.status === "pending" && "○"}
                  </span>

                  {/* Nome e tamanho */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-st-dark font-sans truncate">
                      {f.file.name}
                    </p>
                    <p className="text-xs text-st-muted font-sans">
                      {fmtSize(f.file.size)}
                      {f.status === "done" && (
                        <span className="text-st-green ml-2">Enviado</span>
                      )}
                      {f.status === "error" && (
                        <span className="text-st-red ml-2">{f.error}</span>
                      )}
                      {f.status === "uploading" && (
                        <span className="text-st-gold ml-2">Enviando...</span>
                      )}
                    </p>
                  </div>

                  {/* Remover (só se não está uploading e não concluído) */}
                  {f.status !== "uploading" && f.status !== "done" && (
                    <button
                      onClick={() => removeFile(i)}
                      className="text-st-muted hover:text-st-red text-sm shrink-0"
                      title="Remover"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Botão enviar */}
          {files.length > 0 && pendingCount > 0 && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full py-3 rounded-lg font-sans text-sm font-medium text-white
                         bg-st-gold hover:bg-st-gold/90 disabled:opacity-50
                         transition-colors"
            >
              {uploading
                ? "Enviando..."
                : `Enviar ${pendingCount} arquivo${pendingCount > 1 ? "s" : ""}`}
            </button>
          )}
        </div>

        {/* Confirmação de sucesso */}
        {allDone && doneCount > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-5 text-center space-y-2">
            <p className="text-st-green font-serif text-lg">
              Documentos enviados com sucesso!
            </p>
            <p className="text-sm text-st-muted font-sans">
              {doneCount} arquivo{doneCount > 1 ? "s" : ""} recebido
              {doneCount > 1 ? "s" : ""}. Sua equipe será notificada.
              <br />
              Você pode fechar esta página ou enviar mais documentos.
            </p>
          </div>
        )}

        {/* Rodapé */}
        <p className="text-center text-xs text-st-muted font-sans pt-4">
          Silveira Torquato Advogados · Planejamento Patrimonial e Tributário
        </p>
      </div>
    </Shell>
  );
}

/* ------------------------------------------------------------------ */
/*  Shell — layout simplificado para o cliente                         */
/* ------------------------------------------------------------------ */

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-st-light">
      {/* Header simplificado */}
      <header className="bg-st-dark h-14 flex items-center px-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <span className="bg-st-gold text-white text-xs font-bold px-2 py-1 rounded">
            ST
          </span>
          <h1 className="text-white text-sm font-serif tracking-wide">
            Envio de Documentos
          </h1>
        </div>
      </header>
      {children}
    </div>
  );
}
