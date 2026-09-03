import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/backend/lib/db';
import Session from '@/backend/models/Session';
import Supplier from '@/backend/models/Supplier';
import Project from '@/backend/models/Project';
import GeneratedLink from '@/backend/models/GeneratedLink';

// ─── Status Normalization ───────────────────────────────────────────────────

export type NormalizedStatus = 'complete' | 'disqualified' | 'quota_full' | 'security' | 'drop';

const STATUS_MAP: Record<string, NormalizedStatus> = {
    // Complete variations
    'complete': 'complete',
    'completed': 'complete',
    'success': 'complete',

    // Disqualify / Terminate variations
    'terminate': 'disqualified',
    'terminated': 'disqualified',
    'disqualify': 'disqualified',
    'disqualified': 'disqualified',
    'dq': 'disqualified',

    // Quota Full variations
    'quota_full': 'quota_full',
    'quotafull': 'quota_full',
    'quota': 'quota_full',
    'overquota': 'quota_full',

    // Security variations
    'security_terminate': 'security',
    'securityterm': 'security',
    'security_term': 'security',
    'security': 'security',
    'fraud': 'security',

    // Drop / abandoned variations
    'drop': 'drop',
    'abandoned': 'drop',
    'left': 'drop',
};

// ─── URL Interpolation for Supplier Return Links ────────────────────────────

function interpolateReturnUrl(
    templateUrl: string,
    params: {
        uid: string;
        sessionId?: string;
        pid?: string;
        sid?: string;
        status?: string;
    }
): string {
    let url = templateUrl.trim();
    const { uid, sessionId, pid, sid, status } = params;

    const hasUidPlaceholder = /\[(uid|rid|respondent_?id|id)\]/i.test(url);
    const hasSessionPlaceholder = /\[(session_?id|txid|tid)\]/i.test(url);
    const hasStatusPlaceholder = /\[status\]/i.test(url);

    url = url.replace(/\[(uid|rid|respondent_?id|id)\]/gi, encodeURIComponent(uid));
    if (sessionId) {
        url = url.replace(/\[(session_?id|txid|tid)\]/gi, encodeURIComponent(sessionId));
    }
    if (pid) {
        url = url.replace(/\[(pid|project_?id)\]/gi, encodeURIComponent(pid));
    }
    if (sid) {
        url = url.replace(/\[(sid|supplier_?id)\]/gi, encodeURIComponent(sid));
    }
    if (status) {
        url = url.replace(/\[status\]/gi, encodeURIComponent(status));
    }

    if (!hasUidPlaceholder) {
        const separator = url.includes('?') ? '&' : '?';
        url = `${url}${separator}uid=${encodeURIComponent(uid)}`;
    }
    if (sessionId && !hasSessionPlaceholder) {
        const separator = url.includes('?') ? '&' : '?';
        url = `${url}${separator}sessionId=${encodeURIComponent(sessionId)}`;
    }
    if (status && !hasStatusPlaceholder && !url.includes('status=')) {
        const separator = url.includes('?') ? '&' : '?';
        url = `${url}${separator}status=${encodeURIComponent(status)}`;
    }

    return url;
}

// ─── Callback Processor ─────────────────────────────────────────────────────

interface ProcessCallbackParams {
    rawStatus: string;
    uid: string;
    sessionId?: string;
    pid?: string;
    sid?: string;
    shouldRedirect?: boolean;
    baseUrl?: string;
}

