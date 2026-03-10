"use client";
import { useState, useEffect, useRef } from "react";
import { WfRct, Ponto } from "@/lib/types";
import { savePonto, saveWfRct, recalcCreditoApresentado } from "@/lib/store";
import Btn from "@/components/Btn";

interface Props {
  step: WfRct;
  creditoId: string;
  pontos: Ponto[];
  onAdvance: () => void;
  onReload: () => void;
}

export default function WfStepRevisao({
  step,
  creditoId,
  pontos,
  onAdvance,
  onReload,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [obs, setObs] = useState(step.observacoes || "");
  const [url, setUrl] = useState(step.url || "");
  const [localPontos, setLocalPontos] = useState<Ponto[]>(pontos);
  const localPontosRef = useRef(localPontos);
  localPontosRef.current = localPontos;
  const isDone = step.status === "concluido";

  // Sync from parent when pontos change externally
  useEffect(() => {
    setLocalPontos(pontos);
  }, [pontos]);

  function updateLocal(id: string, field: keyof Ponto, value: string | number) {
    setLocalPontos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  }

  async function saveOnBlur(id: string) {
    const current = localPontosRef.current.find((x) => x.id === id);
    if (current) await savePonto(current);
  }

  async function handleConcluir() {
    setSaving(true);
    try {
      // Save any unsaved pontos first
      for (const p of localPontos) {
        await savePonto(p);
      }
      await recalcCreditoApresentado(creditoId);
      await saveWfRct({ ...step, status: "concluido", observacoes: obs, url });
      onAdvance();
    } finally {
      setSaving(false);
    }
  }

  async function saveStepFields() {
    await saveWfRct({ ...step, observacoes: obs, url });
  }

  function formatBRL(val: number) {
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  const total = localPontos.reduce((s, p) => s + p.valor, 0);

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs font-sans text-blue-800">
          Revise os pontos apresentados pelo colaborador. Você pode modificar valores e adicionar observações em cada ponto.
        </p>
      </div>

      {/* Total */}
      <div className="bg-white border border-st-border rounded-lg p-3 flex items-center justify-between">
        <span className="text-sm font-sans text-st-dark font-medium">Total dos Pontos</span>
        <span className="text-lg font-serif font-bold text-st-gold">{formatBRL(total)}</span>
      </div>

      {/* Tabela de Pontos editável pelo analista */}
      <div className="bg-white border border-st-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-sans">
            <thead>
              <tr className="bg-gray-50 border-b border-st-border">
                <th className="text-left px-3 py-2 text-xs text-st-muted font-medium">Descrição</th>
                <th className="text-left px-3 py-2 text-xs text-st-muted font-medium w-28">Período</th>
                <th className="text-right px-3 py-2 text-xs text-st-muted font-medium w-32">Valor (R$)</th>
                <th className="text-left px-3 py-2 text-xs text-st-muted font-medium">Observação Analista</th>
              </tr>
            </thead>
            <tbody>
              {localPontos.map((p) => (
                <tr key={p.id} className="border-b border-st-border/50 hover:bg-gray-50/50">
                  <td className="px-3 py-1.5">
                    <input
                      type="text"
                      value={p.descricao}
                      onChange={(e) => updateLocal(p.id, "descricao", e.target.value)}
                      onBlur={() => saveOnBlur(p.id)}
                      disabled={isDone}
                      className="w-full bg-transparent border-0 outline-none text-sm text-st-dark disabled:opacity-60"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      type="text"
                      value={p.periodo}
                      onChange={(e) => updateLocal(p.id, "periodo", e.target.value)}
                      onBlur={() => saveOnBlur(p.id)}
                      disabled={isDone}
                      className="w-full bg-transparent border-0 outline-none text-sm text-st-dark disabled:opacity-60"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      type="number"
                      step="0.01"
                      value={p.valor || ""}
                      onChange={(e) => updateLocal(p.id, "valor", parseFloat(e.target.value) || 0)}
                      onBlur={() => saveOnBlur(p.id)}
                      disabled={isDone}
                      className="w-full bg-transparent border-0 outline-none text-sm text-right text-st-dark disabled:opacity-60"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      type="text"
                      value={p.observacao}
                      onChange={(e) => updateLocal(p.id, "observacao", e.target.value)}
                      onBlur={() => saveOnBlur(p.id)}
                      disabled={isDone}
                      placeholder="Notas do analista..."
                      className="w-full bg-transparent border-0 outline-none text-sm text-st-dark placeholder:text-st-muted/50 disabled:opacity-60"
                    />
                  </td>
                </tr>
              ))}
              {localPontos.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-xs text-st-muted">
                    Nenhum ponto para revisar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Observações + URL */}
      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="block text-xs font-sans text-st-muted mb-1">Observações da Revisão</label>
          <textarea
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            onBlur={saveStepFields}
            disabled={isDone}
            rows={3}
            className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold resize-none disabled:opacity-60 disabled:bg-gray-50"
          />
        </div>
        <div>
          <label className="block text-xs font-sans text-st-muted mb-1">URL Documentos</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={saveStepFields}
            disabled={isDone}
            placeholder="https://..."
            className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold disabled:opacity-60 disabled:bg-gray-50"
          />
        </div>
      </div>

      {!isDone && (
        <div className="flex justify-end">
          <Btn
            variant="gold"
            onClick={handleConcluir}
            loading={saving}
            className="!px-6"
          >
            Aprovar e Apresentar →
          </Btn>
        </div>
      )}

      {isDone && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-xs font-sans text-green-800">
            Revisão concluída. Crédito apresentado: <strong>{formatBRL(total)}</strong>
          </p>
        </div>
      )}
    </div>
  );
}
