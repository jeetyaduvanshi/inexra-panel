import { NextResponse } from 'next/server';
import dbConnect from '@/backend/lib/db';
import ClientConfiguration from '@/backend/models/ClientConfiguration';

// GET - Fetch client configuration(s)
export async function GET(req: Request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const clientName = searchParams.get('clientName');

        if (clientName) {
            const config = await ClientConfiguration.findOne({ clientName });
            return NextResponse.json({ success: true, data: config });
        }

        const configs = await ClientConfiguration.find().sort({ createdAt: -1 });
        return NextResponse.json({ success: true, data: configs });
    } catch (error) {
        console.error('Fetch Client Config Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch client configuration' }, { status: 500 });
    }
}

// POST - Create or Update client configuration
export async function POST(req: Request) {
    try {
        await dbConnect();
        const { clientName, apiKey, apiEndpoint } = await req.json();

        if (!clientName || !apiKey || !apiEndpoint) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Upsert - update if exists, create if not
        const config = await ClientConfiguration.findOneAndUpdate(
            { clientName },
            { clientName, apiKey, apiEndpoint, updatedAt: new Date() },
            { upsert: true, new: true, runValidators: true }
        );

        return NextResponse.json({ success: true, data: config });
    } catch (error) {
        console.error('Save Client Config Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to save client configuration' }, { status: 500 });
    }
}

// DELETE - Remove client configuration
export async function DELETE(req: Request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const clientName = searchParams.get('clientName');

        if (!clientName) {
            return NextResponse.json({ error: 'Client name required' }, { status: 400 });
        }

        await ClientConfiguration.findOneAndDelete({ clientName });
        return NextResponse.json({ success: true, message: 'Configuration deleted' });
    } catch (error) {
        console.error('Delete Client Config Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete configuration' }, { status: 500 });
    }
}
