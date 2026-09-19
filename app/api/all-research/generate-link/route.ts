import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/backend/lib/db';
import AllResearchSurvey from '@/backend/models/AllResearchSurvey';
import GeneratedLink from '@/backend/models/GeneratedLink';

const HASH_SECRET = process.env.ALL_RESEARCH_HASH_SECRET || '';

/**
 * Generates a SHA3-256 hash of (url + secretKey)
 * As per All Research Redirect URL Hashing Guide:
 * $hash = hash('sha3-256', $baseUrl . $secretKey);
 */
function generateSHA3Hash(baseUrl: string, secretKey: string): string {
    return crypto.createHash('sha3-256').update(baseUrl + secretKey).digest('hex');
}

/**
 * POST — Generate a hashed tracking link for a respondent
 *
 * Body: { surveyId: string, uid: string }
 *
 * Flow:
 * 1. Fetch survey from DB to get entry_live_url
 * 2. Replace [identifier] in URL with our unique txid
 * 3. Generate SHA3-256 hash of (fullUrl + HASH_SECRET)
 * 4. Append &hash=<value> to URL (hash must be LAST parameter)
 * 5. Save tracking record in GeneratedLink collection
 * 6. Return the final hashed URL
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
        if (!HASH_SECRET) {
            return NextResponse.json({
                success: false,
                error: 'ALL_RESEARCH_HASH_SECRET is not configured',
            }, { status: 500 });
        }

        // Fetch the survey to get the entry_live_url
        const survey = await AllResearchSurvey.findOne({ surveyId: String(surveyId) });
        if (!survey) {
            return NextResponse.json({
                success: false,
                error: `Survey ${surveyId} not found. Please fetch surveys first.`,
            }, { status: 404 });
        }

        if (!survey.entryLiveUrl) {
            return NextResponse.json({
                success: false,
                error: 'This survey does not have an entry_live_url.',
            }, { status: 400 });
        }

        // Generate a unique transaction ID for this respondent
        const txid = crypto.randomUUID();

        // Step 1: Replace [identifier] placeholder in the All Research URL with our txid
        // All Research entry URL example:
        // https://your_domain/project/supplier-auth?projectid=...&supplierid=...&uid=[identifier]
        const baseUrl = survey.entryLiveUrl.replace(/\[identifier\]/gi, encodeURIComponent(txid));

        // Step 2: Generate SHA3-256 hash
        // Formula: hash('sha3-256', baseUrl . secretKey)
        const hash = generateSHA3Hash(baseUrl, HASH_SECRET);

        // Step 3: Append hash as the LAST parameter (required by All Research spec)
        const finalUrl = `${baseUrl}&hash=${hash}`;

        // Step 4: Save tracking record
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
