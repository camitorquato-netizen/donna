"use client";
import { Pasta, PastaStatus, PASTA_STATUS_LABELS, TIPO_SERVICO_OPTIONS } from "@/lib/types";
import ClienteSelector from "@/components/ClienteSelector";
import ContratoSelector from "@/components/ContratoSelector";

interface TabGeralProps {
  pasta: Pasta;
  onChange: <K extends keyof Pasta>(key: K, val: Pasta[K]) => void;
}

export default function TabGeral({ pasta, onChange }: TabGeralProps) {
  return (
    <div className="space-y-6">
      {/* Vinculação */}
      <section className="bg-white border border-st-border rounded-xl p-4 sm:p-5">
        <h2 className="font-serif font-bold text-st-dark mb-4">Vinculação</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ClienteSelector
            value={pasta.clienteId}
            onChange={(id) => onChange("clienteId", id)}
          />
          <ContratoSelector
            value={pasta.contratoId || ""}
            onChange={(id) => onChange("contratoId", id || undefined)}
            clienteId={pasta.clienteId || undefined}
          />
        </div>
      </section>

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
              className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold"
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
              className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold font-mono"
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
                  className={`flex-1 text-center py-2 rounded-lg border text-sm font-sans cursor-pointer transition-colors ${
                    pasta.tipo === t
                      ? "bg-st-gold/10 border-st-gold text-st-gold"
                      : "border-st-border text-st-muted hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="pastaTipo"
                    value={t}
                    checked={pasta.tipo === t}
                    onChange={() => onChange("tipo", t)}
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
                className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold bg-white"
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
              placeholder="Ex: Federal, Estadual, Municipal"
              className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold"
            />
          </div>
        </div>
      </section>

      {/* Status */}
      <section className="bg-white border border-st-border rounded-xl p-4 sm:p-5">
        <h2 className="font-serif font-bold text-st-dark mb-4">Status</h2>
        <div className="max-w-xs">
          <select
            value={pasta.status}
            onChange={(e) => onChange("status", e.target.value as PastaStatus)}
            className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold bg-white"
          >
            {Object.entries(PASTA_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </section>
    </div>
  );
}