async function processSurveyCallback(params: ProcessCallbackParams): Promise<NextResponse> {
    const { rawStatus, uid, sessionId, pid, sid, shouldRedirect, baseUrl = '' } = params;

    // 1. Validate required fields
    if (!rawStatus || (!uid && !sessionId)) {
        return NextResponse.json(
            {
                success: false,
                error: "Missing required fields: 'status' and at least one of 'uid' or 'sessionId' must be provided.",
            },
            { status: 400 }
        );
    }

    // 2. Normalize status
    const cleanStatusKey = rawStatus.toLowerCase().trim();
    const normalizedStatus = STATUS_MAP[cleanStatusKey];

    if (!normalizedStatus) {
        return NextResponse.json(
            {
                success: false,
                error: `Unrecognized survey status: '${rawStatus}'. Expected one of: complete, terminate, disqualify, quota_full, security_terminate, drop.`,
            },
            { status: 400 }
        );
    }

    try {
        await dbConnect();

        // 3. Find Session Record
        // Priority 1: Exact sessionId match if provided
        // Priority 2: respondentUid + projectId match (if pid provided)
        // Priority 3: Latest respondentUid match
        let session = null;

        if (sessionId) {
            session = await Session.findOne({ sessionId });
        }

        if (!session && uid) {
            const query: Record<string, unknown> = { respondentUid: uid };

            if (pid) {
                if (mongoose.Types.ObjectId.isValid(pid)) {
                    query.projectId = new mongoose.Types.ObjectId(pid);
                } else {
                    const projectDoc = await Project.findOne({
                        $or: [{ parentId: pid }, { projectName: pid }],
                    });
                    if (projectDoc) {
                        query.projectId = projectDoc._id;
                    }
                }
            }

            // Get the most recent session for this respondent
            session = await Session.findOne(query).sort({ entryTimestamp: -1, createdAt: -1 });
        }

        // ── Fallback to GeneratedLink (Zamplia legacy compatibility) ──
        if (!session && uid) {
            const legacyLink = await GeneratedLink.findOne({ uid });
            if (legacyLink) {
                const finalStatuses = ['complete', 'disqualified', 'quota_full', 'security', 'drop'];
                const isDuplicate = finalStatuses.includes(legacyLink.status);

                if (!isDuplicate) {
                    await GeneratedLink.findOneAndUpdate(
                        { uid },
                        {
                            status: normalizedStatus,
                            updatedAt: new Date(),
                        }
                    );
                }

                return NextResponse.json({
                    success: true,
                    message: isDuplicate
                        ? `Legacy transaction already processed as: ${legacyLink.status}`
                        : `Legacy transaction updated to: ${normalizedStatus}`,
                    duplicate: isDuplicate,
                    legacy: true,
                    data: {
                        uid,
                        surveyId: legacyLink.surveyId,
                        status: isDuplicate ? legacyLink.status : normalizedStatus,
                    },
                });
            }
        }

        // If session still not found
        if (!session) {
            console.warn(`[SURVEY-CALLBACK] No session found for uid="${uid}", sessionId="${sessionId}", pid="${pid}"`);
            return NextResponse.json(
                {
                    success: false,
                    error: `No survey session found for respondent '${uid || sessionId}'.`,
                    notFound: true,
                },
                { status: 404 }
            );
        }

        // 4. Load Supplier and Project
        const [supplier, project] = await Promise.all([
            Supplier.findById(session.supplierId),
            Project.findById(session.projectId),
        ]);

        // 5. Idempotency Check
        // If session is already finalized, DO NOT re-increment counters or re-calculate payout
        const finalStatuses = ['complete', 'disqualified', 'quota_full', 'security', 'drop'];
        const isFinal = finalStatuses.includes(session.status);

        let supplierReturnUrl: string | null = null;
        if (supplier) {
            let targetTemplate = '';
            if (normalizedStatus === 'complete' && supplier.completionUrl) {
                targetTemplate = supplier.completionUrl;
            } else if (normalizedStatus === 'disqualified' && supplier.terminateUrl) {
                targetTemplate = supplier.terminateUrl;
            } else if (normalizedStatus === 'quota_full' && supplier.quotaFullUrl) {
                targetTemplate = supplier.quotaFullUrl;
            } else if (normalizedStatus === 'security' && supplier.securityUrl) {
                targetTemplate = supplier.securityUrl;
            }

            if (targetTemplate) {
                supplierReturnUrl = interpolateReturnUrl(targetTemplate, {
                    uid: session.respondentUid,
                    sessionId: session.sessionId,
                    pid: session.projectId?.toString(),
                    sid: supplier._id?.toString(),
                    status: normalizedStatus,
                });
            }
        }

        if (isFinal) {
            console.log(
                `[SURVEY-CALLBACK] Duplicate callback ignored for sessionId=${session.sessionId}, uid=${session.respondentUid}, currentStatus=${session.status}`
            );

            if (shouldRedirect && supplierReturnUrl) {
                return NextResponse.redirect(supplierReturnUrl, 302);
            }

            return NextResponse.json({
                success: true,
                message: `Session already in final state: ${session.status}`,
                duplicate: true,
                session: {
                    sessionId: session.sessionId,
                    respondentUid: session.respondentUid,
                    projectId: session.projectId,
                    supplierId: session.supplierId,
                    status: session.status,
                    payout: session.payout,
                    entryTimestamp: session.entryTimestamp,
                    exitTimestamp: session.exitTimestamp,
                },
                supplierReturnUrl,
            });
        }

        // 6. Calculate Payout (only applies to completes)
        let payout = 0;
        if (normalizedStatus === 'complete') {
            payout = supplier?.cpi || session.payout || 0;
        }

        // 7. Update Session Record
        session.status = normalizedStatus;
        session.payout = payout;
        session.exitTimestamp = new Date();
        await session.save();

        // 8. Atomically Update Metric Counters on Supplier & Project
        const supplierInc: Record<string, number> = {};
        const projectInc: Record<string, number> = {};

        switch (normalizedStatus) {
            case 'complete':
                supplierInc.completes = 1;
                projectInc.completes = 1;
                break;
            case 'disqualified':
                supplierInc.disqualified = 1;
                projectInc.disqualify = 1; // Project model uses 'disqualify'
                break;
            case 'quota_full':
                supplierInc.quotaFull = 1;
                break;
            case 'security':
                supplierInc.securityTerm = 1;
                break;
            case 'drop':
                supplierInc.drop = 1;
                projectInc.drop = 1;
                break;
        }

        const updatePromises: Promise<unknown>[] = [];

        if (supplier && Object.keys(supplierInc).length > 0) {
            updatePromises.push(Supplier.findByIdAndUpdate(supplier._id, { $inc: supplierInc }));
        }

        if (project && Object.keys(projectInc).length > 0) {
            updatePromises.push(Project.findByIdAndUpdate(project._id, { $inc: projectInc }));
        }

        await Promise.all(updatePromises);

        console.log(
            `[SURVEY-CALLBACK] Successfully processed sessionId=${session.sessionId}, uid=${session.respondentUid}, status=${rawStatus} -> ${normalizedStatus}, payout=${payout}`
        );

        // 9. Handle Browser Redirect if requested
        if (shouldRedirect) {
            if (supplierReturnUrl) {
                return NextResponse.redirect(supplierReturnUrl, 302);
            }
            // Fallback redirect to client-redirect-url display page
            const redirectPageUrl = new URL('/client-redirect-url', baseUrl || 'http://localhost:3000');
            redirectPageUrl.searchParams.set('status', rawStatus);
            redirectPageUrl.searchParams.set('uid', session.respondentUid);
            if (session.projectId) {
                redirectPageUrl.searchParams.set('sid', session.projectId.toString());
            }
            return NextResponse.redirect(redirectPageUrl.toString(), 302);
        }

        // 10. Return JSON Response
        return NextResponse.json({
            success: true,
            message: `Session successfully updated to: ${normalizedStatus}`,
            duplicate: false,
            session: {
                sessionId: session.sessionId,
                respondentUid: session.respondentUid,
                projectId: session.projectId,
                supplierId: session.supplierId,
                status: session.status,
                payout: session.payout,
                entryTimestamp: session.entryTimestamp,
                exitTimestamp: session.exitTimestamp,
            },
            supplierReturnUrl,
        });

    } catch (error) {
        console.error('[SURVEY-CALLBACK] Server processing error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error while processing survey callback.' },
            { status: 500 }
        );
    }
}

