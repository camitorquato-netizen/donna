"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getCaseByTicket, saveCase, newCaseId } from "@/lib/store";
import { createEmptyCase } from "@/lib/types";

function NovoCasoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState("Verificando dados...");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const ticket = searchParams.get("ticket")?.trim();
    const cliente = searchParams.get("cliente")?.trim() || "";

    if (!ticket) {
      setErrorMsg(
        "Parâmetro 'ticket' não encontrado na URL. Use: /novo-caso?ticket=XXXX&cliente=Nome"
      );
      return;
    }

    let cancelled = false;

    async function resolve() {
      try {
        setStatus("Buscando caso existente...");
        const existing = await getCaseByTicket(ticket!);

        if (cancelled) return;

        if (existing) {
          setStatus("Caso encontrado! Redirecionando...");
          router.replace(`/caso/${existing.id}`);
          return;
        }

        setStatus("Criando novo caso...");
        const id = newCaseId();
        const novo = {
          ...createEmptyCase(id),
          clientName: cliente,
          appsheetTicketId: ticket!,
        };

        await saveCase(novo);

        if (cancelled) return;

        setStatus("Caso criado! Redirecionando...");
        router.replace(`/caso/${id}`);
      } catch (err) {
        if (!cancelled) {
          console.error("[NovoCaso] Erro:", err);
          setErrorMsg(
            `Erro ao processar: ${err instanceof Error ? err.message : "erro desconhecido"}`
          );
        }
      }
    }

    resolve();

    return () => {
      cancelled = true;
    };
  }, [searchParams, router]);

  return (
    <div className="max-w-4xl mx-auto py-16 text-center">
      {errorMsg ? (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 text-left rounded">
          <p className="text-sm text-red-700 font-sans">{errorMsg}</p>
          <button
            onClick={() => router.push("/casos")}
            className="mt-3 text-sm text-st-gold underline font-sans cursor-pointer"
          >
            ← Voltar para lista de casos
          </button>
        </div>
      ) : (
        <p className="text-sm text-st-muted font-sans animate-pulse">
          {status}
        </p>
      )}
    </div>
  );
}

export default function NovoCasoPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto py-16 text-center">
          <p className="text-sm text-st-muted font-sans animate-pulse">
            Carregando...
          </p>
        </div>
      }
    >
      <NovoCasoContent />
    </Suspense>
  );
}
