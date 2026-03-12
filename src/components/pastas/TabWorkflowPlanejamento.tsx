"use client";
import { useState, useEffect, useCallback } from "react";
import { WfPlanejamento, WF_PLANEJAMENTO_TAREFA_DESCRIPTIONS, WfPlanejamentoTarefa } from "@/lib/types";
import { getWfPlanejamentoByPasta, initWfPlanejamentoForPasta } from "@/lib/store";
import WorkflowStepsPlanejamento from "./WorkflowStepsPlanejamento";
import WfStepPlanejamento from "./WfStepPlanejamento";

interface TabWorkflowPlanejamentoProps {
  pastaId: string;
}

export default function TabWorkflowPlanejamento({ pastaId }: TabWorkflowPlanejamentoProps) {
  const [steps, setSteps] = useState<WfPlanejamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let data = await getWfPlanejamentoByPasta(pastaId);

      // Auto-init: se nenhum step existe, criar os 6
      if (data.length === 0) {
        await initWfPlanejamentoForPasta(pastaId);
        data = await getWfPlanejamentoByPasta(pastaId);
      }

      setSteps(data);

      // Posicionar na primeira etapa pendente
      const firstPendente = data.findIndex((s) => s.status === "pendente");
      setActiveStepIndex(firstPendente >= 0 ? firstPendente : data.length - 1);
    } catch (err) {
      console.error("[TabWorkflowPlanejamento] Erro:", err);
    } finally {
      setLoading(false);
    }
  }, [pastaId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-st-muted font-sans animate-pulse">
          Carregando workflow...
        </p>
      </div>
    );
  }

  if (steps.length === 0) {
    return (
      <div className="bg-white border border-st-border rounded-xl p-8 text-center">
        <p className="text-sm text-st-muted font-sans">
          Erro ao inicializar workflow. Recarregue a página.
        </p>
      </div>
    );
  }

  const activeStep = steps[activeStepIndex];
  const allDone = steps.every((s) => s.status === "concluido");

  return (
    <div className="space-y-4">
      {/* Header com progress bar */}
      <div className="bg-white border border-st-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-serif font-bold text-st-dark">
            Planejamento Tributário
          </h3>
          {allDone && (
            <span className="text-xs font-sans font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1">
              ✓ Workflow completo
            </span>
          )}
        </div>
        <WorkflowStepsPlanejamento
          steps={steps}
          activeIndex={activeStepIndex}
          onStepClick={setActiveStepIndex}
        />
      </div>

      {/* Conteúdo da etapa ativa */}
      <div className="bg-white border border-st-border rounded-xl p-4 sm:p-5">
        <WfStepPlanejamento
          key={activeStep.id}
          step={activeStep}
          phaseDescription={
            WF_PLANEJAMENTO_TAREFA_DESCRIPTIONS[activeStep.tarefa as WfPlanejamentoTarefa] || ""
          }
          isLastStep={activeStepIndex === steps.length - 1}
          onAdvance={load}
        />
      </div>
    </div>
  );
}
