import { NextResponse } from 'next/server';
import dbConnect from '@/backend/lib/db';
import AllResearchSurvey from '@/backend/models/AllResearchSurvey';

const AR_API_BASE = process.env.ALL_RESEARCH_API_BASE || 'https://api.all-research.com';
const SUPPLIER_ID = process.env.ALL_RESEARCH_SUPPLIER_ID || '';
const TOKEN = process.env.ALL_RESEARCH_TOKEN || '';

// GET — Fetch live surveys from All Research API → upsert into DB
export async function GET() {
    try {
        if (!SUPPLIER_ID || !TOKEN) {
            return NextResponse.json({
                success: false,
                error: 'All Research credentials not configured in environment variables.',
            }, { status: 500 });
        }

        const headers: Record<string, string> = {
            'supplierid': SUPPLIER_ID,
            'token': TOKEN,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        };

        const cookie = process.env.ALL_RESEARCH_COOKIE;
        if (cookie) {
            headers['Cookie'] = cookie;
        }

        const response = await fetch(
            `${AR_API_BASE}/webservices/survey/send_supplier_data`,
            {
                method: 'GET',
                headers,
                cache: 'no-store',
            }
        );

        if (!response.ok) {
            const errText = await response.text();
            console.error('[AR FETCH] API error:', response.status, errText);
            return NextResponse.json({
                success: false,
                error: `All Research API returned ${response.status}: ${errText}`,
            }, { status: response.status });
        }

        const json = await response.json();

        // All Research API returns: { ResponseCode: 1, Message: "...", Data: [...] }
        if (!json || json.ResponseCode !== 1) {
            return NextResponse.json({
                success: false,
                error: json?.Message || 'No valid data returned from All Research API.',
            }, { status: 400 });
        }

        const surveys: Record<string, unknown>[] = Array.isArray(json.Data) ? json.Data : [];

        await dbConnect();

        const upserted: unknown[] = [];
        for (const s of surveys) {
            const doc = {
                surveyId: String(s.project_id ?? s.survey_id ?? ''),
                surveyCode: String(s.project_code ?? s.survey_code ?? ''),
                surveyName: String(s.project_name ?? s.survey_name ?? ''),
                surveyCountry: String(s.country ?? s.survey_country ?? ''),
                surveyLanguage: String(s.language ?? s.survey_language ?? 'English'),
                surveyCategory: String(s.category ?? s.survey_category ?? ''),
                surveyCurrency: String(s.currency ?? s.survey_currency ?? 'USD'),
                audienceType: String(s.audience_type ?? ''),
                incidenceRate: Number(s.project_ir ?? s.incidence_rate ?? 0),
                lengthOfInterview: Number(s.project_loi ?? s.length_of_interview ?? 0),
                costPerInterview: Number(s.cpi ?? s.cost_per_interview ?? 0),
                completeNeeded: Number(s.quota ?? s.complete_needed ?? 0),
                liveClickQuota: Number(s.live_quota ?? s.live_click_quota ?? 0),
                testClickQuota: Number(s.test_quota ?? s.test_click_quota ?? 0),
                surveyStartDate: String(s.project_start_date ?? s.survey_start_date ?? ''),
                surveyEndDate: String(s.project_end_date ?? s.survey_end_date ?? ''),
                entryLiveUrl: String(s.live_url ?? s.entry_live_url ?? ''),
                entryTestUrl: String(s.test_url ?? s.entry_test_url ?? ''),
                deviceType: String(s.device_type ?? 'Desktop,Mobile,Tablet'),
                surveyStatus: String(s.status ?? s.survey_status ?? 'Live'),
                buyerId: String(s.buyer_id ?? ''),
                targetSpec: String(s.target_spec ?? ''),
                collectsPii: String(s.pii_collection ?? s.collects_pii ?? 'No'),
                applicationDownload: String(s.application_download ?? 'No'),
                facialCoding: String(s.facial_coding ?? 'No'),
                qualifications: s.qualifications ?? [],
            };

            if (!doc.surveyId) continue; // skip invalid

            const saved = await AllResearchSurvey.findOneAndUpdate(
                { surveyId: doc.surveyId },
                doc,
                { upsert: true, new: true }
            );
            upserted.push(saved);
        }

        console.log(`[AR FETCH] Synced ${upserted.length} surveys from All Research`);

        return NextResponse.json({
            success: true,
            count: upserted.length,
            data: upserted,
            message: `Successfully synced ${upserted.length} surveys from All Research.`,
        });

    } catch (error) {
        console.error('[AR FETCH ERROR]', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch surveys from All Research',
        }, { status: 500 });
    }
}

// POST — Return cached surveys from our DB (no external API call)
export async function POST() {
    try {
        await dbConnect();
        const surveys = await AllResearchSurvey.find().sort({ createdAt: -1 });
        return NextResponse.json({ success: true, data: surveys });
    } catch (error) {
        console.error('[AR CACHED FETCH ERROR]', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to load cached surveys',
        }, { status: 500 });
    }
}
