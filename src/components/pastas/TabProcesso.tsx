"use client";
import { useState, useEffect, useCallback } from "react";
import { Processo } from "@/lib/types";
import { getProcessoByPasta, saveProcesso } from "@/lib/store";
import Btn from "@/components/Btn";

interface TabProcessoProps {
  pastaId: string;
}

const AREA_OPTIONS = [
  "Tributário",
  "Cível",
  "Trabalhista",
  "Administrativo",
  "Criminal",
  "Empresarial",
  "Previdenciário",
  "Outro",
];

export default function TabProcesso({ pastaId }: TabProcessoProps) {
  const [processo, setProcesso] = useState<Processo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = await getProcessoByPasta(pastaId);
      setProcesso(p);
    } catch (err) {
      console.error("[TabProcesso] Erro:", err);
    } finally {
      setLoading(false);
    }
  }, [pastaId]);

  useEffect(() => {
    load();
  }, [load]);

  function set<K extends keyof Processo>(key: K, val: Processo[K]) {
    setProcesso((prev) => (prev ? { ...prev, [key]: val } : prev));
  }

  async function handleCreate() {
    const novo: Processo = {
      id: crypto.randomUUID(),
      pastaId,
      numeroCnj: "",
      numeroProcesso: "",
      area: "Tributário",
      esfera: "judicial",
      rito: "",
      materia: "",
      polo: "",
      dataAjuizamento: null,
      valorCausa: null,
      jurisdicao: "",
      dataTransitoJulgado: null,
      observacoes: "",
    };
    await saveProcesso(novo);
    setProcesso(novo);
  }

  async function handleSave() {
    if (!processo) return;
    setSaving(true);
    try {
      await saveProcesso(processo);
    } catch (err) {
      console.error("[TabProcesso] Erro ao salvar:", err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-st-muted font-sans animate-pulse">
          Carregando dados do processo...
        </p>
      </div>
    );
  }

  if (!processo) {
    return (
      <div className="bg-white border border-st-border rounded-xl p-8 text-center">
        <p className="text-sm text-st-muted font-sans mb-4">
          Nenhum processo vinculado a esta pasta.
        </p>
        <Btn variant="gold" onClick={handleCreate}>
          Criar Dados do Processo
        </Btn>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="bg-white border border-st-border rounded-xl p-4 sm:p-5">
        <h2 className="font-serif font-bold text-st-dark mb-4">
          Dados do Processo
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-sans text-st-muted mb-1">
              Número CNJ
            </label>
            <input
              type="text"
              value={processo.numeroCnj}
              onChange={(e) => set("numeroCnj", e.target.value)}
              placeholder="NNNNNNN-NN.NNNN.N.NN.NNNN"
              className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-sans text-st-muted mb-1">
              Número do Processo
            </label>
            <input
              type="text"
              value={processo.numeroProcesso}
              onChange={(e) => set("numeroProcesso", e.target.value)}
              className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold"
            />
          </div>
          <div>
            <label className="block text-xs font-sans text-st-muted mb-1">
              Área
            </label>
            <select
              value={processo.area}
              onChange={(e) => set("area", e.target.value)}
              className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold bg-white"
            >
              <option value="">Selecione...</option>
              {AREA_OPTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-sans text-st-muted mb-1">
              Esfera
            </label>
            <div className="flex gap-3">
              {(["judicial", "administrativo"] as const).map((e) => (
                <label
                  key={e}
                  className={`flex-1 text-center py-2 rounded-lg border text-sm font-sans cursor-pointer transition-colors ${
                    processo.esfera === e
                      ? "bg-st-gold/10 border-st-gold text-st-gold"
                      : "border-st-border text-st-muted hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="esfera"
                    value={e}
                    checked={processo.esfera === e}
                    onChange={() => set("esfera", e)}
                    className="sr-only"
                  />
                  {e === "judicial" ? "Judicial" : "Administrativo"}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-sans text-st-muted mb-1">
              Rito
            </label>
            <input
              type="text"
              value={processo.rito}
              onChange={(e) => set("rito", e.target.value)}
              placeholder="Ex: Ordinário, Sumário"
              className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold"
            />
          </div>
          <div>
            <label className="block text-xs font-sans text-st-muted mb-1">
              Matéria
            </label>
            <input
              type="text"
              value={processo.materia}
              onChange={(e) => set("materia", e.target.value)}
              className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold"
            />
          </div>
          <div>
            <label className="block text-xs font-sans text-st-muted mb-1">
              Polo
            </label>
            <div className="flex gap-3">
              {(["ativo", "passivo"] as const).map((p) => (
                <label
                  key={p}
                  className={`flex-1 text-center py-2 rounded-lg border text-sm font-sans cursor-pointer transition-colors ${
                    processo.polo === p
                      ? "bg-st-gold/10 border-st-gold text-st-gold"
                      : "border-st-border text-st-muted hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="polo"
                    value={p}
                    checked={processo.polo === p}
                    onChange={() => set("polo", p)}
                    className="sr-only"
                  />
                  {p === "ativo" ? "Ativo" : "Passivo"}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-sans text-st-muted mb-1">
              Valor da Causa (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={processo.valorCausa ?? ""}
              onChange={(e) =>
                set("valorCausa", e.target.value ? parseFloat(e.target.value) : null)
              }
              className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold"
            />
          </div>
          <div>
            <label className="block text-xs font-sans text-st-muted mb-1">
              Data de Ajuizamento
            </label>
            <input
              type="date"
              value={processo.dataAjuizamento || ""}
              onChange={(e) => set("dataAjuizamento", e.target.value || null)}
              className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold"
            />
          </div>
          <div>
            <label className="block text-xs font-sans text-st-muted mb-1">
              Jurisdição
            </label>
            <input
              type="text"
              value={processo.jurisdicao}
              onChange={(e) => set("jurisdicao", e.target.value)}
              placeholder="Ex: TRF3 - São Paulo"
              className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold"
            />
          </div>
          <div>
            <label className="block text-xs font-sans text-st-muted mb-1">
              Data Trânsito em Julgado
            </label>
            <input
              type="date"
              value={processo.dataTransitoJulgado || ""}
              onChange={(e) => set("dataTransitoJulgado", e.target.value || null)}
              className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-sans text-st-muted mb-1">
              Observações
            </label>
            <textarea
              value={processo.observacoes}
              onChange={(e) => set("observacoes", e.target.value)}
              rows={3}
              className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold resize-none"
            />
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <Btn variant="gold" onClick={handleSave} loading={saving}>
          Salvar Processo
        </Btn>
      </div>
    </div>
  );
}
