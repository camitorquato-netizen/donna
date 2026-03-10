"use client";
import { useState, useEffect, useRef } from "react";
import { WfRct, Ponto } from "@/lib/types";
import { savePonto, deletePonto, saveWfRct } from "@/lib/store";
import Btn from "@/components/Btn";

interface Props {
  step: WfRct;
  creditoId: string;
  pontos: Ponto[];
  onAdvance: () => void;
  onReload: () => void;
}

export default function WfStepLevantamento({
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

  // Sync from parent when pontos change externally (add/delete)
  useEffect(() => {
    setLocalPontos(pontos);
  }, [pontos]);

  async function addPonto() {
    const novo: Ponto = {
      id: crypto.randomUUID(),
      creditoId,
      descricao: "",
      periodo: "",
      valor: 0,
      aprovado: false,
      statusCliente: null,
      categoria: "",
      observacao: "",
    };
    await savePonto(novo);
    onReload();
  }

  function updateLocal(id: string, field: keyof Ponto, value: string | number) {
    setLocalPontos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  }

  async function saveOnBlur(id: string) {
    const current = localPontosRef.current.find((x) => x.id === id);
    if (current) await savePonto(current);
  }

  async function removePonto(id: string) {
    await deletePonto(id);
    onReload();
  }

  async function handleConcluir() {
    setSaving(true);
    try {
      // Save any unsaved pontos first
      for (const p of localPontos) {
        await savePonto(p);
      }
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
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <p className="text-xs font-sans text-amber-800">
          Cadastre os pontos de crédito identificados no levantamento. Cada ponto deve conter descrição, período e valor.
        </p>
      </div>

      {/* Tabela de Pontos */}
      <div className="bg-white border border-st-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-sans">
            <thead>
              <tr className="bg-gray-50 border-b border-st-border">
                <th className="text-left px-3 py-2 text-xs text-st-muted font-medium">Descrição</th>
                <th className="text-left px-3 py-2 text-xs text-st-muted font-medium w-28">Período</th>
                <th className="text-right px-3 py-2 text-xs text-st-muted font-medium w-32">Valor (R$)</th>
                <th className="text-left px-3 py-2 text-xs text-st-muted font-medium w-28">Categoria</th>
                <th className="w-10 px-2" />
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
                      placeholder="Descrição do ponto"
                      className="w-full bg-transparent border-0 outline-none text-sm text-st-dark placeholder:text-st-muted/50 disabled:opacity-60"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      type="text"
                      value={p.periodo}
                      onChange={(e) => updateLocal(p.id, "periodo", e.target.value)}
                      onBlur={() => saveOnBlur(p.id)}
                      disabled={isDone}
                      placeholder="Ex: 01/2020"
                      className="w-full bg-transparent border-0 outline-none text-sm text-st-dark placeholder:text-st-muted/50 disabled:opacity-60"
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
                      placeholder="0,00"
                      className="w-full bg-transparent border-0 outline-none text-sm text-right text-st-dark placeholder:text-st-muted/50 disabled:opacity-60"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      type="text"
                      value={p.categoria}
                      onChange={(e) => updateLocal(p.id, "categoria", e.target.value)}
                      onBlur={() => saveOnBlur(p.id)}
                      disabled={isDone}
                      placeholder="Categoria"
                      className="w-full bg-transparent border-0 outline-none text-sm text-st-dark placeholder:text-st-muted/50 disabled:opacity-60"
                    />
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    {!isDone && (
                      <button
                        onClick={() => removePonto(p.id)}
                        className="text-st-muted hover:text-st-red text-sm cursor-pointer"
                      >
                        ×
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {localPontos.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-xs text-st-muted">
                    Nenhum ponto cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-t border-st-border">
          <span className="text-xs font-sans text-st-muted">
            Total: <strong className="text-st-dark">{formatBRL(total)}</strong> ({localPontos.length} pontos)
          </span>
          {!isDone && (
            <Btn variant="ghost" className="text-xs !px-3 !py-1" onClick={addPonto}>
              + Adicionar Ponto
            </Btn>
          )}
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
            className="!px-6"
          >
            Concluir Levantamento →
          </Btn>
        </div>
      )}
    </div>
  );
}
