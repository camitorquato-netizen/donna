"use client";
import { useState } from "react";
import {
  WfPatrimonial,
  WfPatrimonialAnalise,
  WF_PATRIMONIAL_ANALISE_LABELS,
  WF_PATRIMONIAL_TAREFA_LABELS,
  WfPatrimonialTarefa,
  WfPatrimonialAnaliseTipo,
} from "@/lib/types";
import { saveWfPatrimonial, saveWfPatrimonialAnalise } from "@/lib/store";
import Btn from "@/components/Btn";
import UsuarioSelector from "@/components/UsuarioSelector";

interface Props {
  step: WfPatrimonial;
  analises: WfPatrimonialAnalise[];
  phaseDescription: string;
  onAdvance: () => void;
  onReload: () => void;
}

const BADGE_COLORS: Record<WfPatrimonialAnaliseTipo, string> = {
  tributario: "bg-amber-50 text-amber-700 border-amber-200",
  societario: "bg-blue-50 text-blue-700 border-blue-200",
  familia: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export default function WfStepAnalise({
  step,
  analises,
  phaseDescription,
  onAdvance,
  onReload,
}: Props) {
  const [saving, setSaving] = useState(false);
  const isDone = step.status === "concluido";
  const label = WF_PATRIMONIAL_TAREFA_LABELS[step.tarefa as WfPatrimonialTarefa];
  const concluidos = analises.filter((a) => a.status === "concluido").length;
  const allAnaliseDone = concluidos === 3;

  async function handleConcluir() {
    setSaving(true);
    try {
      await saveWfPatrimonial({ ...step, status: "concluido" });
      onAdvance();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
        <p className="text-xs font-sans text-indigo-800">
          <strong>{label}:</strong> {phaseDescription}
        </p>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-sans text-st-muted">Progresso:</span>
        <span className="text-sm font-sans font-medium text-st-dark">
          {concluidos}/3 concluídos
        </span>
      </div>

      {/* 3 specialist cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {analises.map((analise) => (
          <AnaliseCard
            key={analise.id}
            analise={analise}
            stepDone={isDone}
            onReload={onReload}
          />
        ))}
      </div>

      {!isDone && (
        <div className="flex justify-end">
          <Btn
            variant="gold"
            onClick={handleConcluir}
            loading={saving}
            disabled={!allAnaliseDone}
            className="!px-6"
          >
            {allAnaliseDone
              ? `Concluir ${label} →`
              : `Aguardando ${3 - concluidos} análise(s)`}
          </Btn>
        </div>
      )}

      {isDone && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <p className="text-sm font-sans text-green-800 font-medium">
            ✓ {label} concluída
          </p>
        </div>
      )}
    </div>
  );
}

/* ---- Individual Specialist Card ---- */

function AnaliseCard({
  analise,
  stepDone,
  onReload,
}: {
  analise: WfPatrimonialAnalise;
  stepDone: boolean;
  onReload: () => void;
}) {
  const [obs, setObs] = useState(analise.observacoes || "");
  const [url, setUrl] = useState(analise.url || "");
  const [prazo, setPrazo] = useState(analise.prazo || "");
  const [responsavelId, setResponsavelId] = useState(analise.responsavelId || "");
  const [concluding, setConcluding] = useState(false);
  const done = analise.status === "concluido";
  const disabled = done || stepDone;
  const tipo = analise.tipo as WfPatrimonialAnaliseTipo;

  async function saveFields() {
    await saveWfPatrimonialAnalise({
      ...analise,
      observacoes: obs,
      url,
      prazo: prazo || null,
      responsavelId: responsavelId || undefined,
    });
  }

  async function handleConcluir() {
    setConcluding(true);
    try {
      await saveWfPatrimonialAnalise({
        ...analise,
        status: "concluido",
        observacoes: obs,
        url,
        prazo: prazo || null,
        responsavelId: responsavelId || undefined,
      });
      onReload();
    } finally {
      setConcluding(false);
    }
  }

  return (
    <div
      className={`border rounded-xl p-4 space-y-3 ${
        done
          ? "border-green-200 bg-green-50/30"
          : "border-st-border bg-white"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`text-[10px] font-sans font-medium px-2 py-0.5 rounded-full border ${BADGE_COLORS[tipo]}`}
        >
          {WF_PATRIMONIAL_ANALISE_LABELS[tipo]}
        </span>
        {done && (
          <span className="text-[10px] font-sans text-green-700 font-medium">
            ✓
          </span>
        )}
      </div>

      <UsuarioSelector
        value={responsavelId}
        onChange={(id) => {
          setResponsavelId(id);
          saveWfPatrimonialAnalise({
            ...analise,
            responsavelId: id || undefined,
            observacoes: obs,
            url,
            prazo: prazo || null,
          });
        }}
        label="Responsável"
        disabled={disabled}
      />

      <div>
        <label className="block text-[10px] font-sans text-st-muted mb-1">
          Prazo
        </label>
        <input
          type="date"
          value={prazo}
          onChange={(e) => setPrazo(e.target.value)}
          onBlur={saveFields}
          disabled={disabled}
          className="w-full border border-st-border rounded-lg px-2 py-1.5 text-xs font-sans focus:outline-none focus:border-st-gold disabled:opacity-60 disabled:bg-gray-50"
        />
      </div>

      <div>
        <label className="block text-[10px] font-sans text-st-muted mb-1">
          URL Documentos
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={saveFields}
          disabled={disabled}
          placeholder="https://..."
          className="w-full border border-st-border rounded-lg px-2 py-1.5 text-xs font-sans focus:outline-none focus:border-st-gold disabled:opacity-60 disabled:bg-gray-50"
        />
      </div>

      <div>
        <label className="block text-[10px] font-sans text-st-muted mb-1">
          Observações
        </label>
        <textarea
          value={obs}
          onChange={(e) => setObs(e.target.value)}
          onBlur={saveFields}
          disabled={disabled}
          rows={3}
          placeholder="Parecer, notas..."
          className="w-full border border-st-border rounded-lg px-2 py-1.5 text-xs font-sans focus:outline-none focus:border-st-gold resize-none disabled:opacity-60 disabled:bg-gray-50"
        />
      </div>

      {!disabled && (
        <Btn
          variant="ghost"
          onClick={handleConcluir}
          loading={concluding}
          className="w-full !text-xs"
        >
          Concluir análise ✓
        </Btn>
      )}

      {done && (
        <p className="text-[10px] font-sans text-green-700 text-center font-medium">
          Análise concluída
        </p>
      )}
    </div>
  );
}
