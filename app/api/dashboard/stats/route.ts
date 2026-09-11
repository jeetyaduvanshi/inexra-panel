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
                exitTimestamp: { $gte: start },
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
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

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
