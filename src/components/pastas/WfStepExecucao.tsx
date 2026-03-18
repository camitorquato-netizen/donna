"use client";
import { useState } from "react";
import {
  WfPatrimonial,
  WfPatrimonialSubtarefa,
  WF_PATRIMONIAL_TAREFA_LABELS,
  WfPatrimonialTarefa,
} from "@/lib/types";
import {
  saveWfPatrimonial,
  saveWfPatrimonialSubtarefa,
  addWfPatrimonialSubtarefa,
  deleteWfPatrimonialSubtarefa,
} from "@/lib/store";
import Btn from "@/components/Btn";
import UsuarioSelector from "@/components/UsuarioSelector";

interface Props {
  step: WfPatrimonial;
  subtarefas: WfPatrimonialSubtarefa[];
  phaseDescription: string;
  isLastStep: boolean;
  onAdvance: () => void;
  onReload: () => void;
}

export default function WfStepExecucao({
  step,
  subtarefas,
  phaseDescription,
  isLastStep,
  onAdvance,
  onReload,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [newDesc, setNewDesc] = useState("");
  const [obs, setObs] = useState(step.observacoes || "");
  const [responsavelId, setResponsavelId] = useState(step.responsavelId || "");
  const isDone = step.status === "concluido";
  const label = WF_PATRIMONIAL_TAREFA_LABELS[step.tarefa as WfPatrimonialTarefa];

  const concluidas = subtarefas.filter((s) => s.status === "concluido").length;
  const total = subtarefas.length;

  async function handleAddSubtarefa() {
    const desc = newDesc.trim();
    if (!desc) return;
    await addWfPatrimonialSubtarefa(step.pastaId, desc);
    setNewDesc("");
    onReload();
  }

  async function handleToggleSubtarefa(sub: WfPatrimonialSubtarefa) {
    if (isDone) return;
    const newStatus = sub.status === "concluido" ? "pendente" : "concluido";
    await saveWfPatrimonialSubtarefa({ ...sub, status: newStatus });
    onReload();
  }

  async function handleDeleteSubtarefa(id: string) {
    if (isDone) return;
    await deleteWfPatrimonialSubtarefa(id);
    onReload();
  }

  async function saveStepFields() {
    await saveWfPatrimonial({
      ...step,
      observacoes: obs,
      responsavelId: responsavelId || undefined,
    });
  }

  async function handleConcluir() {
    setSaving(true);
    try {
      await saveWfPatrimonial({
        ...step,
        status: "concluido",
        observacoes: obs,
        responsavelId: responsavelId || undefined,
      });
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <UsuarioSelector
          value={responsavelId}
          onChange={(id) => {
            setResponsavelId(id);
            saveWfPatrimonial({
              ...step,
              responsavelId: id || undefined,
              observacoes: obs,
            });
          }}
          label="Responsável Geral"
          disabled={isDone}
        />
        <div className="flex items-end">
          <div className="text-sm font-sans text-st-muted">
            {total > 0 ? (
              <span>
                <strong className="text-st-dark">{concluidas}</strong> de{" "}
                <strong className="text-st-dark">{total}</strong> sub-tarefas concluídas
              </span>
            ) : (
              <span>Nenhuma sub-tarefa adicionada</span>
            )}
          </div>
        </div>
      </div>

      {/* Sub-tasks list */}
      <div className="border border-st-border rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-3 py-2 border-b border-st-border">
          <p className="text-xs font-sans font-medium text-st-dark">
            Sub-tarefas de Execução
          </p>
        </div>
        <div className="divide-y divide-st-border">
          {subtarefas.map((sub) => (
            <SubtarefaRow
              key={sub.id}
              sub={sub}
              disabled={isDone}
              onToggle={() => handleToggleSubtarefa(sub)}
              onDelete={() => handleDeleteSubtarefa(sub.id)}
              onReload={onReload}
            />
          ))}
          {subtarefas.length === 0 && (
            <div className="px-3 py-4 text-center">
              <p className="text-xs font-sans text-st-muted">
                Adicione as sub-tarefas de execução abaixo
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add sub-task */}
      {!isDone && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddSubtarefa()}
            placeholder="Descrição da sub-tarefa (ex: Abertura de holding)"
            className="flex-1 border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold"
          />
          <Btn variant="ghost" onClick={handleAddSubtarefa} className="!px-4">
            + Tarefa
          </Btn>
        </div>
      )}

      {/* Observações */}
      <div>
        <label className="block text-xs font-sans text-st-muted mb-1">
          Observações
        </label>
        <textarea
          value={obs}
          onChange={(e) => setObs(e.target.value)}
          onBlur={saveStepFields}
          disabled={isDone}
          rows={3}
          placeholder="Observações da execução..."
          className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold resize-none disabled:opacity-60 disabled:bg-gray-50"
        />
      </div>

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
            ✓ {label} concluída
          </p>
        </div>
      )}
    </div>
  );
}

/* ---- Individual sub-task row ---- */

function SubtarefaRow({
  sub,
  disabled,
  onToggle,
  onDelete,
  onReload,
}: {
  sub: WfPatrimonialSubtarefa;
  disabled: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onReload: () => void;
}) {
  const [responsavelId, setResponsavelId] = useState(sub.responsavelId || "");
  const [prazo, setPrazo] = useState(sub.prazo || "");
  const done = sub.status === "concluido";

  async function saveSub() {
    await saveWfPatrimonialSubtarefa({
      ...sub,
      responsavelId: responsavelId || undefined,
      prazo: prazo || null,
    });
  }

  return (
    <div className="px-3 py-2.5 hover:bg-gray-50">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggle}
          disabled={disabled}
          className={`w-5 h-5 rounded border flex items-center justify-center text-xs shrink-0 cursor-pointer disabled:cursor-not-allowed ${
            done
              ? "bg-st-gold border-st-gold text-white"
              : "border-st-border bg-white"
          }`}
        >
          {done && "✓"}
        </button>
        <span
          className={`flex-1 text-sm font-sans ${
            done ? "text-st-muted line-through" : "text-st-dark"
          }`}
        >
          {sub.descricao}
        </span>
        {!disabled && (
          <button
            onClick={onDelete}
            className="text-st-muted hover:text-st-red text-xs cursor-pointer"
            title="Remover"
          >
            ✕
          </button>
        )}
      </div>
      <div className="flex gap-3 mt-2 ml-8">
        <div className="flex-1 max-w-[200px]">
          <UsuarioSelector
            value={responsavelId}
            onChange={(id) => {
              setResponsavelId(id);
              saveWfPatrimonialSubtarefa({
                ...sub,
                responsavelId: id || undefined,
                prazo: prazo || null,
              });
            }}
            label=""
            disabled={disabled}
          />
        </div>
        <div>
          <input
            type="date"
            value={prazo}
            onChange={(e) => setPrazo(e.target.value)}
            onBlur={saveSub}
            disabled={disabled}
            className="border border-st-border rounded-lg px-2 py-1 text-xs font-sans focus:outline-none focus:border-st-gold disabled:opacity-60 disabled:bg-gray-50"
          />
        </div>
      </div>
    </div>
  );
}
