"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Parceiro } from "@/lib/types";
import { getAllParceiros } from "@/lib/store";

interface ParceiroSelectorProps {
  value: string;
  onChange: (parceiroId: string) => void;
  label?: string;
  disabled?: boolean;
  returnTo?: string;
}

export default function ParceiroSelector({
  value,
  onChange,
  label = "Parceiro",
  disabled = false,
  returnTo,
}: ParceiroSelectorProps) {
  const router = useRouter();
  const [parceiros, setParceiros] = useState<Parceiro[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    getAllParceiros().then(setParceiros);
  }, []);

  const filtered = parceiros.filter((p) =>
    p.razaoSocial.toLowerCase().includes(search.toLowerCase())
  );

  const selected = parceiros.find((p) => p.id === value);

  function handleNewParceiro() {
    const id = crypto.randomUUID();
    const ret = returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : "";
    router.push(`/parceiros/${id}?novo=1${ret}`);
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
        {selected ? selected.razaoSocial.toUpperCase() : "Selecione um parceiro..."}
      </button>

      {open && !disabled && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-st-border rounded-lg shadow-lg max-h-60 overflow-auto">
          <div className="sticky top-0 bg-white p-2 border-b border-st-border">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar parceiro..."
              className="w-full border border-st-border rounded px-2 py-1.5 text-sm font-sans focus:outline-none focus:border-st-gold"
              autoFocus
            />
          </div>
          {/* Opção para limpar seleção */}
          <button
            type="button"
            onClick={() => {
              onChange("");
              setOpen(false);
              setSearch("");
            }}
            className={`w-full text-left px-3 py-2 text-sm font-sans hover:bg-st-gold/10 transition-colors cursor-pointer ${
              !value ? "bg-st-gold/10 text-st-gold" : "text-st-muted"
            }`}
          >
            Nenhum parceiro
          </button>
          {filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                onChange(p.id);
                setOpen(false);
                setSearch("");
              }}
              className={`w-full text-left px-3 py-2 text-sm font-sans hover:bg-st-gold/10 transition-colors cursor-pointer ${
                p.id === value ? "bg-st-gold/10 text-st-gold" : "text-st-dark"
              }`}
            >
              <span className="font-medium">{p.razaoSocial.toUpperCase()}</span>
              {p.percentualParceria > 0 && (
                <span className="text-xs text-st-muted ml-2">
                  {p.percentualParceria}%
                </span>
              )}
            </button>
          ))}
          <button
            type="button"
            onClick={handleNewParceiro}
            className="sticky bottom-0 w-full text-left px-3 py-2.5 text-sm font-sans font-medium text-st-gold hover:bg-st-gold/10 transition-colors cursor-pointer border-t border-st-border bg-white"
          >
            + Novo Parceiro
          </button>
        </div>
      )}
    </div>
  );
}
