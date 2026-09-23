import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/backend/lib/db';
import AllResearchSurvey from '@/backend/models/AllResearchSurvey';
import GeneratedLink from '@/backend/models/GeneratedLink';
import Session from '@/backend/models/Session';

/**
 * POST — Generate a tracking link for a respondent
 *
 * Body: { surveyId: string, uid: string }
 *
 * Flow:
 * 1. Fetch survey from DB to get entry_live_url
 * 2. Replace [identifier] in URL with our unique txid
 * 3. Save tracking record in GeneratedLink & Session collections
 * 4. Return the clean respondent URL
 */
export async function POST(req: Request) {
    try {
        await dbConnect();

        const body = await req.json();
        const { surveyId, uid } = body;

        if (!surveyId) {
            return NextResponse.json({
                success: false,
                error: 'surveyId is required',
            }, { status: 400 });
        }
        if (!uid) {
            return NextResponse.json({
                success: false,
                error: 'uid (Respondent ID) is required',
            }, { status: 400 });
        }

        // Fetch survey to get entryLiveUrl and CPI
        const survey = await AllResearchSurvey.findOne({ surveyId: String(surveyId) });
        if (!survey) {
            return NextResponse.json({
                success: false,
                error: `Survey with ID ${surveyId} not found. Please refresh surveys.`,
            }, { status: 404 });
        }

        if (!survey.entryLiveUrl) {
            return NextResponse.json({
                success: false,
                error: 'This survey does not have an entry_live_url configured.',
            }, { status: 400 });
        }

        // Generate a unique transaction ID for this respondent
        const txid = crypto.randomUUID();

        // Replace [identifier] placeholder in the All Research URL with our txid
        // As confirmed by All Research team, clean URL without entry hash is accepted
        const finalUrl = survey.entryLiveUrl.replace(/\[identifier\]/gi, encodeURIComponent(txid));

        // Step 4: Save tracking records
        const generatedLink = await GeneratedLink.create({
            txid,
            surveyId: String(surveyId),
            uid: String(uid),
            ip: 'generated',
            vendor: 'all-research',
            status: 'clicked',
            payout: survey.costPerInterview || 0,
            generatedUrl: finalUrl,
        });

        // Also create Session record for central dashboard telemetry
        await Session.create({
            sessionId: txid,
            respondentUid: String(uid),
            ip: 'all-research',
            status: 'started',
            entryTimestamp: new Date(),
            payout: survey.costPerInterview || 0,
        }).catch((err) => {
            console.warn('[AR LINK] Session create non-fatal warning:', err.message);
        });

        // Increment hit counter on survey
        await AllResearchSurvey.findOneAndUpdate(
            { surveyId: String(surveyId) },
            { $inc: { hits: 1 } }
        );

        console.log(`[AR LINK GENERATED] txid=${txid} surveyId=${surveyId} uid=${uid}`);

        return NextResponse.json({
            success: true,
            data: {
                txid,
                url: finalUrl,
                surveyId,
                uid,
                generatedLink,
            },
        });

    } catch (error) {
        console.error('[AR GENERATE LINK ERROR]', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate link',
        }, { status: 500 });
    }
}

// GET — Fetch all generated links for all-research vendor
export async function GET(req: Request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const surveyId = searchParams.get('surveyId');
        const status = searchParams.get('status');

        const query: Record<string, unknown> = { vendor: 'all-research' };
        if (surveyId) query.surveyId = surveyId;
        if (status) query.status = status;

        const links = await GeneratedLink.find(query).sort({ createdAt: -1 }).limit(500);

        return NextResponse.json({ success: true, data: links });
    } catch (error) {
        console.error('[AR FETCH LINKS ERROR]', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch generated links',
        }, { status: 500 });
    }
}
