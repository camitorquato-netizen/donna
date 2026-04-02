"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Tarefa,
  TAREFA_STATUS_LABELS,
  TarefaStatus,
  TAREFA_PRIORIDADE_LABELS,
  TarefaPrioridade,
  Usuario,
} from "@/lib/types";
import { getTarefasByPasta, deleteTarefa, getAllUsuarios } from "@/lib/store";
import Btn from "@/components/Btn";
import Badge from "@/components/Badge";
import TarefaModal from "./TarefaModal";

interface TabTarefasProps {
  pastaId: string;
}

const statusColors: Record<string, "gold" | "green" | "muted" | "dark"> = {
  pendente: "muted",
  em_andamento: "gold",
  concluida: "green",
  cancelada: "dark",
};

const prioridadeColors: Record<string, "gold" | "green" | "red" | "muted"> = {
  baixa: "muted",
  normal: "green",
  alta: "gold",
  urgente: "red",
};

export default function TabTarefas({ pastaId }: TabTarefasProps) {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Tarefa | null | "new">(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, users] = await Promise.all([
        getTarefasByPasta(pastaId),
        getAllUsuarios(false),
      ]);
      setTarefas(data);
      setUsuarios(users);
    } catch (err) {
      console.error("[TabTarefas] Erro:", err);
    } finally {
      setLoading(false);
    }
  }, [pastaId]);

  useEffect(() => {
    load();
  }, [load]);

  function getUsuarioNome(id?: string) {
    if (!id) return null;
    return usuarios.find((u) => u.id === id)?.nome || null;
  }

  async function handleDelete(id: string) {
    await deleteTarefa(id);
    setTarefas((prev) => prev.filter((t) => t.id !== id));
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-st-muted font-sans animate-pulse">
          Carregando tarefas...
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif font-bold text-st-dark">
          Tarefas ({tarefas.length})
        </h2>
        <Btn variant="gold" onClick={() => setModal("new")}>
          + Nova Tarefa
        </Btn>
      </div>

      {tarefas.length === 0 ? (
        <div className="bg-white border border-st-border rounded-xl p-8 text-center">
          <p className="text-sm text-st-muted font-sans">
            Nenhuma tarefa cadastrada.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tarefas.map((t) => (
            <div
              key={t.id}
              className="bg-white border border-st-border rounded-xl p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-serif font-bold text-sm text-st-dark">
                      {t.titulo}
                    </h3>
                    <Badge color={statusColors[t.status] || "muted"}>
                      {TAREFA_STATUS_LABELS[t.status as TarefaStatus] || t.status}
                    </Badge>
                    <Badge color={prioridadeColors[t.prioridade] || "muted"}>
                      {TAREFA_PRIORIDADE_LABELS[t.prioridade as TarefaPrioridade] || t.prioridade}
                    </Badge>
                  </div>
                  {t.descricao && (
                    <p className="text-xs text-st-muted font-sans line-clamp-2 mb-1">
                      {t.descricao}
                    </p>
                  )}
                  <div className="flex gap-3 text-xs text-st-muted font-sans flex-wrap">
                    {t.tipo && <span>{t.tipo}</span>}
                    {t.prazo && (
                      <span className="text-st-gold font-medium">
                        Prazo:{" "}
                        {new Date(t.prazo + "T00:00:00").toLocaleDateString("pt-BR")}
                      </span>
                    )}
                    {getUsuarioNome(t.responsavelId) && (
                      <span>Resp: {getUsuarioNome(t.responsavelId)}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => setModal(t)}
                    className="text-xs text-st-muted hover:text-st-gold font-sans cursor-pointer px-2 py-1"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
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
        <TarefaModal
          tarefa={modal === "new" ? null : modal}
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
