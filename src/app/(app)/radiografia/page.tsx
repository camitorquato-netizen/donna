"use client";
import TabRadiografia from "@/components/pastas/TabRadiografia";

export default function RadiografiaPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="font-serif text-xl sm:text-2xl font-bold text-st-dark">
          Radiografia Fiscal
        </h1>
        <p className="text-sm text-st-muted font-sans mt-1">
          Análise fiscal por IA a partir de arquivos SPED — triagem rápida para RCT
        </p>
      </div>

      <TabRadiografia />
    </div>
  );
}
