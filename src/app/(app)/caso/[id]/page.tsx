"use client";
import { use } from "react";
import { useCase } from "@/hooks/useCase";
import Steps from "@/components/Steps";
import IBox from "@/components/IBox";
import StageIntake from "@/components/StageIntake";
import StageValidationA from "@/components/StageValidationA";
import StageDiagnosis from "@/components/StageDiagnosis";
import StageValidationB from "@/components/StageValidationB";
import StageProposal from "@/components/StageProposal";
import StageSlides from "@/components/StageSlides";

export default function CasoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const caseHook = useCase(id);
  const { caso, loading, error, dbReady, clearError } = caseHook;

  if (!dbReady) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <p className="text-sm text-st-muted font-sans animate-pulse">
          Carregando caso...
        </p>
      </div>
    );
  }

  if (!caso) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <IBox type="error" title="Caso não encontrado">
          O caso solicitado não foi encontrado. Ele pode ter sido excluído.
        </IBox>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-2 gap-2">
        <h2 className="font-serif text-base sm:text-lg font-bold text-st-dark truncate">
          {caso.clientName || "Novo Caso"}
        </h2>
        <a
          href="/casos"
          className="text-xs sm:text-sm text-st-muted hover:text-st-dark font-sans transition-colors whitespace-nowrap"
        >
          ← Voltar
        </a>
      </div>

      <Steps current={caso.step} />

      <div className="mt-4 sm:mt-6">
        {caso.step === 1 && (
          <StageIntake
            caso={caso}
            loading={loading}
            error={error}
            update={caseHook.update}
            runIntake={caseHook.runIntake}
            runPreliminary={caseHook.runPreliminary}
            clearError={clearError}
          />
        )}
        {caso.step === 2 && (
          <StageValidationA
            caso={caso}
            loading={loading}
            error={error}
            update={caseHook.update}
            runIntake={caseHook.runIntake}
            approveIntake={caseHook.approveIntake}
            clearError={clearError}
          />
        )}
        {caso.step === 3 && (
          <StageDiagnosis
            caso={caso}
            loading={loading}
            error={error}
            update={caseHook.update}
            runDiagnosis={caseHook.runDiagnosis}
            clearError={clearError}
          />
        )}
        {caso.step === 4 && (
          <StageValidationB
            caso={caso}
            loading={loading}
            error={error}
            update={caseHook.update}
            runDiagnosis={caseHook.runDiagnosis}
            approveDiagnosis={caseHook.approveDiagnosis}
            clearError={clearError}
          />
        )}
        {caso.step === 5 && (
          <StageProposal
            caso={caso}
            loading={loading}
            error={error}
            update={caseHook.update}
            runProposal={caseHook.runProposal}
            clearError={clearError}
          />
        )}
        {caso.step === 6 && (
          <StageSlides
            caso={caso}
            loading={loading}
            error={error}
            update={caseHook.update}
            generateDiagJSON={caseHook.generateDiagJSON}
            generateClienteJSON={caseHook.generateClienteJSON}
            clearError={clearError}
          />
        )}
      </div>
    </div>
  );
}
