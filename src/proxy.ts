import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_LOGIN_ROUTE } from "@/lib/admin-entry";
import { SESSION_COOKIE, roleForSession } from "@/server/auth";
import { isAdminEntryKey } from "@/server/admin-entry";

/**
 * Runs only for the admin addresses. Pages stream, and a streamed response is already sent as 200 by the time
 * the page itself can call notFound(). Checking here first gives strangers the same real 404 as any unknown
 * address, so the panel cannot be found. The pages and actions still check on their own.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const allowed = pathname.startsWith(`${ADMIN_LOGIN_ROUTE}/`)
    ? isAdminEntryKey(pathname.slice(ADMIN_LOGIN_ROUTE.length + 1))
    : (await roleForSession(request.cookies.get(SESSION_COOKIE)?.value)) === "admin";
  // An address with no page behind it renders the ordinary not-found page with a 404 status.
  return allowed ? NextResponse.next() : NextResponse.rewrite(new URL("/_404", request.url));
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/admin-login/:path*"],
};
