import { NextResponse } from 'next/server';
import dbConnect from '@/backend/lib/db';
import Supplier from '@/backend/models/Supplier';
import Project from '@/backend/models/Project';
import Session from '@/backend/models/Session';
import crypto from 'crypto';

import { getBaseUrl } from '@/backend/lib/baseUrl';

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

        // 3. Always create a Session so that callbacks can always find + update the correct project counters.
        //    If no uid is provided (e.g. direct test), generate a temporary one so tracking still works.
        const resolvedUid = uid || `ANON_${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
        const sessionId = crypto.randomUUID();
        const realIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
        const userAgent = request.headers.get('user-agent') || '';

        await Session.create({
            sessionId,
            projectId: supplier.projectId,
            supplierId: supplier._id,
            respondentUid: resolvedUid,
            ip: realIp.split(',')[0].trim(),
            userAgent,
            status: 'started',
            payout: supplier.cpi || 0,
        }).catch((err) => console.error('Session create error in slug tracking:', err));

        // 4. Resolve destination URL by replacing UID placeholder, filling empty param (e.g. &pid= or &uid=), or appending it
        let destinationUrl = supplier.originalLink.trim();
        let uidFilled = false;

        if (resolvedUid) {
            const uidPlaceholderRegex = /[\[{<](?:uid|rid|pid|id|respondent_?id|panelist_?id|panellist_?id|sub_?id|user_?id)[\]}>]/i;
            if (uidPlaceholderRegex.test(destinationUrl)) {
                destinationUrl = destinationUrl.replace(new RegExp(uidPlaceholderRegex.source, 'gi'), encodeURIComponent(resolvedUid));
                uidFilled = true;
            }

            // Fill empty parameter in query string (e.g. &pid= or ?pid= or &uid=)
            const emptyUidParamRegex = /([?&](?:uid|pid|rid|id|respondent_?id|panelist_?id|panellist_?id|sub_?id|user_?id))=(&|$)/i;
            if (!uidFilled && emptyUidParamRegex.test(destinationUrl)) {
                destinationUrl = destinationUrl.replace(emptyUidParamRegex, (_, p1, p2) => `${p1}=${encodeURIComponent(resolvedUid)}${p2}`);
                uidFilled = true;
            }

            // Fallback: append uid only if it was a real uid (not auto-generated anonymous)
            if (!uidFilled && uid) {
                const separator = destinationUrl.includes('?') ? '&' : '?';
                destinationUrl = `${destinationUrl}${separator}uid=${encodeURIComponent(resolvedUid)}`;
            }
        }

        // 5. Inject sessionId into destination URL for round-trip callback tracking
        if (sessionId) {
            let sessionFilled = false;
            const sessionPlaceholderRegex = /[\[{<](?:session_?id|txid|tid|transaction_?id)[\]}>]/i;
            if (sessionPlaceholderRegex.test(destinationUrl)) {
                destinationUrl = destinationUrl.replace(new RegExp(sessionPlaceholderRegex.source, 'gi'), encodeURIComponent(sessionId));
                sessionFilled = true;
            }

            const emptySessionRegex = /([?&](?:session_?id|txid|tid))=(&|$)/i;
            if (!sessionFilled && emptySessionRegex.test(destinationUrl)) {
                destinationUrl = destinationUrl.replace(emptySessionRegex, (_, p1, p2) => `${p1}=${encodeURIComponent(sessionId)}${p2}`);
                sessionFilled = true;
            }

            if (!sessionFilled) {
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
