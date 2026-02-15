import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    const { pathname } = request.nextUrl;

    // 1. Define Public Paths (No Auth Required)
    const isPublicPath =
        pathname === '/login' ||
        pathname.startsWith('/api/auth') ||
        pathname.startsWith('/api/s/') || // Legacy tracking links
        pathname.startsWith('/client-api-data/') || // Zamplia tracking links
        pathname.startsWith('/client-redirect-url') || // Zamplia callback redirect pages
        pathname.startsWith('/api/zamplia/callback') || // Zamplia callback API
        pathname.startsWith('/_next') ||
        pathname === '/favicon.ico';

    // 2. Redirect logic
    if (isPublicPath) {
        // If user is already logged in and tries to go to login, send to dashboard
        if (token && pathname === '/login') {
            return NextResponse.redirect(new URL('/', request.url));
        }
        return NextResponse.next();
    }

    // 3. Protected Routes
    if (!token) {
        // Redirect to login if accessing protected route
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
