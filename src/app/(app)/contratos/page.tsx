"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Contrato, CONTRATO_STATUS_LABELS, ContratoStatus } from "@/lib/types";
import { getAllContratos } from "@/lib/store";
import Btn from "@/components/Btn";
import Badge from "@/components/Badge";
import SearchInput from "@/components/SearchInput";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/contexts/AuthContext";

const statusColors: Record<string, "gold" | "green" | "muted" | "dark"> = {
  rascunho: "muted",
  enviado_assinatura: "gold",
  assinado: "green",
  vigente: "green",
  encerrado: "dark",
};

export default function ContratosPage() {
  const router = useRouter();
  const { canEdit } = useAuth();
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllContratos();
      setContratos(data);
    } catch (err) {
      console.error("[Contratos] Erro:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function handleNew() {
    router.push(`/contratos/novo`);
  }

  const filtered = contratos.filter((c) => {
    if (filterStatus && c.status !== filterStatus) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (c.titulo || "").toLowerCase().includes(q) ||
      (c.objeto || "").toLowerCase().includes(q) ||
      (c.clienteNome || "").toLowerCase().includes(q)
    );
  });

  function formatBRL(val: number | null) {
    if (!val) return "—";
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 sm:mb-8 gap-3">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-st-dark">
            Contratos
          </h1>
          <p className="text-xs sm:text-sm text-st-muted font-sans mt-1">
            {loading
              ? "Carregando..."
              : `${contratos.length} contrato${contratos.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        {canEdit && (
          <Btn variant="gold" onClick={handleNew}>
            + Novo Contrato
          </Btn>
        )}
      </div>

      {!loading && contratos.length > 0 && (
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Buscar por título, objeto ou cliente..."
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-st-border rounded-lg px-3 py-2 text-sm font-sans bg-white focus:outline-none focus:border-st-gold"
          >
            <option value="">Todos os status</option>
            {Object.entries(CONTRATO_STATUS_LABELS).map(([k, v]) => (
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
            Carregando contratos...
          </p>
        </div>
      ) : contratos.length === 0 ? (
        <EmptyState
          title="Nenhum contrato cadastrado"
          description={canEdit ? 'Clique em "Novo Contrato" para adicionar o primeiro contrato.' : "Nenhum contrato cadastrado ainda."}
          actionLabel={canEdit ? "+ Novo Contrato" : undefined}
          onAction={canEdit ? handleNew : undefined}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <div
              key={c.id}
              onClick={() => router.push(`/contratos/${c.id}`)}
              className="border border-st-border rounded-xl p-3 sm:p-4 bg-white hover:shadow-sm transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-serif font-bold text-st-dark text-sm sm:text-base truncate">
                      {c.titulo || "Sem título"}
                    </h3>
                    {c.objeto && <Badge color="dark">{c.objeto}</Badge>}
                    <Badge color={statusColors[c.status] || "muted"}>
                      {CONTRATO_STATUS_LABELS[c.status as ContratoStatus] || c.status}
                    </Badge>
                  </div>
                  <div className="flex gap-3 mt-1 text-xs text-st-muted font-sans flex-wrap">
                    {c.clienteNome && <span>{c.clienteNome}</span>}
                    <span className="font-medium">{formatBRL(c.valor)}</span>
                    {c.dataEntrada && (
                      <span>
                        {new Date(c.dataEntrada + "T00:00:00").toLocaleDateString("pt-BR")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <p className="text-center text-sm text-st-muted font-sans py-8">
              Nenhum contrato encontrado com esses filtros.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
