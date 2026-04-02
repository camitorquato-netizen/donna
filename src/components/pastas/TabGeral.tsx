"use client";
import { Pasta, PastaStatus, PASTA_STATUS_LABELS, TIPO_SERVICO_OPTIONS } from "@/lib/types";
import ClienteSelector from "@/components/ClienteSelector";
import ContratoSelector from "@/components/ContratoSelector";
import UsuarioSelector from "@/components/UsuarioSelector";

interface TabGeralProps {
  pasta: Pasta;
  onChange: <K extends keyof Pasta>(key: K, val: Pasta[K]) => void;
  isEditing?: boolean;
}

const inputClass =
  "w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold disabled:opacity-60 disabled:bg-st-light disabled:cursor-not-allowed";
const selectClass =
  "w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold bg-white disabled:opacity-60 disabled:bg-st-light disabled:cursor-not-allowed";

export default function TabGeral({ pasta, onChange, isEditing = false }: TabGeralProps) {
  const dis = !isEditing;

  return (
    <div className="space-y-6">
      {/* Vinculação — só aparece ao editar */}
      {isEditing && (
        <section className="bg-white border border-st-border rounded-xl p-4 sm:p-5">
          <h2 className="font-serif font-bold text-st-dark mb-4">Vinculação</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ClienteSelector
              value={pasta.clienteId}
              onChange={(id) => onChange("clienteId", id)}
              disabled={false}
            />
            <ContratoSelector
              value={pasta.contratoId || ""}
              onChange={(id) => onChange("contratoId", id || undefined)}
              clienteId={pasta.clienteId || undefined}
              disabled={false}
            />
          </div>
        </section>
      )}

      {/* Dados da Pasta */}
      <section className="bg-white border border-st-border rounded-xl p-4 sm:p-5">
        <h2 className="font-serif font-bold text-st-dark mb-4">
          Dados da Pasta
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-sans text-st-muted mb-1">
              Título
            </label>
            <input
              type="text"
              value={pasta.titulo}
              onChange={(e) => onChange("titulo", e.target.value)}
              disabled={dis}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-sans text-st-muted mb-1">
              Número
            </label>
            <input
              type="text"
              value={pasta.numero}
              onChange={(e) => onChange("numero", e.target.value)}
              disabled={dis}
              className={`${inputClass} font-mono`}
            />
          </div>
          <div>
            <label className="block text-xs font-sans text-st-muted mb-1">
              Tipo
            </label>
            <div className="flex gap-3">
              {(["servico", "processo"] as const).map((t) => (
                <label
                  key={t}
                  className={`flex-1 text-center py-2 rounded-lg border text-sm font-sans transition-colors ${
                    pasta.tipo === t
                      ? "bg-st-gold/10 border-st-gold text-st-gold"
                      : "border-st-border text-st-muted hover:bg-gray-50"
                  } ${dis ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <input
                    type="radio"
                    name="pastaTipo"
                    value={t}
                    checked={pasta.tipo === t}
                    onChange={() => onChange("tipo", t)}
                    disabled={dis}
                    className="sr-only"
                  />
                  {t === "servico" ? "Serviço" : "Processo"}
                </label>
              ))}
            </div>
          </div>

          {pasta.tipo === "servico" && (
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">
                Tipo de Serviço
              </label>
              <select
                value={pasta.tipoServico}
                onChange={(e) => onChange("tipoServico", e.target.value)}
                disabled={dis}
                className={selectClass}
              >
                <option value="">Selecione...</option>
                {TIPO_SERVICO_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-sans text-st-muted mb-1">
              Abrangência
            </label>
            <input
              type="text"
              value={pasta.abrangencia}
              onChange={(e) => onChange("abrangencia", e.target.value)}
              disabled={dis}
              placeholder="Ex: Federal, Estadual, Municipal"
              className={inputClass}
            />
          </div>
          <UsuarioSelector
            value={pasta.responsavelId || ""}
            onChange={(id) => onChange("responsavelId", id || undefined)}
            label="Responsável"
            disabled={dis}
          />
        </div>
      </section>

      {/* Status */}
      <section className="bg-white border border-st-border rounded-xl p-4 sm:p-5">
        <h2 className="font-serif font-bold text-st-dark mb-4">Status</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <select
              value={pasta.status}
              onChange={(e) => onChange("status", e.target.value as PastaStatus)}
              disabled={dis}
              className={selectClass}
            >
              {Object.entries(PASTA_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          {pasta.createdAt && (
            <div>
              <label className="block text-xs font-sans text-st-muted mb-1">
                Data de Criação
              </label>
              <p className="text-sm font-sans text-st-dark py-2">
                {new Date(pasta.createdAt).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
