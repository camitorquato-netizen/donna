"use client";
import { useState, useEffect, useCallback, useRef } from "react";

interface SlideViewerProps {
  slides: React.ReactElement[];
  onClose: () => void;
  title: string;
  onDownload?: () => void;
}

export default function SlideViewer({
  slides,
  onClose,
  title,
  onDownload,
}: SlideViewerProps) {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const next = useCallback(() => {
    setCurrent((c) => Math.min(c + 1, slides.length - 1));
  }, [slides.length]);

  const prev = useCallback(() => {
    setCurrent((c) => Math.max(c - 1, 0));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        next();
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      }
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [next, prev, onClose]);

  // Lock body scroll when viewer is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Touch swipe handlers
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
    }
    touchStartX.current = null;
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 z-10">
        <span className="text-white/50 text-xs sm:text-sm font-sans truncate mr-2">{title}</span>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {onDownload && (
            <button
              onClick={onDownload}
              className="text-white/70 hover:text-white text-xs sm:text-sm font-sans px-2 sm:px-3 py-1 border border-white/20 rounded-lg hover:border-white/40 transition-colors cursor-pointer"
            >
              <span className="hidden sm:inline">↓ Download HTML</span>
              <span className="sm:hidden">↓</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white text-xl px-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Slide */}
      <div className="w-full max-w-5xl px-2 sm:px-4 mt-10 sm:mt-0">
        <div className="bg-white rounded-lg sm:rounded-xl overflow-y-auto overflow-x-hidden shadow-2xl max-h-[75vh] sm:max-h-none">
          {slides[current]}
        </div>
      </div>

      {/* Navigation arrows — hidden on mobile (use swipe) */}
      {current > 0 && (
        <button
          onClick={prev}
          className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full items-center justify-center text-white text-xl transition-colors cursor-pointer"
        >
          ‹
        </button>
      )}
      {current < slides.length - 1 && (
        <button
          onClick={next}
          className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full items-center justify-center text-white text-xl transition-colors cursor-pointer"
        >
          ›
        </button>
      )}

      {/* Mobile navigation buttons */}
      <div className="sm:hidden flex items-center gap-6 mt-3">
        <button
          onClick={prev}
          disabled={current === 0}
          className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white text-lg disabled:opacity-30 cursor-pointer"
        >
          ‹
        </button>
        <span className="text-white/60 text-sm font-sans">
          {current + 1} / {slides.length}
        </span>
        <button
          onClick={next}
          disabled={current === slides.length - 1}
          className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white text-lg disabled:opacity-30 cursor-pointer"
        >
          ›
        </button>
      </div>

      {/* Bottom: dots + counter (desktop) */}
      <div className="hidden sm:flex absolute bottom-6 flex-col items-center gap-3">
        <div className="flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                i === current
                  ? "bg-st-gold w-4"
                  : "bg-white/30 hover:bg-white/50"
              }`}
            />
          ))}
        </div>
        <span className="text-white/40 text-xs font-sans">
          {current + 1} / {slides.length}
        </span>
      </div>
    </div>
  );
}
