"use client";
import { useState, useEffect, useCallback } from "react";
import {
  WfPatrimonial,
  WfPatrimonialDoc,
  WfPatrimonialAnalise,
  WfPatrimonialSubtarefa,
  WF_PATRIMONIAL_TAREFA_DESCRIPTIONS,
  WfPatrimonialTarefa,
} from "@/lib/types";
import {
  getWfPatrimonialByPasta,
  initWfPatrimonialForPasta,
  getWfPatrimonialDocs,
  getWfPatrimonialAnalises,
  getWfPatrimonialSubtarefas,
} from "@/lib/store";
import WorkflowStepsPatrimonial from "./WorkflowStepsPatrimonial";
import WfStepPatrimonial from "./WfStepPatrimonial";
import WfStepColeta from "./WfStepColeta";
import WfStepAnalise from "./WfStepAnalise";
import WfStepGate from "./WfStepGate";
import WfStepExecucao from "./WfStepExecucao";

interface TabWorkflowPatrimonialProps {
  pastaId: string;
}

export default function TabWorkflowPatrimonial({ pastaId }: TabWorkflowPatrimonialProps) {
  const [steps, setSteps] = useState<WfPatrimonial[]>([]);
  const [docs, setDocs] = useState<WfPatrimonialDoc[]>([]);
  const [analises, setAnalises] = useState<WfPatrimonialAnalise[]>([]);
  const [subtarefas, setSubtarefas] = useState<WfPatrimonialSubtarefa[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let data = await getWfPatrimonialByPasta(pastaId);

      if (data.length === 0) {
        await initWfPatrimonialForPasta(pastaId);
        data = await getWfPatrimonialByPasta(pastaId);
      }

      setSteps(data);

      // Load auxiliary data in parallel
      const [docsData, analisesData, subtarefasData] = await Promise.all([
        getWfPatrimonialDocs(pastaId),
        getWfPatrimonialAnalises(pastaId),
        getWfPatrimonialSubtarefas(pastaId),
      ]);
      setDocs(docsData);
      setAnalises(analisesData);
      setSubtarefas(subtarefasData);

      // Position to first pending step
      const firstPendente = data.findIndex((s) => s.status === "pendente");
      setActiveStepIndex(firstPendente >= 0 ? firstPendente : data.length - 1);
    } catch (err) {
      console.error("[TabWorkflowPatrimonial] Erro:", err);
    } finally {
      setLoading(false);
    }
  }, [pastaId]);

  const reloadAux = useCallback(async () => {
    const [docsData, analisesData, subtarefasData] = await Promise.all([
      getWfPatrimonialDocs(pastaId),
      getWfPatrimonialAnalises(pastaId),
      getWfPatrimonialSubtarefas(pastaId),
    ]);
    setDocs(docsData);
    setAnalises(analisesData);
    setSubtarefas(subtarefasData);
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

  function renderStepContent() {
    const desc =
      WF_PATRIMONIAL_TAREFA_DESCRIPTIONS[activeStep.tarefa as WfPatrimonialTarefa] || "";

    // Step 3 — Coleta
    if (activeStep.tarefa === "3_coleta") {
      return (
        <WfStepColeta
          key={activeStep.id}
          step={activeStep}
          docs={docs}
          phaseDescription={desc}
          onAdvance={load}
          onReload={reloadAux}
        />
      );
    }

    // Step 4 — Análise Técnica (parallel)
    if (activeStep.tarefa === "4_analise") {
      return (
        <WfStepAnalise
          key={activeStep.id}
          step={activeStep}
          analises={analises}
          phaseDescription={desc}
          onAdvance={load}
          onReload={reloadAux}
        />
      );
    }

    // Step 7 — Gate de Aprovação
    if (activeStep.tarefa === "7_gate") {
      return (
        <WfStepGate
          key={activeStep.id}
          step={activeStep}
          phaseDescription={desc}
          onAdvance={load}
          onGoToStep={(idx) => {
            // Reload steps then navigate
            load().then(() => setActiveStepIndex(idx));
          }}
        />
      );
    }

    // Step 8 — Execução (sub-tasks)
    if (activeStep.tarefa === "8_execucao") {
      return (
        <WfStepExecucao
          key={activeStep.id}
          step={activeStep}
          subtarefas={subtarefas}
          phaseDescription={desc}
          isLastStep={false}
          onAdvance={load}
          onReload={reloadAux}
        />
      );
    }

    // Generic steps: 1, 2, 5, 6, 9
    return (
      <WfStepPatrimonial
        key={activeStep.id}
        step={activeStep}
        phaseDescription={desc}
        isLastStep={activeStepIndex === steps.length - 1}
        onAdvance={load}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with progress bar */}
      <div className="bg-white border border-st-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-serif font-bold text-st-dark">
            Planejamento Patrimonial
          </h3>
          {allDone && (
            <span className="text-xs font-sans font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1">
              ✓ Workflow completo
            </span>
          )}
        </div>
        <WorkflowStepsPatrimonial
          steps={steps}
          activeIndex={activeStepIndex}
          onStepClick={setActiveStepIndex}
        />
      </div>

      {/* Active step content */}
      <div className="bg-white border border-st-border rounded-xl p-4 sm:p-5">
        {renderStepContent()}
      </div>
    </div>
  );
}
