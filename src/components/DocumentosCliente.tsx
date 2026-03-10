"use client";

import { useEffect, useState, useCallback } from "react";
import { Case, CaseFile, Documento } from "@/lib/types";
import { getDocumentos } from "@/lib/store";
import { getSignedUrl } from "@/lib/storage";
import { fileToBase64 } from "@/lib/fileUtils";
import { supabase } from "@/lib/supabase";
import Btn from "./Btn";

/* ------------------------------------------------------------------ */
/*  Tipos internos                                                     */
/* ------------------------------------------------------------------ */

interface DocWithUrl extends Documento {
  signedUrl?: string;
  loadingUrl?: boolean;
}

interface Props {
  caso: Case;
  onFilesReady: (files: CaseFile[]) => void;
}

/* ------------------------------------------------------------------ */
/*  Labels de tipo                                                     */
/* ------------------------------------------------------------------ */

const TIPO_LABEL: Record<string, string> = {
  irpf: "IRPF",
  contrato_social: "Contrato Social",
  balancete: "Balancete",
  outro: "Outro",
};

/* ------------------------------------------------------------------ */
/*  Componente                                                         */
/* ------------------------------------------------------------------ */

export default function DocumentosCliente({ caso, onFilesReady }: Props) {
  const [docs, setDocs] = useState<DocWithUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [extractStatus, setExtractStatus] = useState<
    Record<string, "pending" | "extracting" | "done" | "error">
  >({});
  const [extractError, setExtractError] = useState<string | null>(null);

  // Carregar documentos
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getDocumentos(caso.id).then((result) => {
      if (!cancelled) {
        setDocs(result.map((d) => ({ ...d })));
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [caso.id]);

  // Gerar URL assinada para um doc
  const handleViewDoc = useCallback(async (doc: DocWithUrl, index: number) => {
    if (doc.signedUrl) {
      window.open(doc.signedUrl, "_blank");
      return;
    }

    setDocs((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], loadingUrl: true };
      return updated;
    });

    const url = await getSignedUrl(doc.storagePath);

    setDocs((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        signedUrl: url || undefined,
        loadingUrl: false,
      };
      return updated;
    });

    if (url) window.open(url, "_blank");
  }, []);

  // Extrair dados de todos os documentos
  const handleExtract = useCallback(async () => {
    if (docs.length === 0) return;
    setExtracting(true);
    setExtractError(null);

    const statusMap: Record<string, "pending" | "extracting" | "done" | "error"> = {};
    for (const d of docs) {
      statusMap[d.id || d.nome] = "pending";
    }
    setExtractStatus({ ...statusMap });

    const caseFiles: CaseFile[] = [];

    for (const doc of docs) {
      const key = doc.id || doc.nome;
      statusMap[key] = "extracting";
      setExtractStatus({ ...statusMap });

      try {
        // 1) Baixar arquivo do Storage
        const { data: blob, error: dlErr } = await supabase.storage
          .from("documentos")
          .download(doc.storagePath);

        if (dlErr || !blob) {
          throw new Error(dlErr?.message || "Download falhou");
        }

        // 2) Converter Blob para File para reusar fileToBase64
        const file = new File([blob], doc.nome, {
          type: blob.type || "application/octet-stream",
        });

        // 3) Processar (extrai texto de PDF ou comprime imagem)
        const caseFile = await fileToBase64(file);
        caseFiles.push(caseFile);

        statusMap[key] = "done";
      } catch (err) {
        console.error(`[DocExtract] Erro em ${doc.nome}:`, err);
        statusMap[key] = "error";
      }

      setExtractStatus({ ...statusMap });
    }

    setExtracting(false);

    if (caseFiles.length > 0) {
      onFilesReady(caseFiles);
    } else {
      setExtractError("Nenhum documento pôde ser processado.");
    }
  }, [docs, onFilesReady]);

  // ---------- Render ----------

  if (loading) {
    return (
      <div className="bg-white border border-st-border rounded-lg p-4">
        <p className="text-sm text-st-muted font-sans animate-pulse">
          Carregando documentos...
        </p>
      </div>
    );
  }

  if (docs.length === 0) {
    return (
      <div className="bg-white border border-st-border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-st-dark font-sans mb-2">
          Documentos do Cliente
        </h3>
        <p className="text-sm text-st-muted font-sans">
          Nenhum documento enviado pelo cliente ainda.
        </p>
        {caso.appsheetTicketId && (
          <p className="text-xs text-st-muted font-sans mt-2">
            Link para envio:{" "}
            <span className="text-st-gold select-all">
              /cliente/{caso.appsheetTicketId}
            </span>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-st-border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-st-dark font-sans">
          Documentos do Cliente ({docs.length})
        </h3>
        {caso.appsheetTicketId && (
          <span className="text-xs text-st-muted font-sans">
            #{caso.appsheetTicketId}
          </span>
        )}
      </div>

      {/* Lista de documentos */}
      <div className="space-y-2">
        {docs.map((doc, i) => {
          const key = doc.id || doc.nome;
          const status = extractStatus[key];

          return (
            <div
              key={key}
              className="flex items-center gap-3 bg-gray-50 rounded px-3 py-2"
            >
              {/* Status de extração */}
              {status && (
                <span className="text-sm shrink-0">
                  {status === "done" && (
                    <span className="text-st-green">✓</span>
                  )}
                  {status === "error" && (
                    <span className="text-st-red">✗</span>
                  )}
                  {status === "extracting" && (
                    <span className="inline-block w-3 h-3 border-2 border-st-gold border-t-transparent rounded-full animate-spin" />
                  )}
                  {status === "pending" && (
                    <span className="text-st-muted">○</span>
                  )}
                </span>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-st-dark font-sans truncate">
                  {doc.nome}
                </p>
                <p className="text-xs text-st-muted font-sans">
                  {TIPO_LABEL[doc.tipo] || doc.tipo}
                  {doc.createdAt && (
                    <span className="ml-2">
                      {new Date(doc.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                </p>
              </div>

              {/* Botão ver */}
              <button
                onClick={() => handleViewDoc(doc, i)}
                disabled={doc.loadingUrl}
                className="text-xs text-st-gold hover:underline font-sans shrink-0 disabled:opacity-50"
              >
                {doc.loadingUrl ? "..." : "Ver"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Botão extrair */}
      <Btn
        variant="gold"
        onClick={handleExtract}
        loading={extracting}
        className="w-full"
      >
        {extracting
          ? "Extraindo dados..."
          : `Extrair dados dos documentos (${docs.length})`}
      </Btn>

      {extractError && (
        <p className="text-xs text-st-red font-sans">{extractError}</p>
      )}
    </div>
  );
}
