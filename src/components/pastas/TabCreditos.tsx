"use client";
import { useState, useEffect, useCallback } from "react";
import { Credito, CREDITO_FASE_LABELS, CreditoFase } from "@/lib/types";
import { getCreditosByPasta, deleteCredito } from "@/lib/store";
import Btn from "@/components/Btn";
import Badge from "@/components/Badge";
import CreditoModal from "./CreditoModal";

interface TabCreditosProps {
  pastaId: string;
}

const faseColors: Record<string, "gold" | "green" | "muted" | "dark" | "red"> = {
  "1_analise": "muted",
  "2_parecer": "gold",
  "3_apresentacao": "gold",
  "4_aguardando_aprovacao": "gold",
  "5_utilizacao": "green",
  "6_findo": "dark",
  nao_autorizado: "red",
  extinto: "muted",
};

export default function TabCreditos({ pastaId }: TabCreditosProps) {
  const [creditos, setCreditos] = useState<Credito[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Credito | null | "new">(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCreditosByPasta(pastaId);
      setCreditos(data);
    } catch (err) {
      console.error("[TabCreditos] Erro:", err);
    } finally {
      setLoading(false);
    }
  }, [pastaId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id: string) {
    await deleteCredito(id);
    setCreditos((prev) => prev.filter((c) => c.id !== id));
  }

  function formatBRL(val: number) {
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  const totalApresentado = creditos.reduce((s, c) => s + c.creditoApresentado, 0);
  const totalValidado = creditos.reduce((s, c) => s + c.creditoValidado, 0);
  const totalSaldo = creditos.reduce((s, c) => s + c.saldo, 0);

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-st-muted font-sans animate-pulse">
          Carregando créditos...
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Totais */}
      {creditos.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white border border-st-border rounded-xl p-3 text-center">
            <p className="text-xs text-st-muted font-sans">Apresentado</p>
            <p className="font-serif font-bold text-st-dark text-sm">
              {formatBRL(totalApresentado)}
            </p>
          </div>
          <div className="bg-white border border-st-border rounded-xl p-3 text-center">
            <p className="text-xs text-st-muted font-sans">Validado</p>
            <p className="font-serif font-bold text-st-green text-sm">
              {formatBRL(totalValidado)}
            </p>
          </div>
          <div className="bg-white border border-st-border rounded-xl p-3 text-center">
            <p className="text-xs text-st-muted font-sans">Saldo</p>
            <p className="font-serif font-bold text-st-gold text-sm">
              {formatBRL(totalSaldo)}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif font-bold text-st-dark">
          Créditos ({creditos.length})
        </h2>
        <Btn variant="gold" onClick={() => setModal("new")}>
          + Novo Crédito
        </Btn>
      </div>

      {creditos.length === 0 ? (
        <div className="bg-white border border-st-border rounded-xl p-8 text-center">
          <p className="text-sm text-st-muted font-sans">
            Nenhum crédito cadastrado.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {creditos.map((c) => (
            <div
              key={c.id}
              className="bg-white border border-st-border rounded-xl p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-serif font-bold text-sm text-st-dark">
                      {c.titulo}
                    </h3>
                    <Badge color="dark">{c.tributo}</Badge>
                    <Badge color={faseColors[c.fase] || "muted"}>
                      {CREDITO_FASE_LABELS[c.fase as CreditoFase] || c.fase}
                    </Badge>
                  </div>
                  <div className="flex gap-4 text-xs text-st-muted font-sans flex-wrap">
                    <span>
                      Apresentado: <strong>{formatBRL(c.creditoApresentado)}</strong>
                    </span>
                    <span>
                      Validado: <strong className="text-st-green">{formatBRL(c.creditoValidado)}</strong>
                    </span>
                    <span>
                      Saldo: <strong className="text-st-gold">{formatBRL(c.saldo)}</strong>
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => setModal(c)}
                    className="text-xs text-st-muted hover:text-st-gold font-sans cursor-pointer px-2 py-1"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="text-xs text-st-muted hover:text-st-red font-sans cursor-pointer px-2 py-1"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <CreditoModal
          credito={modal === "new" ? null : modal}
          pastaId={pastaId}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            load();
          }}
        />
      )}
    </>
  );
}
