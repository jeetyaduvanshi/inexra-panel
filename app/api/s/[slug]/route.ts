import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Supplier from '@/models/Supplier';
import Project from '@/models/Project';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> } // params is a Promise in Next.js 15+
) {
    const slug = (await params).slug;

    try {
        await dbConnect();

        // Find Supplier by Slug
        const supplier = await Supplier.findOne({ trackingSlug: slug });

        if (!supplier) {
            return new NextResponse("Link not found or expired", { status: 404 });
        }

        if (supplier.status === 'paused') {
            return new NextResponse("This survey link is currently paused.", { status: 403 });
        }

        // 1. Increment Hits for Supplier
        supplier.hits += 1;
        await supplier.save();

        // 2. Increment Hits for Parent Project (Optional but good for aggregation)
        // Ideally handled via aggregation queries, but direct increment is faster for dashboard
        await Project.findByIdAndUpdate(supplier.projectId, { $inc: { hits: 1 } });

        // 3. Log Visitor (Optional - Phase 5 step 3 in user request)
        // await Log.create({ ip: request.headers.get('x-forwarded-for'), timestamp: new Date(), slug });

        // 4. Redirect to Original Link
        return NextResponse.redirect(supplier.originalLink);

    } catch (error) {
        console.error("Tracking Error:", error);
        return new NextResponse("Server Error during redirect", { status: 500 });
    }
}
