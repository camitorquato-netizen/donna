"use client";
import { useState } from "react";
import { WfRct } from "@/lib/types";
import { saveWfRct } from "@/lib/store";
import Btn from "@/components/Btn";

interface Props {
  step: WfRct;
  onAdvance: () => void;
}

export default function WfStepFaturamento({ step, onAdvance }: Props) {
  const [saving, setSaving] = useState(false);
  const [obs, setObs] = useState(step.observacoes || "");
  const [url, setUrl] = useState(step.url || "");
  const isDone = step.status === "concluido";

  async function handleConcluir() {
    setSaving(true);
    try {
      await saveWfRct({ ...step, status: "concluido", observacoes: obs, url });
      onAdvance();
    } finally {
      setSaving(false);
    }
  }

  async function saveStepFields() {
    await saveWfRct({ ...step, observacoes: obs, url });
  }

  return (
    <div className="space-y-4">
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
        <p className="text-xs font-sans text-indigo-800">
          Etapa final — conclusão do crédito. Documente e conclua o workflow.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="block text-xs font-sans text-st-muted mb-1">Observações</label>
          <textarea
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            onBlur={saveStepFields}
            disabled={isDone}
            rows={6}
            placeholder="Notas sobre a conclusão..."
            className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold resize-none disabled:opacity-60 disabled:bg-gray-50"
          />
        </div>
        <div>
          <label className="block text-xs font-sans text-st-muted mb-1">URL Documentos</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={saveStepFields}
            disabled={isDone}
            placeholder="https://..."
            className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold disabled:opacity-60 disabled:bg-gray-50"
          />
        </div>
      </div>

      {!isDone && (
        <div className="flex justify-end">
          <Btn
            variant="gold"
            onClick={handleConcluir}
            loading={saving}
            className="!px-6"
          >
            Concluir Workflow ✓
          </Btn>
        </div>
      )}

      {isDone && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <p className="text-sm font-sans text-green-800 font-medium">
            ✓ Workflow concluído
          </p>
        </div>
      )}
    </div>
  );
}
