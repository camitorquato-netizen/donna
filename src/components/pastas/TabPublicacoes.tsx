"use client";
import { useState, useEffect, useCallback } from "react";
import { Publicacao, PublicacaoStatus, PUBLICACAO_STATUS_LABELS } from "@/lib/types";
import { getPublicacoesByPasta, savePublicacao } from "@/lib/store";
import Badge from "@/components/Badge";
import Btn from "@/components/Btn";

interface TabPublicacoesProps {
  pastaId: string;
}

const statusColors: Record<string, "gold" | "green" | "muted"> = {
  nova: "gold",
  lida: "muted",
  respondida: "green",
};

const statusCycle: PublicacaoStatus[] = ["nova", "lida", "respondida"];

const EMPTY_PUB: Omit<Publicacao, "id" | "pastaId"> = {
  dataHora: null,
  tribunal: "",
  sistema: "",
  processoCnj: "",
  parte: "",
  assunto: "",
  teor: "",
  linkProcesso: "",
  status: "nova",
  prazo: null,
  observacoes: "",
};

export default function TabPublicacoes({ pastaId }: TabPublicacoesProps) {
  const [publicacoes, setPublicacoes] = useState<Publicacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_PUB });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPublicacoesByPasta(pastaId);
      setPublicacoes(data);
    } catch (err) {
      console.error("[TabPublicacoes] Erro:", err);
    } finally {
      setLoading(false);
    }
  }, [pastaId]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleStatus(pub: Publicacao) {
    const idx = statusCycle.indexOf(pub.status);
    const next = statusCycle[(idx + 1) % statusCycle.length];
    const updated = { ...pub, status: next };
    await savePublicacao(updated);
    setPublicacoes((prev) =>
      prev.map((p) => (p.id === pub.id ? updated : p))
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      const novo: Publicacao = {
        id: crypto.randomUUID(),
        pastaId,
        ...form,
        dataHora: form.dataHora || new Date().toISOString(),
      };
      await savePublicacao(novo);
      setPublicacoes((prev) => [novo, ...prev]);
      setForm({ ...EMPTY_PUB });
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-st-muted font-sans animate-pulse">
          Carregando publicações...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Botão Nova Publicação */}
      <div className="flex justify-end">
        <Btn
          variant={showForm ? "ghost" : "gold"}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancelar" : "+ Nova Publicação"}
        </Btn>
      </div>

      {/* Formulário inline */}
      {showForm && (
        <div className="bg-white border border-st-border rounded-xl p-4 sm:p-5 space-y-4">
          <h3 className="font-serif font-bold text-st-dark text-sm">
            Nova Nota de Expediente
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">Assunto</label>
              <input
                type="text"
                value={form.assunto}
                onChange={(e) => setForm((f) => ({ ...f, assunto: e.target.value }))}
                placeholder="Ex: Intimação para manifestação"
                className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold"
              />
            </div>
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">Tribunal</label>
              <input
                type="text"
                value={form.tribunal}
                onChange={(e) => setForm((f) => ({ ...f, tribunal: e.target.value }))}
                placeholder="Ex: TRF3, TJSP"
                className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold"
              />
            </div>
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">Processo CNJ</label>
              <input
                type="text"
                value={form.processoCnj}
                onChange={(e) => setForm((f) => ({ ...f, processoCnj: e.target.value }))}
                placeholder="NNNNNNN-NN.NNNN.N.NN.NNNN"
                className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans font-mono focus:outline-none focus:border-st-gold"
              />
            </div>
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">Prazo</label>
              <input
                type="date"
                value={form.prazo || ""}
                onChange={(e) => setForm((f) => ({ ...f, prazo: e.target.value || null }))}
                className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold"
              />
            </div>
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">Data/Hora</label>
              <input
                type="datetime-local"
                value={form.dataHora ? form.dataHora.slice(0, 16) : ""}
                onChange={(e) => setForm((f) => ({ ...f, dataHora: e.target.value ? new Date(e.target.value).toISOString() : null }))}
                className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold"
              />
            </div>
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">Parte</label>
              <input
                type="text"
                value={form.parte}
                onChange={(e) => setForm((f) => ({ ...f, parte: e.target.value }))}
                placeholder="Nome da parte"
                className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-sans text-st-muted mb-1">Teor / Conteúdo</label>
              <textarea
                value={form.teor}
                onChange={(e) => setForm((f) => ({ ...f, teor: e.target.value }))}
                rows={4}
                placeholder="Conteúdo da publicação / nota de expediente..."
                className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold resize-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-sans text-st-muted mb-1">Observações</label>
              <textarea
                value={form.observacoes}
                onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))}
                rows={2}
                placeholder="Anotações internas..."
                className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Btn variant="gold" onClick={handleSave} loading={saving}>
              Salvar Publicação
            </Btn>
          </div>
        </div>
      )}

      {/* Lista */}
      {publicacoes.length === 0 && !showForm && (
        <div className="bg-white border border-st-border rounded-xl p-8 text-center">
          <p className="text-sm text-st-muted font-sans">
            Nenhuma publicação registrada para esta pasta.
          </p>
          <p className="text-xs text-st-muted font-sans mt-2">
            Clique em &quot;+ Nova Publicação&quot; para cadastrar manualmente.
          </p>
        </div>
      )}

      {publicacoes.map((pub) => (
        <div
          key={pub.id}
          className="bg-white border border-st-border rounded-xl p-4 sm:p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                {pub.tribunal && (
                  <Badge color="dark">{pub.tribunal}</Badge>
                )}
                <button
                  onClick={() => toggleStatus(pub)}
                  className="cursor-pointer"
                >
                  <Badge color={statusColors[pub.status] || "muted"}>
                    {PUBLICACAO_STATUS_LABELS[pub.status] || pub.status}
                  </Badge>
                </button>
                {pub.prazo && (
                  <span className="text-xs text-st-gold font-medium font-sans">
                    Prazo: {new Date(pub.prazo + "T00:00:00").toLocaleDateString("pt-BR")}
                  </span>
                )}
              </div>
              {pub.assunto && (
                <p className="font-serif font-bold text-sm text-st-dark mb-1">
                  {pub.assunto}
                </p>
              )}
              {pub.teor && (
                <p className="text-xs text-st-muted font-sans whitespace-pre-wrap">
                  {pub.teor}
                </p>
              )}
              <div className="flex gap-3 mt-2 text-xs text-st-muted font-sans flex-wrap">
                {pub.dataHora && (
                  <span>
                    {new Date(pub.dataHora).toLocaleString("pt-BR")}
                  </span>
                )}
                {pub.processoCnj && (
                  <span className="font-mono">{pub.processoCnj}</span>
                )}
                {pub.parte && (
                  <span>{pub.parte}</span>
                )}
              </div>
              {pub.observacoes && (
                <p className="text-xs text-st-muted font-sans mt-2 italic">
                  {pub.observacoes}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
