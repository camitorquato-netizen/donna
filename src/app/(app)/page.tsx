"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DashboardSummary, Cliente } from "@/lib/types";
import { getDashboardSummary, getRecentClientes } from "@/lib/store";
import SummaryCard from "@/components/SummaryCard";
import Badge from "@/components/Badge";

function formatBRL(val: number): string {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function Dashboard() {
  const router = useRouter();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentes, setRecentes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, r] = await Promise.all([
        getDashboardSummary(),
        getRecentClientes(5),
      ]);
      setSummary(s);
      setRecentes(r);
    } catch (err) {
      console.error("[Dashboard] Erro:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-st-muted font-sans animate-pulse">
          Carregando dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="font-serif text-xl sm:text-2xl font-bold text-st-dark">
          Dashboard
        </h1>
        <p className="text-sm text-st-muted font-sans mt-1">
          Visão geral do escritório
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <SummaryCard
          label="Clientes"
          value={summary?.totalClientes ?? 0}
          icon="◎"
          color="dark"
        />
        <SummaryCard
          label="Contratos Ativos"
          value={summary?.contratosAtivos ?? 0}
          icon="◑"
          color="gold"
        />
        <SummaryCard
          label="A Receber"
          value={formatBRL(summary?.totalAReceber ?? 0)}
          icon="▲"
          color="green"
        />
        <SummaryCard
          label="A Pagar"
          value={formatBRL(summary?.totalAPagar ?? 0)}
          icon="▼"
          color="red"
        />
      </div>

      {/* Clientes recentes */}
      <div className="bg-white border border-st-border rounded-xl p-4 sm:p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg font-bold text-st-dark">
            Clientes Recentes
          </h2>
          <button
            onClick={() => router.push("/clientes")}
            className="text-xs text-st-gold font-sans hover:underline cursor-pointer"
          >
            Ver todos →
          </button>
        </div>

        {recentes.length === 0 ? (
          <p className="text-sm text-st-muted font-sans py-4 text-center">
            Nenhum cliente cadastrado ainda.
          </p>
        ) : (
          <div className="space-y-2">
            {recentes.map((c) => (
              <div
                key={c.id}
                onClick={() => router.push(`/clientes/${c.id}`)}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-st-light/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-st-gold/10 flex items-center justify-center text-st-gold font-serif font-bold text-sm shrink-0">
                    {c.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-serif font-bold text-sm text-st-dark truncate">
                      {c.nome}
                    </p>
                    <p className="text-xs text-st-muted font-sans truncate">
                      {c.email || c.telefone || "Sem contato"}
                    </p>
                  </div>
                </div>
                <Badge color={c.tipoPessoa === "PJ" ? "dark" : "gold"}>
                  {c.tipoPessoa}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick link to Casos IA */}
      <div
        onClick={() => router.push("/casos")}
        className="bg-white border border-st-border rounded-xl p-4 sm:p-5 flex items-center justify-between hover:shadow-sm transition-shadow cursor-pointer"
      >
        <div>
          <h3 className="font-serif font-bold text-st-dark">Casos IA</h3>
          <p className="text-xs text-st-muted font-sans mt-1">
            Acessar workflow de planejamento patrimonial
          </p>
        </div>
        <span className="text-2xl text-st-gold">▸</span>
      </div>
    </div>
  );
}
