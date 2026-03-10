"use client";
import { useState } from "react";
import { Case, CaseFile } from "@/lib/types";
import Btn from "./Btn";
import IBox from "./IBox";
import MdBox from "./MdBox";
import FileUploader from "./FileUploader";

interface Props {
  caso: Case;
  loading: boolean;
  error: string | null;
  update: (partial: Partial<Case>) => void;
  runIntake: (transcript: string, files: CaseFile[], previousIntake?: string, meta?: Partial<Case>) => Promise<void>;
  approveIntake: () => void;
  clearError: () => void;
}

export default function StageValidationA({
  caso,
  loading,
  error,
  update,
  runIntake,
  approveIntake,
  clearError,
}: Props) {
  const [caseFocus, setCaseFocus] = useState(caso.caseFocus || "");
  const [intakeNotes, setIntakeNotes] = useState(caso.intakeNotes || "");
  const [newInfo, setNewInfo] = useState("");
  const [newFiles, setNewFiles] = useState<CaseFile[]>([]);
  const [showRegen, setShowRegen] = useState(false);

  function handleApprove() {
    update({ caseFocus, intakeNotes });
    approveIntake();
  }

  async function handleRegen() {
    clearError();
    const extraText = newInfo
      ? `${caso.transcript}\n\n---\nINFORMAÇÕES ADICIONAIS:\n${newInfo}`
      : caso.transcript;
    const allFiles = [...caso.intakeFiles, ...newFiles];
    await runIntake(extraText, allFiles, caso.intakeOutput);
    setShowRegen(false);
    setNewInfo("");
    setNewFiles([]);
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <IBox type="gold" title="Etapa 2 — Validação do Sênior">
        Revise o intake estruturado. Preencha o foco do caso e observações que serão injetados no prompt do diagnóstico.
      </IBox>

      <MdBox content={caso.intakeOutput} title="Intake Estruturado" />

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-sans font-medium text-st-dark mb-1">
            Foco do Caso e Observações
          </label>
          <textarea
            value={caseFocus}
            onChange={(e) => setCaseFocus(e.target.value)}
            placeholder='Ex: "Foco tributário — dividendos e holding. Verificar internacional. Cliente tem urgência pela venda do imóvel em Alphaville."'
            className="w-full h-24 border border-st-border rounded-lg px-3 sm:px-4 py-3 text-sm font-sans resize-y focus:outline-none focus:border-st-gold"
          />
          <p className="text-xs text-st-muted mt-1">
            Este texto será injetado diretamente no prompt do diagnóstico.
          </p>
        </div>

        <div>
          <label className="block text-sm font-sans font-medium text-st-dark mb-1">
            Notas Adicionais
          </label>
          <textarea
            value={intakeNotes}
            onChange={(e) => setIntakeNotes(e.target.value)}
            placeholder="Observações complementares do sênior..."
            className="w-full h-20 border border-st-border rounded-lg px-3 sm:px-4 py-3 text-sm font-sans resize-y focus:outline-none focus:border-st-gold"
          />
        </div>
      </div>

      {!showRegen ? (
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Btn variant="ghost" onClick={() => update({ step: 1 })} className="w-full sm:w-auto">
            ← Voltar ao Intake
          </Btn>
          <Btn variant="gold" onClick={() => setShowRegen(true)} className="w-full sm:w-auto">
            Regenerar com Novos Dados
          </Btn>
          <Btn variant="green" onClick={handleApprove} className="w-full sm:w-auto">
            Aprovar e Avançar →
          </Btn>
        </div>
      ) : (
        <div className="space-y-4 p-3 sm:p-4 border border-st-gold/30 rounded-xl bg-st-gold/5">
          <h4 className="font-serif font-bold text-st-dark text-sm">
            Regenerar Intake
          </h4>
          <textarea
            value={newInfo}
            onChange={(e) => setNewInfo(e.target.value)}
            placeholder="Informações adicionais recebidas..."
            className="w-full h-24 border border-st-border rounded-lg px-3 sm:px-4 py-3 text-sm font-sans resize-y focus:outline-none focus:border-st-gold"
          />
          <FileUploader
            files={newFiles}
            onFilesChange={setNewFiles}
            disabled={loading}
          />
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Btn
              variant="ghost"
              className="w-full sm:w-auto"
              onClick={() => {
                setShowRegen(false);
                setNewInfo("");
                setNewFiles([]);
              }}
            >
              Cancelar
            </Btn>
            <Btn variant="gold" onClick={handleRegen} loading={loading} className="w-full sm:w-auto">
              {loading ? "Regenerando..." : "Regenerar Intake"}
            </Btn>
          </div>
        </div>
      )}

      {error && (
        <IBox type="error" title="Erro">
          {error}
        </IBox>
      )}
    </div>
  );
}
