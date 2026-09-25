import { NextResponse } from 'next/server';
import dbConnect from '@/backend/lib/db';
import GeneratedLink from '@/backend/models/GeneratedLink';
import AllResearchSurvey from '@/backend/models/AllResearchSurvey';
import Session from '@/backend/models/Session';

export async function GET() {
    try {
        await dbConnect();

        // 1. Calculate today's start in IST (UTC+5:30)
        const now = new Date();
        const istOffsetMs = 5.5 * 60 * 60 * 1000;
        const nowIst = new Date(now.getTime() + istOffsetMs);
        const todayStart = new Date(
            Date.UTC(nowIst.getUTCFullYear(), nowIst.getUTCMonth(), nowIst.getUTCDate()) - istOffsetMs
        );

        // 2. Fetch all-time summary from GeneratedLink
        const linksStats = await GeneratedLink.aggregate([
            { $match: { vendor: 'all-research' } },
            {
                $group: {
                    _id: null,
                    totalClicks: { $sum: 1 },
                    completes: { $sum: { $cond: [{ $eq: ['$status', 'complete'] }, 1, 0] } },
                    disqualified: { $sum: { $cond: [{ $eq: ['$status', 'disqualified'] }, 1, 0] } },
                    quotaFull: { $sum: { $cond: [{ $eq: ['$status', 'quota_full'] }, 1, 0] } },
                    revenue: {
                        $sum: { $cond: [{ $eq: ['$status', 'complete'] }, '$payout', 0] },
                    },
                },
            },
        ]);

        const summaryData = linksStats[0] || {
            totalClicks: 0,
            completes: 0,
            disqualified: 0,
            quotaFull: 0,
            revenue: 0,
        };

        // 3. Today's stats for All Research
        const todayStats = await GeneratedLink.aggregate([
            {
                $match: {
                    vendor: 'all-research',
                    $or: [
                        { updatedAt: { $gte: todayStart } },
                        { createdAt: { $gte: todayStart } },
                    ],
                },
            },
            {
                $group: {
                    _id: null,
                    todayClicks: {
                        $sum: { $cond: [{ $gte: ['$createdAt', todayStart] }, 1, 0] },
                    },
                    todayCompletes: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ['$status', 'complete'] },
                                        { $gte: ['$updatedAt', todayStart] },
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                    todayTerminates: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ['$status', 'disqualified'] },
                                        { $gte: ['$updatedAt', todayStart] },
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                    todayQuotaFull: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ['$status', 'quota_full'] },
                                        { $gte: ['$updatedAt', todayStart] },
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                },
            },
        ]);

        const todayData = todayStats[0] || {
            todayClicks: 0,
            todayCompletes: 0,
            todayTerminates: 0,
            todayQuotaFull: 0,
        };

        const totalSurveys = await AllResearchSurvey.countDocuments();

        // 4. Fetch recent 50 All Research sessions with survey metadata
        const recentLinks = await GeneratedLink.find({ vendor: 'all-research' })
            .sort({ updatedAt: -1, createdAt: -1 })
            .limit(50)
            .lean();

        const surveyIds = Array.from(new Set(recentLinks.map((l) => String(l.surveyId)).filter(Boolean)));
        const txids = recentLinks.map((l) => l.txid).filter(Boolean);

        const [surveys, sessions] = await Promise.all([
            AllResearchSurvey.find({ surveyId: { $in: surveyIds } }).lean(),
            Session.find({ sessionId: { $in: txids } }).lean(),
        ]);

        const surveyMap = new Map(surveys.map((s) => [s.surveyId, s]));
        const sessionMap = new Map(sessions.map((s) => [s.sessionId, s]));

        const formatTime = (d: Date | null) => {
            if (!d || isNaN(d.getTime())) return '-';
            return d.toLocaleTimeString('en-US', {
                timeZone: 'Asia/Kolkata',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
            });
        };

        const formatDate = (d: Date | null) => {
            if (!d || isNaN(d.getTime())) return '-';
            return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        };

        const formattedSessions = recentLinks.map((link) => {
            const survey = surveyMap.get(String(link.surveyId));
            const session = sessionMap.get(link.txid);

            const entryDate = session?.entryTimestamp
                ? new Date(session.entryTimestamp)
                : link.createdAt
                ? new Date(link.createdAt)
                : null;
            const exitDate = session?.exitTimestamp
                ? new Date(session.exitTimestamp)
                : link.updatedAt
                ? new Date(link.updatedAt)
                : null;

            let loiStr = '-';
            if (entryDate && exitDate) {
                const diffMs = exitDate.getTime() - entryDate.getTime();
                if (diffMs > 0) {
                    const totalSec = Math.floor(diffMs / 1000);
                    const mins = Math.floor(totalSec / 60);
                    const secs = totalSec % 60;
                    loiStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
                }
            }

            return {
                txid: link.txid,
                uid: link.uid,
                surveyId: link.surveyId,
                surveyName: survey?.surveyName || `Survey #${link.surveyId}`,
                country: survey?.surveyCountry || 'Global',
                status: link.status || session?.status || 'clicked',
                cpi: Number(link.payout || survey?.costPerInterview || 0).toFixed(2),
                currency: survey?.surveyCurrency || 'USD',
                loi: loiStr,
                ip: session?.exitIp && session.exitIp !== 'unknown' && session.exitIp !== 'all-research'
                    ? session.exitIp
                    : (link.ip && link.ip !== 'generated' && link.ip !== 'all-research' ? link.ip : '-'),
                startTime: formatTime(entryDate),
                endTime: formatTime(exitDate),
                date: formatDate(exitDate || entryDate),
            };
        });

        return NextResponse.json({
            success: true,
            summary: {
                totalSurveys,
                totalClicks: summaryData.totalClicks,
                totalCompletes: summaryData.completes,
                totalTerminates: summaryData.disqualified,
                totalQuotaFull: summaryData.quotaFull,
                totalRevenue: Number(summaryData.revenue).toFixed(2),
                todayClicks: todayData.todayClicks,
                todayCompletes: todayData.todayCompletes,
                todayTerminates: todayData.todayTerminates,
                todayQuotaFull: todayData.todayQuotaFull,
            },
            sessions: formattedSessions,
        });
    } catch (error) {
        console.error('[AR STATS] Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch All Research telemetry' },
            { status: 500 }
        );
    }
}
