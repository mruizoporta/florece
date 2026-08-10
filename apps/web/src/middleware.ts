import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Tenant-aware routing for /s/{slug}/...
 * Optional future rewrite: map custom domains to /s/{slug} via x-tenant-slug header.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const tenantMatch = pathname.match(/^\/s\/([^/]+)/);
  if (tenantMatch) {
    const slug = tenantMatch[1];
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-tenant-slug", slug);

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/s/:slug/:path*"],
};
