"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Pasta, PASTA_STATUS_LABELS, PastaStatus, TIPO_SERVICO_OPTIONS } from "@/lib/types";
import { getAllPastas } from "@/lib/store";
import Btn from "@/components/Btn";
import Badge from "@/components/Badge";
import SearchInput from "@/components/SearchInput";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/contexts/AuthContext";

const statusColors: Record<string, "gold" | "green" | "muted" | "dark"> = {
  ativo: "green",
  suspenso: "gold",
  arquivado: "muted",
  encerrado: "dark",
};

export default function PastasPage() {
  const router = useRouter();
  const { canEdit } = useAuth();
  const [pastas, setPastas] = useState<Pasta[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllPastas();
      setPastas(data);
    } catch (err) {
      console.error("[Pastas] Erro:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function handleNew() {
    router.push(`/pastas/novo`);
  }

  const filtered = pastas.filter((p) => {
    if (filterTipo) {
      if (filterTipo === "processo" && p.tipo !== "processo") return false;
      if (filterTipo === "servico" && p.tipo !== "servico") return false;
      if (
        filterTipo !== "processo" &&
        filterTipo !== "servico" &&
        p.tipoServico !== filterTipo
      )
        return false;
    }
    if (filterStatus && p.status !== filterStatus) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (p.titulo || "").toLowerCase().includes(q) ||
      (p.numero || "").toLowerCase().includes(q) ||
      (p.clienteNome || "").toLowerCase().includes(q) ||
      (p.tipoServico || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 sm:mb-8 gap-3">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-st-dark">
            Pastas de Trabalho
          </h1>
          <p className="text-xs sm:text-sm text-st-muted font-sans mt-1">
            {loading
              ? "Carregando..."
              : `${pastas.length} pasta${pastas.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        {canEdit && (
          <Btn variant="gold" onClick={handleNew}>
            + Nova Pasta
          </Btn>
        )}
      </div>

      {!loading && pastas.length > 0 && (
        <div className="flex gap-3 mb-4 flex-wrap">
          <div className="flex-1 min-w-[180px]">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Buscar por título, número ou cliente..."
            />
          </div>
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="border border-st-border rounded-lg px-3 py-2 text-sm font-sans bg-white focus:outline-none focus:border-st-gold"
          >
            <option value="">Todos os tipos</option>
            <option value="processo">Processo</option>
            <option value="servico">Serviço</option>
            {TIPO_SERVICO_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-st-border rounded-lg px-3 py-2 text-sm font-sans bg-white focus:outline-none focus:border-st-gold"
          >
            <option value="">Todos os status</option>
            {Object.entries(PASTA_STATUS_LABELS).map(([k, v]) => (
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
            Carregando pastas...
          </p>
        </div>
      ) : pastas.length === 0 ? (
        <EmptyState
          title="Nenhuma pasta cadastrada"
          description={canEdit ? 'Clique em "Nova Pasta" para criar a primeira pasta de trabalho.' : "Nenhuma pasta cadastrada ainda."}
          actionLabel={canEdit ? "+ Nova Pasta" : undefined}
          onAction={canEdit ? handleNew : undefined}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <div
              key={p.id}
              onClick={() => router.push(`/pastas/${p.id}`)}
              className="border border-st-border rounded-xl p-3 sm:p-4 bg-white hover:shadow-sm transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-serif font-bold text-st-dark text-sm sm:text-base truncate">
                      {p.titulo || p.numero || "Sem título"}
                    </h3>
                    <Badge color={p.tipo === "processo" ? "dark" : "gold"}>
                      {p.tipo === "processo" ? "Processo" : p.tipoServico || "Serviço"}
                    </Badge>
                    <Badge color={statusColors[p.status] || "muted"}>
                      {PASTA_STATUS_LABELS[p.status as PastaStatus] || p.status}
                    </Badge>
                  </div>
                  <div className="flex gap-3 mt-1 text-xs text-st-muted font-sans flex-wrap">
                    {p.numero && <span className="font-mono">{p.numero}</span>}
                    {p.clienteNome && <span>{p.clienteNome}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <p className="text-center text-sm text-st-muted font-sans py-8">
              Nenhuma pasta encontrada com esses filtros.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
