"use client";
import { use, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Pasta,
  Processo,
  PastaTabKey,
  PastaTabConfig,
  getPastaTabsConfig,
  PASTA_STATUS_LABELS,
  PastaStatus,
} from "@/lib/types";
import { getPasta, savePasta, getProcessoByPasta } from "@/lib/store";
import Btn from "@/components/Btn";
import Badge from "@/components/Badge";
import TabGeral from "@/components/pastas/TabGeral";
import TabProcesso from "@/components/pastas/TabProcesso";
import TabPublicacoes from "@/components/pastas/TabPublicacoes";
import TabTarefas from "@/components/pastas/TabTarefas";
import TabCreditos from "@/components/pastas/TabCreditos";
import TabWorkflow from "@/components/pastas/TabWorkflow";
import TabCompensacoes from "@/components/pastas/TabCompensacoes";
import TabRadiografia from "@/components/pastas/TabRadiografia";
import TabFinanceiro from "@/components/pastas/TabFinanceiro";
import TabWorkflowPlanejamento from "@/components/pastas/TabWorkflowPlanejamento";
import { useAuth } from "@/contexts/AuthContext";

const statusColors: Record<string, "gold" | "green" | "muted" | "dark"> = {
  ativo: "green",
  suspenso: "gold",
  arquivado: "muted",
  encerrado: "dark",
};

export default function PastaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { isReadOnly, canSeeFinanceiro } = useAuth();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as PastaTabKey | null;
  const creditoParam = searchParams.get("credito");
  const [pasta, setPasta] = useState<Pasta | null>(null);
  const [processo, setProcesso] = useState<Processo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<PastaTabKey>(tabParam || "geral");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, proc] = await Promise.all([
        getPasta(id),
        getProcessoByPasta(id),
      ]);
      setPasta(p);
      setProcesso(proc);
    } catch (err) {
      console.error("[PastaDetail] Erro:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  function set<K extends keyof Pasta>(key: K, val: Pasta[K]) {
    setPasta((prev) => (prev ? { ...prev, [key]: val } : prev));
  }

  async function handleSave() {
    if (!pasta) return;
    setSaving(true);
    try {
      await savePasta(pasta);
      setIsEditing(false);
    } catch (err) {
      console.error("[PastaDetail] Erro ao salvar:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel() {
    await load();
    setIsEditing(false);
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <p className="text-sm text-st-muted font-sans animate-pulse">
          Carregando pasta...
        </p>
      </div>
    );
  }

  if (!pasta) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <p className="text-sm text-st-muted font-sans">
          Pasta não encontrada.
        </p>
        <button
          onClick={() => router.push("/pastas")}
          className="mt-3 text-sm text-st-gold font-sans hover:underline cursor-pointer"
        >
          ← Voltar para pastas
        </button>
      </div>
    );
  }

  const tabs: PastaTabConfig[] = getPastaTabsConfig(pasta, processo).filter(
    (t) => t.key !== "financeiro" || canSeeFinanceiro
  );

  // Se a aba ativa não está disponível, voltar para "geral"
  if (!tabs.find((t) => t.key === activeTab)) {
    // Use setTimeout to avoid state update during render
    setTimeout(() => setActiveTab("geral"), 0);
  }

  function renderTabContent() {
    switch (activeTab) {
      case "geral":
        return <TabGeral pasta={pasta!} onChange={set} isEditing={isEditing} />;
      case "processo":
        return <TabProcesso pastaId={pasta!.id} />;
      case "publicacoes":
        return <TabPublicacoes pastaId={pasta!.id} />;
      case "tarefas":
        return <TabTarefas pastaId={pasta!.id} />;
      case "radiografia":
        return (
          <TabRadiografia
            pastaId={pasta!.id}
            clienteNome={pasta!.clienteNome}
          />
        );
      case "creditos":
        return <TabCreditos pastaId={pasta!.id} autoCreditoId={creditoParam} />;
      case "workflow":
        return <TabWorkflow pastaId={pasta!.id} />;
      case "workflow_planejamento":
        return <TabWorkflowPlanejamento pastaId={pasta!.id} />;
      case "compensacoes":
        return (
          <TabCompensacoes
            pastaId={pasta!.id}
            contratoId={pasta!.contratoId}
            clienteId={pasta!.clienteId}
          />
        );
      case "financeiro":
        return (
          <TabFinanceiro
            pastaId={pasta!.id}
            clienteId={pasta!.clienteId}
          />
        );
      default:
        return null;
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back link */}
      <button
        onClick={() => router.push("/pastas")}
        className="text-sm text-st-muted hover:text-st-dark font-sans transition-colors mb-4 cursor-pointer"
      >
        ← Voltar para pastas
      </button>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0">
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-st-dark">
              {pasta.numero && (
                <span className="text-st-muted font-mono text-base mr-2">
                  {pasta.numero}
                </span>
              )}
              {pasta.titulo || "Pasta sem título"}
            </h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge color={pasta.tipo === "processo" ? "dark" : "gold"}>
                {pasta.tipo === "processo"
                  ? "Processo"
                  : pasta.tipoServico || "Serviço"}
              </Badge>
              <Badge color={statusColors[pasta.status] || "muted"}>
                {PASTA_STATUS_LABELS[pasta.status as PastaStatus] || pasta.status}
              </Badge>
            </div>
            {pasta.clienteNome && (
              <p className="text-sm text-st-muted font-sans mt-2">
                Cliente: <strong>{pasta.clienteNome}</strong>
              </p>
            )}
          </div>
          {activeTab === "geral" && (
            isEditing ? (
              <div className="flex gap-2 shrink-0">
                <Btn variant="ghost" onClick={handleCancel}>Cancelar</Btn>
                <Btn variant="gold" onClick={handleSave} loading={saving}>Salvar</Btn>
              </div>
            ) : (
              !isReadOnly && <Btn variant="gold" onClick={() => setIsEditing(true)}>Editar</Btn>
            )
          )}
        </div>
      </div>

      {/* Dynamic Tabs */}
      <div className="border-b border-st-border mb-6 overflow-x-auto">
        <div className="flex gap-0 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-sans font-medium transition-colors border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === tab.key
                  ? "border-st-gold text-st-gold"
                  : "border-transparent text-st-muted hover:text-st-dark"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
}
