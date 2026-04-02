"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Pasta } from "@/lib/types";
import { savePasta } from "@/lib/store";
import Btn from "@/components/Btn";
import TabGeral from "@/components/pastas/TabGeral";

export default function NovaPastaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [saving, setSaving] = useState(false);

  const preClienteId = searchParams.get("clienteId") || "";
  const preContratoId = searchParams.get("contratoId") || "";
  const preTitulo = searchParams.get("titulo") || "";
  const preClienteNome = searchParams.get("clienteNome") || "";
  const preContratoTitulo = searchParams.get("contratoTitulo") || "";

  const id = useState(() => crypto.randomUUID())[0];
  const numero = useState(() => {
    const now = new Date();
    const seq = String(Math.floor(Math.random() * 999) + 1).padStart(3, "0");
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}/${seq}`;
  })[0];

  const [pasta, setPasta] = useState<Pasta>({
    id,
    numero,
    clienteId: preClienteId,
    contratoId: preContratoId || undefined,
    titulo: preTitulo,
    tipo: "servico",
    tipoServico: "",
    status: "ativo",
    abrangencia: "",
  });

  function set<K extends keyof Pasta>(key: K, val: Pasta[K]) {
    setPasta((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSave() {
    if (!pasta.clienteId) {
      alert("Selecione um cliente antes de salvar.");
      return;
    }
    setSaving(true);
    try {
      await savePasta(pasta);
      router.push(`/pastas/${pasta.id}`);
    } catch (err) {
      console.error("[NovaPasta] Erro ao salvar:", err);
      alert("Erro ao salvar pasta. Verifique o console.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => router.push("/pastas")}
        className="text-sm text-st-muted hover:text-st-dark font-sans transition-colors mb-4 cursor-pointer"
      >
        ← Voltar para pastas
      </button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-xl sm:text-2xl font-bold text-st-dark">
          Nova Pasta de Trabalho
        </h1>
        <Btn variant="gold" onClick={handleSave} loading={saving}>
          Criar Pasta
        </Btn>
      </div>

      {(preClienteNome || preContratoTitulo) && (
        <div className="bg-st-gold/10 border border-st-gold/30 rounded-xl p-4 mb-6">
          <p className="text-sm font-sans text-st-dark">
            {preClienteNome && <>Cliente: <strong>{preClienteNome}</strong></>}
            {preClienteNome && preContratoTitulo && <> | </>}
            {preContratoTitulo && <>Contrato: <strong>{preContratoTitulo}</strong></>}
          </p>
        </div>
      )}

      <TabGeral pasta={pasta} onChange={set} isEditing={true} />
    </div>
  );
}
