"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { Case, CaseFile, StageNumber, DiagJSON, ClienteJSON } from "@/lib/types";
import { getCase, saveCase } from "@/lib/store";
import { callAnthropic, extractJSON } from "@/lib/api";
import { P_INTAKE, P_DIAG, P_PROPOSTA, P_JSON_DIAG, P_JSON_CLIENTE } from "@/lib/prompts";

export function useCase(caseId: string) {
  const [caso, setCaso] = useState<Case | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbReady, setDbReady] = useState(false);

  // Ref always holds the latest caso — callbacks read from here
  // to avoid stale closures
  const casoRef = useRef<Case | null>(null);
  casoRef.current = caso;

  // Carregar caso do Supabase (async)
  useEffect(() => {
    let cancelled = false;
    getCase(caseId).then((c) => {
      if (!cancelled) {
        setCaso(c);
        setDbReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [caseId]);

  // Persist: atualiza UI imediatamente, salva no Supabase em background
  const persist = useCallback((updated: Case) => {
    setCaso(updated);
    saveCase(updated).catch((err) => {
      console.error("[useCase] Erro ao salvar:", err);
    });
  }, []);

  const update = useCallback(
    (partial: Partial<Case>) => {
      const prev = casoRef.current;
      if (!prev) return;
      persist({ ...prev, ...partial });
    },
    [persist]
  );

  const clearError = useCallback(() => setError(null), []);

  // Etapa 1 — Intake
  // meta: optional fields (clientName, professional) merged into the saved case
  const runIntake = useCallback(
    async (
      transcript: string,
      files: CaseFile[],
      previousIntake?: string,
      meta?: Partial<Case>
    ) => {
      const cur = casoRef.current;
      if (!cur) return;

      // Persist metadata immediately so it isn't lost even if the API call fails
      if (meta) persist({ ...cur, ...meta });

      setLoading(true);
      setError(null);
      try {
        let userText = transcript;
        if (previousIntake) {
          userText = `INTAKE ANTERIOR (use como base e incorpore as novas informações):\n\n${previousIntake}\n\n---\n\nNOVA TRANSCRIÇÃO / INFORMAÇÕES ADICIONAIS:\n\n${transcript}`;
        }

        const output = await callAnthropic(P_INTAKE(), userText, files, 5000);
        persist({
          ...casoRef.current!,
          ...meta,
          transcript,
          intakeFiles: files,
          intakeOutput: output,
          step: (previousIntake ? cur.step : 2) as StageNumber,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao processar intake.");
      } finally {
        setLoading(false);
      }
    },
    [persist]
  );

  // Etapa 2 → 3 — Aprovar intake
  const approveIntake = useCallback(() => {
    update({ step: 3 });
  }, [update]);

  // Etapa 3 — Diagnóstico
  const runDiagnosis = useCallback(
    async (extraInfo?: string, extraFiles?: CaseFile[]) => {
      const cur = casoRef.current;
      if (!cur) return;
      setLoading(true);
      setError(null);
      try {
        let userText = cur.intakeOutput;
        if (extraInfo) {
          userText += `\n\n---\nINFORMAÇÕES ADICIONAIS:\n${extraInfo}`;
        }

        const allFiles = [...(cur.diagFiles || []), ...(extraFiles || [])];
        const output = await callAnthropic(
          P_DIAG(cur.caseFocus, cur.intakeNotes),
          userText,
          allFiles,
          6000
        );
        persist({
          ...casoRef.current!,
          diagExtraInfo: extraInfo || cur.diagExtraInfo,
          diagFiles: allFiles,
          diagnosticOutput: output,
          step: 4 as StageNumber,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao gerar diagnóstico.");
      } finally {
        setLoading(false);
      }
    },
    [persist]
  );

  // Etapa 4 → 5 — Aprovar diagnóstico
  const approveDiagnosis = useCallback(() => {
    update({ step: 5 });
  }, [update]);

  // Etapa 5 — Proposta
  const runProposal = useCallback(async () => {
    const cur = casoRef.current;
    if (!cur) return;
    setLoading(true);
    setError(null);
    try {
      const output = await callAnthropic(
        P_PROPOSTA(cur.diagnosticNotes),
        cur.diagnosticOutput,
        [],
        6000
      );
      persist({
        ...casoRef.current!,
        proposalOutput: output,
        step: 6 as StageNumber,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao gerar proposta.");
    } finally {
      setLoading(false);
    }
  }, [persist]);

  // Etapa 6 — Gerar JSON para slides
  const generateDiagJSON = useCallback(async () => {
    const cur = casoRef.current;
    if (!cur) return;
    setLoading(true);
    setError(null);
    try {
      const raw = await callAnthropic(
        P_JSON_DIAG(),
        cur.diagnosticOutput,
        [],
        2500
      );
      const json = extractJSON<DiagJSON>(raw);
      persist({ ...casoRef.current!, diagJSON: json });
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Erro ao extrair dados para slides internos."
      );
    } finally {
      setLoading(false);
    }
  }, [persist]);

  const generateClienteJSON = useCallback(async () => {
    const cur = casoRef.current;
    if (!cur) return;
    setLoading(true);
    setError(null);
    try {
      const sourceText = `${cur.diagnosticOutput}\n\n---\n\nPROPOSTA:\n${cur.proposalOutput}`;
      const raw = await callAnthropic(
        P_JSON_CLIENTE(),
        sourceText,
        [],
        2500
      );
      const json = extractJSON<ClienteJSON>(raw);
      persist({ ...casoRef.current!, clienteJSON: json });
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Erro ao extrair dados para slides do cliente."
      );
    } finally {
      setLoading(false);
    }
  }, [persist]);

  // Voltar etapa
  const goToStep = useCallback(
    (step: StageNumber) => {
      update({ step });
    },
    [update]
  );

  return {
    caso,
    loading,
    error,
    dbReady,
    update,
    clearError,
    runIntake,
    approveIntake,
    runDiagnosis,
    approveDiagnosis,
    runProposal,
    generateDiagJSON,
    generateClienteJSON,
    goToStep,
  };
}
