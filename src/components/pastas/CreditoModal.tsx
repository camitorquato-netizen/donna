"use client";
import { useState } from "react";
import {
  Credito,
  TRIBUTO_OPTIONS,
} from "@/lib/types";
import { saveCredito, initWfRctForCredito } from "@/lib/store";
import Btn from "@/components/Btn";
import UsuarioSelector from "@/components/UsuarioSelector";

interface CreditoModalProps {
  credito?: Credito | null;
  pastaId: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function CreditoModal({
  credito,
  pastaId,
  onClose,
  onSaved,
}: CreditoModalProps) {
  const isNew = !credito;
  const [form, setForm] = useState<Partial<Credito>>(
    credito || {
      id: crypto.randomUUID(),
      pastaId,
      titulo: "",
      tributo: "",
      creditoApresentado: 0,
      creditoValidado: 0,
      saldo: 0,
      fase: "1_analise",
      apresentacaoUrl: "",
      parecerUrl: "",
    }
  );
  const [saving, setSaving] = useState(false);

  function set<K extends keyof Credito>(key: K, val: Credito[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSave() {
    if (!form.titulo || !form.tributo) return;
    setSaving(true);
    try {
      await saveCredito(form as Credito);
      // Se é novo, criar workflow steps
      if (isNew && form.id) {
        await initWfRctForCredito(form.id);
      }
      onSaved();
    } catch (err) {
      console.error("[CreditoModal] Erro:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-st-border">
          <h2 className="font-serif text-lg font-bold text-st-dark">
            {isNew ? "Novo Crédito" : "Editar Crédito"}
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

          {/* Tributo */}
          <div>
            <label className="block text-xs font-sans text-st-muted mb-1">
              Tributo *
            </label>
            <select
              value={form.tributo || ""}
              onChange={(e) => set("tributo", e.target.value)}
              className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold bg-white"
            >
              <option value="">Selecione...</option>
              {TRIBUTO_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Valores */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">
                Apresentado (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.creditoApresentado || ""}
                onChange={(e) =>
                  set("creditoApresentado", parseFloat(e.target.value) || 0)
                }
                className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold"
              />
            </div>
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">
                Validado (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.creditoValidado || ""}
                onChange={(e) =>
                  set("creditoValidado", parseFloat(e.target.value) || 0)
                }
                className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold"
              />
            </div>
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">
                Saldo (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.saldo || ""}
                onChange={(e) =>
                  set("saldo", parseFloat(e.target.value) || 0)
                }
                className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold"
              />
            </div>
          </div>

          {/* Analista */}
          <UsuarioSelector
            value={form.responsavelId || ""}
            onChange={(id) => set("responsavelId", id || undefined)}
            label="Analista"
          />

          {/* URLs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">
                URL Apresentação
              </label>
              <input
                type="url"
                value={form.apresentacaoUrl || ""}
                onChange={(e) => set("apresentacaoUrl", e.target.value)}
                placeholder="https://..."
                className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold"
              />
            </div>
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">
                URL Parecer
              </label>
              <input
                type="url"
                value={form.parecerUrl || ""}
                onChange={(e) => set("parecerUrl", e.target.value)}
                placeholder="https://..."
                className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold"
              />
            </div>
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
