import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import GeneratedLink from '@/models/GeneratedLink';
import ZampilaSurvey from '@/models/ZampilaSurvey';

// Unified Zamplia callback handler
// Called internally by the redirect page to update status in DB
// GET /api/zamplia/callback?status=complete|terminate|quota_full|security_terminate&uid=XXX
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const uid = searchParams.get('uid');

    if (!status || !uid) {
        return NextResponse.json(
            { success: false, error: 'Missing status or uid' },
            { status: 400 }
        );
    }

    // Map Zamplia status names to our internal statuses
    const statusMap: Record<string, string> = {
        'complete': 'complete',
        'terminate': 'disqualified',
        'disqualify': 'disqualified',
        'quota_full': 'quota_full',
        'security_terminate': 'security',
    };

    const internalStatus = statusMap[status];
    if (!internalStatus) {
        return NextResponse.json(
            { success: false, error: `Unknown status: ${status}` },
            { status: 400 }
        );
    }

    try {
        await dbConnect();

        // Find the transaction by uid
        const link = await GeneratedLink.findOne({ uid });
        if (!link) {
            console.warn(`[CALLBACK] Invalid uid=${uid} status=${status}`);
            return NextResponse.json(
                { success: false, error: 'Transaction not found' },
                { status: 404 }
            );
        }

        // Idempotent: prevent duplicate updates if already in a final status
        const finalStatuses = ['complete', 'disqualified', 'quota_full', 'security', 'drop'];
        if (finalStatuses.includes(link.status)) {
            console.log(`[CALLBACK] Duplicate postback ignored uid=${uid} currentStatus=${link.status}`);
            return NextResponse.json({
                success: true,
                message: `Already processed as: ${link.status}`,
                duplicate: true,
                data: {
                    uid,
                    surveyId: link.surveyId,
                    status: link.status,
                    ip: link.ip,
                },
            });
        }

        // Determine payout (only for completes)
        let payout = 0;
        if (internalStatus === 'complete') {
            const survey = await ZampilaSurvey.findOne({ surveyId: link.surveyId });
            payout = survey?.cpi || 0;
        }

        // Update the link status
        await GeneratedLink.findOneAndUpdate(
            { uid },
            {
                status: internalStatus,
                payout,
                updatedAt: new Date(),
            }
        );

        // Increment survey stats
        const statField: Record<string, string> = {
            'complete': 'completes',
            'disqualified': 'disqualified',
            'quota_full': 'quotaFull',
            'security': 'securityTerm',
        };

        if (statField[internalStatus]) {
            await ZampilaSurvey.findOneAndUpdate(
                { surveyId: link.surveyId },
                { $inc: { [statField[internalStatus]]: 1 } }
            );
        }

        console.log(`[CALLBACK] uid=${uid} status=${status} → ${internalStatus} surveyId=${link.surveyId}`);

        return NextResponse.json({
            success: true,
            message: `Status updated to: ${internalStatus}`,
            data: {
                uid,
                surveyId: link.surveyId,
                status: internalStatus,
                payout,
                ip: link.ip,
            },
        });

    } catch (error) {
        console.error('[CALLBACK ERROR]', error);
        return NextResponse.json(
            { success: false, error: 'Failed to process callback' },
            { status: 500 }
        );
    }
}
