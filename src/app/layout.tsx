import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Donna — Silveira Torquato Advogados",
  description: "Sistema de diagnóstico patrimonial assistido por IA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
