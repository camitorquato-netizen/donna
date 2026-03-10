import { StageNumber, STAGE_LABELS } from "@/lib/types";

interface StepsProps {
  current: StageNumber;
}

export default function Steps({ current }: StepsProps) {
  const stages = [1, 2, 3, 4, 5, 6] as StageNumber[];

  return (
    <div className="flex items-center justify-center gap-0 w-full overflow-x-auto py-4 px-1">
      {stages.map((s, i) => {
        const done = s < current;
        const active = s === current;
        return (
          <div key={s} className="flex items-center">
            <div className="flex flex-col items-center min-w-[36px] sm:min-w-[80px]">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-sans font-bold transition-all ${
                  done
                    ? "bg-st-gold text-white"
                    : active
                    ? "border-2 border-st-gold text-st-gold bg-white"
                    : "border-2 border-st-border text-st-muted bg-white"
                }`}
              >
                {done ? "\u2713" : s}
              </div>
              {/* Labels hidden on mobile, shown on sm+ */}
              <span
                className={`hidden sm:block text-xs font-sans mt-1.5 text-center ${
                  active
                    ? "text-st-gold font-bold"
                    : done
                    ? "text-st-dark"
                    : "text-st-muted"
                }`}
              >
                {STAGE_LABELS[s]}
              </span>
              {/* Show label on mobile only for active step */}
              {active && (
                <span className="sm:hidden text-[10px] font-sans mt-1 text-center text-st-gold font-bold leading-tight max-w-[50px] truncate">
                  {STAGE_LABELS[s]}
                </span>
              )}
            </div>
            {i < stages.length - 1 && (
              <div
                className={`w-4 sm:w-8 h-0.5 mt-[-18px] ${
                  s < current ? "bg-st-gold" : "bg-st-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
