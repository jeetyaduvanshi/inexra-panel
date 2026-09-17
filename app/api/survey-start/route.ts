import { NextResponse } from 'next/server';
import dbConnect from '@/backend/lib/db';
import Supplier from '@/backend/models/Supplier';
import Project from '@/backend/models/Project';
import Session from '@/backend/models/Session';
import mongoose from 'mongoose';
import crypto from 'crypto';

import { getBaseUrl, sanitizePanelUrl } from '@/backend/lib/baseUrl';

/**
 * Replace placeholder tokens in target survey or supplier return URLs.
 * Replaces bracket placeholders [uid], [sessionId], [pid], [sid] and {{uid}}, {{sessionId}}, etc.
 */
function interpolateUrl(
    templateUrl: string,
    params: {
        uid: string;
        sessionId?: string;
        pid?: string;
        sid?: string;
    }
): string {
    let url = templateUrl.trim();
    const { uid, sessionId, pid, sid } = params;

    const hasUidPlaceholder = /\[(uid|rid|respondent_?id|id)\]|\{\{(uid|rid|respondent_?id|id)\}\}/i.test(url);
    const hasSessionPlaceholder = /\[(session_?id|txid|tid)\]|\{\{(session_?id|txid|tid)\}\}/i.test(url);

    // Substitute placeholders
    url = url.replace(/\[(uid|rid|respondent_?id|id)\]|\{\{(uid|rid|respondent_?id|id)\}\}/gi, encodeURIComponent(uid));
    if (sessionId) {
        url = url.replace(/\[(session_?id|txid|tid)\]|\{\{(session_?id|txid|tid)\}\}/gi, encodeURIComponent(sessionId));
    }
    if (pid) {
        url = url.replace(/\[(pid|project_?id)\]|\{\{(pid|project_?id)\}\}/gi, encodeURIComponent(pid));
    }
    if (sid) {
        url = url.replace(/\[(sid|supplier_?id)\]|\{\{(sid|supplier_?id)\}\}/gi, encodeURIComponent(sid));
    }

    // Append uid if not substituted via placeholder
    if (!hasUidPlaceholder && uid) {
        const separator = url.includes('?') ? '&' : '?';
        url = `${url}${separator}uid=${encodeURIComponent(uid)}`;
    }

    // Append sessionId if provided and not substituted via placeholder
    if (sessionId && !hasSessionPlaceholder) {
        const separator = url.includes('?') ? '&' : '?';
        url = `${url}${separator}sessionId=${encodeURIComponent(sessionId)}`;
    }

    return url;
}

/**
 * Exit redirect handler: route to supplier's configured exit URL or internal fallback page.
 */
interface SupplierDoc {
    _id?: mongoose.Types.ObjectId;
    terminateUrl?: string;
    quotaFullUrl?: string;
    securityUrl?: string;
}

function getSupplierExitRedirect(
    baseUrl: string,
    type: 'terminate' | 'quota_full' | 'security_terminate',
    supplier: SupplierDoc | null,
    uid: string,
    pid: string,
    sessionId?: string
): NextResponse {
    let destinationUrl = '';

    if (supplier) {
        if (type === 'terminate' && supplier.terminateUrl) {
            destinationUrl = supplier.terminateUrl;
        } else if (type === 'quota_full' && supplier.quotaFullUrl) {
            destinationUrl = supplier.quotaFullUrl;
        } else if (type === 'security_terminate' && supplier.securityUrl) {
            destinationUrl = supplier.securityUrl;
        }
    }

    if (destinationUrl) {
        const sanitizedDest = sanitizePanelUrl(destinationUrl, baseUrl);
        const finalUrl = interpolateUrl(sanitizedDest, {
            uid,
            sessionId,
            pid,
            sid: supplier?._id?.toString(),
        });
        return NextResponse.redirect(finalUrl, 302);
    }

    // Fallback: Internal branded redirect page
    const fallbackUrl = `${baseUrl}/client-redirect-url?status=${type}&uid=${encodeURIComponent(uid)}&sid=${encodeURIComponent(pid)}`;
    return NextResponse.redirect(fallbackUrl, 302);
}

