import { NextResponse } from 'next/server';
import dbConnect from '@/backend/lib/db';
import GeneratedLink from '@/backend/models/GeneratedLink';

// GET - Dashboard aggregation stats for Zampila
// Returns today's counts + rates via MongoDB aggregation pipeline
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const dateFilter = searchParams.get('date'); // optional: YYYY-MM-DD
    const surveyId = searchParams.get('surveyId'); // optional filter

    try {
        await dbConnect();

        // Set date range (default: today)
        const now = new Date();
        let startOfDay: Date;
        let endOfDay: Date;

        if (dateFilter) {
            startOfDay = new Date(dateFilter + 'T00:00:00.000Z');
            endOfDay = new Date(dateFilter + 'T23:59:59.999Z');
        } else {
            startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        }

        // Build match stage
        const matchStage: Record<string, unknown> = {
            vendor: 'zampila',
            createdAt: { $gte: startOfDay, $lte: endOfDay },
        };
        if (surveyId) matchStage.surveyId = surveyId;

        // Aggregation pipeline
        const pipeline = [
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalClicks: { $sum: 1 },
                    completed: {
                        $sum: { $cond: [{ $eq: ['$status', 'complete'] }, 1, 0] },
                    },
                    disqualified: {
                        $sum: { $cond: [{ $eq: ['$status', 'disqualified'] }, 1, 0] },
                    },
                    quotaFull: {
                        $sum: { $cond: [{ $eq: ['$status', 'quota_full'] }, 1, 0] },
                    },
                    securityFail: {
                        $sum: { $cond: [{ $eq: ['$status', 'security'] }, 1, 0] },
                    },
                    dropped: {
                        $sum: { $cond: [{ $eq: ['$status', 'drop'] }, 1, 0] },
                    },
                    clicked: {
                        $sum: { $cond: [{ $eq: ['$status', 'clicked'] }, 1, 0] },
                    },
                    totalPayout: { $sum: '$payout' },
                },
            },
        ];

        const results = await GeneratedLink.aggregate(pipeline);

        const stats = results[0] || {
            totalClicks: 0,
            completed: 0,
            disqualified: 0,
            quotaFull: 0,
            securityFail: 0,
            dropped: 0,
            clicked: 0,
            totalPayout: 0,
        };

        // Calculate rates (avoid division by zero)
        const total = stats.totalClicks || 1;
        const rates = {
            completionRate: Number(((stats.completed / total) * 100).toFixed(2)),
            terminationRate: Number(((stats.disqualified / total) * 100).toFixed(2)),
            securityRate: Number(((stats.securityFail / total) * 100).toFixed(2)),
            quotaRate: Number(((stats.quotaFull / total) * 100).toFixed(2)),
            dropRate: Number(((stats.dropped / total) * 100).toFixed(2)),
        };

        // Per-survey breakdown
        const perSurveyPipeline = [
            { $match: matchStage },
            {
                $group: {
                    _id: '$surveyId',
                    totalClicks: { $sum: 1 },
                    completed: {
                        $sum: { $cond: [{ $eq: ['$status', 'complete'] }, 1, 0] },
                    },
                    disqualified: {
                        $sum: { $cond: [{ $eq: ['$status', 'disqualified'] }, 1, 0] },
                    },
                    quotaFull: {
                        $sum: { $cond: [{ $eq: ['$status', 'quota_full'] }, 1, 0] },
                    },
                    securityFail: {
                        $sum: { $cond: [{ $eq: ['$status', 'security'] }, 1, 0] },
                    },
                    dropped: {
                        $sum: { $cond: [{ $eq: ['$status', 'drop'] }, 1, 0] },
                    },
                    totalPayout: { $sum: '$payout' },
                },
            },
            { $sort: { totalClicks: -1 as const } },
        ];

        const perSurvey = await GeneratedLink.aggregate(perSurveyPipeline);

        return NextResponse.json({
            success: true,
            data: {
                date: dateFilter || now.toISOString().split('T')[0],
                overview: { ...stats, _id: undefined },
                rates,
                perSurvey: perSurvey.map((s) => ({
                    surveyId: s._id,
                    ...s,
                    _id: undefined,
                })),
            },
        });

    } catch (error) {
        console.error('[DASHBOARD STATS ERROR]', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to compute dashboard stats',
        }, { status: 500 });
    }
}
