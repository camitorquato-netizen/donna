"use client";
import { useState } from "react";
import { Case, CaseFile } from "@/lib/types";
import Btn from "./Btn";
import IBox from "./IBox";
import MdBox from "./MdBox";

interface Props {
  caso: Case;
  loading: boolean;
  error: string | null;
  update: (partial: Partial<Case>) => void;
  runDiagnosis: (extraInfo?: string, extraFiles?: CaseFile[]) => Promise<void>;
  approveDiagnosis: () => void;
  clearError: () => void;
}

export default function StageValidationB({
  caso,
  loading,
  error,
  update,
  runDiagnosis,
  approveDiagnosis,
  clearError,
}: Props) {
  const [notes, setNotes] = useState(caso.diagnosticNotes || "");

  function handleApprove() {
    update({ diagnosticNotes: notes });
    approveDiagnosis();
  }

  async function handleRegen() {
    clearError();
    update({ diagnosticNotes: notes });
    await runDiagnosis();
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <IBox type="gold" title="Etapa 4 — Validação do Diagnóstico">
        Revise o diagnóstico completo. Adicione direcionamentos para a proposta de projetos.
      </IBox>

      <MdBox
        content={caso.diagnosticOutput}
        title="Diagnóstico Patrimonial"
      />

      <div>
        <label className="block text-sm font-sans font-medium text-st-dark mb-1">
          Direcionamentos para a Proposta
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder='Ex: "Priorizar holding patrimonial e planejamento sucessório. Postergar reorganização societária."'
          className="w-full h-24 border border-st-border rounded-lg px-3 sm:px-4 py-3 text-sm font-sans resize-y focus:outline-none focus:border-st-gold"
        />
      </div>

      {error && (
        <IBox type="error" title="Erro">
          {error}
        </IBox>
      )}

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <Btn variant="ghost" onClick={() => update({ step: 3 })} className="w-full sm:w-auto">
          ← Voltar
        </Btn>
        <Btn variant="gold" onClick={handleRegen} loading={loading} className="w-full sm:w-auto">
          {loading ? "Regenerando..." : "Regenerar Diagnóstico"}
        </Btn>
        <Btn variant="green" onClick={handleApprove} className="w-full sm:w-auto">
          Aprovar e Avançar →
        </Btn>
      </div>
    </div>
  );
}
