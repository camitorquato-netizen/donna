"use client";
import { use, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { PilotoRct } from "@/lib/types";
import { getPilotoRct, deletePilotoRct, savePilotoRct } from "@/lib/store";
import { downloadDocx } from "@/lib/docxExport";
import { parseMultiplosSped, SpedResumo } from "@/lib/spedParser";
import { callAnthropic } from "@/lib/api";
import { P_SPED_COMPLEMENTO } from "@/lib/prompts";
import Btn from "@/components/Btn";
import Md from "@/components/Md";

interface ArquivoSped {
  filename: string;
  content: string;
  resumo: SpedResumo | null;
}

export default function PilotoRctDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [piloto, setPiloto] = useState<PilotoRct | null>(null);
  const [loading, setLoading] = useState(true);

  // Complemento state
  const [showComplemento, setShowComplemento] = useState(false);
  const [arquivos, setArquivos] = useState<ArquivoSped[]>([]);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getPilotoRct(id).then((data) => {
      setPiloto(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <p className="text-sm text-st-muted font-sans animate-pulse">
          Carregando análise...
        </p>
      </div>
    );
  }

  if (!piloto) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 inline-block">
          <p className="text-sm text-red-700 font-sans">
            Análise não encontrada. Ela pode ter sido excluída.
          </p>
        </div>
        <div className="mt-4">
          <a
            href="/radiografia"
            className="text-sm text-st-muted hover:text-st-dark font-sans transition-colors"
          >
            ← Voltar para lista
          </a>
        </div>
      </div>
    );
  }

  const resultado = piloto.resultado;

  // Extrair métricas do resultado
  const receita =
    resultado.match(/[Rr]eceita\s+[Bb]ruta[^R]*?R\$\s*([\d.,]+)/)?.[1] || null;
  const carga =
    resultado.match(/[Cc]arga\s+[Tt]ribut[aá]ria[^R]*?R\$\s*([\d.,]+)/)?.[1] || null;
  const percentual =
    resultado.match(/(\d+[.,]\d+)\s*%/)?.[1] || null;
  const oportunidades = (resultado.match(/[Oo]portunidade/g) || []).length;

  const cards = [
    receita && {
      label: "Receita Bruta",
      value: `R$ ${receita}`,
      color: "text-st-dark",
    },
    carga && {
      label: "Carga Tributária",
      value: `R$ ${carga}`,
      color: "text-st-red",
    },
    percentual && {
      label: "% s/ Faturamento",
      value: `${percentual}%`,
      color: "text-st-dark",
    },
    {
      label: "Oportunidades",
      value: String(oportunidades),
      color: "text-st-green",
    },
  ].filter(Boolean) as { label: string; value: string; color: string }[];

  async function handleDelete() {
    if (confirm("Tem certeza que deseja excluir esta análise?")) {
      await deletePilotoRct(id);
      router.push("/radiografia");
    }
  }

  // --- Complemento: upload e reprocessamento ---

  async function processarArquivos(fileList: FileList) {
    setErro("");
    const novos: ArquivoSped[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const name = file.name.toLowerCase();

      const isText =
        !file.type ||
        file.type === "text/plain" ||
        file.type === "application/octet-stream" ||
        name.endsWith(".txt");

      if (!isText) {
        setErro(`Arquivo "${file.name}" não parece ser texto. O SPED deve ser um arquivo .txt.`);
        continue;
      }

      if (file.size > 100 * 1024 * 1024) {
        setErro(`Arquivo "${file.name}" muito grande (máx. 100MB).`);
        continue;
      }

      try {
        const buffer = await file.arrayBuffer();
        let content: string;
        try {
          content = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
        } catch {
          content = new TextDecoder("iso-8859-1").decode(buffer);
        }

        if (!content.includes("|0000|") && !content.includes("|0001|")) {
          setErro(`Arquivo "${file.name}" não parece ser um SPED válido.`);
          continue;
        }

        novos.push({ filename: file.name, content, resumo: null });
      } catch {
        setErro(`Erro ao ler "${file.name}".`);
      }
    }

    if (novos.length > 0) {
      const comResumo = novos.map((a) => {
        try {
          const { resumos } = parseMultiplosSped([
            { content: a.content, filename: a.filename },
          ]);
          return { ...a, resumo: resumos[0] || null };
        } catch {
          return a;
        }
      });
      setArquivos((prev) => [...prev, ...comResumo]);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) {
      processarArquivos(e.dataTransfer.files);
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      processarArquivos(e.target.files);
    }
    e.target.value = "";
  }

  function removerArquivo(idx: number) {
    setArquivos((prev) => prev.filter((_, i) => i !== idx));
  }

  async function reprocessar() {
    if (!piloto || arquivos.length === 0) return;

    setErro("");
    setProcessando(true);

    try {
      const { textoConsolidado, resumos } = parseMultiplosSped(
        arquivos.map((a) => ({ content: a.content, filename: a.filename }))
      );

      const tiposNovos = resumos
        .map((r) => `${r.tipo} (${r.periodo || "período N/I"})`)
        .join(", ");

      const userPrompt = `# COMPLEMENTO DE ANÁLISE

## Análise Anterior (já processada)

${piloto.resultado}

---

## Novos Arquivos SPED para Incorporar

- Cliente: ${piloto.clienteNome || "Não informado"}
- CNPJ: ${piloto.clienteCnpj || "Extrair do SPED"}
- Novos arquivos: ${resumos.length} (${tiposNovos})

### Registros SPED Adicionais

${textoConsolidado}

---

Incorpore os dados acima à análise anterior e produza a análise COMPLETA e ATUALIZADA conforme instruções do system prompt.`;

      const text = await callAnthropic(
        P_SPED_COMPLEMENTO(),
        userPrompt,
        [],
        8000
      );

      // Atualizar piloto com resultado enriquecido
      const novosArquivosInfo = [
        ...piloto.arquivosInfo,
        ...resumos.map((r) => ({
          filename: r.tipo,
          tipo: r.tipo,
          periodo: r.periodo || "",
        })),
      ];

      const updated: PilotoRct = {
        ...piloto,
        resultado: text,
        arquivosInfo: novosArquivosInfo,
      };

      await savePilotoRct(updated);
      setPiloto(updated);
      setArquivos([]);
      setShowComplemento(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro desconhecido.";
      setErro(msg);
    } finally {
      setProcessando(false);
    }
  }

  const tipoIcon: Record<string, string> = {
    "EFD-Contribuições": "📊",
    "EFD-ICMS/IPI": "🏭",
    ECF: "📋",
    Desconhecido: "❓",
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-2">
        <div>
          <h2 className="font-serif text-base sm:text-lg font-bold text-st-dark truncate">
            {piloto.clienteNome || "Análise"}
          </h2>
          <div className="flex gap-3 mt-1 text-xs text-st-muted font-sans flex-wrap">
            {piloto.clienteCnpj && <span>{piloto.clienteCnpj}</span>}
            <span>
              {new Date(piloto.createdAt).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </span>
            {piloto.arquivosInfo.length > 0 && (
              <span>
                {piloto.arquivosInfo.map((a) => a.tipo).join(", ")}
              </span>
            )}
          </div>
        </div>
        <a
          href="/radiografia"
          className="text-xs sm:text-sm text-st-muted hover:text-st-dark font-sans transition-colors whitespace-nowrap"
        >
          ← Voltar
        </a>
      </div>

      <div className="space-y-4">
        {/* Cards de métricas */}
        {cards.length > 0 && (
          <div
            className={`grid gap-3 ${
              cards.length <= 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"
            }`}
          >
            {cards.map((c) => (
              <div
                key={c.label}
                className="bg-white border border-st-border rounded-xl p-4 text-center"
              >
                <p className="text-xs font-sans text-st-muted uppercase tracking-wider">
                  {c.label}
                </p>
                <p
                  className={`text-lg font-serif font-bold mt-1 ${c.color}`}
                >
                  {c.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Card principal do resultado */}
        <div className="bg-white border border-st-border rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-st-border">
            <div>
              <p className="text-xs font-sans font-medium text-st-muted uppercase tracking-wider">
                Piloto RCT
              </p>
              <p className="text-sm font-serif text-st-dark">
                {piloto.clienteNome || "Cliente"}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Btn
                variant="ghost"
                className="!text-xs !px-3 !py-1"
                onClick={() => navigator.clipboard?.writeText(resultado)}
              >
                Copiar
              </Btn>
              <Btn
                variant="ghost"
                className="!text-xs !px-3 !py-1"
                onClick={() =>
                  downloadDocx(
                    resultado,
                    piloto.clienteNome || "Cliente",
                    "piloto-rct"
                  )
                }
              >
                Baixar Word
              </Btn>
              <Btn
                variant="ghost"
                className="!text-xs !px-3 !py-1 !text-st-red"
                onClick={handleDelete}
              >
                Excluir
              </Btn>
            </div>
          </div>

          <Md content={resultado} />
        </div>

        {/* Botão para complementar */}
        {!showComplemento && !processando && (
          <div className="flex justify-center">
            <Btn
              variant="ghost"
              className="!text-sm"
              onClick={() => setShowComplemento(true)}
            >
              + Complementar com mais arquivos
            </Btn>
          </div>
        )}

        {/* Seção de complemento */}
        {showComplemento && (
          <div className="bg-white border border-st-border rounded-xl p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-sans font-medium text-st-muted uppercase tracking-wider">
                  Complementar Análise
                </p>
                <p className="text-xs font-sans text-st-muted mt-1">
                  Adicione mais arquivos SPED para enriquecer a análise existente
                </p>
              </div>
              <button
                onClick={() => {
                  setShowComplemento(false);
                  setArquivos([]);
                  setErro("");
                }}
                className="text-st-muted hover:text-st-dark transition-colors text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Upload area */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
                dragging
                  ? "border-st-gold bg-st-gold/5"
                  : "border-st-border hover:border-st-gold/50"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                multiple
                accept=".txt,.TXT,text/plain"
                onChange={handleFileInput}
                className="hidden"
              />
              <div className="text-st-muted text-sm font-sans">
                <span className="text-2xl block mb-2">📄</span>
                <span className="hidden sm:inline">
                  Arraste arquivos SPED adicionais aqui, ou clique para selecionar
                </span>
                <span className="sm:hidden">
                  Toque para selecionar arquivos SPED adicionais
                </span>
                <p className="text-xs text-st-muted/70 mt-1">
                  EFD-Contribuições · EFD-ICMS/IPI · ECF
                </p>
              </div>
            </div>

            {/* Lista de arquivos novos */}
            {arquivos.length > 0 && (
              <div className="space-y-2">
                {arquivos.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 bg-gray-50 border border-st-border/50 rounded-lg px-3 py-2"
                  >
                    <span className="text-lg">
                      {tipoIcon[a.resumo?.tipo || "Desconhecido"]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-sans text-st-dark truncate">
                        {a.filename}
                      </p>
                      {a.resumo && (
                        <p className="text-xs font-sans text-st-muted">
                          {a.resumo.tipo}
                          {a.resumo.nome ? ` — ${a.resumo.nome}` : ""}
                          {a.resumo.periodo ? ` — ${a.resumo.periodo}` : ""}
                          {" · "}
                          {a.resumo.totalLinhas.toLocaleString("pt-BR")} linhas →{" "}
                          {a.resumo.linhasFiltradas.toLocaleString("pt-BR")}{" "}
                          registros-chave
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removerArquivo(i);
                      }}
                      className="text-st-muted hover:text-st-red transition-colors cursor-pointer shrink-0 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Erro */}
            {erro && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <p className="text-sm text-red-700 font-sans">{erro}</p>
              </div>
            )}

            {/* Botão reprocessar */}
            {arquivos.length > 0 && (
              <div className="flex justify-end">
                <Btn
                  variant="gold"
                  onClick={reprocessar}
                  loading={processando}
                  className="!px-6"
                >
                  {processando
                    ? "Reprocessando..."
                    : `Reprocessar com ${arquivos.length} arquivo${arquivos.length > 1 ? "s" : ""}`}
                </Btn>
              </div>
            )}
          </div>
        )}

        {/* Loading do reprocessamento */}
        {processando && (
          <div className="bg-white border border-st-border rounded-xl p-8 text-center">
            <div className="flex justify-center gap-1.5 mb-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-st-gold animate-pulse"
                  style={{ animationDelay: `${i * 200}ms` }}
                />
              ))}
            </div>
            <p className="text-sm text-st-muted font-sans">
              Incorporando novos dados à análise...
            </p>
            <p className="text-xs text-st-muted/60 font-sans mt-1">
              Isso pode levar até 30 segundos
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
