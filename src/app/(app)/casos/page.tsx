"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Case, STAGE_LABELS, createEmptyCase } from "@/lib/types";
import { getAllCases, saveCase, deleteCase, newCaseId } from "@/lib/store";
import Btn from "@/components/Btn";
import Badge from "@/components/Badge";
import SearchInput from "@/components/SearchInput";
import EmptyState from "@/components/EmptyState";

export default function CasosPage() {
  const router = useRouter();
  const [cases, setCases] = useState<Case[]>([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [search, setSearch] = useState("");

  const loadCases = useCallback(async () => {
    setLoadingCases(true);
    try {
      const data = await getAllCases();
      setCases(data);
    } catch (err) {
      console.error("[Casos] Erro ao carregar casos:", err);
    } finally {
      setLoadingCases(false);
    }
  }, []);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  async function handleNewCase() {
    const id = newCaseId();
    const c = createEmptyCase(id);
    await saveCase(c);
    router.push(`/caso/${id}`);
  }

  async function handleDelete(id: string) {
    if (confirm("Tem certeza que deseja excluir este caso?")) {
      await deleteCase(id);
      await loadCases();
    }
  }

  const stageColors: Record<number, "gold" | "green" | "muted" | "red" | "dark"> = {
    1: "muted",
    2: "gold",
    3: "muted",
    4: "gold",
    5: "muted",
    6: "green",
  };

  const filtered = cases.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (c.clientName || "").toLowerCase().includes(q) ||
      (c.professional || "").toLowerCase().includes(q) ||
      (c.appsheetTicketId || "").toLowerCase().includes(q) ||
      (c.tipo || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 sm:mb-8 gap-3">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-st-dark">
            Casos IA
          </h1>
          <p className="text-xs sm:text-sm text-st-muted font-sans mt-1">
            {loadingCases
              ? "Carregando..."
              : `${cases.length} caso${cases.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Btn variant="gold" onClick={handleNewCase}>
          + Novo Caso
        </Btn>
      </div>

      {!loadingCases && cases.length > 0 && (
        <div className="mb-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nome do cliente..."
          />
        </div>
      )}

      {loadingCases ? (
        <div className="text-center py-12 sm:py-16">
          <p className="text-sm text-st-muted font-sans animate-pulse">
            Carregando casos do banco de dados...
          </p>
        </div>
      ) : cases.length === 0 ? (
        <EmptyState
          title="Nenhum caso ainda"
          description='Clique em "Novo Caso" para iniciar sua primeira análise patrimonial.'
          actionLabel="+ Criar Primeiro Caso"
          onAction={handleNewCase}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="border border-st-border rounded-xl p-3 sm:p-4 bg-white hover:shadow-sm transition-shadow cursor-pointer"
              onClick={() => router.push(`/caso/${c.id}`)}
            >
              <div className="flex items-start sm:items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <h3 className="font-serif font-bold text-st-dark text-sm sm:text-base truncate">
                      {c.clientName || "Sem nome"}
                    </h3>
                    <Badge color={stageColors[c.step]}>
                      {STAGE_LABELS[c.step]}
                    </Badge>
                  </div>
                  <div className="flex gap-3 sm:gap-4 mt-1 text-xs text-st-muted font-sans flex-wrap">
                    {c.professional && <span className="truncate">{c.professional}</span>}
                    {c.tipo && <span className="truncate">{c.tipo}</span>}
                    {c.appsheetTicketId && (
                      <span className="truncate text-st-gold">#{c.appsheetTicketId}</span>
                    )}
                    <span className="shrink-0">
                      {new Date(c.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(c.id);
                    }}
                    className="px-2 py-1 text-st-red text-xs font-sans border border-st-border rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
