"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Tarefa,
  TarefaStatus,
  TarefaPrioridade,
  TAREFA_STATUS_LABELS,
  TAREFA_PRIORIDADE_LABELS,
  Usuario,
} from "@/lib/types";
import { getAllTarefas, getAllUsuarios, deleteTarefa } from "@/lib/store";
import Badge from "@/components/Badge";
import { useAuth } from "@/contexts/AuthContext";

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

type TarefaComPasta = Tarefa & { pastaTitulo?: string; pastaNumero?: string };
type Filtro = "minhas" | "todas" | "pendentes" | "vencidas";

export default function TarefasPage() {
  const router = useRouter();
  const { usuario, isReadOnly } = useAuth();
  const [tarefas, setTarefas] = useState<TarefaComPasta[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<Filtro>("minhas");
  const [filtroResponsavel, setFiltroResponsavel] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, u] = await Promise.all([getAllTarefas(), getAllUsuarios(false)]);
      setTarefas(t);
      setUsuarios(u);
    } catch (err) {
      console.error("[Tarefas] Erro:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function getNome(id?: string) {
    if (!id) return null;
    return usuarios.find((u) => u.id === id)?.nome || null;
  }

  const hoje = new Date().toISOString().slice(0, 10);

  const filtradas = tarefas.filter((t) => {
    // Filtro por responsável
    if (filtroResponsavel && t.responsavelId !== filtroResponsavel) return false;

    if (filtro === "minhas") {
      return (
        t.responsavelId === usuario?.id ||
        t.executanteId === usuario?.id ||
        t.solicitanteId === usuario?.id
      );
    }
    if (filtro === "pendentes") {
      return t.status === "pendente" || t.status === "em_andamento";
    }
    if (filtro === "vencidas") {
      return t.prazo && t.prazo < hoje && t.status !== "concluida" && t.status !== "cancelada";
    }
    return true; // todas
  });

  async function handleDelete(id: string) {
    if (!window.confirm("Excluir esta tarefa?")) return;
    await deleteTarefa(id);
    setTarefas((prev) => prev.filter((t) => t.id !== id));
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <p className="text-sm text-st-muted font-sans animate-pulse">
          Carregando tarefas...
        </p>
      </div>
    );
  }

  const vencidas = tarefas.filter(
    (t) => t.prazo && t.prazo < hoje && t.status !== "concluida" && t.status !== "cancelada"
  ).length;

  const minhas = tarefas.filter(
    (t) =>
      t.responsavelId === usuario?.id ||
      t.executanteId === usuario?.id ||
      t.solicitanteId === usuario?.id
  ).length;

  const pendentes = tarefas.filter(
    (t) => t.status === "pendente" || t.status === "em_andamento"
  ).length;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="font-serif text-xl sm:text-2xl font-bold text-st-dark mb-6">
        Tarefas
      </h1>

      {/* Cards resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <button
          onClick={() => setFiltro("minhas")}
          className={`rounded-xl p-3 text-center border transition-colors cursor-pointer ${
            filtro === "minhas"
              ? "bg-st-gold/10 border-st-gold"
              : "bg-white border-st-border hover:border-st-gold/50"
          }`}
        >
          <p className="text-xs text-st-muted font-sans">Minhas</p>
          <p className="font-serif font-bold text-st-dark text-lg">{minhas}</p>
        </button>
        <button
          onClick={() => setFiltro("pendentes")}
          className={`rounded-xl p-3 text-center border transition-colors cursor-pointer ${
            filtro === "pendentes"
              ? "bg-st-gold/10 border-st-gold"
              : "bg-white border-st-border hover:border-st-gold/50"
          }`}
        >
          <p className="text-xs text-st-muted font-sans">Pendentes</p>
          <p className="font-serif font-bold text-st-gold text-lg">{pendentes}</p>
        </button>
        <button
          onClick={() => setFiltro("vencidas")}
          className={`rounded-xl p-3 text-center border transition-colors cursor-pointer ${
            filtro === "vencidas"
              ? "bg-red-50 border-red-300"
              : "bg-white border-st-border hover:border-red-300"
          }`}
        >
          <p className="text-xs text-st-muted font-sans">Vencidas</p>
          <p className="font-serif font-bold text-red-500 text-lg">{vencidas}</p>
        </button>
        <button
          onClick={() => setFiltro("todas")}
          className={`rounded-xl p-3 text-center border transition-colors cursor-pointer ${
            filtro === "todas"
              ? "bg-st-gold/10 border-st-gold"
              : "bg-white border-st-border hover:border-st-gold/50"
          }`}
        >
          <p className="text-xs text-st-muted font-sans">Todas</p>
          <p className="font-serif font-bold text-st-dark text-lg">{tarefas.length}</p>
        </button>
      </div>

      {/* Filtro por responsável */}
      <div className="flex items-center gap-3 mb-4">
        <select
          value={filtroResponsavel}
          onChange={(e) => setFiltroResponsavel(e.target.value)}
          className="border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold bg-white"
        >
          <option value="">Todos os responsáveis</option>
          {usuarios.map((u) => (
            <option key={u.id} value={u.id}>{u.nome}</option>
          ))}
        </select>
        <p className="text-sm text-st-muted font-sans">
          {filtradas.length} tarefa{filtradas.length !== 1 ? "s" : ""}
        </p>
      </div>

      {filtradas.length === 0 ? (
        <div className="bg-white border border-st-border rounded-xl p-8 text-center">
          <p className="text-sm text-st-muted font-sans">
            Nenhuma tarefa encontrada.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtradas.map((t) => {
            const vencida =
              t.prazo && t.prazo < hoje && t.status !== "concluida" && t.status !== "cancelada";
            return (
              <div
                key={t.id}
                className={`bg-white border rounded-xl p-4 hover:shadow-sm transition-shadow ${
                  vencida ? "border-red-300" : "border-st-border"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-serif font-bold text-sm text-st-dark">
                        {t.titulo || "Sem título"}
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
                      {t.prazo && (
                        <span className={vencida ? "text-red-500 font-medium" : "text-st-gold font-medium"}>
                          Prazo: {new Date(t.prazo + "T00:00:00").toLocaleDateString("pt-BR")}
                          {vencida && " (vencida)"}
                        </span>
                      )}
                      {getNome(t.responsavelId) && (
                        <span>Resp: {getNome(t.responsavelId)}</span>
                      )}
                      {(t.pastaTitulo || t.pastaNumero) && (
                        <button
                          onClick={() => router.push(`/pastas/${t.pastaId}?tab=tarefas`)}
                          className="text-st-gold hover:underline cursor-pointer"
                        >
                          Pasta: {t.pastaTitulo || t.pastaNumero}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {t.pastaId && (
                      <button
                        onClick={() => router.push(`/pastas/${t.pastaId}?tab=tarefas`)}
                        className="text-xs text-st-muted hover:text-st-gold font-sans cursor-pointer px-2 py-1"
                      >
                        Abrir
                      </button>
                    )}
                    {!isReadOnly && (
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="text-xs text-st-muted hover:text-red-500 font-sans cursor-pointer px-2 py-1"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
