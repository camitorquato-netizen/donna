"use client";
import { useState, useEffect } from "react";
import { Contrato, CONTRATO_STATUS_LABELS, ContratoStatus } from "@/lib/types";
import { getContratosByCliente, getAllContratos } from "@/lib/store";

interface ContratoSelectorProps {
  value: string;
  onChange: (contratoId: string) => void;
  clienteId?: string;
  label?: string;
}

export default function ContratoSelector({
  value,
  onChange,
  clienteId,
  label = "Contrato",
}: ContratoSelectorProps) {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (clienteId) {
      getContratosByCliente(clienteId).then(setContratos);
    } else {
      getAllContratos().then(setContratos);
    }
  }, [clienteId]);

  const filtered = contratos.filter((c) =>
    (c.titulo || c.objeto || "").toLowerCase().includes(search.toLowerCase())
  );

  const selected = contratos.find((c) => c.id === value);

  return (
    <div className="relative">
      <label className="block text-xs font-sans text-st-muted mb-1">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans text-left bg-white focus:outline-none focus:border-st-gold transition-colors cursor-pointer"
      >
        {selected
          ? selected.titulo || selected.objeto || "Contrato sem título"
          : "Selecione um contrato..."}
      </button>

      {open && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-st-border rounded-lg shadow-lg max-h-60 overflow-auto">
          <div className="sticky top-0 bg-white p-2 border-b border-st-border">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar contrato..."
              className="w-full border border-st-border rounded px-2 py-1.5 text-sm font-sans focus:outline-none focus:border-st-gold"
              autoFocus
            />
          </div>
          {/* Opção para desvincular */}
          <button
            type="button"
            onClick={() => {
              onChange("");
              setOpen(false);
              setSearch("");
            }}
            className="w-full text-left px-3 py-2 text-sm font-sans text-st-muted hover:bg-gray-50 transition-colors cursor-pointer border-b border-st-border"
          >
            Nenhum contrato
          </button>
          {filtered.length === 0 ? (
            <p className="p-3 text-sm text-st-muted font-sans text-center">
              Nenhum contrato encontrado
            </p>
          ) : (
            filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  onChange(c.id);
                  setOpen(false);
                  setSearch("");
                }}
                className={`w-full text-left px-3 py-2 text-sm font-sans hover:bg-st-gold/10 transition-colors cursor-pointer ${
                  c.id === value ? "bg-st-gold/10 text-st-gold" : "text-st-dark"
                }`}
              >
                <span className="font-medium">
                  {c.titulo || c.objeto || "Sem título"}
                </span>
                <span className="text-xs text-st-muted ml-2">
                  {CONTRATO_STATUS_LABELS[c.status as ContratoStatus] || c.status}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
