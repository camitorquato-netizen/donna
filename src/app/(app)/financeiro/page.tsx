"use client";
import { useState, useEffect, useCallback } from "react";
import { Lancamento, LANCAMENTO_STATUS_LABELS, LancamentoStatus } from "@/lib/types";
import { getAllLancamentos } from "@/lib/store";
import Btn from "@/components/Btn";
import Badge from "@/components/Badge";
import SummaryCard from "@/components/SummaryCard";
import EmptyState from "@/components/EmptyState";
import LancamentoModal from "@/components/LancamentoModal";

type TabFilter = "todos" | "a_receber" | "a_pagar";

const statusColors: Record<string, "gold" | "green" | "red" | "muted"> = {
  pendente: "gold",
  pago: "green",
  vencido: "red",
  cancelado: "muted",
};

function formatBRL(val: number): string {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function FinanceiroPage() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabFilter>("todos");
  const [showModal, setShowModal] = useState(false);
  const [editLancamento, setEditLancamento] = useState<Lancamento | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllLancamentos();
      setLancamentos(data);
    } catch (err) {
      console.error("[Financeiro] Erro:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totals = lancamentos.reduce(
    (acc, l) => {
      if (l.tipo === "a_receber" && l.status === "pendente") acc.aReceber += l.valor;
      if (l.tipo === "a_pagar" && l.status === "pendente") acc.aPagar += l.valor;
      if (l.status === "pago") acc.pago += l.valorPago || l.valor;
      return acc;
    },
    { aReceber: 0, aPagar: 0, pago: 0 }
  );

  const filtered = lancamentos.filter((l) => {
    if (tab === "todos") return true;
    return l.tipo === tab;
  });

  function handleNew() {
    setEditLancamento(null);
    setShowModal(true);
  }

  function handleEdit(l: Lancamento) {
    setEditLancamento(l);
    setShowModal(true);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 sm:mb-8 gap-3">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-st-dark">
            Financeiro
          </h1>
          <p className="text-xs sm:text-sm text-st-muted font-sans mt-1">
            {loading
              ? "Carregando..."
              : `${lancamentos.length} lançamento${lancamentos.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Btn variant="gold" onClick={handleNew}>
          + Novo Lançamento
        </Btn>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
        <SummaryCard
          label="A Receber"
          value={formatBRL(totals.aReceber)}
          icon="▲"
          color="green"
        />
        <SummaryCard
          label="A Pagar"
          value={formatBRL(totals.aPagar)}
          icon="▼"
          color="red"
        />
        <SummaryCard
          label="Pago"
          value={formatBRL(totals.pago)}
          icon="✓"
          color="dark"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-st-border/30 rounded-lg p-1">
        {(
          [
            { key: "todos", label: "Todos" },
            { key: "a_receber", label: "A Receber" },
            { key: "a_pagar", label: "A Pagar" },
          ] as { key: TabFilter; label: string }[]
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-md text-sm font-sans transition-colors cursor-pointer ${
              tab === t.key
                ? "bg-white text-st-dark shadow-sm"
                : "text-st-muted hover:text-st-dark"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-sm text-st-muted font-sans animate-pulse">
            Carregando lançamentos...
          </p>
        </div>
      ) : lancamentos.length === 0 ? (
        <EmptyState
          title="Nenhum lançamento"
          description='Clique em "Novo Lançamento" para registrar uma entrada ou saída.'
          actionLabel="+ Novo Lançamento"
          onAction={handleNew}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((l) => (
            <div
              key={l.id}
              onClick={() => handleEdit(l)}
              className="border border-st-border rounded-xl p-3 sm:p-4 bg-white hover:shadow-sm transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs font-sans font-medium px-2 py-0.5 rounded ${
                        l.tipo === "a_receber"
                          ? "bg-green-50 text-st-green"
                          : "bg-red-50 text-st-red"
                      }`}
                    >
                      {l.tipo === "a_receber" ? "Receber" : "Pagar"}
                    </span>
                    <h3 className="font-sans text-sm text-st-dark truncate">
                      {l.descricao || "Sem descrição"}
                    </h3>
                  </div>
                  <div className="flex gap-3 mt-1 text-xs text-st-muted font-sans flex-wrap">
                    {l.clienteNome && <span>{l.clienteNome}</span>}
                    {l.dataVencimento && (
                      <span>
                        Venc:{" "}
                        {new Date(l.dataVencimento + "T00:00:00").toLocaleDateString(
                          "pt-BR"
                        )}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p
                    className={`font-serif font-bold text-sm ${
                      l.tipo === "a_receber" ? "text-st-green" : "text-st-red"
                    }`}
                  >
                    {formatBRL(l.valor)}
                  </p>
                  <Badge color={statusColors[l.status] || "muted"}>
                    {LANCAMENTO_STATUS_LABELS[l.status as LancamentoStatus] ||
                      l.status}
                  </Badge>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <p className="text-center text-sm text-st-muted font-sans py-8">
              Nenhum lançamento nesta categoria.
            </p>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <LancamentoModal
          lancamento={editLancamento}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            load();
          }}
        />
      )}
    </div>
  );
}
