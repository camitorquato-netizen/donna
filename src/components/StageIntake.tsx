"use client";
import { useState, useCallback } from "react";
import { Case, CaseFile } from "@/lib/types";
import { downloadPreliminaryDocx } from "@/lib/docxExport";
import Btn from "./Btn";
import IBox from "./IBox";
import MdBox from "./MdBox";
import FileUploader from "./FileUploader";
import DocumentosCliente from "./DocumentosCliente";

interface Props {
  caso: Case;
  loading: boolean;
  error: string | null;
  update: (partial: Partial<Case>) => void;
  runIntake: (transcript: string, files: CaseFile[], previousIntake?: string, meta?: Partial<Case>) => Promise<void>;
  runPreliminary: (transcript: string, meta?: Partial<Case>) => Promise<void>;
  clearError: () => void;
}

export default function StageIntake({
  caso,
  loading,
  error,
  update,
  runIntake,
  runPreliminary,
  clearError,
}: Props) {
  const [transcript, setTranscript] = useState(caso.transcript || "");
  const [files, setFiles] = useState<CaseFile[]>(caso.intakeFiles || []);
  const [clientName, setClientName] = useState(caso.clientName || "");
  const [professional, setProfessional] = useState(caso.professional || "");
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveUrl, setDriveUrl] = useState<string | null>(null);
  const [driveError, setDriveError] = useState<string | null>(null);

  // Quando documentos do Storage são extraídos, adicionar à lista de files
  const handleStorageFiles = useCallback((extracted: CaseFile[]) => {
    setFiles((prev) => [...prev, ...extracted]);
  }, []);

  async function handleProcess() {
    clearError();
    await runIntake(transcript, files, undefined, { clientName, professional });
  }

  async function handlePreliminary() {
    clearError();
    await runPreliminary(transcript, { clientName, professional });
  }

  function handleDownloadDocx() {
    if (caso.preliminaryOutput) {
      downloadPreliminaryDocx(caso.preliminaryOutput, caso.clientName);
    }
  }

  async function handleOpenGoogleDocs() {
    if (!caso.preliminaryOutput) return;
    setDriveLoading(true);
    setDriveError(null);
    setDriveUrl(null);

    try {
      const res = await fetch("/api/drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markdown: caso.preliminaryOutput,
          clientName: caso.clientName,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Erro desconhecido" }));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setDriveUrl(data.url);
      window.open(data.url, "_blank");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      setDriveError(msg);
    } finally {
      setDriveLoading(false);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <IBox type="info" title="Etapa 1 — Intake">
        Cole a transcrição da reunião e anexe documentos do cliente (IRPF, contratos, matrículas).
        A IA vai extrair e organizar todas as informações em 11 seções estruturadas.
      </IBox>

      <div className="space-y-4 sm:space-y-6">
        {/* Info do caso */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-sans text-st-dark mb-1">
              Nome do Cliente
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Ex: João Silva"
              disabled={loading}
              className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm font-sans text-st-dark mb-1">
              Profissional Responsável
            </label>
            <input
              type="text"
              value={professional}
              onChange={(e) => setProfessional(e.target.value)}
              placeholder="Ex: Dra. Maria Silveira"
              disabled={loading}
              className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold disabled:opacity-50"
            />
          </div>
        </div>

        {/* Transcrição */}
        <div>
          <label className="block text-sm font-sans text-st-dark mb-1">
            Transcrição da Reunião
          </label>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Cole aqui a transcrição da reunião (Google Meet, Zoom, Otter.ai, etc.)..."
            disabled={loading}
            className="w-full h-48 sm:h-80 border border-st-border rounded-lg px-3 sm:px-4 py-3 text-sm font-serif leading-relaxed resize-y focus:outline-none focus:border-st-gold disabled:opacity-50"
          />
        </div>

        {/* Documentos enviados pelo cliente via portal */}
        <DocumentosCliente caso={caso} onFilesReady={handleStorageFiles} />

        {/* Upload manual */}
        <div>
          <label className="block text-sm font-sans text-st-dark mb-1">
            Anexar documentos manualmente
          </label>
          <FileUploader
            files={files}
            onFilesChange={setFiles}
            disabled={loading}
          />
        </div>
      </div>

      {error && (
        <IBox type="error" title="Erro">
          {error}
        </IBox>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Btn
          variant="gold"
          onClick={handleProcess}
          loading={loading}
          disabled={!transcript.trim()}
          className="w-full sm:w-auto"
        >
          {loading ? "Processando..." : "Processar Intake"}
        </Btn>
        <Btn
          variant="ghost"
          onClick={handlePreliminary}
          loading={loading}
          disabled={!transcript.trim()}
          className="w-full sm:w-auto border border-st-gold text-st-gold hover:bg-st-gold/10"
        >
          {loading ? "Gerando..." : "Gerar Diagnóstico Preliminar"}
        </Btn>
      </div>

      {/* Diagnóstico Preliminar (se gerado) */}
      {caso.preliminaryOutput && (
        <div className="space-y-4">
          <MdBox
            content={caso.preliminaryOutput}
            title="Diagnóstico Patrimonial Preliminar"
          />
          <div className="flex flex-col sm:flex-row gap-3 items-start">
            <Btn
              variant="ghost"
              onClick={handleDownloadDocx}
              className="w-full sm:w-auto"
            >
              Baixar .docx
            </Btn>
            <Btn
              variant="gold"
              onClick={handleOpenGoogleDocs}
              loading={driveLoading}
              className="w-full sm:w-auto"
            >
              {driveLoading ? "Enviando ao Drive..." : "Abrir no Google Docs"}
            </Btn>
          </div>

          {driveError && (
            <IBox type="error" title="Erro Google Drive">
              {driveError}
            </IBox>
          )}

          {driveUrl && (
            <IBox type="success" title="Google Docs">
              Documento criado com sucesso!{" "}
              <a
                href={driveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-st-gold font-medium"
              >
                Abrir no Google Docs
              </a>
            </IBox>
          )}
        </div>
      )}

      {/* Intake Estruturado (se gerado) */}
      {caso.intakeOutput && (
        <div className="space-y-4">
          <MdBox content={caso.intakeOutput} title="Intake Estruturado" />
          <div className="flex justify-end">
            <Btn variant="green" onClick={() => update({ step: 2 })} className="w-full sm:w-auto">
              Avançar para Validação →
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}
