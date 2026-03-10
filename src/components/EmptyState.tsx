import Btn from "./Btn";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="text-center py-12 sm:py-16">
      <div className="w-14 h-14 bg-st-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <span className="text-2xl text-st-gold">◈</span>
      </div>
      <h2 className="font-serif text-lg sm:text-xl text-st-dark mb-2">
        {title}
      </h2>
      <p className="text-sm text-st-muted font-sans mb-6 max-w-md mx-auto px-4">
        {description}
      </p>
      {actionLabel && onAction && (
        <Btn variant="gold" onClick={onAction}>
          {actionLabel}
        </Btn>
      )}
    </div>
  );
}
