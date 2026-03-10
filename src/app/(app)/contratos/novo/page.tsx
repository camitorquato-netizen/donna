"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Contrato, ContratoStatus, CONTRATO_STATUS_LABELS, CONTRATO_OBJETOS } from "@/lib/types";
import { saveContrato } from "@/lib/store";
import Btn from "@/components/Btn";
import ClienteSelector from "@/components/ClienteSelector";

export default function NovoContratoPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [contrato, setContrato] = useState<Contrato>({
    id: crypto.randomUUID(),
    clienteId: "",
    objeto: "",
    titulo: "",
    arquivoUrl: "",
    valor: null,
    percentualHonorarios: 0.20,
    dataEntrada: null,
    vigencia: null,
    percentualParceiro: 0,
    status: "rascunho",
  });

  function set<K extends keyof Contrato>(key: K, val: Contrato[K]) {
    setContrato((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSave() {
    if (!contrato.clienteId) {
      alert("Selecione um cliente antes de salvar.");
      return;
    }
    setSaving(true);
    try {
      await saveContrato(contrato);
      router.push(`/contratos/${contrato.id}`);
    } catch (err) {
      console.error("[NovoContrato] Erro ao salvar:", err);
      alert("Erro ao salvar contrato. Verifique o console.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => router.push("/contratos")}
        className="text-sm text-st-muted hover:text-st-dark font-sans transition-colors mb-4 cursor-pointer"
      >
        ← Voltar para contratos
      </button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-xl sm:text-2xl font-bold text-st-dark">
          Novo Contrato
        </h1>
        <Btn variant="gold" onClick={handleSave} loading={saving}>
          Criar Contrato
        </Btn>
      </div>

      <div className="space-y-6">
        {/* Cliente */}
        <section className="bg-white border border-st-border rounded-xl p-4 sm:p-5">
          <h2 className="font-serif font-bold text-st-dark mb-4">
            Vinculação
          </h2>
          <ClienteSelector
            value={contrato.clienteId}
            onChange={(id) => set("clienteId", id)}
          />
        </section>

        {/* Dados do Contrato */}
        <section className="bg-white border border-st-border rounded-xl p-4 sm:p-5">
          <h2 className="font-serif font-bold text-st-dark mb-4">
            Dados do Contrato
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-sans text-st-muted mb-1">
                Título
              </label>
              <input
                type="text"
                value={contrato.titulo}
                onChange={(e) => set("titulo", e.target.value)}
                className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold"
              />
            </div>
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">
                Objeto
              </label>
              <select
                value={contrato.objeto}
                onChange={(e) => set("objeto", e.target.value)}
                className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold bg-white"
              >
                <option value="">Selecione...</option>
                {CONTRATO_OBJETOS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">
                Valor (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={contrato.valor ?? ""}
                onChange={(e) =>
                  set("valor", e.target.value ? parseFloat(e.target.value) : null)
                }
                className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold"
              />
            </div>
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">
                % Honorários
              </label>
              <input
                type="number"
                step="0.01"
                value={(contrato.percentualHonorarios * 100).toFixed(0)}
                onChange={(e) =>
                  set(
                    "percentualHonorarios",
                    (parseFloat(e.target.value) || 0) / 100
                  )
                }
                className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold"
                placeholder="20"
              />
            </div>
          </div>
        </section>

        {/* Datas e Status */}
        <section className="bg-white border border-st-border rounded-xl p-4 sm:p-5">
          <h2 className="font-serif font-bold text-st-dark mb-4">
            Datas e Status
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">
                Data de Entrada
              </label>
              <input
                type="date"
                value={contrato.dataEntrada || ""}
                onChange={(e) => set("dataEntrada", e.target.value || null)}
                className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold"
              />
            </div>
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">
                Vigência
              </label>
              <input
                type="date"
                value={contrato.vigencia || ""}
                onChange={(e) => set("vigencia", e.target.value || null)}
                className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold"
              />
            </div>
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">
                Status
              </label>
              <select
                value={contrato.status}
                onChange={(e) => set("status", e.target.value as ContratoStatus)}
                className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold bg-white"
              >
                {Object.entries(CONTRATO_STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
