import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import GeneratedLink from '@/models/GeneratedLink';
import ClientConfiguration from '@/models/ClientConfiguration';

// Survey tracking endpoint for Zamplia
// Handles initial click: /client-api-data/zamplia/link/[surveyId]?id=XXX&transectionid=XXX&ip=XXX
export async function GET(
    request: Request,
    { params }: { params: Promise<{ surveyId: string }> }
) {
    const { surveyId } = await params;
    const { searchParams } = new URL(request.url);
    const transectionid = searchParams.get('transectionid');
    const ip = searchParams.get('ip');

    if (!transectionid) {
        return new NextResponse('Missing transectionid parameter', { status: 400 });
    }

    try {
        await dbConnect();

        // Look up by uid (transectionid) and surveyId
        const link = await GeneratedLink.findOne({ uid: transectionid, surveyId });

        if (!link) {
            console.warn(`[TRACKING] Invalid transectionid=${transectionid} for surveyId=${surveyId}`);
            return new NextResponse('Invalid tracking link', { status: 404 });
        }

        // Capture real IP from query param or headers
        const realIp = ip
            || request.headers.get('x-forwarded-for')
            || request.headers.get('x-real-ip')
            || link.ip
            || 'unknown';

        // Update the link with click IP
        await GeneratedLink.findOneAndUpdate(
            { uid: transectionid, surveyId },
            {
                ip: realIp.split(',')[0].trim(),
                status: 'clicked',
                updatedAt: new Date(),
            }
        );

        console.log(`[CLICK] transectionid=${transectionid} surveyId=${surveyId} ip=${realIp}`);

        // Check if we're in test mode
        const config = await ClientConfiguration.findOne({ clientName: 'Zamplia' });
        const isTestMode = config?.apiKey === 'TEST_MODE';

        if (isTestMode) {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
            return new NextResponse(
                `<!DOCTYPE html>
                <html><head><title>Survey Redirect (TEST MODE)</title></head>
                <body style="font-family:sans-serif;padding:40px;max-width:600px;margin:auto;">
                    <h2>🧪 TEST MODE — Survey Redirect</h2>
                    <p><strong>Survey ID:</strong> ${surveyId}</p>
                    <p><strong>UID (transectionid):</strong> ${transectionid}</p>
                    <p><strong>IP:</strong> ${realIp}</p>
                    <hr/>
                    <p>In production, the user would be redirected to the Zamplia survey.</p>
                    <p>Simulate callbacks:</p>
                    <ul>
                        <li><a href="${baseUrl}/client-redirect-url?status=complete&uid=${transectionid}">✅ Complete</a></li>
                        <li><a href="${baseUrl}/client-redirect-url?status=terminate&uid=${transectionid}">❌ Terminate</a></li>
                        <li><a href="${baseUrl}/client-redirect-url?status=quota_full&uid=${transectionid}">🚫 Quota Full</a></li>
                        <li><a href="${baseUrl}/client-redirect-url?status=security_terminate&uid=${transectionid}">🔒 Security</a></li>
                    </ul>
                </body></html>`,
                { status: 200, headers: { 'Content-Type': 'text/html' } }
            );
        }

        // Production: Redirect to the actual Zamplia survey
        const surveyRedirectUrl = `https://res.zamplia.com/?vid=1912&isMap=1&sid=${surveyId}&uid=${transectionid}&cid=42`;

        return NextResponse.redirect(surveyRedirectUrl, 302);

    } catch (error) {
        console.error('[TRACKING ERROR]', error);
        return new NextResponse('Server Error', { status: 500 });
    }
}
