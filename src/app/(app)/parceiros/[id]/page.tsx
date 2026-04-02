"use client";
import { useState, useEffect, useCallback, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Parceiro, createEmptyParceiro } from "@/lib/types";
import { getParceiro, saveParceiro, deleteParceiro } from "@/lib/store";
import { useAuth } from "@/contexts/AuthContext";

export default function ParceiroDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { canEdit, canDelete } = useAuth();

  const isNew = searchParams.get("novo") === "1";
  const [parceiro, setParceiro] = useState<Parceiro | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(isNew);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isNew) {
      setParceiro(createEmptyParceiro(id));
      setLoading(false);
    } else {
      getParceiro(id)
        .then((p) => setParceiro(p))
        .finally(() => setLoading(false));
    }
  }, [id, isNew]);

  const set = useCallback(
    <K extends keyof Parceiro>(key: K, val: Parceiro[K]) => {
      setParceiro((prev) => (prev ? { ...prev, [key]: val } : prev));
    },
    []
  );

  async function handleSave() {
    if (!parceiro) return;
    await saveParceiro(parceiro);
    setIsEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleDelete() {
    if (!confirm("Tem certeza que deseja excluir este parceiro?")) return;
    await deleteParceiro(id);
    router.push("/parceiros");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-st-gold" />
      </div>
    );
  }

  if (!parceiro) {
    return (
      <p className="text-center py-12 text-st-muted font-sans">
        Parceiro não encontrado.
      </p>
    );
  }

  const dis = !isEditing;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => router.push("/parceiros")}
            className="text-sm text-st-muted hover:text-st-dark mb-1 cursor-pointer font-sans"
          >
            ← Parceiros
          </button>
          <h1 className="text-2xl font-serif text-st-dark">
            {parceiro.razaoSocial || "Novo Parceiro"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-sm text-st-green font-sans font-medium bg-st-green/10 px-3 py-1 rounded">
              Salvo com sucesso!
            </span>
          )}
          {canEdit && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="border border-st-gold text-st-gold px-4 py-2 rounded-lg text-sm font-sans hover:bg-st-gold/10 transition-colors cursor-pointer"
            >
              Editar
            </button>
          )}
          {isEditing && (
            <>
              <button
                onClick={() => {
                  if (isNew) router.push("/parceiros");
                  else {
                    setIsEditing(false);
                    getParceiro(id).then((p) => p && setParceiro(p));
                  }
                }}
                className="border border-st-border text-st-muted px-4 py-2 rounded-lg text-sm font-sans hover:bg-st-light transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="bg-st-gold text-white px-4 py-2 rounded-lg text-sm font-sans font-medium hover:bg-st-gold/90 transition-colors cursor-pointer"
              >
                Salvar
              </button>
            </>
          )}
          {canDelete && !isEditing && (
            <button
              onClick={handleDelete}
              className="border border-st-red/30 text-st-red px-4 py-2 rounded-lg text-sm font-sans hover:bg-st-red/10 transition-colors cursor-pointer"
            >
              Excluir
            </button>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="bg-white border border-st-border rounded-xl p-6 space-y-6">
        {/* Dados do Parceiro */}
        <div>
          <h2 className="text-sm font-sans font-semibold text-st-dark mb-3 uppercase tracking-wider">
            Dados do Parceiro
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-sans text-st-muted mb-1">
                Razão Social / Nome
              </label>
              <input
                disabled={dis}
                value={parceiro.razaoSocial}
                onChange={(e) => set("razaoSocial", e.target.value)}
                className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans disabled:opacity-60 disabled:bg-st-light focus:outline-none focus:border-st-gold"
              />
            </div>
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">
                CPF / CNPJ
              </label>
              <input
                disabled={dis}
                value={parceiro.cpfCnpj}
                onChange={(e) => set("cpfCnpj", e.target.value)}
                className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans disabled:opacity-60 disabled:bg-st-light focus:outline-none focus:border-st-gold"
              />
            </div>
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">
                Percentual Parceria (%)
              </label>
              <input
                disabled={dis}
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={parceiro.percentualParceria}
                onChange={(e) =>
                  set("percentualParceria", parseFloat(e.target.value) || 0)
                }
                className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans disabled:opacity-60 disabled:bg-st-light focus:outline-none focus:border-st-gold"
              />
            </div>
          </div>
        </div>

        {/* Contato */}
        <div>
          <h2 className="text-sm font-sans font-semibold text-st-dark mb-3 uppercase tracking-wider">
            Contato
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">
                E-mail
              </label>
              <input
                disabled={dis}
                type="email"
                value={parceiro.email}
                onChange={(e) => set("email", e.target.value)}
                className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans disabled:opacity-60 disabled:bg-st-light focus:outline-none focus:border-st-gold"
              />
            </div>
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">
                Telefone
              </label>
              <input
                disabled={dis}
                value={parceiro.telefone}
                onChange={(e) => set("telefone", e.target.value)}
                className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans disabled:opacity-60 disabled:bg-st-light focus:outline-none focus:border-st-gold"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-sans text-st-muted mb-1">
                Endereço
              </label>
              <input
                disabled={dis}
                value={parceiro.endereco}
                onChange={(e) => set("endereco", e.target.value)}
                className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans disabled:opacity-60 disabled:bg-st-light focus:outline-none focus:border-st-gold"
              />
            </div>
          </div>
        </div>

        {/* Financeiro */}
        <div>
          <h2 className="text-sm font-sans font-semibold text-st-dark mb-3 uppercase tracking-wider">
            Dados Bancários
          </h2>
          <textarea
            disabled={dis}
            rows={3}
            value={parceiro.dadosBancarios}
            onChange={(e) => set("dadosBancarios", e.target.value)}
            placeholder="Banco, agência, conta, PIX..."
            className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans disabled:opacity-60 disabled:bg-st-light focus:outline-none focus:border-st-gold"
          />
        </div>

        {/* Observações */}
        <div>
          <h2 className="text-sm font-sans font-semibold text-st-dark mb-3 uppercase tracking-wider">
            Observações
          </h2>
          <textarea
            disabled={dis}
            rows={3}
            value={parceiro.observacoes}
            onChange={(e) => set("observacoes", e.target.value)}
            className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans disabled:opacity-60 disabled:bg-st-light focus:outline-none focus:border-st-gold"
          />
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-sans text-st-muted">Status:</label>
          <button
            disabled={dis}
            onClick={() => set("ativo", !parceiro.ativo)}
            className={`text-xs font-sans px-3 py-1 rounded cursor-pointer transition-colors ${
              parceiro.ativo
                ? "bg-st-green/10 text-st-green"
                : "bg-st-muted/10 text-st-muted"
            } ${dis ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {parceiro.ativo ? "Ativo" : "Inativo"}
          </button>
        </div>
      </div>
    </div>
  );
}
