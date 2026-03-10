"use client";
import { useState, useEffect } from "react";
import { WfRct, Credito, ControleRct } from "@/lib/types";
import { saveWfRct, getControleRctByCredito } from "@/lib/store";
import Btn from "@/components/Btn";
import Badge from "@/components/Badge";

interface Props {
  step: WfRct;
  credito: Credito;
  onAdvance: () => void;
}

export default function WfStepCompensacoes({ step, credito, onAdvance }: Props) {
  const [obs, setObs] = useState(step.observacoes || "");
  const [url, setUrl] = useState(step.url || "");
  const [compensacoes, setCompensacoes] = useState<ControleRct[]>([]);
  const isDone = step.status === "concluido";

  useEffect(() => {
    getControleRctByCredito(credito.id).then(setCompensacoes);
  }, [credito.id]);

  const totalCompensado = compensacoes.reduce((s, c) => s + c.valorCompensado, 0);
  const saldoZerado = credito.saldo <= 0;

  async function saveStepFields() {
    await saveWfRct({ ...step, observacoes: obs, url });
  }

  async function handleConcluir() {
    await saveWfRct({ ...step, status: "concluido", observacoes: obs, url });
    onAdvance();
  }

  function formatBRL(val: number) {
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  return (
    <div className="space-y-4">
      <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
        <p className="text-xs font-sans text-teal-800">
          Acompanhe as compensações até zerar o saldo do crédito. Crie compensações na aba &quot;Compensações&quot;.
        </p>
      </div>

      {/* Saldo e totais */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white border border-st-border rounded-lg p-3 text-center">
          <p className="text-[10px] text-st-muted font-sans">Crédito Validado</p>
          <p className="text-sm font-bold text-st-dark font-sans">{formatBRL(credito.creditoValidado)}</p>
        </div>
        <div className="bg-white border border-st-border rounded-lg p-3 text-center">
          <p className="text-[10px] text-st-muted font-sans">Total Compensado</p>
          <p className="text-sm font-bold text-st-green font-sans">{formatBRL(totalCompensado)}</p>
        </div>
        <div className={`bg-white border rounded-lg p-3 text-center ${saldoZerado ? "border-green-300" : "border-amber-300"}`}>
          <p className="text-[10px] text-st-muted font-sans">Saldo</p>
          <p className={`text-sm font-bold font-sans ${saldoZerado ? "text-green-600" : "text-amber-600"}`}>
            {formatBRL(credito.saldo)}
          </p>
        </div>
      </div>

      {/* Lista de compensações */}
      {compensacoes.length > 0 ? (
        <div className="bg-white border border-st-border rounded-xl overflow-hidden">
          <div className="space-y-0">
            {compensacoes.map((comp) => (
              <div
                key={comp.id}
                className="flex items-center justify-between p-3 border-b border-st-border/50 last:border-0"
              >
                <div className="flex gap-3 text-xs font-sans text-st-dark flex-wrap">
                  <span className="font-medium">{formatBRL(comp.valorCompensado)}</span>
                  {comp.tributoCompensado && (
                    <Badge color="muted">{comp.tributoCompensado}</Badge>
                  )}
                  {comp.dataCompensacao && (
                    <span className="text-st-muted">
                      {new Date(comp.dataCompensacao + "T00:00:00").toLocaleDateString("pt-BR")}
                    </span>
                  )}
                  {comp.formaUtilizacao && (
                    <span className="text-st-muted">{comp.formaUtilizacao}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-st-border rounded-xl p-6 text-center">
          <p className="text-xs text-st-muted font-sans">Nenhuma compensação registrada ainda.</p>
          <p className="text-[10px] text-st-muted font-sans mt-1">Use a aba &quot;Compensações&quot; para criar novas.</p>
        </div>
      )}

      {/* Observações + URL */}
      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="block text-xs font-sans text-st-muted mb-1">Observações</label>
          <textarea
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            onBlur={saveStepFields}
            disabled={isDone}
            rows={3}
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

      {!isDone && saldoZerado && (
        <div className="flex justify-end">
          <Btn variant="gold" onClick={handleConcluir} className="!px-6">
            Concluir Compensações →
          </Btn>
        </div>
      )}

      {!isDone && !saldoZerado && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs font-sans text-amber-800">
            O saldo precisa ser zerado para avançar. Crie compensações na aba &quot;Compensações&quot;.
          </p>
        </div>
      )}

      {isDone && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-xs font-sans text-green-800">
            Compensações concluídas. Saldo zerado.
          </p>
        </div>
      )}
    </div>
  );
}
