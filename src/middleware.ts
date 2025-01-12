import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAdminRoute = req.nextUrl.pathname.startsWith('/dashboard/admin');
    const isUserRoute = req.nextUrl.pathname.startsWith('/dashboard/client');

    // Protect admin routes
    if (isAdminRoute && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard/client', req.url));
    }

    // Protect user routes
    if (isUserRoute && !token) {
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
);

// Specify the paths that should be protected
export const config = {
  matcher: [
    '/dashboard/admin/:path*',
    '/dashboard/client/:path*'
  ]
}; 