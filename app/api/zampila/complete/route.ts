import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import GeneratedLink from '@/models/GeneratedLink';
import ZampilaSurvey from '@/models/ZampilaSurvey';

// Callback: Survey Completed
// /api/zampila/complete?txid=XXXXX
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const txid = searchParams.get('txid');

    if (!txid) {
        return NextResponse.json({ success: false, error: 'Missing txid' }, { status: 400 });
    }

    try {
        await dbConnect();

        // Find the transaction
        const link = await GeneratedLink.findOne({ txid });
        if (!link) {
            console.warn(`[COMPLETE] Invalid txid=${txid}`);
            return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 });
        }

        // Idempotent: prevent duplicate updates if already in a final status
        const finalStatuses = ['complete', 'disqualified', 'quota_full', 'security', 'drop'];
        if (finalStatuses.includes(link.status)) {
            console.log(`[COMPLETE] Duplicate postback ignored txid=${txid} currentStatus=${link.status}`);
            return NextResponse.json({
                success: true,
                message: `Already processed as: ${link.status}`,
                duplicate: true,
            });
        }

        // Update status to complete and set payout from survey CPI
        const survey = await ZampilaSurvey.findOne({ surveyId: link.surveyId });
        const payout = survey?.cpi || 0;

        await GeneratedLink.findOneAndUpdate(
            { txid },
            {
                status: 'complete',
                payout,
                updatedAt: new Date(),
            }
        );

        // Increment survey stats
        if (survey) {
            await ZampilaSurvey.findOneAndUpdate(
                { surveyId: link.surveyId },
                { $inc: { completes: 1 } }
            );
        }

        console.log(`[COMPLETE] txid=${txid} surveyId=${link.surveyId} payout=${payout}`);

        return NextResponse.json({
            success: true,
            message: 'Survey completion recorded',
            data: { txid, surveyId: link.surveyId, status: 'complete', payout },
        });

    } catch (error) {
        console.error('[COMPLETE ERROR]', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to process completion',
        }, { status: 500 });
    }
}
