import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
    const pathname = req.nextUrl.pathname;

    // Skip middleware for NextAuth API routes
    if (pathname.startsWith('/api/auth')) {
        return NextResponse.next();
    }

    // Skip middleware for other API routes that don't need protection
    const publicApiRoutes = [
        '/api/users/sign-up',
        '/api/users/verify',
        '/api/users/resend-code',
    ];

    if (publicApiRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.next();
    }

    // Skip middleware for static files and assets
    if (
        pathname.startsWith('/_next/') ||
        pathname.startsWith('/images/') ||
        pathname.startsWith('/icons/') ||
        pathname.includes('.') // Skip files with extensions (images, favicon, etc.)
    ) {
        return NextResponse.next();
    }

    // Get the token to check if user is authenticated
    const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
    });

    const isAuthenticated = !!token;

    // Define public routes that can be accessed without authentication
    const publicRoutes = ['/', '/sign-in', '/sign-up', '/verify'];
    
    // Define auth-only routes that authenticated users shouldn't access
    const authRoutes = ['/sign-in', '/sign-up', '/verify'];
    
    // Define admin-only routes (if you have any)
    const adminRoutes = ['/admin'];
    
    // Check if the current path matches any route pattern
    const isPublicRoute = publicRoutes.some(route => {
        if (route === '/') return pathname === '/';
        return pathname.startsWith(route);
    });
    
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
    const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));

    // If user is authenticated and trying to access auth routes, redirect to home
    if (isAuthenticated && isAuthRoute) {
        return NextResponse.redirect(new URL('/', req.url));
    }

    // Check for admin routes (if you have role-based access)
    if (isAdminRoute) {
        if (!isAuthenticated) {
            const signInUrl = new URL('/sign-in', req.url);
            signInUrl.searchParams.set('callbackUrl', pathname);
            return NextResponse.redirect(signInUrl);
        }
    }

    // If user is not authenticated and trying to access protected routes
    if (!isAuthenticated && !isPublicRoute) {
        const signInUrl = new URL('/sign-in', req.url);
        signInUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(signInUrl);
    }

    // Add security headers for authenticated routes
    if (isAuthenticated && !isPublicRoute) {
        const response = NextResponse.next();
        
        // Add security headers
        response.headers.set('X-Frame-Options', 'DENY');
        response.headers.set('X-Content-Type-Options', 'nosniff');
        response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        
        return response;
    }

    // Allow the request to continue
    return NextResponse.next();
}

export const config = {
    // Match all routes except static files and certain API routes
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api/auth (NextAuth API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files
         * - file extensions for images and assets
         */
        '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
    ],
};