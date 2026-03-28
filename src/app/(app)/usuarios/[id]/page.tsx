"use client";
import { use, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Usuario, USUARIO_PERMISSAO_LABELS, UsuarioPermissao, createEmptyUsuario } from "@/lib/types";
import { getUsuario, saveUsuario, deleteUsuario } from "@/lib/store";
import Btn from "@/components/Btn";

const inputClass =
  "w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold disabled:opacity-60 disabled:bg-st-light disabled:cursor-not-allowed";
const selectClass =
  "w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold bg-white disabled:opacity-60 disabled:bg-st-light disabled:cursor-not-allowed";

export default function UsuarioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNew = searchParams.get("novo") === "1";
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (isNew) {
        setUsuario(createEmptyUsuario(id));
        setIsEditing(true);
      } else {
        const u = await getUsuario(id);
        setUsuario(u);
        if (u && !u.nome) setIsEditing(true);
      }
    } catch (err) {
      console.error("[UsuarioDetail] Erro:", err);
    } finally {
      setLoading(false);
    }
  }, [id, isNew]);

  useEffect(() => {
    load();
  }, [load]);

  function set<K extends keyof Usuario>(key: K, val: Usuario[K]) {
    setUsuario((prev) => (prev ? { ...prev, [key]: val } : prev));
  }

  async function handleSave() {
    if (!usuario) return;
    setSaving(true);
    try {
      await saveUsuario(usuario);
      setIsEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("[UsuarioDetail] Erro ao salvar:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel() {
    await load();
    setIsEditing(false);
  }

  async function handleDelete() {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;
    await deleteUsuario(id);
    router.push("/usuarios");
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center">
        <p className="text-sm text-st-muted font-sans animate-pulse">
          Carregando usuário...
        </p>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center">
        <p className="text-sm text-st-muted font-sans">
          Usuário não encontrado.
        </p>
        <button
          onClick={() => router.push("/usuarios")}
          className="mt-3 text-sm text-st-gold font-sans hover:underline cursor-pointer"
        >
          ← Voltar para usuários
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => router.push("/usuarios")}
        className="text-sm text-st-muted hover:text-st-dark font-sans transition-colors mb-4 cursor-pointer"
      >
        ← Voltar para usuários
      </button>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-full bg-st-gold/10 flex items-center justify-center text-st-gold font-serif font-bold text-lg shrink-0">
            {usuario.nome ? usuario.nome.charAt(0).toUpperCase() : "?"}
          </div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-st-dark truncate">
            {usuario.nome || "Novo Usuário"}
          </h1>
        </div>
        {isEditing ? (
          <div className="flex gap-2 shrink-0">
            <Btn variant="ghost" onClick={handleCancel}>
              Cancelar
            </Btn>
            <Btn variant="gold" onClick={handleSave} loading={saving}>
              Salvar
            </Btn>
          </div>
        ) : (
          <div className="flex items-center gap-3 shrink-0">
            {saved && (
              <span className="text-sm font-sans text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-1 animate-pulse">
                Salvo com sucesso!
              </span>
            )}
            <Btn variant="gold" onClick={() => setIsEditing(true)}>
              Editar
            </Btn>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Dados Pessoais */}
        <section className="bg-white border border-st-border rounded-xl p-4 sm:p-5">
          <h2 className="font-serif font-bold text-st-dark mb-4">
            Dados Pessoais
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">
                Nome
              </label>
              <input
                type="text"
                value={usuario.nome}
                onChange={(e) => set("nome", e.target.value)}
                disabled={!isEditing}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">
                Email
              </label>
              <input
                type="email"
                value={usuario.email}
                onChange={(e) => set("email", e.target.value)}
                disabled={!isEditing}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">
                Cargo
              </label>
              <input
                type="text"
                value={usuario.cargo}
                onChange={(e) => set("cargo", e.target.value)}
                disabled={!isEditing}
                placeholder="Ex: Advogado, Estagiário, Analista"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">
                Foto (URL)
              </label>
              <input
                type="text"
                value={usuario.fotoUrl}
                onChange={(e) => set("fotoUrl", e.target.value)}
                disabled={!isEditing}
                placeholder="https://..."
                className={inputClass}
              />
            </div>
          </div>
        </section>

        {/* Acesso */}
        <section className="bg-white border border-st-border rounded-xl p-4 sm:p-5">
          <h2 className="font-serif font-bold text-st-dark mb-4">Acesso</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">
                Permissão
              </label>
              <select
                value={usuario.permissao}
                onChange={(e) =>
                  set("permissao", e.target.value as UsuarioPermissao)
                }
                disabled={!isEditing}
                className={selectClass}
              >
                {Object.entries(USUARIO_PERMISSAO_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">
                Status
              </label>
              <div className="flex items-center gap-3 mt-1">
                <label
                  className={`flex items-center gap-2 text-sm font-sans ${
                    !isEditing ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={usuario.ativo}
                    onChange={(e) => set("ativo", e.target.checked)}
                    disabled={!isEditing}
                    className="w-4 h-4 accent-st-gold"
                  />
                  Ativo
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Info */}
        {usuario.createdAt && (
          <section className="bg-white border border-st-border rounded-xl p-4 sm:p-5">
            <h2 className="font-serif font-bold text-st-dark mb-4">
              Informações
            </h2>
            <div className="text-sm text-st-muted font-sans">
              <span className="font-medium">Data de Criação:</span>{" "}
              {new Date(usuario.createdAt).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </div>
          </section>
        )}

        {/* Excluir */}
        {isEditing && (
          <div className="flex justify-end">
            <button
              onClick={handleDelete}
              className="text-sm text-st-red hover:underline font-sans cursor-pointer"
            >
              Excluir Usuário
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
