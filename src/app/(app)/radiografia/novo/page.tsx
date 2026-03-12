"use client";
import { useRouter } from "next/navigation";
import TabRadiografia from "@/components/pastas/TabRadiografia";

export default function NovaRadiografiaPage() {
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-2">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-st-dark">
            Nova Análise
          </h1>
          <p className="text-sm text-st-muted font-sans mt-1">
            Piloto RCT — análise fiscal por IA a partir de arquivos SPED
          </p>
        </div>
        <a
          href="/radiografia"
          className="text-xs sm:text-sm text-st-muted hover:text-st-dark font-sans transition-colors whitespace-nowrap"
        >
          ← Voltar
        </a>
      </div>

      <TabRadiografia
        onSaved={(id) => router.push(`/radiografia/${id}`)}
      />
    </div>
  );
}
