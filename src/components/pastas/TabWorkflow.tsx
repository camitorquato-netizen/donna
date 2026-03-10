"use client";
import { useState, useEffect, useCallback } from "react";
import { Credito, WfRct, Ponto } from "@/lib/types";
import {
  getCreditosByPasta,
  getWfRctByCredito,
  getPontosByCredito,
} from "@/lib/store";
import Badge from "@/components/Badge";
import WorkflowSteps from "./WorkflowSteps";
import WfStepLevantamento from "./WfStepLevantamento";
import WfStepRevisao from "./WfStepRevisao";
import WfStepApresentacao from "./WfStepApresentacao";
import WfStepRetificacoes from "./WfStepRetificacoes";
import WfStepCompensacoes from "./WfStepCompensacoes";
import WfStepFaturamento from "./WfStepFaturamento";

interface TabWorkflowProps {
  pastaId: string;
}

interface CreditoWorkflow {
  credito: Credito;
  steps: WfRct[];
  pontos: Ponto[];
}

export default function TabWorkflow({ pastaId }: TabWorkflowProps) {
  const [data, setData] = useState<CreditoWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCreditoIndex, setSelectedCreditoIndex] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const creditos = await getCreditosByPasta(pastaId);
      const items: CreditoWorkflow[] = [];
      for (const credito of creditos) {
        const [steps, pontos] = await Promise.all([
          getWfRctByCredito(credito.id),
          getPontosByCredito(credito.id),
        ]);
        items.push({ credito, steps, pontos });
      }
      setData(items);

      // Set active step to first pendente
      if (items.length > 0) {
        const idx = selectedCreditoIndex < items.length ? selectedCreditoIndex : 0;
        const firstPendente = items[idx].steps.findIndex(
          (s) => s.status === "pendente"
        );
        setActiveStepIndex(firstPendente >= 0 ? firstPendente : items[idx].steps.length - 1);
      }
    } catch (err) {
      console.error("[TabWorkflow] Erro:", err);
    } finally {
      setLoading(false);
    }
  }, [pastaId, selectedCreditoIndex]);

  useEffect(() => {
    load();
  }, [load]);

  function handleAdvance() {
    load();
  }

  function handleReload() {
    load();
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-st-muted font-sans animate-pulse">
          Carregando workflow...
        </p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white border border-st-border rounded-xl p-8 text-center">
        <p className="text-sm text-st-muted font-sans">
          Nenhum crédito cadastrado. Crie créditos na aba &quot;Créditos&quot;
          primeiro.
        </p>
      </div>
    );
  }

  const current = data[selectedCreditoIndex] || data[0];
  const { credito, steps, pontos } = current;
  const activeStep = steps[activeStepIndex];

  function renderStepContent() {
    if (!activeStep) return null;

    switch (activeStepIndex) {
      case 0:
        return (
          <WfStepLevantamento
            step={activeStep}
            creditoId={credito.id}
            pontos={pontos}
            onAdvance={handleAdvance}
            onReload={handleReload}
          />
        );
      case 1:
        return (
          <WfStepRevisao
            step={activeStep}
            creditoId={credito.id}
            pontos={pontos}
            onAdvance={handleAdvance}
            onReload={handleReload}
          />
        );
      case 2:
        return (
          <WfStepApresentacao
            step={activeStep}
            creditoId={credito.id}
            pontos={pontos}
            onAdvance={handleAdvance}
            onReload={handleReload}
          />
        );
      case 3:
        return (
          <WfStepRetificacoes
            step={activeStep}
            onAdvance={handleAdvance}
          />
        );
      case 4:
        return (
          <WfStepCompensacoes
            step={activeStep}
            credito={credito}
            onAdvance={handleAdvance}
          />
        );
      case 5:
        return (
          <WfStepFaturamento
            step={activeStep}
            onAdvance={handleAdvance}
          />
        );
      default:
        return null;
    }
  }

  return (
    <div className="space-y-4">
      {/* Seletor de crédito (quando há múltiplos) */}
      {data.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {data.map((item, idx) => (
            <button
              key={item.credito.id}
              onClick={() => {
                setSelectedCreditoIndex(idx);
                const fp = item.steps.findIndex((s) => s.status === "pendente");
                setActiveStepIndex(fp >= 0 ? fp : item.steps.length - 1);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-sans font-medium transition-colors cursor-pointer whitespace-nowrap ${
                idx === selectedCreditoIndex
                  ? "bg-st-gold text-white"
                  : "bg-white border border-st-border text-st-muted hover:text-st-dark"
              }`}
            >
              {item.credito.titulo}
            </button>
          ))}
        </div>
      )}

      {/* Header do crédito */}
      <div className="bg-white border border-st-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="font-serif font-bold text-st-dark">{credito.titulo}</h3>
          <Badge color="dark">{credito.tributo}</Badge>
        </div>

        {/* Steps navigator */}
        <WorkflowSteps
          steps={steps}
          activeIndex={activeStepIndex}
          onStepClick={setActiveStepIndex}
        />
      </div>

      {/* Step Content */}
      <div className="bg-white border border-st-border rounded-xl p-4 sm:p-5">
        {renderStepContent()}
      </div>
    </div>
  );
}
