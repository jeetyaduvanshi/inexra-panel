import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/backend/lib/db';
import GeneratedLink from '@/backend/models/GeneratedLink';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://inexra-panel.com';

// POST - Generate a tracking link for a survey
export async function POST(req: Request) {
    try {
        await dbConnect();
        const { surveyId, uid, ipAddress } = await req.json();

        // Validation
        if (!surveyId) {
            return NextResponse.json({
                success: false,
                error: 'surveyId is required',
            }, { status: 400 });
        }
        if (!uid) {
            return NextResponse.json({
                success: false,
                error: 'uid (Transaction ID) is required',
            }, { status: 400 });
        }

        // Generate secure UUID txid
        const txid = crypto.randomUUID();

        // Build tracking URL matching Zamplia URL pattern
        const generatedUrl = `${BASE_URL}/client-api-data/zamplia/link/${encodeURIComponent(surveyId)}?id=${encodeURIComponent(surveyId)}&transectionid=${encodeURIComponent(uid)}&ip=${encodeURIComponent(ipAddress || 'unknown')}`;

        // Save to GeneratedLink collection
        const generatedLink = await GeneratedLink.create({
            txid,
            surveyId: String(surveyId),
            uid: String(uid),
            ip: ipAddress || 'unknown',
            vendor: 'zampila',
            status: 'clicked',
            payout: 0,
            generatedUrl,
        });

        console.log(`[LINK CREATED] txid=${txid} surveyId=${surveyId} uid=${uid}`);

        return NextResponse.json({
            success: true,
            data: {
                txid,
                url: generatedUrl,
                generatedLink,
            },
        });

    } catch (error) {
        console.error('[GENERATE LINK ERROR]', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate link',
        }, { status: 500 });
    }
}

// GET - Fetch generated links with optional filters
export async function GET(req: Request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const surveyId = searchParams.get('surveyId');
        const status = searchParams.get('status');
        const vendor = searchParams.get('vendor');

        // Build query
        const query: Record<string, unknown> = {};
        if (surveyId) query.surveyId = surveyId;
        if (status) query.status = status;
        if (vendor) query.vendor = vendor;
        else query.vendor = 'zampila'; // default

        const links = await GeneratedLink.find(query).sort({ createdAt: -1 }).limit(500);

        return NextResponse.json({ success: true, data: links });
    } catch (error) {
        console.error('[FETCH LINKS ERROR]', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch generated links',
        }, { status: 500 });
    }
}
