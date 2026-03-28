"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Usuario, USUARIO_PERMISSAO_LABELS, UsuarioPermissao } from "@/lib/types";
import { getAllUsuarios } from "@/lib/store";
import Btn from "@/components/Btn";
import Badge from "@/components/Badge";
import SearchInput from "@/components/SearchInput";
import EmptyState from "@/components/EmptyState";

const permissaoColors: Record<string, "gold" | "green" | "muted" | "dark"> = {
  total: "green",
  restrita: "gold",
  somente_leitura: "muted",
};

export default function UsuariosPage() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterAtivo, setFilterAtivo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllUsuarios(false);
      setUsuarios(data);
    } catch (err) {
      console.error("[Usuarios] Erro:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function handleNew() {
    const id = crypto.randomUUID();
    router.push(`/usuarios/${id}?novo=1`);
  }

  const filtered = usuarios.filter((u) => {
    if (filterAtivo === "ativo" && !u.ativo) return false;
    if (filterAtivo === "inativo" && u.ativo) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.nome.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.cargo.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 sm:mb-8 gap-3">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-st-dark">
            Usuários
          </h1>
          <p className="text-xs sm:text-sm text-st-muted font-sans mt-1">
            {loading
              ? "Carregando..."
              : `${usuarios.length} usuário${usuarios.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Btn variant="gold" onClick={handleNew}>
          + Novo Usuário
        </Btn>
      </div>

      {!loading && usuarios.length > 0 && (
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Buscar por nome, email ou cargo..."
            />
          </div>
          <select
            value={filterAtivo}
            onChange={(e) => setFilterAtivo(e.target.value)}
            className="border border-st-border rounded-lg px-3 py-2 text-sm font-sans bg-white focus:outline-none focus:border-st-gold"
          >
            <option value="">Todos</option>
            <option value="ativo">Ativos</option>
            <option value="inativo">Inativos</option>
          </select>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-sm text-st-muted font-sans animate-pulse">
            Carregando usuários...
          </p>
        </div>
      ) : usuarios.length === 0 ? (
        <EmptyState
          title="Nenhum usuário cadastrado"
          description='Clique em "Novo Usuário" para adicionar o primeiro usuário.'
          actionLabel="+ Novo Usuário"
          onAction={handleNew}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((u) => (
            <div
              key={u.id}
              onClick={() => router.push(`/usuarios/${u.id}`)}
              className="border border-st-border rounded-xl p-3 sm:p-4 bg-white hover:shadow-sm transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-st-gold/10 flex items-center justify-center text-st-gold font-serif font-bold text-sm shrink-0">
                    {u.nome ? u.nome.charAt(0).toUpperCase() : "?"}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-serif font-bold text-st-dark text-sm sm:text-base truncate">
                        {u.nome || "Usuário sem nome"}
                      </h3>
                      <Badge color={permissaoColors[u.permissao] || "muted"}>
                        {USUARIO_PERMISSAO_LABELS[u.permissao as UsuarioPermissao] || u.permissao}
                      </Badge>
                      {!u.ativo && (
                        <Badge color="red">Inativo</Badge>
                      )}
                    </div>
                    <div className="flex gap-3 mt-0.5 text-xs text-st-muted font-sans flex-wrap">
                      {u.email && <span className="truncate">{u.email}</span>}
                      {u.cargo && <span>{u.cargo}</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <p className="text-center text-sm text-st-muted font-sans py-8">
              Nenhum usuário encontrado com esses filtros.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
