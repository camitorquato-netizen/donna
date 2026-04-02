"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Logo from "./Logo";
import { useAuth } from "@/contexts/AuthContext";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  /** If set, only users with this permission can see the item */
  requirePermissao?: "total";
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: "◈" },
  { label: "Clientes", href: "/clientes", icon: "◎" },
  { label: "Contratos", href: "/contratos", icon: "◑" },
  { label: "Parceiros", href: "/parceiros", icon: "◇" },
  { label: "Pastas", href: "/pastas", icon: "◫" },
  { label: "Financeiro", href: "/financeiro", icon: "◆", requirePermissao: "total" },
  { label: "Usuários", href: "/usuarios", icon: "◉", requirePermissao: "total" },
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
  const { usuario, user, signOut } = useAuth();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  const permissao = usuario?.permissao ?? "somente_leitura";
  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.requirePermissao && permissao !== item.requirePermissao) return false;
    return true;
  });

  const avatarUrl =
    usuario?.fotoUrl || user?.user_metadata?.avatar_url || "";
  const displayName = usuario?.nome || user?.email || "";
  const displayEmail = usuario?.email || user?.email || "";

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
          {visibleItems.map((item) => {
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

        {/* User profile footer */}
        <div className="px-4 py-3 border-t border-white/10 flex items-center gap-3">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="w-8 h-8 rounded-full shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-st-gold/30 flex items-center justify-center text-sm text-st-gold shrink-0">
              {displayName.charAt(0).toUpperCase() || "?"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{displayName}</p>
            <p className="text-xs text-white/40 truncate">{displayEmail}</p>
          </div>
          <button
            onClick={signOut}
            className="text-white/40 hover:text-white text-xs shrink-0 cursor-pointer"
            title="Sair"
          >
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
