"use client";
import { useState } from "react";
import { WfPatrimonial, WF_PATRIMONIAL_TAREFA_LABELS, WfPatrimonialTarefa } from "@/lib/types";
import { saveWfPatrimonial } from "@/lib/store";
import Btn from "@/components/Btn";

interface Props {
  step: WfPatrimonial;
  phaseDescription: string;
  onAdvance: () => void;
  onGoToStep: (index: number) => void;
}

export default function WfStepGate({
  step,
  phaseDescription,
  onAdvance,
  onGoToStep,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [obs, setObs] = useState(step.observacoes || "");
  const isDone = step.status === "concluido";
  const label = WF_PATRIMONIAL_TAREFA_LABELS[step.tarefa as WfPatrimonialTarefa];

  async function saveObs() {
    await saveWfPatrimonial({ ...step, observacoes: obs });
  }

  async function handleAprovar() {
    setSaving(true);
    try {
      await saveWfPatrimonial({
        ...step,
        status: "concluido",
        decisao: "aprovado",
        observacoes: obs,
      });
      onAdvance();
    } finally {
      setSaving(false);
    }
  }

  async function handleRevisao() {
    setSaving(true);
    try {
      await saveWfPatrimonial({
        ...step,
        decisao: "revisao",
        revisoes: step.revisoes + 1,
        observacoes: obs,
      });
      // Go back to step 5 (Consolidação) — index 4
      onGoToStep(4);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <p className="text-xs font-sans text-amber-800">
          <strong>{label}:</strong> {phaseDescription}
        </p>
      </div>

      {step.revisoes > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <p className="text-xs font-sans text-orange-700">
            Revisão #{step.revisoes} — O plano já foi revisado{" "}
            {step.revisoes} vez{step.revisoes > 1 ? "es" : ""}.
          </p>
        </div>
      )}

      <div>
        <label className="block text-xs font-sans text-st-muted mb-1">
          Observações / Motivo
        </label>
        <textarea
          value={obs}
          onChange={(e) => setObs(e.target.value)}
          onBlur={saveObs}
          disabled={isDone}
          rows={4}
          placeholder="Motivo da aprovação ou pontos a revisar..."
          className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold resize-none disabled:opacity-60 disabled:bg-gray-50"
        />
      </div>

      {!isDone && (
        <div className="flex flex-col sm:flex-row gap-3">
          <Btn
            variant="gold"
            onClick={handleAprovar}
            loading={saving}
            className="flex-1 !px-6"
          >
            ✓ Aprovar Plano
          </Btn>
          <Btn
            variant="ghost"
            onClick={handleRevisao}
            loading={saving}
            className="flex-1 !px-6"
          >
            ↩ Solicitar Revisão
          </Btn>
        </div>
      )}

      {isDone && step.decisao === "aprovado" && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <p className="text-sm font-sans text-green-800 font-medium">
            ✓ Plano aprovado pelo cliente
          </p>
        </div>
      )}
    </div>
  );
}
