"use client";

interface BtnProps {
  variant?: "primary" | "gold" | "green" | "ghost";
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  type?: "button" | "submit";
}

const variants: Record<string, string> = {
  primary:
    "bg-st-dark text-white hover:opacity-90",
  gold: "bg-st-gold text-white hover:brightness-110",
  green: "bg-st-green text-white hover:brightness-110",
  ghost:
    "bg-transparent border border-st-border text-st-dark hover:bg-black/5",
};

export default function Btn({
  variant = "primary",
  onClick,
  disabled,
  loading,
  children,
  className = "",
  type = "button",
}: BtnProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-sans text-sm font-medium transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {loading && (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
