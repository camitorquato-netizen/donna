"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Cliente, STATUS_PIPELINE_LABELS, StatusPipeline, createEmptyCliente } from "@/lib/types";
import { getAllClientes, saveCliente } from "@/lib/store";
import Btn from "@/components/Btn";
import Badge from "@/components/Badge";
import SearchInput from "@/components/SearchInput";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/contexts/AuthContext";

const pipelineColors: Record<string, "gold" | "green" | "red" | "muted" | "dark"> = {
  lead: "muted",
  em_atendimento: "gold",
  proposta_enviada: "gold",
  contrato_enviado: "gold",
  contrato_assinado: "green",
  onboarding: "green",
  em_execucao: "green",
  concluido: "dark",
  inativo: "muted",
};

export default function ClientesPage() {
  const router = useRouter();
  const { canEdit } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllClientes();
      setClientes(data);
    } catch (err) {
      console.error("[Clientes] Erro:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleNew() {
    const id = crypto.randomUUID();
    const c = createEmptyCliente(id);
    await saveCliente(c);
    router.push(`/clientes/${id}`);
  }

  const filtered = clientes.filter((c) => {
    if (filterStatus && c.statusPipeline !== filterStatus) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.nome.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.telefone.includes(q)
    );
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 sm:mb-8 gap-3">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-st-dark">
            Clientes
          </h1>
          <p className="text-xs sm:text-sm text-st-muted font-sans mt-1">
            {loading
              ? "Carregando..."
              : `${clientes.length} cliente${clientes.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        {canEdit && (
          <Btn variant="gold" onClick={handleNew}>
            + Novo Cliente
          </Btn>
        )}
      </div>

      {!loading && clientes.length > 0 && (
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Buscar por nome, email ou telefone..."
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-st-border rounded-lg px-3 py-2 text-sm font-sans bg-white focus:outline-none focus:border-st-gold"
          >
            <option value="">Todos os status</option>
            {Object.entries(STATUS_PIPELINE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-sm text-st-muted font-sans animate-pulse">
            Carregando clientes...
          </p>
        </div>
      ) : clientes.length === 0 ? (
        <EmptyState
          title="Nenhum cliente cadastrado"
          description={canEdit ? 'Clique em "Novo Cliente" para adicionar o primeiro cliente.' : "Nenhum cliente cadastrado ainda."}
          actionLabel={canEdit ? "+ Novo Cliente" : undefined}
          onAction={canEdit ? handleNew : undefined}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <div
              key={c.id}
              onClick={() => router.push(`/clientes/${c.id}`)}
              className="border border-st-border rounded-xl p-3 sm:p-4 bg-white hover:shadow-sm transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-st-gold/10 flex items-center justify-center text-st-gold font-serif font-bold text-sm shrink-0">
                    {c.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-serif font-bold text-st-dark text-sm sm:text-base truncate">
                        {c.nome.toUpperCase()}
                      </h3>
                      <Badge color={c.tipoPessoa === "PJ" ? "dark" : "gold"}>
                        {c.tipoPessoa}
                      </Badge>
                      <Badge color={pipelineColors[c.statusPipeline] || "muted"}>
                        {STATUS_PIPELINE_LABELS[c.statusPipeline as StatusPipeline] || c.statusPipeline}
                      </Badge>
                    </div>
                    <div className="flex gap-3 mt-0.5 text-xs text-st-muted font-sans flex-wrap">
                      {c.email && <span className="truncate">{c.email}</span>}
                      {c.telefone && <span>{c.telefone}</span>}
                      {c.origem && <span>Origem: {c.origem}</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <p className="text-center text-sm text-st-muted font-sans py-8">
              Nenhum cliente encontrado com esses filtros.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
