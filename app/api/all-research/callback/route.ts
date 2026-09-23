import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/backend/lib/db';
import GeneratedLink from '@/backend/models/GeneratedLink';
import AllResearchSurvey from '@/backend/models/AllResearchSurvey';
import Session from '@/backend/models/Session';
import { getBaseUrl } from '@/backend/lib/baseUrl';

const HASH_SECRET = process.env.ALL_RESEARCH_HASH_SECRET || '';

/**
 * Generates SHA3-256 hash for validation
 */
function generateSHA3Hash(baseUrl: string, secretKey: string): string {
    return crypto.createHash('sha3-256').update(baseUrl + secretKey).digest('hex');
}

/**
 * Validates incoming hash from All Research callback
 * The base URL for verification = full callback URL excluding the &hash= param
 */
function validateIncomingHash(fullCallbackUrl: string, receivedHash: string): boolean {
    if (!HASH_SECRET || !receivedHash) return false;

    // Remove &hash=<value> or ?hash=<value> from the end to get baseUrl
    const baseUrl = fullCallbackUrl.replace(/[&?]hash=[^&]*$/, '');
    const expectedHash = generateSHA3Hash(baseUrl, HASH_SECRET);

    return expectedHash === receivedHash;
}

// Status code mapping from All Research API:
// 1 = Complete, 2 = Terminate/Disqualified, 3 = Quota Full, 4 = Security Terminate
const STATUS_MAP: Record<string, string> = {
    '1': 'complete',
    '2': 'disqualified',
    '3': 'quota_full',
    '4': 'security',
    'complete': 'complete',
    'completed': 'complete',
    'terminate': 'disqualified',
    'terminated': 'disqualified',
    'disqualify': 'disqualified',
    'disqualified': 'disqualified',
    'quota_full': 'quota_full',
    'quotafull': 'quota_full',
    'security': 'security',
    'security_terminate': 'security',
};

/**
 * Builds the redirect URL to the traditional INEXRA client redirect result page
 */
function buildClientRedirect(params: {
    baseUrl: string;
    status: string;
    uid?: string;
    sessionId?: string;
    sid?: string;
    ip?: string;
}): NextResponse {
    const url = new URL('/client-redirect-url', params.baseUrl || 'http://localhost:3000');
    url.searchParams.set('recorded', '1');
    url.searchParams.set('status', params.status);
    if (params.uid) url.searchParams.set('uid', params.uid);
    if (params.sessionId) url.searchParams.set('sessionId', params.sessionId);
    if (params.sid) url.searchParams.set('sid', params.sid);
    if (params.ip) url.searchParams.set('ip', params.ip);
    return NextResponse.redirect(url, 302);
}

