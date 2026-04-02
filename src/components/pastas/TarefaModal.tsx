"use client";
import { useState, useEffect } from "react";
import {
  Tarefa,
  TarefaStatus,
  TAREFA_STATUS_LABELS,
  TarefaPrioridade,
  TAREFA_PRIORIDADE_LABELS,
  Usuario,
} from "@/lib/types";
import { saveTarefa, getAllUsuarios } from "@/lib/store";
import Btn from "@/components/Btn";

interface TarefaModalProps {
  tarefa?: Tarefa | null;
  pastaId: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function TarefaModal({
  tarefa,
  pastaId,
  onClose,
  onSaved,
}: TarefaModalProps) {
  const isNew = !tarefa;
  const [form, setForm] = useState<Partial<Tarefa>>(
    tarefa || {
      id: crypto.randomUUID(),
      pastaId,
      natureza: "",
      tipo: "",
      titulo: "",
      descricao: "",
      prazo: null,
      status: "pendente",
      docUrl: "",
      prioridade: "normal",
    }
  );
  const [saving, setSaving] = useState(false);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  useEffect(() => {
    getAllUsuarios().then(setUsuarios);
  }, []);

  function set<K extends keyof Tarefa>(key: K, val: Tarefa[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSave() {
    if (!form.titulo) return;
    setSaving(true);
    try {
      await saveTarefa(form as Tarefa);
      onSaved();
    } catch (err) {
      console.error("[TarefaModal] Erro:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-st-border">
          <h2 className="font-serif text-lg font-bold text-st-dark">
            {isNew ? "Nova Tarefa" : "Editar Tarefa"}
          </h2>
          <button
            onClick={onClose}
            className="text-st-muted hover:text-st-dark text-xl cursor-pointer"
          >
            ×
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Título */}
          <div>
            <label className="block text-xs font-sans text-st-muted mb-1">
              Título *
            </label>
            <input
              type="text"
              value={form.titulo || ""}
              onChange={(e) => set("titulo", e.target.value)}
              className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold"
              autoFocus
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-sans text-st-muted mb-1">
              Descrição
            </label>
            <textarea
              value={form.descricao || ""}
              onChange={(e) => set("descricao", e.target.value)}
              rows={3}
              className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold resize-none"
            />
          </div>

          {/* Tipo + Natureza */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">
                Tipo
              </label>
              <input
                type="text"
                value={form.tipo || ""}
                onChange={(e) => set("tipo", e.target.value)}
                placeholder="Ex: Petição, Análise"
                className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold"
              />
            </div>
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">
                Natureza
              </label>
              <input
                type="text"
                value={form.natureza || ""}
                onChange={(e) => set("natureza", e.target.value)}
                placeholder="Ex: Interno, Externo"
                className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold"
              />
            </div>
          </div>

          {/* Prazo + Prioridade */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">
                Prazo
              </label>
              <input
                type="date"
                value={form.prazo || ""}
                onChange={(e) => set("prazo", e.target.value || null)}
                className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold"
              />
            </div>
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">
                Prioridade
              </label>
              <select
                value={form.prioridade || "normal"}
                onChange={(e) =>
                  set("prioridade", e.target.value as TarefaPrioridade)
                }
                className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold bg-white"
              >
                {Object.entries(TAREFA_PRIORIDADE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Responsável */}
          <div>
            <label className="block text-xs font-sans text-st-muted mb-1">
              Responsável
            </label>
            <select
              value={form.responsavelId || ""}
              onChange={(e) =>
                set("responsavelId", e.target.value || undefined)
              }
              className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold bg-white"
            >
              <option value="">Selecione...</option>
              {usuarios
                .filter((u) => u.ativo)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome}
                  </option>
                ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-sans text-st-muted mb-1">
              Status
            </label>
            <select
              value={form.status || "pendente"}
              onChange={(e) => set("status", e.target.value as TarefaStatus)}
              className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold bg-white"
            >
              {Object.entries(TAREFA_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* Doc URL */}
          <div>
            <label className="block text-xs font-sans text-st-muted mb-1">
              URL do Documento
            </label>
            <input
              type="url"
              value={form.docUrl || ""}
              onChange={(e) => set("docUrl", e.target.value)}
              placeholder="https://..."
              className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-5 py-4 border-t border-st-border">
          <Btn variant="ghost" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn variant="gold" onClick={handleSave} loading={saving}>
            Salvar
          </Btn>
        </div>
      </div>
    </div>
  );
}
