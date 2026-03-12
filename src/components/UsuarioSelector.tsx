"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Usuario, createEmptyUsuario } from "@/lib/types";
import { getAllUsuarios, saveUsuario } from "@/lib/store";

interface UsuarioSelectorProps {
  value: string;
  onChange: (id: string) => void;
  label?: string;
  disabled?: boolean;
}

export default function UsuarioSelector({
  value,
  onChange,
  label = "Responsável",
  disabled = false,
}: UsuarioSelectorProps) {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    getAllUsuarios().then(setUsuarios);
  }, []);

  const selected = usuarios.find((u) => u.id === value);

  async function handleNewUsuario() {
    const id = crypto.randomUUID();
    const u = createEmptyUsuario(id);
    await saveUsuario(u);
    router.push(`/usuarios/${id}`);
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
        {selected
          ? `${selected.nome}${selected.cargo ? ` — ${selected.cargo}` : ""}`
          : "Selecione..."}
      </button>

      {open && !disabled && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-st-border rounded-lg shadow-lg max-h-60 overflow-auto">
          {/* Opção para desvincular */}
          <button
            type="button"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm font-sans text-st-muted hover:bg-gray-50 transition-colors cursor-pointer border-b border-st-border"
          >
            Nenhum
          </button>
          {usuarios.length === 0 ? (
            <p className="p-3 text-sm text-st-muted font-sans text-center">
              Nenhum usuário cadastrado
            </p>
          ) : (
            usuarios.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => {
                  onChange(u.id);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm font-sans hover:bg-st-gold/10 transition-colors cursor-pointer ${
                  u.id === value ? "bg-st-gold/10 text-st-gold" : "text-st-dark"
                }`}
              >
                <span className="font-medium">{u.nome}</span>
                {u.cargo && (
                  <span className="text-xs text-st-muted ml-2">{u.cargo}</span>
                )}
              </button>
            ))
          )}
          <button
            type="button"
            onClick={handleNewUsuario}
            className="sticky bottom-0 w-full text-left px-3 py-2.5 text-sm font-sans font-medium text-st-gold hover:bg-st-gold/10 transition-colors cursor-pointer border-t border-st-border bg-white"
          >
            + Novo Usuário
          </button>
        </div>
      )}
    </div>
  );
}
