import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import GeneratedLink from '@/models/GeneratedLink';
import ZampilaSurvey from '@/models/ZampilaSurvey';

// Callback: Security Fail
// /api/zampila/security?txid=XXXXX
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const txid = searchParams.get('txid');

    if (!txid) {
        return NextResponse.json({ success: false, error: 'Missing txid' }, { status: 400 });
    }

    try {
        await dbConnect();

        const link = await GeneratedLink.findOne({ txid });
        if (!link) {
            console.warn(`[SECURITY] Invalid txid=${txid}`);
            return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 });
        }

        // Idempotent: prevent duplicate updates
        const finalStatuses = ['complete', 'disqualified', 'quota_full', 'security', 'drop'];
        if (finalStatuses.includes(link.status)) {
            console.log(`[SECURITY] Duplicate postback ignored txid=${txid} currentStatus=${link.status}`);
            return NextResponse.json({
                success: true,
                message: `Already processed as: ${link.status}`,
                duplicate: true,
            });
        }

        // Update to security (no payout)
        await GeneratedLink.findOneAndUpdate(
            { txid },
            {
                status: 'security',
                payout: 0,
                updatedAt: new Date(),
            }
        );

        // Increment survey stats
        await ZampilaSurvey.findOneAndUpdate(
            { surveyId: link.surveyId },
            { $inc: { securityTerm: 1 } }
        );

        console.log(`[SECURITY] txid=${txid} surveyId=${link.surveyId}`);

        return NextResponse.json({
            success: true,
            message: 'Security failure recorded',
            data: { txid, surveyId: link.surveyId, status: 'security' },
        });

    } catch (error) {
        console.error('[SECURITY ERROR]', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to process security failure',
        }, { status: 500 });
    }
}
