import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const forwarded = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ip = (forwarded ? forwarded.split(',')[0].trim() : realIp) || '127.0.0.1';

    return NextResponse.json({ ip });
}
