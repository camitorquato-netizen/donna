import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes — no auth required
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/cliente/") || // public ticket portal
    pathname.startsWith("/api/webhook") // ZapSign webhook
  ) {
    const { response } = await updateSession(request);
    return response;
  }

  const { user, response, supabase } = await updateSession(request);

  // No session → redirect to login
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Check if user is registered in usuarios table
  const { data: usuario } = await supabase
    .from("usuarios")
    .select("id, permissao, ativo")
    .eq("email", user.email)
    .maybeSingle();

  if (!usuario) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      new URL("/login?error=not_registered", request.url)
    );
  }

  if (!usuario.ativo) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      new URL("/login?error=inactive", request.url)
    );
  }

  // Route-level permission blocks
  if (pathname.startsWith("/financeiro") && usuario.permissao !== "total") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname.startsWith("/usuarios") && usuario.permissao !== "total") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