/**
 * Process survey entry pipeline:
 * Validate project → supplier → caps → duplicate check → create session → redirect
 */
async function processSurveyStart(
    request: Request,
    params: {
        pid: string;
        sid: string;
        uid: string;
        isTest: boolean;
        format?: string | null;
    }
): Promise<NextResponse> {
    const { pid, sid, uid, isTest, format } = params;
    const baseUrl = getBaseUrl(request);

    // 1. Parameter Validation
    if (!pid || !sid || !uid) {
        return NextResponse.json(
            {
                success: false,
                error: "Missing required parameters: 'pid' (Project ID), 'sid' (Supplier ID), and 'uid' (Respondent ID) are all required.",
            },
            { status: 400 }
        );
    }

    // Capture client details
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = forwarded ? forwarded.split(',')[0].trim() : (request.headers.get('x-real-ip') || 'unknown');
    const userAgent = request.headers.get('user-agent') || '';

    try {
        await dbConnect();

        // 2. Validate Project
        const projectQuery = mongoose.Types.ObjectId.isValid(pid) ? { _id: pid } : { parentId: pid };
        let project = await Project.findOne(projectQuery);
        if (!project) {
            project = await Project.findOne({ projectName: pid });
        }

        if (!project) {
            return NextResponse.json(
                { success: false, error: `Project not found for identifier: ${pid}` },
                { status: 404 }
            );
        }

        // 3. Validate Supplier
        const supplierQuery: Record<string, unknown> = { projectId: project._id };
        if (mongoose.Types.ObjectId.isValid(sid)) {
            supplierQuery._id = sid;
        } else {
            supplierQuery.trackingSlug = sid;
        }

        const supplier = await Supplier.findOne(supplierQuery);
        if (!supplier) {
            // Check if supplier exists under a different project
            const unassociatedSupplier = mongoose.Types.ObjectId.isValid(sid)
                ? await Supplier.findById(sid)
                : await Supplier.findOne({ trackingSlug: sid });

            if (unassociatedSupplier) {
                return NextResponse.json(
                    { success: false, error: 'Supplier exists but is not associated with the specified Project.' },
                    { status: 400 }
                );
            }

            return NextResponse.json(
                { success: false, error: `Supplier not found for identifier: ${sid}` },
                { status: 404 }
            );
        }

        const projectIdStr = project._id.toString();

        // 4. Validate Project Status
        if (project.status === 'Completed') {
            return getSupplierExitRedirect(baseUrl, 'quota_full', supplier, uid, projectIdStr);
        }

        if (['Hold', 'Closed', 'Bidding'].includes(project.status)) {
            return getSupplierExitRedirect(baseUrl, 'terminate', supplier, uid, projectIdStr);
        }

        if (project.status !== 'Running' && project.status !== 'Testing') {
            return getSupplierExitRedirect(baseUrl, 'terminate', supplier, uid, projectIdStr);
        }

        // 5. Validate Project Completes Cap
        if (project.requiredCompletes > 0 && project.completes >= project.requiredCompletes) {
            return getSupplierExitRedirect(baseUrl, 'quota_full', supplier, uid, projectIdStr);
        }

        // 6. Validate Supplier Status
        if (supplier.status === 'paused') {
            return getSupplierExitRedirect(baseUrl, 'terminate', supplier, uid, projectIdStr);
        }

        // 7. Validate Supplier Caps
        // 7a. Required target completes cap
        if (supplier.requiredCompletes > 0 && supplier.completes >= supplier.requiredCompletes) {
            return getSupplierExitRedirect(baseUrl, 'quota_full', supplier, uid, projectIdStr);
        }

        // 7b. Max redirects cap
        if (supplier.maxRedirects > 0 && supplier.hits >= supplier.maxRedirects) {
            return getSupplierExitRedirect(baseUrl, 'quota_full', supplier, uid, projectIdStr);
        }

        // 8. Fraud Prevention: Check for duplicate respondent
        const existingSession = await Session.findOne({
            projectId: project._id,
            respondentUid: uid,
        });

        if (existingSession && !isTest) {
            return getSupplierExitRedirect(
                baseUrl,
                'security_terminate',
                supplier,
                uid,
                projectIdStr,
                existingSession.sessionId
            );
        }

        // 9. Generate Unique Session ID and Create Session
        const sessionId = `sess_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;

        const session = await Session.create({
            sessionId,
            projectId: project._id,
            supplierId: supplier._id,
            respondentUid: uid,
            ip: realIp,
            userAgent,
            status: 'started',
            payout: supplier.cpi || 0,
            entryTimestamp: new Date(),
        });

        // 10. Increment hits for Supplier and Project atomically
        await Supplier.findByIdAndUpdate(supplier._id, { $inc: { hits: 1 } });
        await Project.findByIdAndUpdate(project._id, { $inc: { hits: 1 } });

        // 11. Determine survey destination URL
        let targetSurveyUrl = '';
        if (isTest || project.status === 'Testing') {
            targetSurveyUrl = project.surveyTestLink || supplier.testLink || supplier.originalLink || project.surveyLink;
        } else {
            targetSurveyUrl = supplier.originalLink || project.surveyLink;
        }

        if (!targetSurveyUrl) {
            return NextResponse.json(
                { success: false, error: 'No survey destination link configured for this project or supplier.' },
                { status: 500 }
            );
        }

        const finalSurveyUrl = interpolateUrl(targetSurveyUrl, {
            uid,
            sessionId,
            pid: projectIdStr,
            sid: supplier._id.toString(),
        });

        // Support JSON response format for automated integration tests and programmatic callers
        if (format === 'json') {
            return NextResponse.json({
                success: true,
                sessionId,
                redirectUrl: finalSurveyUrl,
                session: {
                    sessionId: session.sessionId,
                    projectId: session.projectId,
                    supplierId: session.supplierId,
                    respondentUid: session.respondentUid,
                    status: session.status,
                    payout: session.payout,
                },
            });
        }

        // Standard respondent browser redirect
        return NextResponse.redirect(finalSurveyUrl, 302);

    } catch (error) {
        console.error('Survey Start Error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error while initiating survey session.' },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    const pid = (searchParams.get('pid') || searchParams.get('projectId') || '').trim();
    const sid = (searchParams.get('sid') || searchParams.get('supplierId') || searchParams.get('slug') || '').trim();
    const uid = (searchParams.get('uid') || searchParams.get('respondentUid') || searchParams.get('rid') || searchParams.get('id') || searchParams.get('UID') || searchParams.get('RID') || '').trim();
    const isTest = searchParams.get('test') === 'true' || searchParams.get('test') === '1' || searchParams.get('mode') === 'test';
    const format = searchParams.get('format');

    return processSurveyStart(request, { pid, sid, uid, isTest, format });
}

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}));
        const { searchParams } = new URL(request.url);

        const pid = (body.pid || body.projectId || searchParams.get('pid') || searchParams.get('projectId') || '').trim();
        const sid = (body.sid || body.supplierId || body.slug || searchParams.get('sid') || searchParams.get('supplierId') || searchParams.get('slug') || '').trim();
        const uid = (body.uid || body.respondentUid || body.rid || body.id || body.UID || body.RID || searchParams.get('uid') || searchParams.get('respondentUid') || searchParams.get('rid') || searchParams.get('id') || '').trim();
        const isTest = Boolean(body.test || body.isTest || searchParams.get('test') === 'true' || searchParams.get('test') === '1' || searchParams.get('mode') === 'test');
        const format = body.format || searchParams.get('format') || 'json';

        return processSurveyStart(request, { pid, sid, uid, isTest, format });
    } catch (error) {
        console.error('POST /api/survey-start error:', error);
        return NextResponse.json({ success: false, error: 'Failed to parse request body' }, { status: 400 });
    }
}
