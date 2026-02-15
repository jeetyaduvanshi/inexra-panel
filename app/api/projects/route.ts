import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';

export async function GET() {
    try {
        await dbConnect();
        const projects = await Project.find({}).sort({ createdAt: -1 });
        return NextResponse.json({ success: true, data: projects });
    } catch (error) {
        console.error('Fetch Projects Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch projects' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await dbConnect();
        const body = await req.json();

        const project = await Project.create(body);
        return NextResponse.json({ success: true, data: project });
    } catch (error) {
        console.error('Create Project Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to create project' }, { status: 400 });
    }
}
