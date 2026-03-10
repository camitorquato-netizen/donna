"use client";
import { useState } from "react";
import { Case } from "@/lib/types";
import Btn from "./Btn";
import IBox from "./IBox";
import SlideViewer from "./SlideViewer";
import { diagSlides } from "./DiagSlides";
import { clienteSlides } from "./ClienteSlides";
import {
  buildDiagDownloadHTML,
  buildClienteDownloadHTML,
  downloadHTML,
} from "@/lib/slideHTML";

interface Props {
  caso: Case;
  loading: boolean;
  error: string | null;
  update: (partial: Partial<Case>) => void;
  generateDiagJSON: () => Promise<void>;
  generateClienteJSON: () => Promise<void>;
  clearError: () => void;
}

export default function StageSlides({
  caso,
  loading,
  error,
  update,
  generateDiagJSON,
  generateClienteJSON,
  clearError,
}: Props) {
  const [viewingDiag, setViewingDiag] = useState(false);
  const [viewingCliente, setViewingCliente] = useState(false);

  const diagSlidesArr = caso.diagJSON
    ? diagSlides(caso.diagJSON, caso.clientName, caso.professional)
    : null;
  const clienteSlidesArr = caso.clienteJSON
    ? clienteSlides(caso.clienteJSON, caso.clientName, caso.professional)
    : null;

  function handleDownloadDiag() {
    if (!caso.diagJSON) return;
    const html = buildDiagDownloadHTML(
      caso.diagJSON,
      caso.clientName,
      caso.professional
    );
    downloadHTML(html, `diagnostico-${caso.clientName || "caso"}.html`);
  }

  function handleDownloadCliente() {
    if (!caso.clienteJSON) return;
    const html = buildClienteDownloadHTML(
      caso.clienteJSON,
      caso.clientName,
      caso.professional
    );
    downloadHTML(html, `apresentacao-${caso.clientName || "caso"}.html`);
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <IBox type="info" title="Etapa 6 — Apresentações">
        Gere slides para uso interno (sócios) e para apresentação ao cliente.
        Os slides são gerados a partir do diagnóstico e da proposta aprovados.
      </IBox>

      {error && (
        <IBox type="error" title="Erro">
          {error}
        </IBox>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Card Diagnóstico Interno */}
        <div className="border border-st-border rounded-xl p-4 sm:p-6 bg-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-st-dark rounded-lg flex items-center justify-center text-white text-lg shrink-0">
              📊
            </div>
            <div className="min-w-0">
              <h3 className="font-serif font-bold text-st-dark text-sm sm:text-base">
                Diagnóstico Interno
              </h3>
              <p className="text-xs text-st-muted font-sans">
                7 slides — uso confidencial dos sócios
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {!caso.diagJSON ? (
              <Btn
                variant="gold"
                onClick={() => {
                  clearError();
                  generateDiagJSON();
                }}
                loading={loading}
                className="w-full"
              >
                {loading ? "Gerando..." : "Gerar Slides"}
              </Btn>
            ) : (
              <>
                <Btn
                  variant="primary"
                  onClick={() => setViewingDiag(true)}
                  className="w-full"
                >
                  Visualizar
                </Btn>
                <div className="flex gap-2">
                  <Btn
                    variant="ghost"
                    onClick={handleDownloadDiag}
                    className="flex-1"
                  >
                    ↓ Download
                  </Btn>
                  <Btn
                    variant="ghost"
                    onClick={() => {
                      clearError();
                      generateDiagJSON();
                    }}
                    loading={loading}
                    className="flex-1"
                  >
                    ↺ Regenerar
                  </Btn>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Card Apresentação Cliente */}
        <div className="border border-st-border rounded-xl p-4 sm:p-6 bg-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-st-gold rounded-lg flex items-center justify-center text-white text-lg shrink-0">
              🎯
            </div>
            <div className="min-w-0">
              <h3 className="font-serif font-bold text-st-dark text-sm sm:text-base">
                Apresentação ao Cliente
              </h3>
              <p className="text-xs text-st-muted font-sans">
                9 slides — linguagem acessível
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {!caso.clienteJSON ? (
              <Btn
                variant="gold"
                onClick={() => {
                  clearError();
                  generateClienteJSON();
                }}
                loading={loading}
                className="w-full"
              >
                {loading ? "Gerando..." : "Gerar Slides"}
              </Btn>
            ) : (
              <>
                <Btn
                  variant="primary"
                  onClick={() => setViewingCliente(true)}
                  className="w-full"
                >
                  Visualizar
                </Btn>
                <div className="flex gap-2">
                  <Btn
                    variant="ghost"
                    onClick={handleDownloadCliente}
                    className="flex-1"
                  >
                    ↓ Download
                  </Btn>
                  <Btn
                    variant="ghost"
                    onClick={() => {
                      clearError();
                      generateClienteJSON();
                    }}
                    loading={loading}
                    className="flex-1"
                  >
                    ↺ Regenerar
                  </Btn>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div>
        <Btn variant="ghost" onClick={() => update({ step: 5 })} className="w-full sm:w-auto">
          ← Voltar à Proposta
        </Btn>
      </div>

      {/* Viewers */}
      {viewingDiag && diagSlidesArr && (
        <SlideViewer
          slides={diagSlidesArr}
          onClose={() => setViewingDiag(false)}
          title="Diagnóstico Interno"
          onDownload={handleDownloadDiag}
        />
      )}
      {viewingCliente && clienteSlidesArr && (
        <SlideViewer
          slides={clienteSlidesArr}
          onClose={() => setViewingCliente(false)}
          title="Apresentação ao Cliente"
          onDownload={handleDownloadCliente}
        />
      )}
    </div>
  );
}
