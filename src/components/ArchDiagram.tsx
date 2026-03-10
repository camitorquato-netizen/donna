interface ArchDiagramProps {
  nomeHolding: string;
  socios: string[];
  ativos: string[];
  descricao?: string;
  dark?: boolean;
}

export default function ArchDiagram({
  nomeHolding,
  socios,
  ativos,
  descricao,
  dark = false,
}: ArchDiagramProps) {
  const boxFill = dark ? "#232535" : "#ffffff";
  const boxStroke = dark ? "#c89b5f" : "#e0dbd4";
  const textColor = dark ? "#fcf9f5" : "#232535";
  const arrowColor = "#c89b5f";
  const holdingFill = dark ? "#c89b5f" : "#c89b5f";

  const ativosCapped = ativos.slice(0, 6);
  const svgWidth = Math.max(400, ativosCapped.length * 120 + 40);
  const ativosStartX = (svgWidth - ativosCapped.length * 110) / 2;

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox={`0 0 ${svgWidth} 280`}
        className="w-full"
        style={{ maxWidth: svgWidth }}
      >
        {/* Sócios */}
        {socios.map((socio, i) => {
          const x = svgWidth / 2 - (socios.length * 130) / 2 + i * 130 + 10;
          return (
            <g key={`socio-${i}`}>
              <rect
                x={x}
                y={10}
                width={110}
                height={36}
                rx={8}
                fill={boxFill}
                stroke={boxStroke}
                strokeWidth={1.5}
              />
              <text
                x={x + 55}
                y={33}
                textAnchor="middle"
                fill={textColor}
                fontSize={10}
                fontFamily="Arial"
              >
                {socio.length > 18 ? socio.slice(0, 18) + "…" : socio}
              </text>
              {/* Seta sócio → holding */}
              <line
                x1={x + 55}
                y1={46}
                x2={svgWidth / 2}
                y2={90}
                stroke={arrowColor}
                strokeWidth={1.5}
                markerEnd="url(#arrowhead)"
              />
            </g>
          );
        })}

        {/* Holding */}
        <rect
          x={svgWidth / 2 - 80}
          y={90}
          width={160}
          height={44}
          rx={10}
          fill={holdingFill}
        />
        <text
          x={svgWidth / 2}
          y={108}
          textAnchor="middle"
          fill="white"
          fontSize={11}
          fontWeight="bold"
          fontFamily="Georgia"
        >
          {nomeHolding.length > 22
            ? nomeHolding.slice(0, 22) + "…"
            : nomeHolding}
        </text>
        <text
          x={svgWidth / 2}
          y={124}
          textAnchor="middle"
          fill="white"
          fontSize={9}
          fontFamily="Arial"
        >
          Holding Patrimonial
        </text>

        {/* Setas holding → ativos */}
        {ativosCapped.map((_, i) => {
          const targetX = ativosStartX + i * 110 + 50;
          return (
            <line
              key={`arrow-${i}`}
              x1={svgWidth / 2}
              y1={134}
              x2={targetX}
              y2={170}
              stroke={arrowColor}
              strokeWidth={1.5}
              markerEnd="url(#arrowhead)"
            />
          );
        })}

        {/* Ativos */}
        {ativosCapped.map((ativo, i) => {
          const x = ativosStartX + i * 110;
          return (
            <g key={`ativo-${i}`}>
              <rect
                x={x}
                y={170}
                width={100}
                height={36}
                rx={8}
                fill={boxFill}
                stroke={boxStroke}
                strokeWidth={1.5}
              />
              <text
                x={x + 50}
                y={193}
                textAnchor="middle"
                fill={textColor}
                fontSize={9}
                fontFamily="Arial"
              >
                {ativo.length > 15 ? ativo.slice(0, 15) + "…" : ativo}
              </text>
            </g>
          );
        })}

        {/* Arrow marker */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="8"
            markerHeight="6"
            refX="8"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill={arrowColor} />
          </marker>
        </defs>
      </svg>

      {descricao && (
        <p
          className={`text-xs text-center mt-2 max-w-md ${
            dark ? "text-white/60" : "text-st-muted"
          }`}
        >
          {descricao}
        </p>
      )}
    </div>
  );
}
