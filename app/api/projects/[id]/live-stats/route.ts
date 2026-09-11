import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/backend/lib/db';
import Session from '@/backend/models/Session';

const OUTCOME_STATUSES = ['complete', 'disqualified', 'quota_full', 'security', 'drop'] as const;

function emptyCounts() {
    return { started: 0, complete: 0, disqualified: 0, quota_full: 0, security: 0, drop: 0 };
}

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json(
            { success: false, error: 'Invalid project ID' },
            { status: 400 }
        );
    }

    try {
        await dbConnect();

        const projectId = new mongoose.Types.ObjectId(id);

        // ── Project-level stats (aggregate all sessions for this project) ──
        const projectStats = await Session.aggregate([
            { $match: { projectId } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                },
            },
        ]);

        const projectCounts = emptyCounts();
        let totalHits = 0;
        projectStats.forEach(({ _id, count }: { _id: string; count: number }) => {
            if (_id in projectCounts) {
                (projectCounts as Record<string, number>)[_id] = count;
            }
            totalHits += count;
        });

        // ── Supplier-level stats (group by supplierId then status) ──
        const supplierStats = await Session.aggregate([
            { $match: { projectId } },
            {
                $group: {
                    _id: { supplierId: '$supplierId', status: '$status' },
                    count: { $sum: 1 },
                },
            },
        ]);

        // Organize by supplier
        const supplierMap = new Map<string, Record<string, number>>();
        supplierStats.forEach(({ _id, count }: { _id: { supplierId: mongoose.Types.ObjectId; status: string }; count: number }) => {
            const sid = _id.supplierId.toString();
            if (!supplierMap.has(sid)) {
                supplierMap.set(sid, { ...emptyCounts(), hits: 0 });
            }
            const entry = supplierMap.get(sid)!;
            entry[_id.status] = count;
            entry.hits = (entry.hits || 0) + count;
        });

        const suppliers = Array.from(supplierMap.entries()).map(([supplierId, counts]) => ({
            supplierId,
            ...counts,
        }));

        return NextResponse.json({
            success: true,
            project: {
                projectId: id,
                hits: totalHits,
                ...projectCounts,
            },
            suppliers,
            computedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error('GET /api/projects/[id]/live-stats Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to compute live stats' },
            { status: 500 }
        );
    }
}
