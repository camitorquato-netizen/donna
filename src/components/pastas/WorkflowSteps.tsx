"use client";
import { WfRct, WF_RCT_TAREFA_LABELS, WfRctTarefa } from "@/lib/types";

interface WorkflowStepsProps {
  steps: WfRct[];
  activeIndex: number;
  onStepClick: (index: number) => void;
}

const STEP_LABELS: string[] = [
  "Levantamento",
  "Revisão",
  "Apresentação",
  "Retificações",
  "Compensações",
  "Faturamento",
];

export default function WorkflowSteps({
  steps,
  activeIndex,
  onStepClick,
}: WorkflowStepsProps) {
  return (
    <div className="flex items-center justify-center gap-0 w-full overflow-x-auto py-4 px-1">
      {steps.map((step, i) => {
        const done = step.status === "concluido";
        const active = i === activeIndex;
        const canClick = done || i === activeIndex || i <= activeIndex;

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center min-w-[36px] sm:min-w-[80px]">
              <button
                onClick={() => canClick && onStepClick(i)}
                disabled={!canClick}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-sans font-bold transition-all ${
                  done
                    ? "bg-st-gold text-white cursor-pointer"
                    : active
                    ? "border-2 border-st-gold text-st-gold bg-white cursor-pointer"
                    : "border-2 border-st-border text-st-muted bg-white cursor-not-allowed"
                }`}
              >
                {done ? "✓" : i + 1}
              </button>
              <span
                className={`hidden sm:block text-[10px] font-sans mt-1.5 text-center leading-tight ${
                  active
                    ? "text-st-gold font-bold"
                    : done
                    ? "text-st-dark"
                    : "text-st-muted"
                }`}
              >
                {STEP_LABELS[i] || WF_RCT_TAREFA_LABELS[step.tarefa as WfRctTarefa]}
              </span>
              {active && (
                <span className="sm:hidden text-[9px] font-sans mt-1 text-center text-st-gold font-bold leading-tight max-w-[50px] truncate">
                  {STEP_LABELS[i]}
                </span>
              )}
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-4 sm:w-8 h-0.5 mt-[-18px] ${
                  step.status === "concluido" ? "bg-st-gold" : "bg-st-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
