import { NextResponse } from 'next/server';
import dbConnect from '@/backend/lib/db';
import Session from '@/backend/models/Session';
import Project from '@/backend/models/Project';
import Supplier from '@/backend/models/Supplier';
import GeneratedLink from '@/backend/models/GeneratedLink';
import AllResearchSurvey from '@/backend/models/AllResearchSurvey';

export async function GET(req: Request) {
    try {
        await dbConnect();
        // Ensure models are registered for Mongoose population
        void Project;
        void Supplier;
        void GeneratedLink;
        void AllResearchSurvey;

        const { searchParams } = new URL(req.url);
        const statusParam = (searchParams.get('status') || 'all').toLowerCase().trim();
        const periodParam = (searchParams.get('period') || 'today').toLowerCase().trim();
        const searchQuery = (searchParams.get('search') || '').trim().toLowerCase();
        const limit = Math.min(parseInt(searchParams.get('limit') || '200', 10), 500);

        // 1. Build status filter
        const query: Record<string, unknown> = {};
        if (statusParam && statusParam !== 'all') {
            const statusMap: Record<string, string> = {
                complete: 'complete',
                completed: 'complete',
                disqualified: 'disqualified',
                terminate: 'disqualified',
                quota_full: 'quota_full',
                quotafull: 'quota_full',
                quota: 'quota_full',
                security: 'security',
                'security term': 'security',
                'security fail': 'security',
                drop: 'drop',
            };
            const mapped = statusMap[statusParam] || statusParam;
            query.status = mapped;
        }

        // 2. Build period filter
        const now = new Date();
        const istOffsetMs = 5.5 * 60 * 60 * 1000;
        const nowIst = new Date(now.getTime() + istOffsetMs);

        if (periodParam === 'today') {
            const todayStart = new Date(Date.UTC(nowIst.getUTCFullYear(), nowIst.getUTCMonth(), nowIst.getUTCDate()) - istOffsetMs);

            query.$or = [
                { exitTimestamp: { $gte: todayStart } },
                { entryTimestamp: { $gte: todayStart } },
                { createdAt: { $gte: todayStart } },
            ];
        } else if (periodParam === 'month') {
            const monthStart = new Date(Date.UTC(nowIst.getUTCFullYear(), nowIst.getUTCMonth(), 1) - istOffsetMs);

            query.$or = [
                { exitTimestamp: { $gte: monthStart } },
                { entryTimestamp: { $gte: monthStart } },
                { createdAt: { $gte: monthStart } },
            ];
        }

        // 3. Query Sessions with Project and Supplier population
        const sessions = await Session.find(query)
            .sort({ exitTimestamp: -1, entryTimestamp: -1, createdAt: -1 })
            .limit(limit)
            .populate('projectId', 'projectName parentId clientName country')
            .populate('supplierId', 'supplierName trackingSlug')
            .lean();

        // 3.1 Lookup GeneratedLink & AllResearchSurvey records for unlinked sessions (e.g. All Research)
        const unlinkedSessionIds = sessions.filter((s) => !s.projectId).map((s) => s.sessionId).filter(Boolean);
        const unlinkedUids = sessions.filter((s) => !s.projectId).map((s) => s.respondentUid).filter(Boolean);

        let linkMapByTxid = new Map<string, any>();
        let linkMapByUid = new Map<string, any>();
        let arSurveyMap = new Map<string, any>();

        if (unlinkedSessionIds.length > 0 || unlinkedUids.length > 0) {
            const matchedLinks = await GeneratedLink.find({
                $or: [
                    ...(unlinkedSessionIds.length > 0 ? [{ txid: { $in: unlinkedSessionIds } }] : []),
                    ...(unlinkedUids.length > 0 ? [{ uid: { $in: unlinkedUids } }] : []),
                ],
            }).lean();

            linkMapByTxid = new Map(matchedLinks.map((l) => [l.txid, l]));
            linkMapByUid = new Map(matchedLinks.map((l) => [l.uid, l]));

            const arSurveyIds = matchedLinks
                .filter((l) => l.vendor === 'all-research' && l.surveyId)
                .map((l) => String(l.surveyId));

            if (arSurveyIds.length > 0) {
                const arSurveys = await AllResearchSurvey.find({ surveyId: { $in: arSurveyIds } }).lean();
                arSurveyMap = new Map(arSurveys.map((s) => [s.surveyId, s]));
            }
        }

        // 4. Transform into table-ready rows
        const formatted = sessions.map((s, index) => {
            const proj = s.projectId as { _id?: unknown; projectName?: string; parentId?: string; clientName?: string; country?: string } | null;
            const sup = s.supplierId as { _id?: unknown; supplierName?: string; trackingSlug?: string } | null;

            const genLink = (s.sessionId ? linkMapByTxid.get(s.sessionId) : null) || (s.respondentUid ? linkMapByUid.get(s.respondentUid) : null);
            const isAllResearch = genLink?.vendor === 'all-research' || s.ip === 'all-research';
            const arSurvey = genLink?.surveyId ? arSurveyMap.get(String(genLink.surveyId)) : null;

            const entryDate = s.entryTimestamp ? new Date(s.entryTimestamp) : (s.createdAt ? new Date(s.createdAt) : null);
            const exitDate = s.exitTimestamp ? new Date(s.exitTimestamp) : (s.updatedAt ? new Date(s.updatedAt) : null);

            // Compute LOI (Length of Interview)
            let loiStr = 'N/A';
            if (entryDate && exitDate) {
                const diffMs = exitDate.getTime() - entryDate.getTime();
                if (diffMs >= 0) {
                    const totalSec = Math.floor(diffMs / 1000);
                    const mins = Math.floor(totalSec / 60);
                    const secs = totalSec % 60;
                    loiStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
                }
            }

            const formatDate = (d: Date | null) => {
                if (!d || isNaN(d.getTime())) return '-';
                return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // YYYY-MM-DD (IST)
            };

            const formatTime = (d: Date | null) => {
                if (!d || isNaN(d.getTime())) return '-';
                return d.toLocaleTimeString('en-US', {
                    timeZone: 'Asia/Kolkata',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true,
                }); // e.g. "10:10:15 PM" (IST)
            };

            const statusDisplayMap: Record<string, string> = {
                complete: 'Complete',
                disqualified: 'Disqualified',
                quota_full: 'Quota Full',
                security: 'Security Term',
                drop: 'Drop',
                started: 'Started',
            };

            // Clean up IP: avoid showing 'all-research' as an IP address
            const cleanStartIp = s.ip && s.ip !== 'unknown' && s.ip !== 'all-research'
                ? s.ip
                : (s.exitIp && s.exitIp !== 'unknown' && s.exitIp !== 'all-research' ? s.exitIp : '-');
            const cleanEndIp = s.exitIp && s.exitIp !== 'unknown' && s.exitIp !== 'all-research'
                ? s.exitIp
                : (cleanStartIp !== '-' ? cleanStartIp : '-');

            // Format Client & Supplier
            let clientName = proj?.clientName;
            let supplierName = sup?.supplierName;
            let ourPo = proj?.projectName || (proj?.parentId ? `PO-${proj.parentId}` : '');
            let country = proj?.country;

            if (isAllResearch) {
                clientName = 'All Research';
                supplierName = 'All Research API';
                ourPo = arSurvey?.surveyName
                    ? `AR - ${arSurvey.surveyName}`
                    : (genLink?.surveyId ? `AR - ${genLink.surveyId}` : 'All Research Live Feed');
                country = arSurvey?.surveyCountry || country || 'Global';
            } else {
                if (!clientName) clientName = 'Inexra Direct';
                if (!supplierName) supplierName = 'Direct / Internal';
                if (!ourPo) ourPo = 'Direct Link Test';
                if (!country) country = 'United States';
            }

            return {
                sn: index + 1,
                id: proj?._id
                    ? String(proj._id).slice(-6).toUpperCase()
                    : (genLink?.surveyId ? String(genLink.surveyId) : (s._id ? String(s._id).slice(-6).toUpperCase() : '-')),
                fullId: s._id ? String(s._id) : '',
                supplierId: sup?.trackingSlug || (sup?._id ? String(sup._id).slice(-6) : (isAllResearch ? 'AR-API' : '-')),
                supplierName,
                ourPo,
                client: clientName,
                startIp: cleanStartIp,
                endIp: cleanEndIp,
                startTime: formatTime(entryDate),
                endTime: formatTime(exitDate),
                startDate: formatDate(entryDate),
                endDate: formatDate(exitDate),
                refId: s.sessionId || '-',
                uid: s.respondentUid || '-',
                loi: loiStr,
                status: statusDisplayMap[s.status] || s.status,
                rawStatus: s.status,
                country,
                isAllResearch,
            };
        });

        // 5. In-memory filter if searchQuery is provided
        const filtered = searchQuery
            ? formatted.filter(
                  (r) =>
                      r.uid.toLowerCase().includes(searchQuery) ||
                      r.supplierName.toLowerCase().includes(searchQuery) ||
                      r.ourPo.toLowerCase().includes(searchQuery) ||
                      r.client.toLowerCase().includes(searchQuery) ||
                      r.startIp.toLowerCase().includes(searchQuery) ||
                      r.endIp.toLowerCase().includes(searchQuery) ||
                      r.refId.toLowerCase().includes(searchQuery)
              )
            : formatted;

        return NextResponse.json({
            success: true,
            count: filtered.length,
            data: filtered,
        });
    } catch (error) {
        console.error('GET /api/dashboard/sessions Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch session details' },
            { status: 500 }
        );
    }
}
