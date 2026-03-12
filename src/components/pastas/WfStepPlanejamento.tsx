"use client";
import { useState } from "react";
import { WfPlanejamento, WF_PLANEJAMENTO_TAREFA_LABELS, WfPlanejamentoTarefa } from "@/lib/types";
import { saveWfPlanejamento } from "@/lib/store";
import Btn from "@/components/Btn";
import UsuarioSelector from "@/components/UsuarioSelector";

interface Props {
  step: WfPlanejamento;
  phaseDescription: string;
  isLastStep: boolean;
  onAdvance: () => void;
}

export default function WfStepPlanejamento({
  step,
  phaseDescription,
  isLastStep,
  onAdvance,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [obs, setObs] = useState(step.observacoes || "");
  const [url, setUrl] = useState(step.url || "");
  const [prompt, setPrompt] = useState(step.prompt || "");
  const [prazo, setPrazo] = useState(step.prazo || "");
  const [responsavelId, setResponsavelId] = useState(step.responsavelId || "");
  const isDone = step.status === "concluido";
  const label = WF_PLANEJAMENTO_TAREFA_LABELS[step.tarefa as WfPlanejamentoTarefa];

  async function saveStepFields() {
    await saveWfPlanejamento({
      ...step,
      observacoes: obs,
      url,
      prompt,
      prazo: prazo || null,
      responsavelId: responsavelId || undefined,
    });
  }

  async function handleConcluir() {
    setSaving(true);
    try {
      await saveWfPlanejamento({
        ...step,
        status: "concluido",
        observacoes: obs,
        url,
        prompt,
        prazo: prazo || null,
        responsavelId: responsavelId || undefined,
      });
      onAdvance();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Descrição da fase */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
        <p className="text-xs font-sans text-indigo-800">
          <strong>{label}:</strong> {phaseDescription}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Responsável */}
        <div>
          <UsuarioSelector
            value={responsavelId}
            onChange={(id) => {
              setResponsavelId(id);
              saveWfPlanejamento({
                ...step,
                responsavelId: id || undefined,
                observacoes: obs,
                url,
                prompt,
                prazo: prazo || null,
              });
            }}
            label="Responsável da Etapa"
            disabled={isDone}
          />
        </div>

        {/* Prazo */}
        <div>
          <label className="block text-xs font-sans text-st-muted mb-1">
            Prazo
          </label>
          <input
            type="date"
            value={prazo}
            onChange={(e) => setPrazo(e.target.value)}
            onBlur={saveStepFields}
            disabled={isDone}
            className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold disabled:opacity-60 disabled:bg-gray-50"
          />
        </div>
      </div>

      {/* Documentos */}
      <div>
        <label className="block text-xs font-sans text-st-muted mb-1">
          URL Documentos
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={saveStepFields}
          disabled={isDone}
          placeholder="https://drive.google.com/..."
          className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold disabled:opacity-60 disabled:bg-gray-50"
        />
      </div>

      {/* Prompt IA */}
      <div>
        <label className="block text-xs font-sans text-st-muted mb-1">
          Prompt IA
          <span className="text-[10px] text-st-muted ml-1">(para uso futuro com inteligência artificial)</span>
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onBlur={saveStepFields}
          disabled={isDone}
          rows={3}
          placeholder="Instruções para análise por IA nesta etapa..."
          className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold resize-none disabled:opacity-60 disabled:bg-gray-50"
        />
      </div>

      {/* Observações / Notas */}
      <div>
        <label className="block text-xs font-sans text-st-muted mb-1">
          Observações / Notas
        </label>
        <textarea
          value={obs}
          onChange={(e) => setObs(e.target.value)}
          onBlur={saveStepFields}
          disabled={isDone}
          rows={4}
          placeholder="Notas, anotações e observações desta etapa..."
          className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold resize-none disabled:opacity-60 disabled:bg-gray-50"
        />
      </div>

      {/* Concluir */}
      {!isDone && (
        <div className="flex justify-end">
          <Btn
            variant="gold"
            onClick={handleConcluir}
            loading={saving}
            className="!px-6"
          >
            {isLastStep ? "Concluir Workflow ✓" : `Concluir ${label} →`}
          </Btn>
        </div>
      )}

      {isDone && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <p className="text-sm font-sans text-green-800 font-medium">
            ✓ {label} concluído
          </p>
        </div>
      )}
    </div>
  );
}
