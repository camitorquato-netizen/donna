interface SimChartProps {
  irAtual: number;
  irHolding: number;
  economia: number;
  descricao?: string;
  dark?: boolean;
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function SimChart({
  irAtual,
  irHolding,
  economia,
  descricao,
  dark = false,
}: SimChartProps) {
  const maxVal = Math.max(irAtual, irHolding, 1);
  const barMaxH = 160;
  const h1 = (irAtual / maxVal) * barMaxH;
  const h2 = (irHolding / maxVal) * barMaxH;

  const textColor = dark ? "#fcf9f5" : "#232535";
  const mutedColor = dark ? "#888880" : "#888880";

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 400 260" className="w-full max-w-md">
        {/* Barra IR Atual */}
        <rect
          x={80}
          y={200 - h1}
          width={80}
          height={h1}
          rx={6}
          fill="#b83232"
        />
        <text
          x={120}
          y={190 - h1}
          textAnchor="middle"
          fill={textColor}
          fontSize={13}
          fontFamily="Arial"
          fontWeight="bold"
        >
          {formatBRL(irAtual)}
        </text>
        <text
          x={120}
          y={220}
          textAnchor="middle"
          fill={mutedColor}
          fontSize={11}
          fontFamily="Arial"
        >
          IR Atual (PF)
        </text>

        {/* Barra IR com Holding */}
        <rect
          x={240}
          y={200 - h2}
          width={80}
          height={h2}
          rx={6}
          fill="#2a6e44"
        />
        <text
          x={280}
          y={190 - h2}
          textAnchor="middle"
          fill={textColor}
          fontSize={13}
          fontFamily="Arial"
          fontWeight="bold"
        >
          {formatBRL(irHolding)}
        </text>
        <text
          x={280}
          y={220}
          textAnchor="middle"
          fill={mutedColor}
          fontSize={11}
          fontFamily="Arial"
        >
          IR com Holding
        </text>

        {/* Linha base */}
        <line
          x1={60}
          y1={200}
          x2={340}
          y2={200}
          stroke={dark ? "#444" : "#e0dbd4"}
          strokeWidth={1}
        />

        {/* Economia */}
        <rect
          x={120}
          y={238}
          width={160}
          height={24}
          rx={12}
          fill="#c89b5f"
        />
        <text
          x={200}
          y={254}
          textAnchor="middle"
          fill="white"
          fontSize={12}
          fontFamily="Arial"
          fontWeight="bold"
        >
          Economia: {formatBRL(economia)}/ano
        </text>
      </svg>

      {descricao && (
        <p
          className={`text-xs text-center mt-2 max-w-sm ${
            dark ? "text-white/60" : "text-st-muted"
          }`}
        >
          {descricao}
        </p>
      )}
    </div>
  );
}
