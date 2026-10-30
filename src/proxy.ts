import { auth } from "../auth";
import { NextResponse } from "next/server";

export default auth(async (request) => {
  const isLoggedIn = Boolean(request.auth);
  const isAdminPath = request.nextUrl.pathname.startsWith("/admin");
  const isLoginPage = request.nextUrl.pathname === "/login";

  if (isAdminPath) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", request.nextUrl));
    }

    const email = request.auth?.user?.email;

    if (!email) {
      return NextResponse.redirect(new URL("/login", request.nextUrl));
    }

    // Pemeriksaan akun aktif dilakukan kembali di server.
    // Untuk saat ini, pemeriksaan database pada Server Actions
    // tetap menjadi perlindungan utama tindakan administratif.
  }

  if (isLoginPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/admin", request.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
