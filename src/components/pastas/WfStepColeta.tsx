"use client";
import { useState } from "react";
import { WfPatrimonial, WfPatrimonialDoc, WF_PATRIMONIAL_TAREFA_LABELS, WfPatrimonialTarefa } from "@/lib/types";
import { saveWfPatrimonial, saveWfPatrimonialDoc, addWfPatrimonialDoc, deleteWfPatrimonialDoc } from "@/lib/store";
import Btn from "@/components/Btn";
import UsuarioSelector from "@/components/UsuarioSelector";

interface Props {
  step: WfPatrimonial;
  docs: WfPatrimonialDoc[];
  phaseDescription: string;
  onAdvance: () => void;
  onReload: () => void;
}

const STATUS_CYCLE: WfPatrimonialDoc["status"][] = ["pendente", "recebido", "validado"];
const STATUS_COLORS: Record<string, string> = {
  pendente: "bg-yellow-50 text-yellow-700 border-yellow-200",
  recebido: "bg-blue-50 text-blue-700 border-blue-200",
  validado: "bg-green-50 text-green-700 border-green-200",
};
const STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  recebido: "Recebido",
  validado: "Validado",
};

export default function WfStepColeta({
  step,
  docs,
  phaseDescription,
  onAdvance,
  onReload,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [newDoc, setNewDoc] = useState("");
  const [obs, setObs] = useState(step.observacoes || "");
  const [responsavelId, setResponsavelId] = useState(step.responsavelId || "");
  const isDone = step.status === "concluido";
  const label = WF_PATRIMONIAL_TAREFA_LABELS[step.tarefa as WfPatrimonialTarefa];

  const validados = docs.filter((d) => d.status === "validado").length;
  const total = docs.length;

  async function handleAddDoc() {
    const nome = newDoc.trim();
    if (!nome) return;
    await addWfPatrimonialDoc(step.pastaId, nome);
    setNewDoc("");
    onReload();
  }

  async function handleCycleStatus(doc: WfPatrimonialDoc) {
    if (isDone) return;
    const idx = STATUS_CYCLE.indexOf(doc.status);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    await saveWfPatrimonialDoc({ ...doc, status: next });
    onReload();
  }

  async function handleDeleteDoc(id: string) {
    if (isDone) return;
    await deleteWfPatrimonialDoc(id);
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
          label="Responsável da Etapa"
          disabled={isDone}
        />
        <div className="flex items-end">
          <div className="text-sm font-sans text-st-muted">
            {total > 0 ? (
              <span>
                <strong className="text-st-dark">{validados}</strong> de{" "}
                <strong className="text-st-dark">{total}</strong> documentos validados
              </span>
            ) : (
              <span>Nenhum documento adicionado</span>
            )}
          </div>
        </div>
      </div>

      {/* Document checklist */}
      <div className="border border-st-border rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-3 py-2 border-b border-st-border">
          <p className="text-xs font-sans font-medium text-st-dark">
            Checklist de Documentos
          </p>
        </div>
        <div className="divide-y divide-st-border">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50"
            >
              <button
                onClick={() => handleCycleStatus(doc)}
                disabled={isDone}
                className={`text-[10px] font-sans font-medium px-2 py-0.5 rounded-full border cursor-pointer disabled:cursor-not-allowed ${STATUS_COLORS[doc.status]}`}
                title="Clique para alterar status"
              >
                {STATUS_LABELS[doc.status]}
              </button>
              <span className="flex-1 text-sm font-sans text-st-dark">
                {doc.nome}
              </span>
              {!isDone && (
                <button
                  onClick={() => handleDeleteDoc(doc.id)}
                  className="text-st-muted hover:text-st-red text-xs cursor-pointer"
                  title="Remover"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {docs.length === 0 && (
            <div className="px-3 py-4 text-center">
              <p className="text-xs font-sans text-st-muted">
                Adicione os documentos necessários abaixo
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add document */}
      {!isDone && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newDoc}
            onChange={(e) => setNewDoc(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddDoc()}
            placeholder="Nome do documento (ex: IRPF últimos 5 anos)"
            className="flex-1 border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold"
          />
          <Btn variant="ghost" onClick={handleAddDoc} className="!px-4">
            + Doc
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
          placeholder="Observações sobre a coleta..."
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
            Concluir {label} →
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
