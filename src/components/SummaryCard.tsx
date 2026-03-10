interface SummaryCardProps {
  label: string;
  value: string | number;
  icon?: string;
  color?: "gold" | "green" | "red" | "dark";
}

const colorMap = {
  gold: "border-st-gold/30 bg-st-gold/5",
  green: "border-st-green/30 bg-st-green/5",
  red: "border-st-red/30 bg-st-red/5",
  dark: "border-st-border bg-white",
};

const iconColorMap = {
  gold: "text-st-gold",
  green: "text-st-green",
  red: "text-st-red",
  dark: "text-st-dark",
};

export default function SummaryCard({
  label,
  value,
  icon,
  color = "dark",
}: SummaryCardProps) {
  return (
    <div
      className={`rounded-xl border p-4 sm:p-5 ${colorMap[color]}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-sans text-st-muted uppercase tracking-wider mb-1">
            {label}
          </p>
          <p className="font-serif text-2xl font-bold text-st-dark">
            {value}
          </p>
        </div>
        {icon && (
          <span className={`text-2xl ${iconColorMap[color]}`}>{icon}</span>
        )}
      </div>
    </div>
  );
}
