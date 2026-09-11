import { NextResponse } from 'next/server';
import dbConnect from '@/backend/lib/db';
import Session from '@/backend/models/Session';

const OUTCOME_STATUSES = ['complete', 'disqualified', 'quota_full', 'security', 'drop'] as const;
type OutcomeStatus = (typeof OUTCOME_STATUSES)[number];

function emptyCounts(): Record<OutcomeStatus, number> {
    return { complete: 0, disqualified: 0, quota_full: 0, security: 0, drop: 0 };
}

async function countsSince(start: Date) {
    const rows = await Session.aggregate([
        {
            $match: {
                status: { $in: OUTCOME_STATUSES },
                $or: [
                    { exitTimestamp: { $gte: start } },
                    { updatedAt: { $gte: start } },
                    { createdAt: { $gte: start } },
                ],
            },
        },
        { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const counts = emptyCounts();
    rows.forEach(({ _id, count }: { _id: OutcomeStatus; count: number }) => {
        counts[_id] = count;
    });
    return counts;
}

export async function GET() {
    try {
        await dbConnect();

        const now = new Date();
        // Calculate today's start in both UTC and IST (UTC+5:30)
        const istOffsetMs = 5.5 * 60 * 60 * 1000;
        const nowIst = new Date(now.getTime() + istOffsetMs);
        const todayIst = new Date(Date.UTC(nowIst.getUTCFullYear(), nowIst.getUTCMonth(), nowIst.getUTCDate()) - istOffsetMs);
        const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const todayStart = new Date(Math.min(todayIst.getTime(), todayUtc.getTime()));

        const monthIst = new Date(Date.UTC(nowIst.getUTCFullYear(), nowIst.getUTCMonth(), 1) - istOffsetMs);
        const monthUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        const monthStart = new Date(Math.min(monthIst.getTime(), monthUtc.getTime()));

        const [today, month] = await Promise.all([
            countsSince(todayStart),
            countsSince(monthStart),
        ]);

        return NextResponse.json({
            success: true,
            today,
            month: {
                ...month,
                total: Object.values(month).reduce((sum, count) => sum + count, 0),
            },
        });
    } catch (error) {
        console.error('GET /api/dashboard/stats Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch dashboard outcome statistics' },
            { status: 500 },
        );
    }
}
