import { NextResponse } from 'next/server';
import dbConnect from '@/backend/lib/db';
import Session from '@/backend/models/Session';
import Project from '@/backend/models/Project';
import Supplier from '@/backend/models/Supplier';

export async function GET(req: Request) {
    try {
        await dbConnect();
        // Ensure models are registered for Mongoose population
        void Project;
        void Supplier;

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
            const todayIst = new Date(Date.UTC(nowIst.getUTCFullYear(), nowIst.getUTCMonth(), nowIst.getUTCDate()) - istOffsetMs);
            const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
            const todayStart = new Date(Math.min(todayIst.getTime(), todayUtc.getTime()));

            query.$or = [
                { exitTimestamp: { $gte: todayStart } },
                { entryTimestamp: { $gte: todayStart } },
                { createdAt: { $gte: todayStart } },
            ];
        } else if (periodParam === 'month') {
            const monthIst = new Date(Date.UTC(nowIst.getUTCFullYear(), nowIst.getUTCMonth(), 1) - istOffsetMs);
            const monthUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
            const monthStart = new Date(Math.min(monthIst.getTime(), monthUtc.getTime()));

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

        // 4. Transform into table-ready rows
        const formatted = sessions.map((s, index) => {
            const proj = s.projectId as { _id?: unknown; projectName?: string; parentId?: string; clientName?: string; country?: string } | null;
            const sup = s.supplierId as { _id?: unknown; supplierName?: string; trackingSlug?: string } | null;

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
                return d.toLocaleDateString('en-CA'); // YYYY-MM-DD
            };

            const formatTime = (d: Date | null) => {
                if (!d || isNaN(d.getTime())) return '-';
                return d.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true,
                }); // e.g. "04:10:15 PM"
            };

            const statusDisplayMap: Record<string, string> = {
                complete: 'Complete',
                disqualified: 'Disqualified',
                quota_full: 'Quota Full',
                security: 'Security Term',
                drop: 'Drop',
                started: 'Started',
            };

            return {
                sn: index + 1,
                id: proj?._id ? String(proj._id).slice(-6).toUpperCase() : (s._id ? String(s._id).slice(-6).toUpperCase() : '-'),
                fullId: s._id ? String(s._id) : '',
                supplierId: sup?.trackingSlug || (sup?._id ? String(sup._id).slice(-6) : '-'),
                supplierName: sup?.supplierName || 'Direct / Internal',
                ourPo: proj?.projectName || (proj?.parentId ? `PO-${proj.parentId}` : 'Direct Link Test'),
                client: proj?.clientName || 'Inexra Client',
                startIp: s.ip && s.ip !== 'unknown' ? s.ip : '-',
                endIp: s.exitIp && s.exitIp !== 'unknown' ? s.exitIp : (s.ip && s.ip !== 'unknown' ? s.ip : '-'),
                startTime: formatTime(entryDate),
                endTime: formatTime(exitDate),
                startDate: formatDate(entryDate),
                endDate: formatDate(exitDate),
                refId: s.sessionId || '-',
                uid: s.respondentUid || '-',
                loi: loiStr,
                status: statusDisplayMap[s.status] || s.status,
                rawStatus: s.status,
                country: proj?.country || 'United States',
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
