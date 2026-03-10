"use client";
import { useState, useEffect } from "react";
import { ControleRct, TRIBUTO_OPTIONS } from "@/lib/types";
import { saveControleRct, saveLancamento, updateCreditoSaldo } from "@/lib/store";
import Btn from "@/components/Btn";

interface CompensacaoModalProps {
  compensacao?: ControleRct | null;
  creditoId: string;
  pastaId: string;
  clienteId: string;
  percentualHonorarios: number;
  onClose: () => void;
  onSaved: () => void;
}

export default function CompensacaoModal({
  compensacao,
  creditoId,
  pastaId,
  clienteId,
  percentualHonorarios,
  onClose,
  onSaved,
}: CompensacaoModalProps) {
  const isNew = !compensacao;
  const [form, setForm] = useState<Partial<ControleRct>>(
    compensacao || {
      id: crypto.randomUUID(),
      creditoId,
      valorPrincipal: 0,
      selic: 0,
      valorCompensado: 0,
      tributoCompensado: "",
      dataCompensacao: null,
      formaUtilizacao: "",
      comprovantesUrl: "",
      honorariosPercentual: percentualHonorarios,
      boletoValor: 0,
      perdcompWeb: "",
    }
  );
  const [saving, setSaving] = useState(false);

  // Auto-fill honorariosPercentual from contrato on new compensações
  useEffect(() => {
    if (isNew && percentualHonorarios > 0) {
      setForm((prev) => ({
        ...prev,
        honorariosPercentual: percentualHonorarios,
      }));
    }
  }, [isNew, percentualHonorarios]);

  function set<K extends keyof ControleRct>(key: K, val: ControleRct[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: val };
      // Auto-calc boletoValor when valorCompensado or honorariosPercentual changes
      if (key === "valorCompensado" || key === "honorariosPercentual") {
        const vc = key === "valorCompensado" ? (val as number) : (prev.valorCompensado ?? 0);
        const hp = key === "honorariosPercentual" ? (val as number) : (prev.honorariosPercentual ?? 0);
        next.boletoValor = parseFloat((vc * hp).toFixed(2));
      }
      return next;
    });
  }

  function formatPercent(val: number): string {
    return (val * 100).toFixed(0);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveControleRct(form as ControleRct);

      // Auto-create lancamento a_receber for the honorários
      if ((form.boletoValor ?? 0) > 0) {
        const lancamento = {
          id: crypto.randomUUID(),
          clienteId,
          pastaId,
          creditoId,
          tipo: "a_receber" as const,
          valor: form.boletoValor ?? 0,
          dataVencimento: form.dataCompensacao || null,
          valorPago: 0,
          dataPagamento: null,
          planoContas: "honorarios",
          boletoUrl: "",
          descricao: `Honorários compensação ${form.tributoCompensado || ""} - ${form.valorCompensado?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) || ""}`.trim(),
          repasseParceiro: 0,
          status: "pendente" as const,
        };
        await saveLancamento(lancamento);
      }

      // Auto-update crédito saldo
      await updateCreditoSaldo(creditoId);

      onSaved();
    } catch (err) {
      console.error("[CompensacaoModal] Erro:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-st-border">
          <h2 className="font-serif text-lg font-bold text-st-dark">
            {isNew ? "Nova Compensação" : "Editar Compensação"}
          </h2>
          <button
            onClick={onClose}
            className="text-st-muted hover:text-st-dark text-xl cursor-pointer"
          >
            ×
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Valores */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">
                Valor Principal (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.valorPrincipal || ""}
                onChange={(e) =>
                  set("valorPrincipal", parseFloat(e.target.value) || 0)
                }
                placeholder="0.00"
                className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold"
              />
            </div>
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">
                SELIC (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.selic || ""}
                onChange={(e) =>
                  set("selic", parseFloat(e.target.value) || 0)
                }
                placeholder="0.00"
                className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold"
              />
            </div>
          </div>

          {/* Compensado + Tributo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">
                Valor Compensado (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.valorCompensado || ""}
                onChange={(e) =>
                  set("valorCompensado", parseFloat(e.target.value) || 0)
                }
                placeholder="0.00"
                className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold"
              />
            </div>
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">
                Tributo Compensado
              </label>
              <select
                value={form.tributoCompensado || ""}
                onChange={(e) => set("tributoCompensado", e.target.value)}
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
          </div>

          {/* Data + Forma */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">
                Data da Compensação
              </label>
              <input
                type="date"
                value={form.dataCompensacao || ""}
                onChange={(e) => set("dataCompensacao", e.target.value || null)}
                className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold"
              />
            </div>
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">
                Forma de Utilização
              </label>
              <input
                type="text"
                value={form.formaUtilizacao || ""}
                onChange={(e) => set("formaUtilizacao", e.target.value)}
                placeholder="Ex: DCOMP, Compensação..."
                className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold"
              />
            </div>
          </div>

          {/* Honorários + Boleto (auto-calc) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">
                % Honorários
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  value={form.honorariosPercentual ? formatPercent(form.honorariosPercentual) : ""}
                  onChange={(e) =>
                    set("honorariosPercentual", (parseFloat(e.target.value) || 0) / 100)
                  }
                  placeholder="20"
                  className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-st-muted">%</span>
              </div>
              {percentualHonorarios > 0 && (
                <p className="text-[10px] text-st-muted mt-0.5">
                  Do contrato: {formatPercent(percentualHonorarios)}%
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">
                Valor Honorários (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.boletoValor || ""}
                readOnly
                className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans bg-gray-50 text-st-muted cursor-not-allowed"
              />
              <p className="text-[10px] text-st-muted mt-0.5">
                Calculado: compensado × %
              </p>
            </div>
          </div>

          {/* PerdComp Web */}
          <div>
            <label className="block text-xs font-sans text-st-muted mb-1">
              PerdComp Web
            </label>
            <input
              type="text"
              value={form.perdcompWeb || ""}
              onChange={(e) => set("perdcompWeb", e.target.value)}
              className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold"
            />
          </div>

          {/* Comprovantes URL */}
          <div>
            <label className="block text-xs font-sans text-st-muted mb-1">
              URL Comprovantes
            </label>
            <input
              type="url"
              value={form.comprovantesUrl || ""}
              onChange={(e) => set("comprovantesUrl", e.target.value)}
              placeholder="https://..."
              className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold"
            />
          </div>

          {/* Info box about auto-actions */}
          {isNew && (
            <div className="bg-st-light/50 border border-st-border rounded-lg p-3">
              <p className="text-[11px] text-st-muted font-sans leading-relaxed">
                Ao salvar, será criado automaticamente um lançamento &quot;a receber&quot;
                de honorários vinculado a esta pasta e cliente, e o saldo do crédito
                será atualizado.
              </p>
            </div>
          )}
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
