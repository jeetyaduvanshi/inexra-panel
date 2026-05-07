import { NextResponse } from 'next/server';
import dbConnect from '@/backend/lib/db';
import Supplier from '@/backend/models/Supplier';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        await dbConnect();
        const { projectId, supplierName, originalLink } = await req.json();

        if (!projectId || !supplierName || !originalLink) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Generate unique 8-char slug
        const trackingSlug = crypto.randomBytes(4).toString('hex');

        const supplier = await Supplier.create({
            projectId,
            supplierName,
            originalLink,
            trackingSlug,
        });

        return NextResponse.json({ success: true, data: supplier });
    } catch (error) {
        console.error('Create Supplier Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to create supplier' }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get('projectId');

        if (!projectId) {
            return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
        }

        const suppliers = await Supplier.find({ projectId }).sort({ createdAt: -1 });
        return NextResponse.json({ success: true, data: suppliers });
    } catch (error) {
        console.error('Fetch Suppliers Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch suppliers' }, { status: 500 });
    }
}
