import { NextResponse } from 'next/server';
import dbConnect from '@/backend/lib/db';
import GeneratedLink from '@/backend/models/GeneratedLink';
import ClientConfiguration from '@/backend/models/ClientConfiguration';

// Survey tracking endpoint for Zampila
// Handles initial click: /api/s/zampila/[surveyId]?txid=XXXXX
export async function GET(
    request: Request,
    { params }: { params: Promise<{ surveyId: string }> }
) {
    const { surveyId } = await params;
    const { searchParams } = new URL(request.url);
    const txid = searchParams.get('txid');

    if (!txid) {
        return new NextResponse('Missing txid parameter', { status: 400 });
    }

    try {
        await dbConnect();

        // Validate txid exists in our database
        const link = await GeneratedLink.findOne({ txid, surveyId });

        if (!link) {
            console.warn(`[TRACKING] Invalid txid=${txid} for surveyId=${surveyId}`);
            return new NextResponse('Invalid tracking link', { status: 404 });
        }

        // Capture real IP from headers
        const realIp = request.headers.get('x-forwarded-for')
            || request.headers.get('x-real-ip')
            || link.ip
            || 'unknown';

        // Update the link with click IP (update only if still in clicked status)
        await GeneratedLink.findOneAndUpdate(
            { txid },
            {
                ip: realIp.split(',')[0].trim(), // take first IP if multiple
                updatedAt: new Date(),
            }
        );

        console.log(`[CLICK] txid=${txid} surveyId=${surveyId} ip=${realIp}`);

        // Build actual Zampila survey redirect URL
        // Try to get Zampila config for base redirect URL
        const config = await ClientConfiguration.findOne({ clientName: 'Zampila' });
        const isTestMode = config?.apiKey === 'TEST_MODE';

        if (isTestMode) {
            // In test mode, show debug page
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
            return new NextResponse(
                `<!DOCTYPE html>
                <html><head><title>Survey Redirect (TEST MODE)</title></head>
                <body style="font-family:sans-serif;padding:40px;max-width:600px;margin:auto;">
                    <h2>🧪 TEST MODE — Survey Redirect</h2>
                    <p><strong>Survey ID:</strong> ${surveyId}</p>
                    <p><strong>TXID:</strong> ${txid}</p>
                    <p><strong>UID:</strong> ${link.uid}</p>
                    <p><strong>IP:</strong> ${realIp}</p>
                    <hr/>
                    <p>In production, the user would be redirected to the Zampila survey.</p>
                    <p>Simulate callbacks:</p>
                    <ul>
                        <li><a href="${baseUrl}/api/zampila/complete?txid=${txid}">✅ Complete</a></li>
                        <li><a href="${baseUrl}/api/zampila/terminate?txid=${txid}">❌ Disqualified / Terminate</a></li>
                        <li><a href="${baseUrl}/api/zampila/quota?txid=${txid}">🚫 Quota Full</a></li>
                        <li><a href="${baseUrl}/api/zampila/security?txid=${txid}">🔒 Security Fail</a></li>
                    </ul>
                </body></html>`,
                { status: 200, headers: { 'Content-Type': 'text/html' } }
            );
        }

        // Production: Redirect to the actual Zampila survey
        // Format: https://res.zamplia.com/?vid=XXXX&isMap=1&sid={surveyId}&uid={uid}&cid=XX
        // The exact URL format should be configured per survey or via config
        const surveyRedirectUrl = `https://res.zamplia.com/?vid=1912&isMap=1&sid=${surveyId}&uid=${link.uid}&cid=22`;

        return NextResponse.redirect(surveyRedirectUrl, 302);

    } catch (error) {
        console.error('[TRACKING ERROR]', error);
        return new NextResponse('Server Error', { status: 500 });
    }
}
