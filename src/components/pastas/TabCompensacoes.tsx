"use client";
import { useState, useEffect, useCallback } from "react";
import { Credito, ControleRct, Contrato } from "@/lib/types";
import {
  getCreditosByPasta,
  getControleRctByCredito,
  deleteControleRct,
  getContrato,
} from "@/lib/store";
import Btn from "@/components/Btn";
import Badge from "@/components/Badge";
import CompensacaoModal from "./CompensacaoModal";

interface TabCompensacoesProps {
  pastaId: string;
  contratoId?: string;
  clienteId: string;
}

interface CreditoCompensacoes {
  credito: Credito;
  compensacoes: ControleRct[];
}

export default function TabCompensacoes({
  pastaId,
  contratoId,
  clienteId,
}: TabCompensacoesProps) {
  const [data, setData] = useState<CreditoCompensacoes[]>([]);
  const [loading, setLoading] = useState(true);
  const [contrato, setContrato] = useState<Contrato | null>(null);
  const [modal, setModal] = useState<{
    compensacao: ControleRct | null;
    creditoId: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [creditos, contr] = await Promise.all([
        getCreditosByPasta(pastaId),
        contratoId ? getContrato(contratoId) : Promise.resolve(null),
      ]);
      setContrato(contr);
      const items: CreditoCompensacoes[] = [];
      for (const credito of creditos) {
        const compensacoes = await getControleRctByCredito(credito.id);
        items.push({ credito, compensacoes });
      }
      setData(items);
    } catch (err) {
      console.error("[TabCompensacoes] Erro:", err);
    } finally {
      setLoading(false);
    }
  }, [pastaId, contratoId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id: string) {
    await deleteControleRct(id);
    load();
  }

  function formatBRL(val: number) {
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-st-muted font-sans animate-pulse">
          Carregando compensações...
        </p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white border border-st-border rounded-xl p-8 text-center">
        <p className="text-sm text-st-muted font-sans">
          Nenhum crédito cadastrado. Crie créditos na aba &quot;Créditos&quot; primeiro.
        </p>
      </div>
    );
  }

  const percentualHonorarios = contrato?.percentualHonorarios ?? 0.2;

  return (
    <>
      <div className="space-y-6">
        {data.map(({ credito, compensacoes }) => {
          const totalCompensado = compensacoes.reduce(
            (s, c) => s + c.valorCompensado,
            0
          );

          return (
            <section
              key={credito.id}
              className="bg-white border border-st-border rounded-xl p-4 sm:p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-serif font-bold text-st-dark">
                    {credito.titulo}
                  </h3>
                  <Badge color="dark">{credito.tributo}</Badge>
                </div>
                <Btn
                  variant="gold"
                  className="text-xs !px-3 !py-1.5"
                  onClick={() =>
                    setModal({ compensacao: null, creditoId: credito.id })
                  }
                >
                  + Compensação
                </Btn>
              </div>

              {/* Total compensado */}
              <div className="text-xs font-sans text-st-muted mb-3">
                Total compensado:{" "}
                <strong className="text-st-green">{formatBRL(totalCompensado)}</strong>
                {" / "}
                Saldo crédito:{" "}
                <strong className="text-st-gold">{formatBRL(credito.saldo)}</strong>
              </div>

              {compensacoes.length === 0 ? (
                <p className="text-xs text-st-muted font-sans text-center py-4">
                  Nenhuma compensação registrada.
                </p>
              ) : (
                <div className="space-y-2">
                  {compensacoes.map((comp) => (
                    <div
                      key={comp.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-st-light/50 hover:bg-st-light transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex gap-3 text-xs font-sans text-st-dark flex-wrap">
                          <span>
                            <strong>{formatBRL(comp.valorCompensado)}</strong>
                          </span>
                          {comp.tributoCompensado && (
                            <span className="text-st-muted">
                              → {comp.tributoCompensado}
                            </span>
                          )}
                          {comp.dataCompensacao && (
                            <span className="text-st-muted">
                              {new Date(
                                comp.dataCompensacao + "T00:00:00"
                              ).toLocaleDateString("pt-BR")}
                            </span>
                          )}
                          {comp.formaUtilizacao && (
                            <span className="text-st-muted">
                              {comp.formaUtilizacao}
                            </span>
                          )}
                          {comp.boletoValor > 0 && (
                            <span className="text-st-gold">
                              Honorários: {formatBRL(comp.boletoValor)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() =>
                            setModal({
                              compensacao: comp,
                              creditoId: credito.id,
                            })
                          }
                          className="text-xs text-st-muted hover:text-st-gold font-sans cursor-pointer px-2 py-1"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(comp.id)}
                          className="text-xs text-st-muted hover:text-st-red font-sans cursor-pointer px-2 py-1"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {modal && (
        <CompensacaoModal
          compensacao={modal.compensacao}
          creditoId={modal.creditoId}
          pastaId={pastaId}
          clienteId={clienteId}
          percentualHonorarios={percentualHonorarios}
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
