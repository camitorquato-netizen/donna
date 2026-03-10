"use client";
import { useState } from "react";
import { WfRct, Ponto, PontoStatusCliente } from "@/lib/types";
import { savePonto, saveWfRct, recalcCreditoValidado } from "@/lib/store";
import Btn from "@/components/Btn";

interface Props {
  step: WfRct;
  creditoId: string;
  pontos: Ponto[];
  onAdvance: () => void;
  onReload: () => void;
}

export default function WfStepApresentacao({
  step,
  creditoId,
  pontos,
  onAdvance,
  onReload,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [obs, setObs] = useState(step.observacoes || "");
  const [url, setUrl] = useState(step.url || "");
  const isDone = step.status === "concluido";

  async function setStatusCliente(p: Ponto, status: PontoStatusCliente) {
    await savePonto({ ...p, statusCliente: status });
    onReload();
  }

  const respondidos = pontos.filter((p) => p.statusCliente !== null).length;
  const todosRespondidos = pontos.length > 0 && respondidos === pontos.length;

  const aprovados = pontos.filter((p) => p.statusCliente === "sim");
  const rejeitados = pontos.filter((p) => p.statusCliente === "nao");
  const standBy = pontos.filter((p) => p.statusCliente === "stand_by");

  const totalAprovado = aprovados.reduce((s, p) => s + p.valor, 0);
  const totalRejeitado = rejeitados.reduce((s, p) => s + p.valor, 0);
  const totalStandBy = standBy.reduce((s, p) => s + p.valor, 0);

  async function handleConcluir() {
    setSaving(true);
    try {
      await recalcCreditoValidado(creditoId);
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

  return (
    <div className="space-y-4">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
        <p className="text-xs font-sans text-purple-800">
          Aguardando aprovação do cliente para cada ponto. Marque cada ponto como Sim, Não ou Stand-by.
        </p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-white border border-st-border rounded-lg p-2.5 text-center">
          <p className="text-[10px] text-st-muted font-sans">Respondidos</p>
          <p className="text-sm font-bold text-st-dark font-sans">{respondidos}/{pontos.length}</p>
        </div>
        <div className="bg-white border border-green-200 rounded-lg p-2.5 text-center">
          <p className="text-[10px] text-green-600 font-sans">Aprovado</p>
          <p className="text-sm font-bold text-green-700 font-sans">{formatBRL(totalAprovado)}</p>
        </div>
        <div className="bg-white border border-red-200 rounded-lg p-2.5 text-center">
          <p className="text-[10px] text-red-600 font-sans">Rejeitado</p>
          <p className="text-sm font-bold text-red-700 font-sans">{formatBRL(totalRejeitado)}</p>
        </div>
        <div className="bg-white border border-amber-200 rounded-lg p-2.5 text-center">
          <p className="text-[10px] text-amber-600 font-sans">Stand-by</p>
          <p className="text-sm font-bold text-amber-700 font-sans">{formatBRL(totalStandBy)}</p>
        </div>
      </div>

      {/* Tabela de aprovação */}
      <div className="bg-white border border-st-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-sans">
            <thead>
              <tr className="bg-gray-50 border-b border-st-border">
                <th className="text-left px-3 py-2 text-xs text-st-muted font-medium">Descrição</th>
                <th className="text-left px-3 py-2 text-xs text-st-muted font-medium w-24">Período</th>
                <th className="text-right px-3 py-2 text-xs text-st-muted font-medium w-28">Valor</th>
                <th className="text-center px-3 py-2 text-xs text-st-muted font-medium w-44">Resposta Cliente</th>
              </tr>
            </thead>
            <tbody>
              {pontos.map((p) => (
                <tr key={p.id} className="border-b border-st-border/50 hover:bg-gray-50/50">
                  <td className="px-3 py-2 text-sm text-st-dark">{p.descricao || "—"}</td>
                  <td className="px-3 py-2 text-sm text-st-muted">{p.periodo || "—"}</td>
                  <td className="px-3 py-2 text-sm text-right text-st-dark font-medium">{formatBRL(p.valor)}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1 justify-center">
                      {(["sim", "nao", "stand_by"] as PontoStatusCliente[]).map((st) => {
                        const selected = p.statusCliente === st;
                        const colors: Record<PontoStatusCliente, string> = {
                          sim: selected ? "bg-green-600 text-white" : "bg-white text-green-700 border border-green-300 hover:bg-green-50",
                          nao: selected ? "bg-red-600 text-white" : "bg-white text-red-700 border border-red-300 hover:bg-red-50",
                          stand_by: selected ? "bg-amber-500 text-white" : "bg-white text-amber-700 border border-amber-300 hover:bg-amber-50",
                        };
                        const labels: Record<PontoStatusCliente, string> = {
                          sim: "Sim",
                          nao: "Não",
                          stand_by: "S/B",
                        };
                        return (
                          <button
                            key={st}
                            onClick={() => !isDone && setStatusCliente(p, st)}
                            disabled={isDone}
                            className={`px-2 py-0.5 rounded text-[11px] font-sans font-medium transition-colors cursor-pointer disabled:cursor-not-allowed ${colors[st]}`}
                          >
                            {labels[st]}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
              {pontos.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-xs text-st-muted">
                    Nenhum ponto para apresentar.
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
          <label className="block text-xs font-sans text-st-muted mb-1">Observações</label>
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
            disabled={!todosRespondidos}
            className="!px-6"
          >
            {todosRespondidos ? "Concluir Apresentação →" : `Faltam ${pontos.length - respondidos} respostas`}
          </Btn>
        </div>
      )}

      {isDone && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-xs font-sans text-green-800">
            Apresentação concluída. Crédito validado: <strong>{formatBRL(totalAprovado)}</strong>
          </p>
        </div>
      )}
    </div>
  );
}
