"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { Usuario, UsuarioPermissao } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AuthContextType {
  /** Supabase Auth user (Google) */
  user: User | null;
  /** Matched usuario from DB */
  usuario: Usuario | null;
  loading: boolean;
  signOut: () => Promise<void>;
  /* Permission helpers */
  canEdit: boolean;
  canDelete: boolean;
  canSeeFinanceiro: boolean;
  canManageUsers: boolean;
  isReadOnly: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  usuario: null,
  loading: true,
  signOut: async () => {},
  canEdit: false,
  canDelete: false,
  canSeeFinanceiro: false,
  canManageUsers: false,
  isReadOnly: true,
});

/* ------------------------------------------------------------------ */
/*  Row → Usuario mapping (inline to avoid circular dependency)        */
/* ------------------------------------------------------------------ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToUsuario(r: any): Usuario {
  return {
    id: r.id,
    nome: r.nome ?? "",
    email: r.email ?? "",
    cargo: r.cargo ?? "",
    permissao: (r.permissao as UsuarioPermissao) ?? "somente_leitura",
    fotoUrl: r.foto_url ?? "",
    ativo: r.ativo ?? true,
    createdAt: r.created_at,
  };
}

/* ------------------------------------------------------------------ */
/*  Permission helpers                                                 */
/* ------------------------------------------------------------------ */

function permissionFlags(p: UsuarioPermissao) {
  return {
    canEdit: p === "total" || p === "restrita",
    canDelete: p === "total",
    canSeeFinanceiro: p === "total",
    canManageUsers: p === "total",
    isReadOnly: p === "somente_leitura",
  };
}

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // 1) Get initial session
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u);
      if (u?.email) {
        supabase
          .from("usuarios")
          .select("*")
          .eq("email", u.email)
          .maybeSingle()
          .then(({ data }) => {
            if (data) {
              const usr = rowToUsuario(data);
              setUsuario(usr);

              // Auto-sync Google avatar if usuario has no photo
              if (!usr.fotoUrl && u.user_metadata?.avatar_url) {
                supabase
                  .from("usuarios")
                  .update({ foto_url: u.user_metadata.avatar_url })
                  .eq("id", usr.id)
                  .then(() => {
                    setUsuario((prev) =>
                      prev
                        ? { ...prev, fotoUrl: u.user_metadata.avatar_url }
                        : prev
                    );
                  });
              }
            }
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    // 2) Listen for auth state changes (login/logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setUsuario(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const perm = usuario?.permissao ?? "somente_leitura";

  const value: AuthContextType = {
    user,
    usuario,
    loading,
    signOut,
    ...permissionFlags(perm),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useAuth() {
  return useContext(AuthContext);
}
