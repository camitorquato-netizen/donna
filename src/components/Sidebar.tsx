"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Logo from "./Logo";

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: "◈" },
  { label: "Clientes", href: "/clientes", icon: "◎" },
  { label: "Contratos", href: "/contratos", icon: "◑" },
  { label: "Pastas", href: "/pastas", icon: "◫" },
  { label: "Financeiro", href: "/financeiro", icon: "◆" },
  { label: "Usuários", href: "/usuarios", icon: "◉" },
  { label: "Workflow RCT", href: "/workflow-rct", icon: "⚙" },
  { label: "Piloto RCT", href: "/radiografia", icon: "⚡" },
  { label: "Piloto Patrimonial", href: "/casos", icon: "▸" },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Backdrop mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-st-dark flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
          <Logo size="sm" />
          <span className="font-serif text-lg text-white tracking-wide">
            Donna
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-sans transition-colors ${
                  active
                    ? "bg-st-gold/20 text-st-gold border-l-4 border-st-gold -ml-px"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                <span className="text-base w-5 text-center">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/10">
          <p className="text-xs text-white/40 font-sans">
            Silveira Torquato Advogados
          </p>
        </div>
      </aside>
    </>
  );
}
