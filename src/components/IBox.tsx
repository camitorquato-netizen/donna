interface IBoxProps {
  type?: "info" | "warn" | "error" | "success" | "gold";
  title?: string;
  children: React.ReactNode;
}

const styles: Record<string, { border: string; bg: string; icon: string }> = {
  info: {
    border: "border-blue-400",
    bg: "bg-blue-50",
    icon: "\u{1F4A1}",
  },
  warn: {
    border: "border-amber-400",
    bg: "bg-amber-50",
    icon: "\u26A0\uFE0F",
  },
  error: {
    border: "border-st-red",
    bg: "bg-red-50",
    icon: "\u26D4",
  },
  success: {
    border: "border-st-green",
    bg: "bg-green-50",
    icon: "\u2705",
  },
  gold: {
    border: "border-st-gold",
    bg: "bg-st-gold/10",
    icon: "\u2605",
  },
};

export default function IBox({ type = "info", title, children }: IBoxProps) {
  const s = styles[type];
  return (
    <div
      className={`border-l-4 ${s.border} ${s.bg} p-4 rounded-r-lg mb-4`}
    >
      {title && (
        <div className="font-serif font-bold text-st-dark mb-1">
          {s.icon} {title}
        </div>
      )}
      <div className="text-sm font-sans text-st-dark/80">{children}</div>
    </div>
  );
}
