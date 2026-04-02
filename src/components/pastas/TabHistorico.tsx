"use client";
import { useState, useEffect, useCallback } from "react";
import { Historico } from "@/lib/types";
import { getHistoricoByPasta, saveHistorico, deleteHistorico } from "@/lib/store";
import Btn from "@/components/Btn";
import { useAuth } from "@/contexts/AuthContext";

interface TabHistoricoProps {
  pastaId: string;
}

const inputClass =
  "w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold";

export default function TabHistorico({ pastaId }: TabHistoricoProps) {
  const { usuario, isReadOnly } = useAuth();
  const [historicos, setHistoricos] = useState<Historico[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [texto, setTexto] = useState("");
  const [link, setLink] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getHistoricoByPasta(pastaId);
      setHistoricos(data);
    } catch (err) {
      console.error("[TabHistorico] Erro:", err);
    } finally {
      setLoading(false);
    }
  }, [pastaId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave() {
    if (!texto.trim()) return;
    setSaving(true);
    try {
      const h: Historico = {
        id: crypto.randomUUID(),
        pastaId,
        usuarioId: usuario?.id || "",
        texto: texto.trim(),
        link: link.trim() || undefined,
      };
      await saveHistorico(h);
      setTexto("");
      setLink("");
      setShowForm(false);
      await load();
    } catch (err) {
      alert(`Erro ao salvar: ${err instanceof Error ? err.message : err}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Excluir este registro?")) return;
    try {
      await deleteHistorico(id);
      setHistoricos((prev) => prev.filter((h) => h.id !== id));
    } catch (err) {
      alert(`Erro: ${err instanceof Error ? err.message : err}`);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-st-muted font-sans animate-pulse">
          Carregando histórico...
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif font-bold text-st-dark">
          Histórico ({historicos.length})
        </h2>
        {!isReadOnly && (
          <Btn variant="gold" onClick={() => setShowForm(!showForm)}>
            + Novo Registro
          </Btn>
        )}
      </div>

      {/* Formulário novo registro */}
      {showForm && (
        <div className="bg-white border border-st-border rounded-xl p-4 mb-4 space-y-3">
          <div>
            <label className="block text-xs font-sans text-st-muted mb-1">
              Usuário
            </label>
            <p className="text-sm font-sans text-st-dark font-medium">
              {usuario?.nome || "—"}
            </p>
          </div>
          <div>
            <label className="block text-xs font-sans text-st-muted mb-1">
              Texto *
            </label>
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={4}
              className={inputClass}
              placeholder="Descreva o que foi feito, observações, andamento..."
            />
          </div>
          <div>
            <label className="block text-xs font-sans text-st-muted mb-1">
              Link (opcional)
            </label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className={inputClass}
              placeholder="https://..."
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Btn variant="ghost" onClick={() => { setShowForm(false); setTexto(""); setLink(""); }}>
              Cancelar
            </Btn>
            <Btn variant="gold" onClick={handleSave} loading={saving}>
              Salvar
            </Btn>
          </div>
        </div>
      )}

      {/* Lista */}
      {historicos.length === 0 ? (
        <div className="bg-white border border-st-border rounded-xl p-8 text-center">
          <p className="text-sm text-st-muted font-sans">
            Nenhum registro no histórico.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {historicos.map((h) => (
            <div
              key={h.id}
              className="bg-white border border-st-border rounded-xl p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 text-xs text-st-muted font-sans mb-2">
                    <span className="font-medium text-st-dark">
                      {h.usuarioNome || "Usuário"}
                    </span>
                    {h.createdAt && (
                      <span>
                        {new Date(h.createdAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        às{" "}
                        {new Date(h.createdAt).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-sans text-st-dark whitespace-pre-wrap">
                    {h.texto}
                  </p>
                  {h.link && (
                    <a
                      href={h.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-st-gold font-sans hover:underline mt-2 inline-block"
                    >
                      {h.link}
                    </a>
                  )}
                </div>
                {!isReadOnly && (
                  <button
                    onClick={() => handleDelete(h.id)}
                    className="text-xs text-st-muted hover:text-red-500 font-sans cursor-pointer px-2 py-1 shrink-0"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
