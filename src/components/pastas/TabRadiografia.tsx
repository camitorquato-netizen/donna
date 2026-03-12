"use client";
import { useState, useRef } from "react";
import { parseMultiplosSped, SpedResumo } from "@/lib/spedParser";
import { callAnthropic } from "@/lib/api";
import { P_SPED_RADIOGRAFIA } from "@/lib/prompts";
import Btn from "@/components/Btn";
import Md from "@/components/Md";
import { downloadDocx } from "@/lib/docxExport";
import { savePilotoRct } from "@/lib/store";
import type { PilotoRct } from "@/lib/types";

interface TabRadiografiaProps {
  /** Opcional — quando usado dentro de uma pasta */
  pastaId?: string;
  clienteNome?: string;
  clienteCnpj?: string;
  /** Callback chamado após salvar no banco */
  onSaved?: (id: string) => void;
}

interface ArquivoSped {
  filename: string;
  content: string;
  resumo: SpedResumo | null;
}

export default function TabRadiografia({
  clienteNome,
  clienteCnpj,
  onSaved,
}: TabRadiografiaProps) {
  const [arquivos, setArquivos] = useState<ArquivoSped[]>([]);
  const [nomeCliente, setNomeCliente] = useState(clienteNome || "");
  const [resultado, setResultado] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function processarArquivos(fileList: FileList) {
    setError("");
    const novos: ArquivoSped[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const name = file.name.toLowerCase();

      // Aceita .txt ou qualquer arquivo sem MIME type definido
      const isText =
        !file.type ||
        file.type === "text/plain" ||
        file.type === "application/octet-stream" ||
        name.endsWith(".txt");

      if (!isText) {
        setError(
          `Arquivo "${file.name}" não parece ser texto. O SPED deve ser um arquivo .txt.`
        );
        continue;
      }

      if (file.size > 100 * 1024 * 1024) {
        setError(`Arquivo "${file.name}" muito grande (máx. 100MB).`);
        continue;
      }

      try {
        // Lê como ArrayBuffer para lidar com encoding Latin-1/ISO-8859-1
        const buffer = await file.arrayBuffer();
        let content: string;
        try {
          const utf8 = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
          content = utf8;
        } catch {
          // Fallback para Latin-1 (comum em SPEDs de sistemas contábeis)
          content = new TextDecoder("iso-8859-1").decode(buffer);
        }

        // Validação: SPED deve ter registro |0000|
        if (!content.includes("|0000|") && !content.includes("|0001|")) {
          setError(
            `Arquivo "${file.name}" não parece ser um SPED válido (registro |0000| não encontrado).`
          );
          continue;
        }

        novos.push({ filename: file.name, content, resumo: null });
      } catch {
        setError(`Erro ao ler "${file.name}".`);
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

  async function gerarRadiografia() {
    if (arquivos.length === 0) {
      setError("Adicione pelo menos um arquivo SPED.");
      return;
    }

    setError("");
    setLoading(true);
    setResultado("");

    try {
      const { textoConsolidado, resumos } = parseMultiplosSped(
        arquivos.map((a) => ({ content: a.content, filename: a.filename }))
      );

      const tiposDetectados = resumos
        .map((r) => `${r.tipo} (${r.periodo || "período N/I"})`)
        .join(", ");

      const clienteLabel = nomeCliente || clienteNome || "Não informado";
      const cnpjLabel =
        clienteCnpj ||
        resumos.find((r) => r.cnpj)?.cnpj ||
        "Extrair do SPED";

      const userPrompt = `# DADOS PARA ANÁLISE

## Contexto
- Cliente: ${clienteLabel}
- CNPJ: ${cnpjLabel}
- Arquivos SPED fornecidos: ${resumos.length} (${tiposDetectados})

## Registros SPED Extraídos

${textoConsolidado}

---

Analise os registros acima e gere a análise fiscal completa (Piloto RCT) conforme instruções do system prompt.`;

      const text = await callAnthropic(
        P_SPED_RADIOGRAFIA(),
        userPrompt,
        [],
        8000
      );
      setResultado(text);

      // Auto-save no banco
      const pilotoId = crypto.randomUUID();
      const piloto: PilotoRct = {
        id: pilotoId,
        clienteNome: clienteLabel,
        clienteCnpj: cnpjLabel === "Extrair do SPED" ? "" : cnpjLabel,
        arquivosInfo: resumos.map((r) => ({
          filename: r.tipo,
          tipo: r.tipo,
          periodo: r.periodo || "",
        })),
        resultado: text,
        createdAt: new Date().toISOString(),
      };
      savePilotoRct(piloto).then(() => onSaved?.(pilotoId));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro desconhecido.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function resetar() {
    setArquivos([]);
    setResultado("");
    setError("");
  }

  const tipoIcon: Record<string, string> = {
    "EFD-Contribuições": "📊",
    "EFD-ICMS/IPI": "🏭",
    ECF: "📋",
    Desconhecido: "❓",
  };

  return (
    <div className="space-y-4">
      {/* Info */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <p className="text-xs font-sans text-amber-800">
          Faça upload dos arquivos SPED do cliente (.txt) para gerar uma
          análise fiscal automática com pré-análise de oportunidades de
          crédito tributário (Piloto RCT).
        </p>
      </div>

      {/* Nome do cliente (quando standalone) */}
      {!clienteNome && (
        <div className="bg-white border border-st-border rounded-xl p-4">
          <label className="block text-xs font-sans font-medium text-st-muted uppercase tracking-wider mb-2">
            Cliente (opcional)
          </label>
          <input
            type="text"
            value={nomeCliente}
            onChange={(e) => setNomeCliente(e.target.value)}
            placeholder="Nome do cliente ou empresa"
            className="w-full border border-st-border rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:border-st-gold"
          />
        </div>
      )}

      {/* Upload area */}
      <div className="bg-white border border-st-border rounded-xl p-4">
        <label className="block text-xs font-sans font-medium text-st-muted uppercase tracking-wider mb-2">
          Arquivos SPED
        </label>

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
              Arraste arquivos SPED (.txt) aqui, ou clique para selecionar
            </span>
            <span className="sm:hidden">
              Toque para selecionar arquivos SPED (.txt)
            </span>
            <p className="text-xs text-st-muted/70 mt-1">
              EFD-Contribuições · EFD-ICMS/IPI · ECF
            </p>
          </div>
        </div>

        {/* Lista de arquivos */}
        {arquivos.length > 0 && (
          <div className="mt-3 space-y-2">
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
      </div>

      {/* Erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-sm text-red-700 font-sans">{error}</p>
        </div>
      )}

      {/* Botão Gerar */}
      {arquivos.length > 0 && !resultado && (
        <div className="flex justify-end">
          <Btn
            variant="gold"
            onClick={gerarRadiografia}
            loading={loading}
            className="!px-6"
          >
            {loading ? "Analisando SPEDs..." : "Gerar Piloto RCT →"}
          </Btn>
        </div>
      )}

      {/* Loading */}
      {loading && (
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
            Analisando registros SPED com IA...
          </p>
          <p className="text-xs text-st-muted/60 font-sans mt-1">
            Isso pode levar até 30 segundos
          </p>
        </div>
      )}

      {/* Resultado */}
      {resultado && !loading && (
        <div className="space-y-4">
          {/* Cards de métricas */}
          {(() => {
            const receita =
              resultado.match(
                /[Rr]eceita\s+[Bb]ruta[^R]*?R\$\s*([\d.,]+)/
              )?.[1] || null;
            const carga =
              resultado.match(
                /[Cc]arga\s+[Tt]ribut[aá]ria[^R]*?R\$\s*([\d.,]+)/
              )?.[1] || null;
            const percentual =
              resultado.match(
                /(\d+[.,]\d+)\s*%/
              )?.[1] || null;
            const oportunidades = (
              resultado.match(/[Oo]portunidade/g) || []
            ).length;

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
            ].filter(Boolean) as {
              label: string;
              value: string;
              color: string;
            }[];

            return cards.length > 0 ? (
              <div
                className={`grid gap-3 ${
                  cards.length <= 2
                    ? "grid-cols-2"
                    : "grid-cols-2 sm:grid-cols-4"
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
            ) : null;
          })()}

          {/* Card principal do resultado */}
          <div className="bg-white border border-st-border rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-st-border">
              <div>
                <p className="text-xs font-sans font-medium text-st-muted uppercase tracking-wider">
                  Piloto RCT
                </p>
                <p className="text-sm font-serif text-st-dark">
                  {nomeCliente || clienteNome || "Cliente"}
                </p>
              </div>
              <div className="flex gap-2">
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
                      nomeCliente || clienteNome || "Cliente",
                      "piloto-rct"
                    )
                  }
                >
                  Baixar Word
                </Btn>
                <Btn
                  variant="ghost"
                  className="!text-xs !px-3 !py-1"
                  onClick={resetar}
                >
                  Nova análise
                </Btn>
              </div>
            </div>

            <Md content={resultado} />
          </div>
        </div>
      )}
    </div>
  );
}
