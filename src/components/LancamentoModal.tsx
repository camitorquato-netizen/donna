"use client";
import { useState } from "react";
import { Lancamento, LANCAMENTO_STATUS_LABELS, LancamentoStatus, PLANO_CONTAS_OPTIONS } from "@/lib/types";
import { saveLancamento } from "@/lib/store";
import Btn from "./Btn";
import ClienteSelector from "./ClienteSelector";

interface LancamentoModalProps {
  lancamento?: Lancamento | null;
  onClose: () => void;
  onSaved: () => void;
  defaultPastaId?: string;
  defaultClienteId?: string;
}

export default function LancamentoModal({
  lancamento,
  onClose,
  onSaved,
  defaultPastaId,
  defaultClienteId,
}: LancamentoModalProps) {
  const isNew = !lancamento;
  const [form, setForm] = useState<Partial<Lancamento>>(
    lancamento || {
      id: crypto.randomUUID(),
      tipo: "a_receber",
      valor: 0,
      valorPago: 0,
      repasseParceiro: 0,
      planoContas: "honorarios",
      boletoUrl: "",
      descricao: "",
      status: "pendente",
      pastaId: defaultPastaId || undefined,
      clienteId: defaultClienteId || undefined,
    }
  );
  const [saving, setSaving] = useState(false);

  function set<K extends keyof Lancamento>(key: K, val: Lancamento[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSave() {
    if (!form.tipo || !form.valor) return;
    setSaving(true);
    try {
      await saveLancamento(form as Lancamento);
      onSaved();
    } catch (err) {
      console.error("[Modal] Erro:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-st-border">
          <h2 className="font-serif text-lg font-bold text-st-dark">
            {isNew ? "Novo Lançamento" : "Editar Lançamento"}
          </h2>
          <button
            onClick={onClose}
            className="text-st-muted hover:text-st-dark text-xl cursor-pointer"
          >
            ×
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Tipo */}
          <div className="flex gap-3">
            {(["a_receber", "a_pagar"] as const).map((t) => (
              <label
                key={t}
                className={`flex-1 text-center py-2 rounded-lg border text-sm font-sans cursor-pointer transition-colors ${
                  form.tipo === t
                    ? t === "a_receber"
                      ? "bg-st-green/10 border-st-green text-st-green"
                      : "bg-st-red/10 border-st-red text-st-red"
                    : "border-st-border text-st-muted hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="tipo"
                  value={t}
                  checked={form.tipo === t}
                  onChange={() => set("tipo", t)}
                  className="sr-only"
                />
                {t === "a_receber" ? "A Receber" : "A Pagar"}
              </label>
            ))}
          </div>

          {/* Cliente */}
          <ClienteSelector
            value={form.clienteId || ""}
            onChange={(id) => set("clienteId", id)}
          />

          {/* Descrição */}
          <div>
            <label className="block text-xs font-sans text-st-muted mb-1">
              Descrição
            </label>
            <input
              type="text"
              value={form.descricao || ""}
              onChange={(e) => set("descricao", e.target.value)}
              className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold"
            />
          </div>

          {/* Valor + Vencimento */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">
                Valor (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.valor || ""}
                onChange={(e) => set("valor", parseFloat(e.target.value) || 0)}
                className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold"
              />
            </div>
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">
                Vencimento
              </label>
              <input
                type="date"
                value={form.dataVencimento || ""}
                onChange={(e) => set("dataVencimento", e.target.value || null)}
                className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold"
              />
            </div>
          </div>

          {/* Plano de Contas */}
          <div>
            <label className="block text-xs font-sans text-st-muted mb-1">
              Plano de Contas
            </label>
            <select
              value={form.planoContas || "honorarios"}
              onChange={(e) => set("planoContas", e.target.value)}
              className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold bg-white"
            >
              {PLANO_CONTAS_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1).replace("_", " ")}
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
              onChange={(e) => set("status", e.target.value as LancamentoStatus)}
              className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold bg-white"
            >
              {Object.entries(LANCAMENTO_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
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
