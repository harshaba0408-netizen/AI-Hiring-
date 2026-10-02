import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "hireai-super-secret-jwt-key-change-in-production"
);

// Paths that require a specific role
const roleProtectedPaths = [
  { path: "/candidate", role: "CANDIDATE" },
  { path: "/recruiter", role: "RECRUITER" },
  { path: "/admin", role: "ADMIN" },
];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Check if the path requires protection
  const protectedPathMatch = roleProtectedPaths.find((r) =>
    pathname.startsWith(r.path)
  );

  if (!protectedPathMatch) {
    return NextResponse.next(); // Public route
  }

  // 2. Extract token from cookies
  const token = request.cookies.get("hireai_token")?.value;

  if (!token) {
    // Redirect to login if accessing a protected route without a token
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  try {
    // 3. Verify token and role
    const { payload } = await jwtVerify(token, JWT_SECRET);

    if (payload.role !== protectedPathMatch.role) {
      // User is authenticated but does not have the required role
      // Redirect to their respective dashboard
      const dashboardUrl = new URL(
        `/${(payload.role as string).toLowerCase()}/dashboard`,
        request.url
      );
      return NextResponse.redirect(dashboardUrl);
    }

    return NextResponse.next();
  } catch (error) {
    // Invalid token - clear cookie and redirect to login
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("hireai_token");
    return response;
  }
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes - handled separately inside route handlers)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
