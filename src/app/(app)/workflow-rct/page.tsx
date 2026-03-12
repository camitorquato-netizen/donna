"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CreditoView, WfRct, WF_RCT_TAREFA_LABELS, WfRctTarefa } from "@/lib/types";
import { getAllCreditosView, getWfRctByCredito } from "@/lib/store";
import Badge from "@/components/Badge";
import SearchInput from "@/components/SearchInput";
import EmptyState from "@/components/EmptyState";

interface CreditoComWf extends CreditoView {
  wfTarefa: WfRctTarefa | "concluido";
  wfLabel: string;
}

/** Retorna a tarefa atual (primeira pendente) do workflow */
function getWorkflowTarefa(steps: WfRct[]): { tarefa: WfRctTarefa | "concluido"; label: string } {
  if (steps.length === 0) return { tarefa: "1_levantamento", label: "Levantamento" };
  const pendente = steps.find((s) => s.status === "pendente");
  if (!pendente) return { tarefa: "concluido", label: "Concluído" };
  return {
    tarefa: pendente.tarefa as WfRctTarefa,
    label: WF_RCT_TAREFA_LABELS[pendente.tarefa as WfRctTarefa] || pendente.tarefa,
  };
}

const KANBAN_COLUMNS: { key: WfRctTarefa | "concluido"; label: string; color: string }[] = [
  { key: "1_levantamento", label: "Levantamento", color: "bg-blue-50 border-blue-200" },
  { key: "2_parecer", label: "Revisão", color: "bg-amber-50 border-amber-200" },
  { key: "3_apresentacao", label: "Apresentação", color: "bg-orange-50 border-orange-200" },
  { key: "4_retificacoes", label: "Retificações", color: "bg-purple-50 border-purple-200" },
  { key: "5_compensacoes", label: "Compensações", color: "bg-emerald-50 border-emerald-200" },
  { key: "6_faturamento", label: "Findo", color: "bg-gray-50 border-gray-200" },
  { key: "concluido", label: "Concluído", color: "bg-green-50 border-green-200" },
];

export default function WorkflowRctPage() {
  const router = useRouter();
  const [creditos, setCreditos] = useState<CreditoComWf[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllCreditosView();
      const comWf: CreditoComWf[] = await Promise.all(
        data.map(async (c) => {
          const steps = await getWfRctByCredito(c.id);
          const wf = getWorkflowTarefa(steps);
          return { ...c, wfTarefa: wf.tarefa, wfLabel: wf.label };
        })
      );
      setCreditos(comWf);
    } catch (err) {
      console.error("[WorkflowRCT] Erro:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function formatBRL(val: number) {
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  const filtered = creditos.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.clienteNome.toLowerCase().includes(q) ||
      c.titulo.toLowerCase().includes(q) ||
      c.tributo.toLowerCase().includes(q) ||
      c.responsavelNome.toLowerCase().includes(q) ||
      c.wfLabel.toLowerCase().includes(q) ||
      c.pastaTitulo.toLowerCase().includes(q)
    );
  });

  /** Créditos agrupados por coluna */
  function getCreditosForColumn(key: WfRctTarefa | "concluido") {
    return filtered.filter((c) => c.wfTarefa === key);
  }

  return (
    <div className="max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-st-dark">
            Workflow RCT
          </h1>
          <p className="text-xs sm:text-sm text-st-muted font-sans mt-1">
            {loading
              ? "Carregando..."
              : `${creditos.length} crédito${creditos.length !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      {!loading && creditos.length > 0 && (
        <div className="mb-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por cliente, crédito, analista, etapa..."
          />
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 sm:py-16">
          <p className="text-sm text-st-muted font-sans animate-pulse">
            Carregando créditos e workflows...
          </p>
        </div>
      ) : creditos.length === 0 ? (
        <EmptyState
          title="Nenhum crédito cadastrado"
          description="Créditos aparecem aqui quando cadastrados nas pastas de serviço."
        />
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-2 px-2">
          {KANBAN_COLUMNS.map((col) => {
            const items = getCreditosForColumn(col.key);
            return (
              <div
                key={col.key}
                className="flex-shrink-0 w-[260px] flex flex-col"
              >
                {/* Column header */}
                <div className={`rounded-t-xl border px-3 py-2.5 ${col.color}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-sans font-bold text-xs text-st-dark uppercase tracking-wide">
                      {col.label}
                    </h3>
                    <span className="text-xs font-sans font-medium text-st-muted bg-white/80 rounded-full px-2 py-0.5">
                      {items.length}
                    </span>
                  </div>
                </div>

                {/* Column body */}
                <div className="flex-1 bg-white/50 border border-t-0 border-st-border rounded-b-xl p-2 space-y-2 min-h-[120px]">
                  {items.length === 0 ? (
                    <p className="text-[11px] text-st-muted font-sans text-center py-6 opacity-60">
                      Nenhum crédito
                    </p>
                  ) : (
                    items.map((c) => (
                      <div
                        key={c.id}
                        onClick={() =>
                          router.push(
                            `/pastas/${c.pastaId}?tab=creditos&credito=${c.id}`
                          )
                        }
                        className="bg-white border border-st-border rounded-lg p-2.5 hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <p className="font-serif font-bold text-xs text-st-dark leading-snug mb-1 line-clamp-2">
                          {c.titulo}
                        </p>
                        <div className="flex items-center gap-1 flex-wrap mb-1.5">
                          <Badge color="dark">{c.tributo}</Badge>
                        </div>
                        <p className="text-[11px] text-st-muted font-sans truncate">
                          {c.clienteNome || "Sem cliente"}
                        </p>
                        {c.responsavelNome && (
                          <p className="text-[11px] text-st-muted font-sans truncate">
                            {c.responsavelNome}
                          </p>
                        )}
                        <p className="text-[11px] font-sans font-medium text-st-gold mt-1">
                          {formatBRL(c.creditoApresentado)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
