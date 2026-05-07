import { NextResponse } from 'next/server';
import dbConnect from '@/backend/lib/db';
import Project from '@/backend/models/Project';

export async function GET(req: Request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);

        const page   = Math.max(1, parseInt(searchParams.get('page')  || '1'));
        const limit  = Math.min(100, parseInt(searchParams.get('limit') || '20'));
        const status     = searchParams.get('status');
        const country    = searchParams.get('country');
        const clientName = searchParams.get('clientName');
        const name       = searchParams.get('name');
        const projectId  = searchParams.get('projectId');
        const parentId   = searchParams.get('parentId');
        const pm         = searchParams.get('pm');
        const sm         = searchParams.get('sm');

        // ── Build filter query ───────────────────────────────
        const query: Record<string, unknown> = {};
        if (projectId) {
            query.$expr = {
                $regexMatch: {
                    input: { $toString: "$_id" },
                    regex: projectId,
                    options: "i"
                }
            };
        }
        if (parentId   && parentId !== 'all')  query.parentId   = parentId;
        if (pm         && pm !== 'all')        query.pm         = pm;
        if (sm         && sm !== 'all')        query.sm         = sm;
        if (status     && status !== 'all')    query.status     = status;
        if (country    && country !== 'all')   query.country    = { $regex: country,    $options: 'i' };
        if (clientName && clientName !== 'all') query.clientName = { $regex: clientName, $options: 'i' };
        if (name)                              query.projectName= { $regex: name,        $options: 'i' };

        const total    = await Project.countDocuments(query);
        const projects = await Project.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        // ── Fetch status-level stats for the stats bar ───────
        const statusCounts = await Project.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);
        const stats: Record<string, number> = { total };
        statusCounts.forEach(({ _id, count }: { _id: string; count: number }) => {
            stats[_id] = count;
        });

        return NextResponse.json({
            success : true,
            data    : projects,
            total,
            page,
            pages   : Math.ceil(total / limit),
            limit,
            stats,
        });
    } catch (error) {
        console.error('GET /api/projects Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch projects' },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        await dbConnect();
        const body = await req.json();

        // Convert numeric strings to numbers
        const payload = {
            ...body,
            ir                : Number(body.ir)               || 0,
            loi               : Number(body.loi)              || 0,
            cpi               : Number(body.cpi)              || 0,
            requiredCompletes : Number(body.requiredCompletes) || 0,
        };

        const project = await Project.create(payload);
        return NextResponse.json({ success: true, data: project }, { status: 201 });
    } catch (error: unknown) {
        console.error('POST /api/projects Error:', error);
        const msg = error instanceof Error ? error.message : 'Failed to create project';
        return NextResponse.json({ success: false, error: msg }, { status: 400 });
    }
}
