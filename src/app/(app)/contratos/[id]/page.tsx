"use client";
import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Contrato, ContratoStatus, CONTRATO_STATUS_LABELS, CONTRATO_OBJETOS } from "@/lib/types";
import { getContrato, saveContrato } from "@/lib/store";
import Btn from "@/components/Btn";
import ClienteSelector from "@/components/ClienteSelector";
import { useAuth } from "@/contexts/AuthContext";

const inputClass =
  "w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold disabled:opacity-60 disabled:bg-st-light disabled:cursor-not-allowed";
const selectClass =
  "w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold bg-white disabled:opacity-60 disabled:bg-st-light disabled:cursor-not-allowed";

export default function ContratoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { isReadOnly } = useAuth();
  const [contrato, setContrato] = useState<Contrato | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const c = await getContrato(id);
      setContrato(c);
      if (c && !c.titulo) setIsEditing(true);
    } catch (err) {
      console.error("[ContratoDetail] Erro:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  function set<K extends keyof Contrato>(key: K, val: Contrato[K]) {
    setContrato((prev) => (prev ? { ...prev, [key]: val } : prev));
  }

  async function handleSave() {
    if (!contrato) return;
    setSaving(true);
    try {
      await saveContrato(contrato);
      setIsEditing(false);
    } catch (err) {
      console.error("[ContratoDetail] Erro ao salvar:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel() {
    await load();
    setIsEditing(false);
  }

  const dis = !isEditing;

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center">
        <p className="text-sm text-st-muted font-sans animate-pulse">
          Carregando contrato...
        </p>
      </div>
    );
  }

  if (!contrato) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center">
        <p className="text-sm text-st-muted font-sans">
          Contrato não encontrado.
        </p>
        <button
          onClick={() => router.push("/contratos")}
          className="mt-3 text-sm text-st-gold font-sans hover:underline cursor-pointer"
        >
          ← Voltar para contratos
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => router.push("/contratos")}
        className="text-sm text-st-muted hover:text-st-dark font-sans transition-colors mb-4 cursor-pointer"
      >
        ← Voltar para contratos
      </button>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-3">
        <h1 className="font-serif text-xl sm:text-2xl font-bold text-st-dark truncate">
          {contrato.titulo || "Novo Contrato"}
        </h1>
        {isEditing ? (
          <div className="flex gap-2 shrink-0">
            <Btn variant="ghost" onClick={handleCancel}>Cancelar</Btn>
            <Btn variant="gold" onClick={handleSave} loading={saving}>Salvar</Btn>
          </div>
        ) : (
          !isReadOnly && <Btn variant="gold" onClick={() => setIsEditing(true)}>Editar</Btn>
        )}
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
            disabled={dis}
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
                disabled={dis}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">
                Objeto
              </label>
              <select
                value={contrato.objeto}
                onChange={(e) => set("objeto", e.target.value)}
                disabled={dis}
                className={selectClass}
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
                disabled={dis}
                className={inputClass}
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
                disabled={dis}
                className={inputClass}
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
                disabled={dis}
                className={inputClass}
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
                disabled={dis}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">
                Status
              </label>
              <select
                value={contrato.status}
                onChange={(e) => set("status", e.target.value as ContratoStatus)}
                disabled={dis}
                className={selectClass}
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

        {/* ZapSign (read-only) */}
        {contrato.zapsignDocToken && (
          <section className="bg-white border border-st-border rounded-xl p-4 sm:p-5">
            <h2 className="font-serif font-bold text-st-dark mb-4">
              ZapSign
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-sans">
              <div>
                <span className="text-xs text-st-muted">Token:</span>
                <p className="text-st-dark truncate">{contrato.zapsignDocToken}</p>
              </div>
              {contrato.zapsignSignedAt && (
                <div>
                  <span className="text-xs text-st-muted">Assinado em:</span>
                  <p className="text-st-dark">
                    {new Date(contrato.zapsignSignedAt).toLocaleString("pt-BR")}
                  </p>
                </div>
              )}
              {contrato.zapsignSignerName && (
                <div>
                  <span className="text-xs text-st-muted">Assinante:</span>
                  <p className="text-st-dark">{contrato.zapsignSignerName}</p>
                </div>
              )}
              {contrato.zapsignSignerEmail && (
                <div>
                  <span className="text-xs text-st-muted">Email:</span>
                  <p className="text-st-dark">{contrato.zapsignSignerEmail}</p>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
