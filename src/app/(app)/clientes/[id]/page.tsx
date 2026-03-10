"use client";
import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Cliente, STATUS_PIPELINE_LABELS, StatusPipeline, Contrato, CONTRATO_STATUS_LABELS, ContratoStatus } from "@/lib/types";
import { getCliente, saveCliente, getContratosByCliente } from "@/lib/store";
import Btn from "@/components/Btn";
import Badge from "@/components/Badge";

export default function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, cts] = await Promise.all([
        getCliente(id),
        getContratosByCliente(id),
      ]);
      setCliente(c);
      setContratos(cts);
    } catch (err) {
      console.error("[ClienteDetail] Erro:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  function set<K extends keyof Cliente>(key: K, val: Cliente[K]) {
    setCliente((prev) => (prev ? { ...prev, [key]: val } : prev));
  }

  async function handleSave() {
    if (!cliente) return;
    setSaving(true);
    try {
      await saveCliente(cliente);
    } catch (err) {
      console.error("[ClienteDetail] Erro ao salvar:", err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center">
        <p className="text-sm text-st-muted font-sans animate-pulse">
          Carregando cliente...
        </p>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center">
        <p className="text-sm text-st-muted font-sans">
          Cliente não encontrado.
        </p>
        <button
          onClick={() => router.push("/clientes")}
          className="mt-3 text-sm text-st-gold font-sans hover:underline cursor-pointer"
        >
          ← Voltar para clientes
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => router.push("/clientes")}
        className="text-sm text-st-muted hover:text-st-dark font-sans transition-colors mb-4 cursor-pointer"
      >
        ← Voltar para clientes
      </button>

      <h1 className="font-serif text-xl sm:text-2xl font-bold text-st-dark mb-6">
        {cliente.nome || "Novo Cliente"}
      </h1>

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
                value={cliente.nome}
                onChange={(e) => set("nome", e.target.value)}
                className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold"
              />
            </div>
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">
                Apelido
              </label>
              <input
                type="text"
                value={cliente.apelido}
                onChange={(e) => set("apelido", e.target.value)}
                className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold"
              />
            </div>
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">
                Tipo de Pessoa
              </label>
              <div className="flex gap-3">
                {(["PF", "PJ"] as const).map((t) => (
                  <label
                    key={t}
                    className={`flex-1 text-center py-2 rounded-lg border text-sm font-sans cursor-pointer transition-colors ${
                      cliente.tipoPessoa === t
                        ? "bg-st-gold/10 border-st-gold text-st-gold"
                        : "border-st-border text-st-muted hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="tipoPessoa"
                      value={t}
                      checked={cliente.tipoPessoa === t}
                      onChange={() => set("tipoPessoa", t)}
                      className="sr-only"
                    />
                    {t === "PF" ? "Pessoa Física" : "Pessoa Jurídica"}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">
                {cliente.tipoPessoa === "PJ" ? "CNPJ" : "CPF"}
              </label>
              <input
                type="text"
                value={cliente.tipoPessoa === "PJ" ? cliente.cnpj : cliente.cpf}
                onChange={(e) =>
                  set(
                    cliente.tipoPessoa === "PJ" ? "cnpj" : "cpf",
                    e.target.value
                  )
                }
                className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold"
              />
            </div>
          </div>
        </section>

        {/* Contato */}
        <section className="bg-white border border-st-border rounded-xl p-4 sm:p-5">
          <h2 className="font-serif font-bold text-st-dark mb-4">Contato</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">
                Email
              </label>
              <input
                type="email"
                value={cliente.email}
                onChange={(e) => set("email", e.target.value)}
                className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold"
              />
            </div>
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">
                Telefone
              </label>
              <input
                type="text"
                value={cliente.telefone}
                onChange={(e) => set("telefone", e.target.value)}
                className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-sans text-st-muted mb-1">
                Endereço
              </label>
              <input
                type="text"
                value={cliente.endereco}
                onChange={(e) => set("endereco", e.target.value)}
                className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold"
              />
            </div>
            {cliente.tipoPessoa === "PJ" && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-sans text-st-muted mb-1">
                  Contato na Empresa
                </label>
                <input
                  type="text"
                  value={cliente.contatoEmpresa}
                  onChange={(e) => set("contatoEmpresa", e.target.value)}
                  className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold"
                />
              </div>
            )}
          </div>
        </section>

        {/* Comercial */}
        <section className="bg-white border border-st-border rounded-xl p-4 sm:p-5">
          <h2 className="font-serif font-bold text-st-dark mb-4">Comercial</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">
                Status Pipeline
              </label>
              <select
                value={cliente.statusPipeline}
                onChange={(e) =>
                  set("statusPipeline", e.target.value as StatusPipeline)
                }
                className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold bg-white"
              >
                {Object.entries(STATUS_PIPELINE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">
                Origem
              </label>
              <input
                type="text"
                value={cliente.origem}
                onChange={(e) => set("origem", e.target.value)}
                placeholder="Ex: indicação, site, evento"
                className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold"
              />
            </div>
          </div>
        </section>

        {/* Observações */}
        <section className="bg-white border border-st-border rounded-xl p-4 sm:p-5">
          <h2 className="font-serif font-bold text-st-dark mb-4">
            Observações
          </h2>
          <textarea
            value={cliente.observacoes}
            onChange={(e) => set("observacoes", e.target.value)}
            rows={4}
            className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold resize-none"
          />
        </section>

        {/* Salvar */}
        <div className="flex justify-end">
          <Btn variant="gold" onClick={handleSave} loading={saving}>
            Salvar Cliente
          </Btn>
        </div>

        {/* Contratos do cliente */}
        {contratos.length > 0 && (
          <section className="bg-white border border-st-border rounded-xl p-4 sm:p-5">
            <h2 className="font-serif font-bold text-st-dark mb-4">
              Contratos deste Cliente
            </h2>
            <div className="space-y-2">
              {contratos.map((ct) => (
                <div
                  key={ct.id}
                  onClick={() => router.push(`/contratos/${ct.id}`)}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-st-light/50 transition-colors cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="font-serif font-bold text-sm text-st-dark truncate">
                      {ct.titulo || ct.objeto || "Sem título"}
                    </p>
                    <p className="text-xs text-st-muted font-sans">
                      {ct.objeto}
                      {ct.valor
                        ? ` — ${ct.valor.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}`
                        : ""}
                    </p>
                  </div>
                  <Badge
                    color={
                      ct.status === "assinado" || ct.status === "vigente"
                        ? "green"
                        : ct.status === "encerrado"
                        ? "muted"
                        : "gold"
                    }
                  >
                    {CONTRATO_STATUS_LABELS[ct.status as ContratoStatus] || ct.status}
                  </Badge>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
