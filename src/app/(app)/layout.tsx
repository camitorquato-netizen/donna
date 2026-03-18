"use client";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-st-light flex items-center justify-center">
        <p className="text-st-muted text-sm">Carregando...</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden bg-st-dark h-14 flex items-center px-4 sticky top-0 z-30">
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-white text-xl mr-3 cursor-pointer"
          aria-label="Abrir menu"
        >
          ☰
        </button>
        <span className="font-serif text-lg text-white tracking-wide">
          Donna
        </span>
      </div>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="lg:pl-64 min-h-screen bg-st-light">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}
