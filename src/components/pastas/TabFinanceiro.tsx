"use client";
import { useState, useEffect, useCallback } from "react";
import { Lancamento, LANCAMENTO_STATUS_LABELS, LancamentoStatus } from "@/lib/types";
import { getLancamentosByPasta } from "@/lib/store";
import Btn from "@/components/Btn";
import Badge from "@/components/Badge";
import LancamentoModal from "@/components/LancamentoModal";

interface TabFinanceiroProps {
  pastaId: string;
  clienteId: string;
}

const statusColors: Record<string, "gold" | "green" | "muted" | "red"> = {
  pendente: "gold",
  pago: "green",
  vencido: "red",
  cancelado: "muted",
};

export default function TabFinanceiro({ pastaId, clienteId }: TabFinanceiroProps) {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Lancamento | null | "new">(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLancamentosByPasta(pastaId);
      setLancamentos(data);
    } catch (err) {
      console.error("[TabFinanceiro] Erro:", err);
    } finally {
      setLoading(false);
    }
  }, [pastaId]);

  useEffect(() => {
    load();
  }, [load]);

  function formatBRL(val: number) {
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  const totalReceber = lancamentos
    .filter((l) => l.tipo === "a_receber" && l.status !== "cancelado")
    .reduce((s, l) => s + l.valor, 0);

  const totalPagar = lancamentos
    .filter((l) => l.tipo === "a_pagar" && l.status !== "cancelado")
    .reduce((s, l) => s + l.valor, 0);

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-st-muted font-sans animate-pulse">
          Carregando financeiro...
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white border border-st-border rounded-xl p-3 text-center">
          <p className="text-xs text-st-muted font-sans">A Receber</p>
          <p className="font-serif font-bold text-st-green text-sm">
            {formatBRL(totalReceber)}
          </p>
        </div>
        <div className="bg-white border border-st-border rounded-xl p-3 text-center">
          <p className="text-xs text-st-muted font-sans">A Pagar</p>
          <p className="font-serif font-bold text-st-red text-sm">
            {formatBRL(totalPagar)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif font-bold text-st-dark">
          Lançamentos ({lancamentos.length})
        </h2>
        <Btn variant="gold" onClick={() => setModal("new")}>
          + Novo Lançamento
        </Btn>
      </div>

      {lancamentos.length === 0 ? (
        <div className="bg-white border border-st-border rounded-xl p-8 text-center">
          <p className="text-sm text-st-muted font-sans">
            Nenhum lançamento registrado para esta pasta.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {lancamentos.map((l) => (
            <div
              key={l.id}
              onClick={() => setModal(l)}
              className="bg-white border border-st-border rounded-xl p-4 hover:shadow-sm transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge color={l.tipo === "a_receber" ? "green" : "red"}>
                      {l.tipo === "a_receber" ? "Receber" : "Pagar"}
                    </Badge>
                    <Badge color={statusColors[l.status] || "muted"}>
                      {LANCAMENTO_STATUS_LABELS[l.status as LancamentoStatus] || l.status}
                    </Badge>
                  </div>
                  <div className="flex gap-3 text-xs text-st-muted font-sans flex-wrap">
                    {l.descricao && <span>{l.descricao}</span>}
                    <span className="font-medium text-st-dark">
                      {formatBRL(l.valor)}
                    </span>
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
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <LancamentoModal
          lancamento={modal === "new" ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            load();
          }}
          defaultPastaId={pastaId}
          defaultClienteId={clienteId}
        />
      )}
    </>
  );
}
