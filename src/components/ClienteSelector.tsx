"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Cliente, createEmptyCliente } from "@/lib/types";
import { getAllClientes, saveCliente } from "@/lib/store";

interface ClienteSelectorProps {
  value: string;
  onChange: (clienteId: string) => void;
  label?: string;
  disabled?: boolean;
}

export default function ClienteSelector({
  value,
  onChange,
  label = "Cliente",
  disabled = false,
}: ClienteSelectorProps) {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    getAllClientes().then(setClientes);
  }, []);

  const filtered = clientes.filter((c) =>
    c.nome.toLowerCase().includes(search.toLowerCase())
  );

  const selected = clientes.find((c) => c.id === value);

  async function handleNewCliente() {
    const id = crypto.randomUUID();
    const c = createEmptyCliente(id);
    await saveCliente(c);
    router.push(`/clientes/${id}`);
  }

  return (
    <div className="relative">
      <label className="block text-xs font-sans text-st-muted mb-1">
        {label}
      </label>
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        className={`w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans text-left bg-white focus:outline-none focus:border-st-gold transition-colors ${
          disabled
            ? "opacity-60 bg-st-light cursor-not-allowed"
            : "cursor-pointer"
        }`}
      >
        {selected ? selected.nome : "Selecione um cliente..."}
      </button>

      {open && !disabled && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-st-border rounded-lg shadow-lg max-h-60 overflow-auto">
          <div className="sticky top-0 bg-white p-2 border-b border-st-border">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full border border-st-border rounded px-2 py-1.5 text-sm font-sans focus:outline-none focus:border-st-gold"
              autoFocus
            />
          </div>
          {filtered.length === 0 ? (
            <p className="p-3 text-sm text-st-muted font-sans text-center">
              Nenhum cliente encontrado
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
                <span className="font-medium">{c.nome}</span>
                <span className="text-xs text-st-muted ml-2">
                  {c.tipoPessoa}
                </span>
              </button>
            ))
          )}
          <button
            type="button"
            onClick={handleNewCliente}
            className="sticky bottom-0 w-full text-left px-3 py-2.5 text-sm font-sans font-medium text-st-gold hover:bg-st-gold/10 transition-colors cursor-pointer border-t border-st-border bg-white"
          >
            + Novo Cliente
          </button>
        </div>
      )}
    </div>
  );
}
