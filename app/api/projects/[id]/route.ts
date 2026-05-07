import { NextResponse } from 'next/server';
import dbConnect from '@/backend/lib/db';
import Project from '@/backend/models/Project';

type Ctx = { params: Promise<{ id: string }> };

// ── GET single project ────────────────────────────────────────────────────────
export async function GET(_req: Request, { params }: Ctx) {
    try {
        await dbConnect();
        const { id } = await params;
        const project = await Project.findById(id).lean();
        if (!project)
            return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
        return NextResponse.json({ success: true, data: project });
    } catch (error) {
        console.error('GET /api/projects/[id] Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch project' }, { status: 500 });
    }
}

// ── PUT update project ────────────────────────────────────────────────────────
export async function PUT(req: Request, { params }: Ctx) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();

        // Convert numeric strings
        const payload = {
            ...body,
            ir                : body.ir                != null ? Number(body.ir)                : undefined,
            loi               : body.loi               != null ? Number(body.loi)               : undefined,
            cpi               : body.cpi               != null ? Number(body.cpi)               : undefined,
            requiredCompletes : body.requiredCompletes != null ? Number(body.requiredCompletes) : undefined,
            updatedAt         : new Date(),
        };

        const project = await Project.findByIdAndUpdate(id, payload, {
            new           : true,
            runValidators : true,
        }).lean();

        if (!project)
            return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
        return NextResponse.json({ success: true, data: project });
    } catch (error: unknown) {
        console.error('PUT /api/projects/[id] Error:', error);
        const msg = error instanceof Error ? error.message : 'Failed to update project';
        return NextResponse.json({ success: false, error: msg }, { status: 400 });
    }
}

// ── DELETE project ────────────────────────────────────────────────────────────
export async function DELETE(_req: Request, { params }: Ctx) {
    try {
        await dbConnect();
        const { id } = await params;
        const project = await Project.findByIdAndDelete(id).lean();
        if (!project)
            return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
        return NextResponse.json({ success: true, message: 'Project deleted successfully' });
    } catch (error) {
        console.error('DELETE /api/projects/[id] Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete project' }, { status: 500 });
    }
}
