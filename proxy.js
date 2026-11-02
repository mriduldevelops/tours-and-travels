import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function proxy(request) {
  const token = request.cookies.get("token")?.value;

  const pathname = request.nextUrl.pathname;

  let user = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret);
      user = payload;
    } catch {
      user = null;
    }
  }

  // Admin routes
  if (pathname.startsWith("/admin")) {
    if (!user) {
      return NextResponse.redirect(
        new URL(`/login?next=${encodeURIComponent(pathname)}`, request.url),
      );
    }

    if (user.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // User protected routes
  if (pathname.startsWith("/my-bookings") || pathname.startsWith("/checkout")) {
    if (!user) {
      return NextResponse.redirect(
        new URL(
          `/login?next=${encodeURIComponent(
            request.nextUrl.pathname + request.nextUrl.search,
          )}`,
          request.url,
        ),
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/my-bookings/:path*", "/checkout/:path*"],
};
