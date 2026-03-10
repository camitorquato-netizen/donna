"use client";
import { useState } from "react";
import { Case, CaseFile } from "@/lib/types";
import { downloadDocx } from "@/lib/docxExport";
import Btn from "./Btn";
import IBox from "./IBox";
import MdBox from "./MdBox";
import FileUploader from "./FileUploader";

interface Props {
  caso: Case;
  loading: boolean;
  error: string | null;
  update: (partial: Partial<Case>) => void;
  runDiagnosis: (extraInfo?: string, extraFiles?: CaseFile[]) => Promise<void>;
  clearError: () => void;
}

export default function StageDiagnosis({
  caso,
  loading,
  error,
  update,
  runDiagnosis,
  clearError,
}: Props) {
  const [extraInfo, setExtraInfo] = useState(caso.diagExtraInfo || "");
  const [extraFiles, setExtraFiles] = useState<CaseFile[]>([]);

  async function handleGenerate() {
    clearError();
    await runDiagnosis(extraInfo, extraFiles);
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <IBox type="info" title="Etapa 3 — Diagnóstico Patrimonial">
        O diagnóstico será gerado com base no intake aprovado e no foco definido pelo sênior.
      </IBox>

      {caso.caseFocus && (
        <IBox type="gold" title="Foco do Caso">
          {caso.caseFocus}
        </IBox>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-sans font-medium text-st-dark mb-1">
            Informações Extras (opcional)
          </label>
          <textarea
            value={extraInfo}
            onChange={(e) => setExtraInfo(e.target.value)}
            placeholder="Informações adicionais que chegaram após a validação do intake..."
            disabled={loading}
            className="w-full h-24 border border-st-border rounded-lg px-3 sm:px-4 py-3 text-sm font-sans resize-y focus:outline-none focus:border-st-gold disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-sm font-sans font-medium text-st-dark mb-1">
            Documentos Adicionais (opcional)
          </label>
          <FileUploader
            files={extraFiles}
            onFilesChange={setExtraFiles}
            disabled={loading}
          />
        </div>
      </div>

      {error && (
        <IBox type="error" title="Erro">
          {error}
        </IBox>
      )}

      {!caso.diagnosticOutput ? (
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Btn variant="ghost" onClick={() => update({ step: 2 })} className="w-full sm:w-auto">
            ← Voltar
          </Btn>
          <Btn variant="gold" onClick={handleGenerate} loading={loading} className="w-full sm:w-auto">
            {loading ? "Gerando Diagnóstico..." : "Gerar Diagnóstico"}
          </Btn>
        </div>
      ) : (
        <div className="space-y-4">
          <MdBox
            content={caso.diagnosticOutput}
            title="Diagnóstico Patrimonial"
          />
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Btn variant="ghost" onClick={() => update({ step: 2 })} className="w-full sm:w-auto">
              ← Voltar
            </Btn>
            <Btn variant="gold" onClick={handleGenerate} loading={loading} className="w-full sm:w-auto">
              {loading ? "Regenerando..." : "Regenerar Diagnóstico"}
            </Btn>
            <Btn
              variant="ghost"
              onClick={() => downloadDocx(caso.diagnosticOutput, caso.clientName, "diagnostico")}
              className="w-full sm:w-auto"
            >
              Baixar Word
            </Btn>
            <Btn variant="green" onClick={() => update({ step: 4 })} className="w-full sm:w-auto">
              Avançar para Validação →
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}
