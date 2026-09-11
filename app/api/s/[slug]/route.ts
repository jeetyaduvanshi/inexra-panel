import { NextResponse } from 'next/server';
import dbConnect from '@/backend/lib/db';
import Supplier from '@/backend/models/Supplier';
import Project from '@/backend/models/Project';
import Session from '@/backend/models/Session';
import crypto from 'crypto';

function getBaseUrl(req: Request): string {
    const originHeader = req.headers.get('origin');
    if (originHeader) return originHeader;

    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    if (host) {
        const proto = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
        return `${proto}://${host}`;
    }

    return process.env.NEXT_PUBLIC_BASE_URL || 'https://www.inexraresearch.com';
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> } // params is a Promise in Next.js 15+
) {
    const slug = (await params).slug;
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid') || searchParams.get('UID') || searchParams.get('rid') || searchParams.get('RID') || '';
    const baseUrl = getBaseUrl(request);

    try {
        await dbConnect();

        // Find Supplier by Slug
        const supplier = await Supplier.findOne({ trackingSlug: slug });

        if (!supplier) {
            return new NextResponse("Link not found or expired", { status: 404 });
        }

        if (supplier.status === 'paused') {
            return new NextResponse("This survey link is currently paused.", { status: 403 });
        }

        // Check Supplier Caps
        if (supplier.maxRedirects > 0 && supplier.hits >= supplier.maxRedirects) {
            return NextResponse.redirect(`${baseUrl}/client-redirect-url?uid=${encodeURIComponent(uid || 'unknown')}&status=quota_full`);
        }
        if (supplier.requiredCompletes > 0 && supplier.completes >= supplier.requiredCompletes) {
            return NextResponse.redirect(`${baseUrl}/client-redirect-url?uid=${encodeURIComponent(uid || 'unknown')}&status=quota_full`);
        }

        // Check Parent Project
        const project = await Project.findById(supplier.projectId);
        if (project) {
            if (project.status === 'Closed' || project.status === 'Hold') {
                return new NextResponse("This survey is currently closed or on hold.", { status: 403 });
            }
            if (project.requiredCompletes > 0 && project.completes >= project.requiredCompletes) {
                return NextResponse.redirect(`${baseUrl}/client-redirect-url?uid=${encodeURIComponent(uid || 'unknown')}&status=quota_full`);
            }
        }

        // 1. Increment Hits for Supplier
        supplier.hits += 1;
        await supplier.save();

        // 2. Increment Hits for Parent Project
        await Project.findByIdAndUpdate(supplier.projectId, { $inc: { hits: 1 } });

        // 3. Create Session if UID is provided
        let sessionId = '';
        if (uid) {
            sessionId = crypto.randomUUID();
            const realIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
            const userAgent = request.headers.get('user-agent') || '';

            await Session.create({
                sessionId,
                projectId: supplier.projectId,
                supplierId: supplier._id,
                respondentUid: uid,
                ip: realIp.split(',')[0].trim(),
                userAgent,
                status: 'started',
                payout: supplier.cpi || 0,
            }).catch((err) => console.error('Session create error in slug tracking:', err));
        }

        // 4. Resolve destination URL by replacing UID placeholder or appending it
        let destinationUrl = supplier.originalLink;
        if (uid) {
            if (/\[uid\]|\[UID\]|\[rid\]|\[RID\]|\{\{uid\}\}|\{\{UID\}\}/.test(destinationUrl)) {
                destinationUrl = destinationUrl.replace(/\[uid\]|\[UID\]|\[rid\]|\[RID\]|\{\{uid\}\}|\{\{UID\}\}/g, encodeURIComponent(uid));
            } else {
                const separator = destinationUrl.includes('?') ? '&' : '?';
                destinationUrl = `${destinationUrl}${separator}uid=${encodeURIComponent(uid)}`;
            }
        }

        // 5. Inject sessionId into destination URL for round-trip callback tracking
        if (sessionId) {
            if (/\[sessionId\]|\[session_id\]|\[txid\]|\{\{sessionId\}\}|\{\{session_id\}\}/i.test(destinationUrl)) {
                destinationUrl = destinationUrl.replace(
                    /\[sessionId\]|\[session_id\]|\[txid\]|\{\{sessionId\}\}|\{\{session_id\}\}/gi,
                    encodeURIComponent(sessionId)
                );
            } else {
                const separator = destinationUrl.includes('?') ? '&' : '?';
                destinationUrl = `${destinationUrl}${separator}sessionId=${encodeURIComponent(sessionId)}`;
            }
        }

        console.log(`[SLUG-REDIRECT] ${new Date().toISOString()} | slug=${slug}, uid=${uid}, sessionId=${sessionId}, dest=${destinationUrl}`);

        return NextResponse.redirect(destinationUrl);

    } catch (error) {
        console.error("Tracking Error:", error);
        return new NextResponse("Server Error during redirect", { status: 500 });
    }
}