/**
 * GET — All Research Callback Handler
 *
 * All Research redirects respondents here after survey completion.
 * Query params:
 *   - status: 1=Complete, 2=Terminate/Disqualified, 3=Quota Full, 4=Security Terminate
 *   - uid: our txid (the [identifier] we passed)
 *   - hash: SHA3-256 hash for security validation (optional but validated if present)
 *   - pid / project_id: All Research project ID
 */
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || '';
    const txid = searchParams.get('uid') || searchParams.get('UID') || searchParams.get('txid') || '';
    const receivedHash = searchParams.get('hash') || searchParams.get('Hash') || '';
    const baseUrl = getBaseUrl(req);

    // Extract real client IP from incoming request
    const forwarded = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const clientIp = (forwarded ? forwarded.split(',')[0].trim() : realIp) || '';

    // Determine the mapped status
    const mappedStatus = STATUS_MAP[status] || (status ? status.toLowerCase() : 'disqualified');

    if (!txid) {
        console.warn('[AR CALLBACK] Missing uid/txid in callback');
        return buildClientRedirect({
            baseUrl,
            status: mappedStatus,
            uid: 'unknown',
            sid: 'VM',
            ip: clientIp,
        });
    }

    try {
        await dbConnect();

        // Hash validation (if hash is provided)
        if (receivedHash) {
            const fullUrl = req.url;
            const isValid = validateIncomingHash(fullUrl, receivedHash);
            if (!isValid) {
                console.warn(`[AR CALLBACK] INVALID HASH — txid=${txid} receivedHash=${receivedHash}`);
            } else {
                console.log(`[AR CALLBACK] Hash validated OK — txid=${txid}`);
            }
        }

        // Find transaction record (by txid)
        let link = await GeneratedLink.findOne({ txid, vendor: 'all-research' });
        if (!link) {
            link = await GeneratedLink.findOne({ txid });
        }

        if (!link) {
            console.warn(`[AR CALLBACK] Transaction not found — txid=${txid}`);
            return buildClientRedirect({
                baseUrl,
                status: mappedStatus,
                uid: txid,
                sessionId: txid,
                sid: 'VM',
                ip: clientIp,
            });
        }

        // Fetch survey to get CPI and identifiers
        const survey = await AllResearchSurvey.findOne({ surveyId: link.surveyId });
        const respondentUid = link.uid || txid;
        const projectSid = survey?.surveyCode || survey?.surveyId || link.surveyId || 'VM';
        const resolvedIp = clientIp || (link.ip && link.ip !== 'unknown' && link.ip !== 'generated' ? link.ip : '');

        // Idempotency: skip if already in a final state
        const finalStatuses = ['complete', 'disqualified', 'quota_full', 'security', 'drop'];
        if (finalStatuses.includes(link.status)) {
            console.log(`[AR CALLBACK] Duplicate callback ignored — txid=${txid} currentStatus=${link.status}`);
            return buildClientRedirect({
                baseUrl,
                status: link.status === 'drop' ? 'disqualified' : link.status,
                uid: respondentUid,
                sessionId: txid,
                sid: projectSid,
                ip: resolvedIp,
            });
        }

        // Check Length of Interview (LOI)
        const entryTime = link.createdAt ? new Date(link.createdAt).getTime() : 0;
        const nowMs = Date.now();
        const loiSeconds = entryTime > 0 ? Math.floor((nowMs - entryTime) / 1000) : 0;
        // Any complete in 0 seconds is impossible -> force to 'drop'
        const effectiveStatus = (mappedStatus === 'complete' && loiSeconds <= 0) ? 'drop' : mappedStatus;

        // Payout calculation
        const payout = effectiveStatus === 'complete' ? (survey?.costPerInterview || link.payout || 0) : 0;

        // Update GeneratedLink status and IP
        await GeneratedLink.findOneAndUpdate(
            { txid },
            {
                status: effectiveStatus,
                payout,
                updatedAt: new Date(),
                ...(clientIp && clientIp !== 'unknown' ? { ip: clientIp } : {}),
            }
        );

        // Update survey stats
        if (survey) {
            const increment: Record<string, number> = {};
            if (effectiveStatus === 'complete') increment['completes'] = 1;
            else if (effectiveStatus === 'disqualified') increment['terminates'] = 1;
            else if (effectiveStatus === 'quota_full') increment['quotaFull'] = 1;
            else if (effectiveStatus === 'security') increment['security'] = 1;

            if (Object.keys(increment).length > 0) {
                await AllResearchSurvey.findOneAndUpdate(
                    { surveyId: link.surveyId },
                    { $inc: increment }
                );
            }
        }

        // Update Session record for Central Dashboard stats telemetry
        await Session.findOneAndUpdate(
            { sessionId: txid },
            {
                status: effectiveStatus,
                exitTimestamp: new Date(),
                payout,
                ...(clientIp && clientIp !== 'unknown' ? { ip: clientIp } : {}),
            },
            { upsert: true }
        ).catch((err) => {
            console.warn('[AR CALLBACK] Session update non-fatal warning:', err.message);
        });

        console.log(`[AR CALLBACK] txid=${txid} surveyId=${link.surveyId} status=${effectiveStatus} payout=${payout} respondentUid=${respondentUid}`);

        return buildClientRedirect({
            baseUrl,
            status: effectiveStatus === 'drop' ? 'disqualified' : effectiveStatus,
            uid: respondentUid,
            sessionId: txid,
            sid: projectSid,
            ip: resolvedIp,
        });

    } catch (error) {
        console.error('[AR CALLBACK ERROR]', error);
        return buildClientRedirect({
            baseUrl,
            status: mappedStatus || 'security',
            uid: txid || 'unknown',
            sessionId: txid || '',
            sid: 'VM',
            ip: clientIp,
        });
    }
}
