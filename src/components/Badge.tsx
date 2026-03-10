interface BadgeProps {
  children: React.ReactNode;
  color?: "gold" | "green" | "red" | "muted" | "dark";
  className?: string;
}

const colors: Record<string, string> = {
  gold: "bg-st-gold/15 text-st-gold",
  green: "bg-st-green/15 text-st-green",
  red: "bg-st-red/15 text-st-red",
  muted: "bg-st-muted/15 text-st-muted",
  dark: "bg-st-dark/10 text-st-dark",
};

export default function Badge({
  children,
  color = "gold",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-block text-xs font-sans font-medium px-2.5 py-0.5 rounded-full ${colors[color]} ${className}`}
    >
      {children}
    </span>
  );
}