// ─── Route Handlers ─────────────────────────────────────────────────────────

export async function GET(req: Request) {
    const { searchParams, origin } = new URL(req.url);

    const rawStatus = (searchParams.get('status') || '').trim();
    const uid = (searchParams.get('uid') || searchParams.get('respondentUid') || searchParams.get('rid') || searchParams.get('id') || '').trim();
    const sessionId = (searchParams.get('sessionId') || searchParams.get('txid') || '').trim();
    const pid = (searchParams.get('pid') || searchParams.get('projectId') || searchParams.get('sid') || '').trim();
    const sid = (searchParams.get('supplierId') || '').trim();
    const shouldRedirect = searchParams.get('redirect') === 'true' || searchParams.get('redirect') === '1';

    return processSurveyCallback({
        rawStatus,
        uid,
        sessionId,
        pid,
        sid,
        shouldRedirect,
        baseUrl: origin,
    });
}

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        const { searchParams, origin } = new URL(req.url);

        const rawStatus = (body.status || searchParams.get('status') || '').trim();
        const uid = (body.uid || body.respondentUid || body.rid || body.id || searchParams.get('uid') || searchParams.get('respondentUid') || '').trim();
        const sessionId = (body.sessionId || body.txid || searchParams.get('sessionId') || searchParams.get('txid') || '').trim();
        const pid = (body.pid || body.projectId || searchParams.get('pid') || searchParams.get('projectId') || searchParams.get('sid') || '').trim();
        const sid = (body.sid || body.supplierId || searchParams.get('supplierId') || '').trim();
        const shouldRedirect = Boolean(body.redirect || searchParams.get('redirect') === 'true' || searchParams.get('redirect') === '1');

        return processSurveyCallback({
            rawStatus,
            uid,
            sessionId,
            pid,
            sid,
            shouldRedirect,
            baseUrl: origin,
        });
    } catch (error) {
        console.error('POST /api/survey-callback error:', error);
        return NextResponse.json({ success: false, error: 'Failed to parse request body' }, { status: 400 });
    }
}
