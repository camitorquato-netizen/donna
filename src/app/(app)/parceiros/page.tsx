"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Parceiro } from "@/lib/types";
import { getAllParceiros } from "@/lib/store";
import { useAuth } from "@/contexts/AuthContext";

export default function ParceirosPage() {
  const router = useRouter();
  const { canEdit } = useAuth();
  const [parceiros, setParceiros] = useState<Parceiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getAllParceiros()
      .then(setParceiros)
      .finally(() => setLoading(false));
  }, []);

  const filtered = parceiros.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.razaoSocial.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.cpfCnpj.includes(q)
    );
  });

  function handleNew() {
    const id = crypto.randomUUID();
    router.push(`/parceiros/${id}?novo=1`);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-st-gold" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif text-st-dark">Parceiros</h1>
          <p className="text-sm text-st-muted font-sans">
            {parceiros.length} parceiro{parceiros.length !== 1 && "s"}
          </p>
        </div>
        {canEdit && (
          <button
            onClick={handleNew}
            className="bg-st-gold text-white px-4 py-2 rounded-lg text-sm font-sans font-medium hover:bg-st-gold/90 transition-colors cursor-pointer"
          >
            + Novo Parceiro
          </button>
        )}
      </div>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, e-mail ou CPF/CNPJ..."
          className="flex-1 border border-st-border rounded-lg px-4 py-2.5 text-sm font-sans focus:outline-none focus:border-st-gold bg-white"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-st-muted font-sans text-sm">
          Nenhum parceiro encontrado.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <div
              key={p.id}
              onClick={() => router.push(`/parceiros/${p.id}`)}
              className="bg-white border border-st-border rounded-xl p-4 cursor-pointer hover:border-st-gold/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-sans font-semibold text-st-dark">
                    {p.razaoSocial || "Sem nome"}
                  </h3>
                  <div className="flex items-center gap-4 mt-1 text-xs text-st-muted font-sans">
                    {p.cpfCnpj && <span>{p.cpfCnpj}</span>}
                    {p.email && <span>{p.email}</span>}
                    {p.telefone && <span>{p.telefone}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {p.percentualParceria > 0 && (
                    <span className="text-xs font-sans font-medium text-st-gold bg-st-gold/10 px-2 py-1 rounded">
                      {p.percentualParceria}%
                    </span>
                  )}
                  <span
                    className={`text-xs font-sans px-2 py-1 rounded ${
                      p.ativo
                        ? "bg-st-green/10 text-st-green"
                        : "bg-st-muted/10 text-st-muted"
                    }`}
                  >
                    {p.ativo ? "Ativo" : "Inativo"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
