"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PilotoRct } from "@/lib/types";
import { getAllPilotosRct, deletePilotoRct } from "@/lib/store";
import Btn from "@/components/Btn";
import SearchInput from "@/components/SearchInput";
import EmptyState from "@/components/EmptyState";

export default function RadiografiaPage() {
  const router = useRouter();
  const [pilotos, setPilotos] = useState<PilotoRct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadPilotos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllPilotosRct();
      setPilotos(data);
    } catch (err) {
      console.error("[Radiografia] Erro ao carregar pilotos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPilotos();
  }, [loadPilotos]);

  async function handleDelete(id: string) {
    if (confirm("Tem certeza que deseja excluir esta análise?")) {
      await deletePilotoRct(id);
      await loadPilotos();
    }
  }

  const filtered = pilotos.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.clienteNome.toLowerCase().includes(q) ||
      p.clienteCnpj.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 sm:mb-8 gap-3">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-st-dark">
            Piloto RCT
          </h1>
          <p className="text-xs sm:text-sm text-st-muted font-sans mt-1">
            {loading
              ? "Carregando..."
              : `${pilotos.length} análise${pilotos.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Btn variant="gold" onClick={() => router.push("/radiografia/novo")}>
          + Nova Análise
        </Btn>
      </div>

      {!loading && pilotos.length > 0 && (
        <div className="mb-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nome do cliente..."
          />
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 sm:py-16">
          <p className="text-sm text-st-muted font-sans animate-pulse">
            Carregando análises do banco de dados...
          </p>
        </div>
      ) : pilotos.length === 0 ? (
        <EmptyState
          title="Nenhuma análise ainda"
          description='Clique em "Nova Análise" para iniciar seu primeiro Piloto RCT.'
          actionLabel="+ Nova Análise"
          onAction={() => router.push("/radiografia/novo")}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => {
            const preview = p.resultado.slice(0, 120).replace(/[#*|]/g, "").trim();
            const numArquivos = p.arquivosInfo.length;
            const tipos = [...new Set(p.arquivosInfo.map((a) => a.tipo))].join(", ");

            return (
              <div
                key={p.id}
                className="border border-st-border rounded-xl p-3 sm:p-4 bg-white hover:shadow-sm transition-shadow cursor-pointer"
                onClick={() => router.push(`/radiografia/${p.id}`)}
              >
                <div className="flex items-start sm:items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      <h3 className="font-serif font-bold text-st-dark text-sm sm:text-base truncate">
                        {p.clienteNome || "Sem nome"}
                      </h3>
                      {numArquivos > 0 && (
                        <span className="inline-block bg-st-gold/10 text-st-gold text-xs font-sans px-2 py-0.5 rounded">
                          {numArquivos} arquivo{numArquivos !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-3 sm:gap-4 mt-1 text-xs text-st-muted font-sans flex-wrap">
                      {p.clienteCnpj && (
                        <span className="truncate">{p.clienteCnpj}</span>
                      )}
                      {tipos && <span className="truncate">{tipos}</span>}
                      <span className="shrink-0">
                        {new Date(p.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    {preview && (
                      <p className="text-xs text-st-muted/70 font-sans mt-1 truncate">
                        {preview}...
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(p.id);
                      }}
                      className="px-2 py-1 text-st-red text-xs font-sans border border-st-border rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      Excluir
                    </button>
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
