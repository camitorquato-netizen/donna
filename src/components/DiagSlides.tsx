import { DiagJSON } from "@/lib/types";
import SimChart from "./SimChart";

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  }).format(value);
}

const slideBase = "w-full aspect-video flex flex-col p-10 lg:p-14 overflow-hidden";

export function diagSlides(
  data: DiagJSON,
  clientName: string,
  professional: string
): React.ReactElement[] {
  const today = new Date().toLocaleDateString("pt-BR");

  return [
    // Slide 1 — Capa
    <div key="d1" className={`${slideBase} bg-st-dark text-white justify-between`}>
      <div>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-st-gold text-st-dark font-serif font-bold rounded-lg flex items-center justify-center text-sm">
            ST
          </div>
          <span className="text-white/50 text-xs font-sans">Silveira Torquato Advogados</span>
        </div>
        <h1 className="font-serif text-3xl lg:text-4xl font-bold mb-4">
          DIAGNÓSTICO PATRIMONIAL<br />PRELIMINAR
        </h1>
        <div className="w-16 h-1 bg-st-gold mb-6" />
        <p className="text-lg text-white/80 font-serif">{clientName}</p>
      </div>
      <div className="bg-st-gold/10 border border-st-gold/30 rounded-lg p-4 mt-4">
        <p className="text-sm text-white/90 font-sans leading-relaxed">
          {data.resumo_caso}
        </p>
      </div>
      <div className="flex justify-between text-xs text-white/40 font-sans mt-4">
        <span>{professional}</span>
        <span>{today}</span>
      </div>
    </div>,

    // Slide 2 — Patrimônio
    <div key="d2" className={`${slideBase} bg-st-light text-st-dark`}>
      <h2 className="font-serif text-2xl font-bold mb-6">Patrimônio Identificado</h2>
      <div className="grid grid-cols-3 gap-4 flex-1">
        <div className="bg-white border border-st-border rounded-xl p-4">
          <div className="text-lg mb-3">▣ Imóveis</div>
          <ul className="space-y-1.5">
            {data.patrimonio.imoveis.map((item, i) => (
              <li key={i} className="text-xs font-sans text-st-dark/80 leading-relaxed">
                • {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white border border-st-border rounded-xl p-4">
          <div className="text-lg mb-3">◈ Empresas</div>
          <ul className="space-y-1.5">
            {data.patrimonio.empresas.map((item, i) => (
              <li key={i} className="text-xs font-sans text-st-dark/80 leading-relaxed">
                • {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white border border-st-border rounded-xl p-4">
          <div className="text-lg mb-3">◆ Investimentos</div>
          <ul className="space-y-1.5">
            {data.patrimonio.investimentos.map((item, i) => (
              <li key={i} className="text-xs font-sans text-st-dark/80 leading-relaxed">
                • {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>,

    // Slide 3 — Análise Técnica
    <div key="d3" className={`${slideBase} bg-st-light text-st-dark`}>
      <h2 className="font-serif text-2xl font-bold mb-6">Análise Técnica</h2>
      <div className="grid grid-cols-2 gap-6 flex-1">
        <div>
          <h3 className="font-serif text-lg font-bold mb-3 flex items-center gap-2">
            <span className="text-st-gold">§</span> Tributário
          </h3>
          <ul className="space-y-2">
            {data.tributario.map((item, i) => (
              <li key={i} className="text-xs font-sans text-st-dark/80 leading-relaxed">
                • {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-serif text-lg font-bold mb-3 flex items-center gap-2">
            <span className="text-st-gold">¶</span> Sucessório
          </h3>
          <ul className="space-y-2">
            {data.sucessorio.map((item, i) => (
              <li key={i} className="text-xs font-sans text-st-dark/80 leading-relaxed">
                • {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>,

    // Slide 4 — Simulação Financeira
    <div key="d4" className={`${slideBase} bg-st-light text-st-dark items-center justify-center`}>
      <h2 className="font-serif text-2xl font-bold mb-6">Simulação Financeira</h2>
      <div className="flex items-center gap-8 w-full max-w-2xl">
        <div className="flex-1">
          <SimChart
            irAtual={data.simulacao.ir_atual_pf}
            irHolding={data.simulacao.ir_com_holding}
            economia={data.simulacao.economia_anual}
            descricao={data.simulacao.descricao_calculo}
          />
        </div>
        <div className="space-y-3 text-sm font-sans">
          <div>
            <span className="text-st-muted text-xs">Patrimônio Total</span>
            <div className="font-bold text-lg">{formatBRL(data.simulacao.patrimonio_total)}</div>
          </div>
          <div>
            <span className="text-st-muted text-xs">Renda Anual PF</span>
            <div className="font-bold">{formatBRL(data.simulacao.renda_anual_pf)}</div>
          </div>
          <div className="pt-2 border-t border-st-border">
            <span className="text-st-muted text-xs">Economia em 5 anos</span>
            <div className="font-bold text-st-gold text-lg">
              {formatBRL(data.simulacao.economia_anual * 5)}
            </div>
          </div>
        </div>
      </div>
    </div>,

    // Slide 5 — Riscos
    <div key="d5" className={`${slideBase} bg-st-dark text-white`}>
      <h2 className="font-serif text-2xl font-bold mb-6">Riscos Identificados</h2>
      <div className="grid grid-cols-2 gap-3 flex-1">
        {data.riscos.map((r, i) => {
          const colors: Record<string, string> = {
            Alto: "bg-st-red",
            Médio: "bg-amber-500",
            Baixo: "bg-st-green",
          };
          return (
            <div
              key={i}
              className="bg-white/5 border border-white/10 rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-xs font-sans font-bold text-white px-2 py-0.5 rounded-full ${
                    colors[r.nivel] || "bg-st-muted"
                  }`}
                >
                  {r.nivel}
                </span>
              </div>
              <p className="text-xs text-white/80 font-sans leading-relaxed mb-2">
                {r.descricao}
              </p>
              <p className="text-xs text-st-gold font-sans">→ {r.acao}</p>
            </div>
          );
        })}
      </div>
    </div>,

    // Slide 6 — Oportunidades
    <div key="d6" className={`${slideBase} bg-st-dark text-white`}>
      <h2 className="font-serif text-2xl font-bold mb-6">Oportunidades de Estruturação</h2>
      <div className="grid grid-cols-2 gap-3 flex-1">
        {data.oportunidades.map((op, i) => (
          <div
            key={i}
            className="bg-white/5 border border-white/10 rounded-xl p-4"
          >
            <span className="text-st-gold font-serif font-bold text-lg">
              {String(i + 1).padStart(2, "0")}
            </span>
            <p className="text-xs text-white/80 font-sans leading-relaxed mt-2">
              {op}
            </p>
          </div>
        ))}
      </div>
    </div>,

    // Slide 7 — Documentos
    <div key="d7" className={`${slideBase} bg-st-light text-st-dark`}>
      <h2 className="font-serif text-2xl font-bold mb-6">Documentos Necessários</h2>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex-1">
        <ul className="space-y-2">
          {data.documentos_faltantes.map((doc, i) => (
            <li key={i} className="flex items-start gap-2 text-sm font-sans">
              <span className="text-amber-500 mt-0.5">●</span>
              <span className="text-st-dark/80">{doc}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex justify-between items-center mt-4 text-xs text-st-muted font-sans">
        <span>Silveira Torquato Advogados</span>
        <span>Documento Confidencial</span>
      </div>
    </div>,
  ];
}
