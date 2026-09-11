import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/backend/lib/db';
import Session from '@/backend/models/Session';
import Supplier from '@/backend/models/Supplier';
import Project from '@/backend/models/Project';

/**
 * POST /api/projects/[id]/sync-counters
 * 
 * Recalculates all counter fields on Project and its Suppliers
 * by aggregating the Session collection. Fixes any counter drift.
 */
export async function POST(
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

        // ── Aggregate project-level counts from sessions ──
        const projectAgg = await Session.aggregate([
            { $match: { projectId } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                },
            },
        ]);

        const projectUpdate: Record<string, number> = {
            hits: 0,
            completes: 0,
            disqualify: 0,
            quotaFull: 0,
            securityTerm: 0,
            drop: 0,
        };

        projectAgg.forEach(({ _id, count }: { _id: string; count: number }) => {
            projectUpdate.hits += count;
            switch (_id) {
                case 'complete': projectUpdate.completes = count; break;
                case 'disqualified': projectUpdate.disqualify = count; break;
                case 'quota_full': projectUpdate.quotaFull = count; break;
                case 'security': projectUpdate.securityTerm = count; break;
                case 'drop': projectUpdate.drop = count; break;
            }
        });

        await Project.findByIdAndUpdate(projectId, { $set: projectUpdate });

        // ── Aggregate supplier-level counts from sessions ──
        const supplierAgg = await Session.aggregate([
            { $match: { projectId } },
            {
                $group: {
                    _id: { supplierId: '$supplierId', status: '$status' },
                    count: { $sum: 1 },
                },
            },
        ]);

        // Group by supplier
        const supplierMap = new Map<string, Record<string, number>>();
        supplierAgg.forEach(({ _id, count }: { _id: { supplierId: mongoose.Types.ObjectId; status: string }; count: number }) => {
            const sid = _id.supplierId.toString();
            if (!supplierMap.has(sid)) {
                supplierMap.set(sid, {
                    hits: 0, completes: 0, disqualified: 0, quotaFull: 0, securityTerm: 0, drop: 0,
                });
            }
            const entry = supplierMap.get(sid)!;
            entry.hits += count;
            switch (_id.status) {
                case 'complete': entry.completes = count; break;
                case 'disqualified': entry.disqualified = count; break;
                case 'quota_full': entry.quotaFull = count; break;
                case 'security': entry.securityTerm = count; break;
                case 'drop': entry.drop = count; break;
            }
        });

        // Update each supplier
        const supplierUpdates = Array.from(supplierMap.entries()).map(
            ([supplierId, counts]) =>
                Supplier.findByIdAndUpdate(supplierId, { $set: counts })
        );
        await Promise.all(supplierUpdates);

        console.log(
            `[SYNC-COUNTERS] ${new Date().toISOString()} | project=${id} synced. ` +
            `Project: ${JSON.stringify(projectUpdate)} | Suppliers: ${supplierMap.size} updated`
        );

        return NextResponse.json({
            success: true,
            message: 'Counters synced from session data',
            project: projectUpdate,
            suppliersUpdated: supplierMap.size,
            syncedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error('POST /api/projects/[id]/sync-counters Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to sync counters' },
            { status: 500 }
        );
    }
}
