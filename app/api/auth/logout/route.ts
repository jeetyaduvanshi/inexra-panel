import { NextResponse } from 'next/server';

// POST - Logout by clearing the auth cookie
export async function POST() {
    const response = NextResponse.json({ success: true, message: 'Logged out' });

    response.cookies.set('token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0, // expire immediately
    });

    return response;
}

// GET - support simple GET logout too
export async function GET() {
    const response = NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'));

    response.cookies.set('token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
    });

    return response;
}
