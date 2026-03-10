"use client";
import { Case } from "@/lib/types";
import { downloadDocx } from "@/lib/docxExport";
import Btn from "./Btn";
import IBox from "./IBox";
import MdBox from "./MdBox";

interface Props {
  caso: Case;
  loading: boolean;
  error: string | null;
  update: (partial: Partial<Case>) => void;
  runProposal: () => Promise<void>;
  clearError: () => void;
}

export default function StageProposal({
  caso,
  loading,
  error,
  update,
  runProposal,
  clearError,
}: Props) {
  async function handleGenerate() {
    clearError();
    await runProposal();
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <IBox type="info" title="Etapa 5 — Proposta de Projetos">
        A IA gerará uma proposta de projetos jurídicos com base no diagnóstico aprovado.
      </IBox>

      {caso.diagnosticNotes && (
        <IBox type="gold" title="Direcionamentos do Sênior">
          {caso.diagnosticNotes}
        </IBox>
      )}

      {error && (
        <IBox type="error" title="Erro">
          {error}
        </IBox>
      )}

      {!caso.proposalOutput ? (
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Btn variant="ghost" onClick={() => update({ step: 4 })} className="w-full sm:w-auto">
            ← Voltar
          </Btn>
          <Btn variant="gold" onClick={handleGenerate} loading={loading} className="w-full sm:w-auto">
            {loading ? "Gerando Proposta..." : "Gerar Proposta"}
          </Btn>
        </div>
      ) : (
        <div className="space-y-4">
          <MdBox content={caso.proposalOutput} title="Proposta de Projetos" />
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Btn variant="ghost" onClick={() => update({ step: 4 })} className="w-full sm:w-auto">
              ← Voltar
            </Btn>
            <Btn variant="gold" onClick={handleGenerate} loading={loading} className="w-full sm:w-auto">
              {loading ? "Regenerando..." : "Regenerar Proposta"}
            </Btn>
            <Btn
              variant="ghost"
              onClick={() => downloadDocx(caso.proposalOutput, caso.clientName, "proposta")}
              className="w-full sm:w-auto"
            >
              Baixar Word
            </Btn>
            <Btn variant="green" onClick={() => update({ step: 6 })} className="w-full sm:w-auto">
              Avançar para Slides →
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}
