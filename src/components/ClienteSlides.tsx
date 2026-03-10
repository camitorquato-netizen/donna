import { ClienteJSON } from "@/lib/types";
import SimChart from "./SimChart";
import ArchDiagram from "./ArchDiagram";

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  }).format(value);
}

const slideBase = "w-full aspect-video flex flex-col p-10 lg:p-14 overflow-hidden";

export function clienteSlides(
  data: ClienteJSON,
  clientName: string,
  professional: string
): React.ReactElement[] {
  const today = new Date().toLocaleDateString("pt-BR");

  return [
    // Slide 1 — Capa
    <div key="c1" className={`${slideBase} bg-white text-st-dark justify-between border-b-4 border-st-gold`}>
      <div>
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-st-gold text-st-dark font-serif font-bold rounded-lg flex items-center justify-center text-sm">
            ST
          </div>
          <span className="text-st-muted text-xs font-sans">Silveira Torquato Advogados</span>
        </div>
        <h1 className="font-serif text-3xl lg:text-4xl font-bold mb-3">
          DIAGNÓSTICO E OPORTUNIDADES<br />DE ESTRUTURAÇÃO
        </h1>
        <div className="w-16 h-1 bg-st-gold mb-4" />
        <p className="text-lg text-st-dark/70 font-serif">{clientName}</p>
      </div>
      <div className="flex justify-between text-xs text-st-muted font-sans">
        <span>{professional}</span>
        <span>{today}</span>
      </div>
    </div>,

    // Slide 2 — Resumo Executivo
    <div key="c2" className={`${slideBase} bg-white text-st-dark`}>
      <h2 className="font-serif text-2xl font-bold mb-6">Resumo Executivo</h2>
      <div className="bg-st-light border border-st-border rounded-xl p-6 mb-6">
        <p className="text-sm font-sans leading-relaxed text-st-dark/80">
          {data.resumo}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-st-red/5 border border-st-red/20 rounded-xl p-4 text-center">
          <div className="text-xs font-sans text-st-muted mb-1">IR Atual (PF)</div>
          <div className="font-bold text-xl text-st-red font-sans">
            {formatBRL(data.simulacao.ir_atual_pf)}
          </div>
        </div>
        <div className="bg-st-green/5 border border-st-green/20 rounded-xl p-4 text-center">
          <div className="text-xs font-sans text-st-muted mb-1">IR com Holding</div>
          <div className="font-bold text-xl text-st-green font-sans">
            {formatBRL(data.simulacao.ir_com_holding)}
          </div>
        </div>
        <div className="bg-st-gold/5 border border-st-gold/20 rounded-xl p-4 text-center">
          <div className="text-xs font-sans text-st-muted mb-1">Economia Anual</div>
          <div className="font-bold text-xl text-st-gold font-sans">
            {formatBRL(data.simulacao.economia_anual)}
          </div>
        </div>
      </div>
    </div>,

    // Slide 3 — Situação Atual
    <div key="c3" className={`${slideBase} bg-white text-st-dark`}>
      <h2 className="font-serif text-2xl font-bold mb-6">Situação Atual</h2>
      <div className="space-y-3 flex-1">
        {data.situacao_atual.map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-st-dark text-white flex items-center justify-center text-xs font-sans font-bold shrink-0 mt-0.5">
              {i + 1}
            </div>
            <p className="text-sm font-sans text-st-dark/80 leading-relaxed">
              {item}
            </p>
          </div>
        ))}
      </div>
    </div>,

    // Slide 4 — Estrutura Proposta
    <div key="c4" className={`${slideBase} bg-white text-st-dark`}>
      <h2 className="font-serif text-2xl font-bold mb-4">Estrutura Proposta</h2>
      <div className="flex-1 flex flex-col items-center justify-center">
        <ArchDiagram
          nomeHolding={data.arquitetura.nome_holding}
          socios={data.arquitetura.socios}
          ativos={data.arquitetura.ativos_integrar}
          descricao={data.arquitetura.estrutura_descricao}
        />
      </div>
    </div>,

    // Slide 5 — Pontos de Atenção
    <div key="c5" className={`${slideBase} bg-white text-st-dark`}>
      <h2 className="font-serif text-2xl font-bold mb-6">Pontos de Atenção</h2>
      <div className="space-y-3 flex-1">
        {data.riscos.map((r, i) => (
          <div
            key={i}
            className="bg-white border-l-4 border-st-red rounded-lg p-4 shadow-sm"
          >
            <h4 className="font-sans font-bold text-sm text-st-dark mb-1">
              {r.titulo}
            </h4>
            <p className="text-xs font-sans text-st-dark/70 leading-relaxed">
              {r.descricao}
            </p>
          </div>
        ))}
      </div>
    </div>,

    // Slide 6 — Oportunidades
    <div key="c6" className={`${slideBase} bg-st-dark text-white`}>
      <h2 className="font-serif text-2xl font-bold mb-6">Oportunidades Identificadas</h2>
      <div className="space-y-3 flex-1">
        {data.oportunidades.map((op, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="text-st-gold text-lg">→</span>
            <p className="text-sm font-sans text-white/80 leading-relaxed">
              {op}
            </p>
          </div>
        ))}
      </div>
    </div>,

    // Slide 7 — Projetos Propostos
    <div key="c7" className={`${slideBase} bg-white text-st-dark`}>
      <h2 className="font-serif text-2xl font-bold mb-6">Projetos Propostos</h2>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm font-sans">
          <thead>
            <tr className="border-b-2 border-st-border">
              <th className="text-left py-2 text-st-muted font-medium">Projeto</th>
              <th className="text-left py-2 text-st-muted font-medium">Objetivo</th>
              <th className="text-center py-2 text-st-muted font-medium">Prazo</th>
              <th className="text-center py-2 text-st-muted font-medium">Urgência</th>
            </tr>
          </thead>
          <tbody>
            {data.projetos.map((p, i) => {
              const urgColors: Record<string, string> = {
                Alta: "bg-st-red text-white",
                Média: "bg-amber-500 text-white",
                Baixa: "bg-st-green text-white",
              };
              return (
                <tr key={i} className="border-b border-st-border">
                  <td className="py-2 font-medium">{p.nome}</td>
                  <td className="py-2 text-st-dark/70 text-xs">{p.objetivo}</td>
                  <td className="py-2 text-center text-xs">{p.prazo}</td>
                  <td className="py-2 text-center">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        urgColors[p.urgencia] || "bg-st-muted text-white"
                      }`}
                    >
                      {p.urgencia}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>,

    // Slide 8 — Próximos Passos
    <div key="c8" className={`${slideBase} bg-white text-st-dark`}>
      <h2 className="font-serif text-2xl font-bold mb-6">Próximos Passos</h2>
      <div className="flex-1 flex">
        <div className="relative pl-8">
          <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-st-gold" />
          {data.proximos_passos.map((passo, i) => (
            <div key={i} className="relative mb-6">
              <div className="absolute left-[-22px] top-0.5 w-5 h-5 rounded-full bg-st-gold text-white text-xs font-sans font-bold flex items-center justify-center">
                {i + 1}
              </div>
              <p className="text-sm font-sans text-st-dark/80 leading-relaxed ml-2">
                {passo}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>,

    // Slide 9 — Encerramento
    <div key="c9" className={`${slideBase} bg-st-dark text-white justify-center items-center text-center`}>
      <div className="w-14 h-14 bg-st-gold text-st-dark font-serif font-bold rounded-xl flex items-center justify-center text-xl mb-6">
        ST
      </div>
      <h2 className="font-serif text-2xl font-bold mb-2">
        Silveira Torquato Advogados
      </h2>
      <p className="text-white/60 font-sans text-sm mb-8">
        Planejamento Patrimonial e Tributário
      </p>
      <div className="w-16 h-0.5 bg-st-gold mb-8" />
      <p className="text-xs text-white/40 font-sans max-w-md leading-relaxed">
        Este documento é confidencial e destinado exclusivamente ao cliente indicado.
        As análises apresentadas são preliminares e não constituem parecer jurídico definitivo.
      </p>
    </div>,
  ];
}
