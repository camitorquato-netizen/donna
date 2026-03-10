import { DiagJSON, ClienteJSON } from "./types";

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  }).format(value);
}

const baseStyles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; background: #111; overflow: hidden; }
  h1, h2, h3, h4 { font-family: Georgia, serif; }
  .slide { width: 100vw; height: 100vh; display: none; flex-direction: column; padding: 50px 60px; overflow: hidden; }
  .slide.active { display: flex; }
  .nav { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; gap: 8px; z-index: 10; }
  .nav button { width: 10px; height: 10px; border-radius: 50%; border: none; background: rgba(255,255,255,0.3); cursor: pointer; }
  .nav button.active { background: #c89b5f; width: 16px; border-radius: 5px; }
  .counter { position: fixed; bottom: 8px; left: 50%; transform: translateX(-50%); color: rgba(255,255,255,0.3); font-size: 11px; }
  .arrows { position: fixed; top: 50%; z-index: 10; width: 36px; height: 36px; border-radius: 50%; border: none; background: rgba(255,255,255,0.1); color: white; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .arrows:hover { background: rgba(255,255,255,0.2); }
  .arr-l { left: 16px; transform: translateY(-50%); }
  .arr-r { right: 16px; transform: translateY(-50%); }
  .print-btn { position: fixed; top: 16px; right: 16px; z-index: 10; color: rgba(255,255,255,0.5); font-size: 12px; border: 1px solid rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 8px; background: none; cursor: pointer; }
  .print-btn:hover { color: white; border-color: rgba(255,255,255,0.4); }
  @media print { .nav, .counter, .arrows, .print-btn { display: none !important; } .slide { display: flex !important; page-break-after: always; height: auto; min-height: 100vh; } body { background: white; } }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: bold; }
  .bg-dark { background: #232535; color: #fcf9f5; }
  .bg-light { background: #fcf9f5; color: #232535; }
  .bg-white { background: #ffffff; color: #232535; }
  .text-gold { color: #c89b5f; }
  .text-red { color: #b83232; }
  .text-green { color: #2a6e44; }
  .text-muted { color: #888880; }
  .border-gold { border-bottom: 4px solid #c89b5f; }
  .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; flex: 1; }
  .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; flex: 1; }
  .card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 16px; }
  .card-light { background: #fff; border: 1px solid #e0dbd4; border-radius: 12px; padding: 16px; }
  .divider { width: 60px; height: 3px; background: #c89b5f; margin: 12px 0; }
  .st-logo { width: 40px; height: 40px; background: #c89b5f; color: #232535; font-family: Georgia, serif; font-weight: bold; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; }
  ul { list-style: none; padding: 0; }
  ul li { padding: 4px 0; font-size: 12px; line-height: 1.6; }
  ul li::before { content: "• "; color: #c89b5f; }
`;

const navScript = `
<script>
let c=0;const ss=document.querySelectorAll('.slide'),bs=document.querySelectorAll('.nav button'),ct=document.querySelector('.counter');
function show(n){ss.forEach(s=>s.classList.remove('active'));bs.forEach(b=>b.classList.remove('active'));c=Math.max(0,Math.min(n,ss.length-1));ss[c].classList.add('active');bs[c].classList.add('active');ct.textContent=(c+1)+' / '+ss.length;}
document.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key===' ')show(c+1);if(e.key==='ArrowLeft')show(c-1);});
document.querySelector('.arr-l').onclick=()=>show(c-1);
document.querySelector('.arr-r').onclick=()=>show(c+1);
bs.forEach((b,i)=>b.onclick=()=>show(i));
document.querySelector('.print-btn').onclick=()=>window.print();
</script>`;

function wrapHTML(title: string, slides: string[], slideCount: number): string {
  const dots = Array.from(
    { length: slideCount },
    (_, i) => `<button class="${i === 0 ? "active" : ""}"></button>`
  ).join("");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>${baseStyles}</style></head>
<body>
${slides.join("\n")}
<button class="arrows arr-l">‹</button>
<button class="arrows arr-r">›</button>
<div class="nav">${dots}</div>
<div class="counter">1 / ${slideCount}</div>
<button class="print-btn">Imprimir / PDF</button>
${navScript}
</body></html>`;
}

export function buildDiagDownloadHTML(
  data: DiagJSON,
  clientName: string,
  professional: string
): string {
  const today = new Date().toLocaleDateString("pt-BR");
  const sim = data.simulacao;

  const slides = [
    // Slide 1 — Capa
    `<div class="slide active bg-dark">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:32px">
        <div class="st-logo">ST</div>
        <span class="text-muted" style="font-size:11px">Silveira Torquato Advogados</span>
      </div>
      <h1 style="font-size:36px;margin-bottom:16px">DIAGNÓSTICO PATRIMONIAL<br>PRELIMINAR</h1>
      <div class="divider"></div>
      <p style="font-size:18px;opacity:0.8;font-family:Georgia,serif">${clientName}</p>
      <div style="background:rgba(200,155,95,0.1);border:1px solid rgba(200,155,95,0.3);border-radius:12px;padding:16px;margin-top:auto">
        <p style="font-size:13px;opacity:0.9;line-height:1.6">${data.resumo_caso}</p>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:11px;opacity:0.4;margin-top:16px">
        <span>${professional}</span><span>${today}</span>
      </div>
    </div>`,

    // Slide 2 — Patrimônio
    `<div class="slide bg-light">
      <h2 style="font-size:24px;margin-bottom:20px">Patrimônio Identificado</h2>
      <div class="grid-3">
        <div class="card-light"><div style="font-size:16px;margin-bottom:12px">▣ Imóveis</div><ul>${data.patrimonio.imoveis.map((i) => `<li>${i}</li>`).join("")}</ul></div>
        <div class="card-light"><div style="font-size:16px;margin-bottom:12px">◈ Empresas</div><ul>${data.patrimonio.empresas.map((e) => `<li>${e}</li>`).join("")}</ul></div>
        <div class="card-light"><div style="font-size:16px;margin-bottom:12px">◆ Investimentos</div><ul>${data.patrimonio.investimentos.map((i) => `<li>${i}</li>`).join("")}</ul></div>
      </div>
    </div>`,

    // Slide 3 — Análise Técnica
    `<div class="slide bg-light">
      <h2 style="font-size:24px;margin-bottom:20px">Análise Técnica</h2>
      <div class="grid-2">
        <div><h3 style="margin-bottom:12px"><span class="text-gold">§</span> Tributário</h3><ul>${data.tributario.map((t) => `<li>${t}</li>`).join("")}</ul></div>
        <div><h3 style="margin-bottom:12px"><span class="text-gold">¶</span> Sucessório</h3><ul>${data.sucessorio.map((s) => `<li>${s}</li>`).join("")}</ul></div>
      </div>
    </div>`,

    // Slide 4 — Simulação
    `<div class="slide bg-light" style="align-items:center;justify-content:center">
      <h2 style="font-size:24px;margin-bottom:24px">Simulação Financeira</h2>
      <div style="display:flex;gap:40px;align-items:center">
        <div style="text-align:center">
          <div style="display:flex;gap:40px;align-items:flex-end;margin-bottom:8px">
            <div><div style="width:80px;height:${Math.round((sim.ir_atual_pf / Math.max(sim.ir_atual_pf, sim.ir_com_holding, 1)) * 140)}px;background:#b83232;border-radius:6px"></div><div class="text-muted" style="font-size:11px;margin-top:4px">IR Atual</div><div style="font-weight:bold;font-size:13px">${formatBRL(sim.ir_atual_pf)}</div></div>
            <div><div style="width:80px;height:${Math.round((sim.ir_com_holding / Math.max(sim.ir_atual_pf, sim.ir_com_holding, 1)) * 140)}px;background:#2a6e44;border-radius:6px"></div><div class="text-muted" style="font-size:11px;margin-top:4px">Com Holding</div><div style="font-weight:bold;font-size:13px">${formatBRL(sim.ir_com_holding)}</div></div>
          </div>
          <div style="background:#c89b5f;color:white;padding:6px 20px;border-radius:12px;font-size:12px;font-weight:bold;margin-top:12px">Economia: ${formatBRL(sim.economia_anual)}/ano</div>
        </div>
        <div style="font-size:13px">
          <div><span class="text-muted" style="font-size:11px">Patrimônio Total</span><div style="font-weight:bold;font-size:18px">${formatBRL(sim.patrimonio_total)}</div></div>
          <div style="margin-top:12px"><span class="text-muted" style="font-size:11px">Economia em 5 anos</span><div style="font-weight:bold;font-size:18px" class="text-gold">${formatBRL(sim.economia_anual * 5)}</div></div>
        </div>
      </div>
    </div>`,

    // Slide 5 — Riscos
    `<div class="slide bg-dark">
      <h2 style="font-size:24px;margin-bottom:20px">Riscos Identificados</h2>
      <div class="grid-2">${data.riscos
        .map((r) => {
          const c = r.nivel === "Alto" ? "#b83232" : r.nivel === "Médio" ? "#d97706" : "#2a6e44";
          return `<div class="card"><span class="badge" style="background:${c};color:white">${r.nivel}</span><p style="font-size:12px;opacity:0.8;margin:8px 0;line-height:1.5">${r.descricao}</p><p style="font-size:11px" class="text-gold">→ ${r.acao}</p></div>`;
        })
        .join("")}</div>
    </div>`,

    // Slide 6 — Oportunidades
    `<div class="slide bg-dark">
      <h2 style="font-size:24px;margin-bottom:20px">Oportunidades de Estruturação</h2>
      <div class="grid-2">${data.oportunidades
        .map(
          (op, i) =>
            `<div class="card"><span class="text-gold" style="font-family:Georgia,serif;font-weight:bold;font-size:18px">${String(i + 1).padStart(2, "0")}</span><p style="font-size:12px;opacity:0.8;margin-top:8px;line-height:1.5">${op}</p></div>`
        )
        .join("")}</div>
    </div>`,

    // Slide 7 — Documentos
    `<div class="slide bg-light">
      <h2 style="font-size:24px;margin-bottom:20px">Documentos Necessários</h2>
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:24px;flex:1">
        <ul>${data.documentos_faltantes.map((d) => `<li style="padding:6px 0">${d}</li>`).join("")}</ul>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:11px" class="text-muted" style="margin-top:16px">
        <span>Silveira Torquato Advogados</span><span>Documento Confidencial</span>
      </div>
    </div>`,
  ];

  return wrapHTML(`Diagnóstico - ${clientName}`, slides, slides.length);
}

export function buildClienteDownloadHTML(
  data: ClienteJSON,
  clientName: string,
  professional: string
): string {
  const today = new Date().toLocaleDateString("pt-BR");
  const sim = data.simulacao;

  const slides = [
    // Slide 1 — Capa
    `<div class="slide active bg-white border-gold">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:40px">
        <div class="st-logo">ST</div>
        <span class="text-muted" style="font-size:11px">Silveira Torquato Advogados</span>
      </div>
      <h1 style="font-size:34px;margin-bottom:12px">DIAGNÓSTICO E OPORTUNIDADES<br>DE ESTRUTURAÇÃO</h1>
      <div class="divider"></div>
      <p style="font-size:18px;opacity:0.7;font-family:Georgia,serif">${clientName}</p>
      <div style="margin-top:auto;display:flex;justify-content:space-between;font-size:11px" class="text-muted">
        <span>${professional}</span><span>${today}</span>
      </div>
    </div>`,

    // Slide 2 — Resumo
    `<div class="slide bg-white">
      <h2 style="font-size:24px;margin-bottom:20px">Resumo Executivo</h2>
      <div style="background:#fcf9f5;border:1px solid #e0dbd4;border-radius:12px;padding:20px;margin-bottom:20px">
        <p style="font-size:13px;line-height:1.6;opacity:0.8">${data.resumo}</p>
      </div>
      <div class="grid-3">
        <div style="background:rgba(184,50,50,0.05);border:1px solid rgba(184,50,50,0.2);border-radius:12px;padding:16px;text-align:center"><div class="text-muted" style="font-size:11px;margin-bottom:4px">IR Atual (PF)</div><div class="text-red" style="font-weight:bold;font-size:20px">${formatBRL(sim.ir_atual_pf)}</div></div>
        <div style="background:rgba(42,110,68,0.05);border:1px solid rgba(42,110,68,0.2);border-radius:12px;padding:16px;text-align:center"><div class="text-muted" style="font-size:11px;margin-bottom:4px">IR com Holding</div><div class="text-green" style="font-weight:bold;font-size:20px">${formatBRL(sim.ir_com_holding)}</div></div>
        <div style="background:rgba(200,155,95,0.05);border:1px solid rgba(200,155,95,0.2);border-radius:12px;padding:16px;text-align:center"><div class="text-muted" style="font-size:11px;margin-bottom:4px">Economia Anual</div><div class="text-gold" style="font-weight:bold;font-size:20px">${formatBRL(sim.economia_anual)}</div></div>
      </div>
    </div>`,

    // Slide 3 — Situação Atual
    `<div class="slide bg-white">
      <h2 style="font-size:24px;margin-bottom:20px">Situação Atual</h2>
      ${data.situacao_atual.map((item, i) => `<div style="display:flex;gap:12px;margin-bottom:12px"><div style="width:28px;height:28px;border-radius:50%;background:#232535;color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;flex-shrink:0">${i + 1}</div><p style="font-size:13px;line-height:1.6;opacity:0.8">${item}</p></div>`).join("")}
    </div>`,

    // Slide 4 — Estrutura
    `<div class="slide bg-white" style="align-items:center;justify-content:center">
      <h2 style="font-size:24px;margin-bottom:24px">Estrutura Proposta</h2>
      <div style="text-align:center">
        ${data.arquitetura.socios.map((s) => `<div style="display:inline-block;border:1px solid #e0dbd4;border-radius:8px;padding:8px 20px;margin:4px;font-size:12px">${s}</div>`).join("")}
        <div style="color:#c89b5f;font-size:24px;margin:12px 0">↓</div>
        <div style="display:inline-block;background:#c89b5f;color:white;border-radius:10px;padding:12px 32px;font-family:Georgia,serif;font-weight:bold">${data.arquitetura.nome_holding}</div>
        <div style="color:#c89b5f;font-size:24px;margin:12px 0">↓</div>
        <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
          ${data.arquitetura.ativos_integrar.map((a) => `<div style="border:1px solid #e0dbd4;border-radius:8px;padding:6px 16px;font-size:11px">${a}</div>`).join("")}
        </div>
        <p class="text-muted" style="font-size:11px;margin-top:16px">${data.arquitetura.estrutura_descricao}</p>
      </div>
    </div>`,

    // Slide 5 — Riscos
    `<div class="slide bg-white">
      <h2 style="font-size:24px;margin-bottom:20px">Pontos de Atenção</h2>
      ${data.riscos.map((r) => `<div style="border-left:4px solid #b83232;border-radius:8px;padding:12px 16px;margin-bottom:12px;background:white;box-shadow:0 1px 3px rgba(0,0,0,0.05)"><h4 style="font-size:13px;font-weight:bold;margin-bottom:4px">${r.titulo}</h4><p style="font-size:11px;opacity:0.7;line-height:1.5">${r.descricao}</p></div>`).join("")}
    </div>`,

    // Slide 6 — Oportunidades
    `<div class="slide bg-dark">
      <h2 style="font-size:24px;margin-bottom:20px">Oportunidades Identificadas</h2>
      ${data.oportunidades.map((op) => `<div style="display:flex;gap:12px;margin-bottom:12px"><span class="text-gold" style="font-size:16px">→</span><p style="font-size:13px;opacity:0.8;line-height:1.5">${op}</p></div>`).join("")}
    </div>`,

    // Slide 7 — Projetos
    `<div class="slide bg-white">
      <h2 style="font-size:24px;margin-bottom:20px">Projetos Propostos</h2>
      <table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead><tr style="border-bottom:2px solid #e0dbd4"><th style="text-align:left;padding:8px 0" class="text-muted">Projeto</th><th style="text-align:left;padding:8px 0" class="text-muted">Objetivo</th><th style="text-align:center;padding:8px 0" class="text-muted">Prazo</th><th style="text-align:center;padding:8px 0" class="text-muted">Urgência</th></tr></thead>
        <tbody>${data.projetos.map((p) => {
          const c = p.urgencia === "Alta" ? "#b83232" : p.urgencia === "Média" ? "#d97706" : "#2a6e44";
          return `<tr style="border-bottom:1px solid #e0dbd4"><td style="padding:8px 0;font-weight:500">${p.nome}</td><td style="padding:8px 0;opacity:0.7;font-size:11px">${p.objetivo}</td><td style="padding:8px 0;text-align:center;font-size:11px">${p.prazo}</td><td style="padding:8px 0;text-align:center"><span class="badge" style="background:${c};color:white">${p.urgencia}</span></td></tr>`;
        }).join("")}</tbody>
      </table>
    </div>`,

    // Slide 8 — Próximos Passos
    `<div class="slide bg-white">
      <h2 style="font-size:24px;margin-bottom:20px">Próximos Passos</h2>
      <div style="padding-left:24px;position:relative">
        <div style="position:absolute;left:10px;top:0;bottom:0;width:2px;background:#c89b5f"></div>
        ${data.proximos_passos.map((p, i) => `<div style="position:relative;margin-bottom:20px"><div style="position:absolute;left:-20px;top:2px;width:20px;height:20px;border-radius:50%;background:#c89b5f;color:white;font-size:10px;font-weight:bold;display:flex;align-items:center;justify-content:center">${i + 1}</div><p style="font-size:13px;opacity:0.8;line-height:1.5;margin-left:12px">${p}</p></div>`).join("")}
      </div>
    </div>`,

    // Slide 9 — Encerramento
    `<div class="slide bg-dark" style="justify-content:center;align-items:center;text-align:center">
      <div class="st-logo" style="width:56px;height:56px;font-size:20px;border-radius:12px;margin-bottom:24px">ST</div>
      <h2 style="font-size:24px;margin-bottom:8px">Silveira Torquato Advogados</h2>
      <p style="opacity:0.6;font-size:13px;margin-bottom:32px">Planejamento Patrimonial e Tributário</p>
      <div style="width:60px;height:2px;background:#c89b5f;margin:0 auto 32px"></div>
      <p style="font-size:11px;opacity:0.4;max-width:400px;line-height:1.5">Este documento é confidencial e destinado exclusivamente ao cliente indicado. As análises apresentadas são preliminares e não constituem parecer jurídico definitivo.</p>
    </div>`,
  ];

  return wrapHTML(`Apresentação - ${clientName}`, slides, slides.length);
}

export function downloadHTML(html: string, filename: string): void {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
