"use client";
import { useState, useCallback } from "react";
import { Case, CaseFile } from "@/lib/types";
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
  clearError: () => void;
}

export default function StageIntake({
  caso,
  loading,
  error,
  update,
  runIntake,
  clearError,
}: Props) {
  const [transcript, setTranscript] = useState(caso.transcript || "");
  const [files, setFiles] = useState<CaseFile[]>(caso.intakeFiles || []);
  const [clientName, setClientName] = useState(caso.clientName || "");
  const [professional, setProfessional] = useState(caso.professional || "");

  // Quando documentos do Storage são extraídos, adicionar à lista de files
  const handleStorageFiles = useCallback((extracted: CaseFile[]) => {
    setFiles((prev) => [...prev, ...extracted]);
  }, []);

  async function handleProcess() {
    clearError();
    await runIntake(transcript, files, undefined, { clientName, professional });
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
      </div>

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
