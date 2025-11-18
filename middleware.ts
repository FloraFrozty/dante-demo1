import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();

  // block or hide certain pages
  if (url.pathname.startsWith("/secret")) {
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
  if (url.pathname.startsWith("/chat")) {
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/secret/:path*"],
};