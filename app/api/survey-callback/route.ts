import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/backend/lib/db';
import Session from '@/backend/models/Session';
import Supplier from '@/backend/models/Supplier';
import Project from '@/backend/models/Project';
import GeneratedLink from '@/backend/models/GeneratedLink';
import { getBaseUrl } from '@/backend/lib/baseUrl';

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

// ─── Callback Processor ─────────────────────────────────────────────────────

interface ProcessCallbackParams {
    rawStatus: string;
    uid: string;
    sessionId?: string;
    pid?: string;
    shouldRedirect?: boolean;
    baseUrl?: string;
    clientIp?: string;
}

function resultPageRedirect(
    baseUrl: string,
    rawStatus: string,
    uid: string,
    sessionId: string,
    projectId?: { toString(): string } | null,
    ip?: string,
): NextResponse {
    const url = new URL('/client-redirect-url', baseUrl || 'http://localhost:3000');
    url.searchParams.set('recorded', '1');
    url.searchParams.set('status', rawStatus);
    url.searchParams.set('uid', uid);
    url.searchParams.set('sessionId', sessionId);
    if (projectId) url.searchParams.set('pid', projectId.toString());
    if (ip) url.searchParams.set('ip', ip);
    return NextResponse.redirect(url, 302);
}

async function processSurveyCallback(params: ProcessCallbackParams): Promise<NextResponse> {
    const { rawStatus, uid, sessionId, pid, shouldRedirect, baseUrl = '', clientIp = '' } = params;

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

        // 4. Load Supplier and Project or auto-create session if missing
        let supplier = null;
        let project = null;

        if (session) {
            [supplier, project] = await Promise.all([
                session.supplierId ? Supplier.findById(session.supplierId) : null,
                session.projectId ? Project.findById(session.projectId) : null,
            ]);
        } else {
            // Auto-create session if not found but pid or uid is provided
            let projectIdObj: mongoose.Types.ObjectId | null = null;
            if (pid) {
                if (mongoose.Types.ObjectId.isValid(pid)) {
                    projectIdObj = new mongoose.Types.ObjectId(pid);
                } else {
                    const projectDoc = await Project.findOne({
                        $or: [{ parentId: pid }, { projectName: pid }],
                    });
                    if (projectDoc) projectIdObj = projectDoc._id;
                }
            }

            if (projectIdObj) {
                [supplier, project] = await Promise.all([
                    Supplier.findOne({ projectId: projectIdObj }),
                    Project.findById(projectIdObj),
                ]);
            }

            if (project && supplier) {
                session = new Session({
                    sessionId: sessionId || crypto.randomUUID(),
                    projectId: project._id,
                    supplierId: supplier._id,
                    respondentUid: uid || 'anonymous',
                    ip: clientIp || 'unknown',
                    exitIp: clientIp || 'unknown',
                    status: 'started',
                    payout: 0,
                    entryTimestamp: new Date(),
                });
            } else {
                // If project/supplier is not pre-registered (e.g. direct client test URL with &pid=TEST1),
                // auto-create the session so it is ALWAYS recorded and visible on the dashboard!
                session = new Session({
                    sessionId: sessionId || crypto.randomUUID(),
                    projectId: project?._id || null,
                    supplierId: supplier?._id || null,
                    respondentUid: uid || 'anonymous',
                    ip: clientIp || 'unknown',
                    exitIp: clientIp || 'unknown',
                    status: 'started',
                    payout: 0,
                    entryTimestamp: new Date(),
                });
            }
        }

        // 5. Idempotency & Final-Status Guard
        const isTestUid = uid === 'TEST_USER';
        // Check if UID is a placeholder (e.g. [uid], %5Buid%5D)
        const isPlaceholderUid = uid === '[uid]' || uid === '%5Buid%5D' || (/^\[.+\]$/.test(uid) && uid !== 'TEST_USER');

        // Check Length of Interview (LOI)
        // If the respondent actually spent time on the survey (> 0s elapsed since entry),
        // they are a real respondent who went through the panel, even if their UID was sent as [uid].
        // Only if LOI is 0s (entryTimestamp == exitTimestamp or instant callback) is it considered a fake direct S2S ping.
        const entryTime = session?.entryTimestamp ? new Date(session.entryTimestamp).getTime() : 0;
        const nowMs = Date.now();
        const loiSeconds = entryTime > 0 ? Math.floor((nowMs - entryTime) / 1000) : 0;
        const hasRealLoi = loiSeconds > 0;

        // True Direct S2S = placeholder UID AND 0s LOI (no real interview took place)
        const isDirectS2S = isPlaceholderUid && !hasRealLoi;
        const previousStatus = session.status;
        const FINAL_STATUSES = ['complete', 'disqualified', 'quota_full', 'security', 'drop'];
        const isAlreadyFinal = !isTestUid && !isDirectS2S && FINAL_STATUSES.includes(previousStatus);

        if (isAlreadyFinal) {
            console.log(
                `[SURVEY-CALLBACK] ${new Date().toISOString()} | BLOCKED: Session already final. sessionId=${session.sessionId}, uid=${session.respondentUid}, currentStatus=${session.status}, attemptedStatus=${normalizedStatus}`
            );

            const resolvedIp = (session?.ip && session.ip !== 'unknown' ? session.ip : clientIp) || '';
            if (shouldRedirect) {
                return resultPageRedirect(baseUrl, rawStatus, session.respondentUid, session.sessionId, session.projectId, resolvedIp);
            }

            return NextResponse.json({
                success: true,
                message: `Session already in final state: ${session.status}. Cannot change to ${normalizedStatus}.`,
                duplicate: true,
                session: {
                    sessionId: session.sessionId,
                    respondentUid: session.respondentUid,
                    projectId: session.projectId,
                    supplierId: session.supplierId,
                    status: session.status,
                    ip: resolvedIp,
                    payout: session.payout,
                    entryTimestamp: session.entryTimestamp,
                    exitTimestamp: session.exitTimestamp,
                },
                supplierReturnUrl: null,
            });
        }

        // 6. Update or Create Session Record
        // S2S entries ([uid] literal with 0s LOI): force status to 'drop' — not a real respondent
        // Respondents with real LOI (> 0s): keep normalizedStatus (e.g. complete)
        const effectiveStatus = isDirectS2S ? 'drop' : normalizedStatus;

        if ((isTestUid || isDirectS2S) && previousStatus !== 'started') {
            // Always create a fresh session for test/S2S UIDs (no idempotency)
            session = new Session({
                sessionId: crypto.randomUUID(),
                projectId: session.projectId,
                supplierId: session.supplierId,
                respondentUid: uid,
                ip: clientIp || session.ip || 'unknown',
                exitIp: clientIp || session.ip || 'unknown',
                status: effectiveStatus,
                payout: 0, // No payout for test/S2S
                entryTimestamp: new Date(),
                exitTimestamp: new Date(),
            });
            await session.save();
        } else {
            let payout = 0;
            if (effectiveStatus === 'complete') {
                payout = supplier?.cpi || session.payout || 0;
            }

            session.status = effectiveStatus;
            session.payout = payout;
            session.exitTimestamp = new Date();
            session.exitIp = clientIp || session.ip || 'unknown';
            if (clientIp && (!session.ip || session.ip === 'unknown')) {
                session.ip = clientIp;
            }
            await session.save();
        }

        // 7. Atomically Update Metric Counters on Supplier & Project
        // ⚠ SKIP counters for Direct S2S (uid=[uid] literal with 0s LOI) — not a real respondent
        if (isDirectS2S) {
            console.log(
                `[SURVEY-CALLBACK] ${new Date().toISOString()} | S2S-SKIPPED: uid=${uid} sent literal placeholder with 0s LOI — counters NOT incremented. status=${normalizedStatus}`
            );
        } else {
            const supplierInc: Record<string, number> = {};
            const projectInc: Record<string, number> = {};

            switch (effectiveStatus) {
                case 'complete':
                    supplierInc.completes = 1;
                    projectInc.completes = 1;
                    break;
                case 'disqualified':
                    supplierInc.disqualified = 1;
                    projectInc.disqualify = 1;
                    break;
                case 'quota_full':
                    supplierInc.quotaFull = 1;
                    projectInc.quotaFull = 1;
                    break;
                case 'security':
                    supplierInc.securityTerm = 1;
                    projectInc.securityTerm = 1;
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
        }

        console.log(
            `[SURVEY-CALLBACK] ${new Date().toISOString()} | OK: sessionId=${session.sessionId}, uid=${session.respondentUid}, ${previousStatus} -> ${normalizedStatus}, supplier=${ supplier?._id}, project=${project?._id}`
        );

        // 8. Handle Browser Redirect if requested
        const resolvedIp = (session?.ip && session.ip !== 'unknown' ? session.ip : clientIp) || '';
        if (shouldRedirect) {
            return resultPageRedirect(baseUrl, rawStatus, session.respondentUid, session.sessionId, session.projectId, resolvedIp);
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
                ip: resolvedIp,
                payout: session.payout,
                entryTimestamp: session.entryTimestamp,
                exitTimestamp: session.exitTimestamp,
            },
            supplierReturnUrl: null,
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
    const forwarded = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const clientIp = (forwarded ? forwarded.split(',')[0].trim() : realIp) || '';

    const rawStatus = (searchParams.get('status') || '').trim();
    const uid = (searchParams.get('uid') || searchParams.get('respondentUid') || searchParams.get('rid') || searchParams.get('id') || '').trim();
    const sessionId = (searchParams.get('sessionId') || searchParams.get('txid') || '').trim();
    const pid = (searchParams.get('pid') || searchParams.get('projectId') || searchParams.get('sid') || '').trim();
    const shouldRedirect = searchParams.get('redirect') === 'true' || searchParams.get('redirect') === '1';

    const baseUrl = getBaseUrl(req);

    return processSurveyCallback({
        rawStatus,
        uid,
        sessionId,
        pid,
        shouldRedirect,
        baseUrl,
        clientIp,
    });
}

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        const { searchParams } = new URL(req.url);
        const forwarded = req.headers.get('x-forwarded-for');
        const realIp = req.headers.get('x-real-ip');
        const clientIp = (forwarded ? forwarded.split(',')[0].trim() : realIp) || '';

        const rawStatus = (body.status || searchParams.get('status') || '').trim();
        const uid = (body.uid || body.respondentUid || body.rid || body.id || searchParams.get('uid') || searchParams.get('respondentUid') || '').trim();
        const sessionId = (body.sessionId || body.txid || searchParams.get('sessionId') || searchParams.get('txid') || '').trim();
        const pid = (body.pid || body.projectId || searchParams.get('pid') || searchParams.get('projectId') || searchParams.get('sid') || '').trim();
        const shouldRedirect = Boolean(body.redirect || searchParams.get('redirect') === 'true' || searchParams.get('redirect') === '1');
        const baseUrl = getBaseUrl(req);

        return processSurveyCallback({
            rawStatus,
            uid,
            sessionId,
            pid,
            shouldRedirect,
            baseUrl,
            clientIp,
        });
    } catch (error) {
        console.error('POST /api/survey-callback error:', error);
        return NextResponse.json({ success: false, error: 'Failed to parse request body' }, { status: 400 });
    }
}
