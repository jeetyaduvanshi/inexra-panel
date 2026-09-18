import { NextResponse } from 'next/server';
import dbConnect from '@/backend/lib/db';
import Project from '@/backend/models/Project';

export async function GET(req: Request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const statusParam = searchParams.get('status') || 'total';
        const searchQuery = (searchParams.get('search') || '').trim().toLowerCase();

        const query: Record<string, unknown> = {};

        // Status mapping matching dashboard cards
        if (statusParam && statusParam.toLowerCase() !== 'total' && statusParam.toLowerCase() !== 'all') {
            const statusMap: Record<string, string> = {
                running: 'Running',
                runnings: 'Running',
                bidding: 'Bidding',
                biddings: 'Bidding',
                testing: 'Testing',
                testings: 'Testing',
                hold: 'Hold',
                'on hold': 'Hold',
                'on holds': 'Hold',
                completed: 'Completed',
                closed: 'Closed',
            };
            const mapped = statusMap[statusParam.toLowerCase()] || statusParam;
            query.status = mapped;
        }

        const projects = await Project.find(query)
            .sort({ createdAt: -1 })
            .limit(300)
            .lean();

        const formatted = projects.map((p, index) => {
            const created = p.createdAt ? new Date(p.createdAt) : null;
            const startDate = created && !isNaN(created.getTime())
                ? created.toLocaleDateString('en-CA')
                : '-';

            // Short ID display (or parentId if available)
            const displayId = p.parentId ? p.parentId : String(p._id).slice(-4);
            const parentDisplay = p.parentId ? p.parentId : '0';

            const pm = p.pm || 'Amarjeet Yadav';
            const sm = p.sm || 'KD Shukla';
            const pmSm = `${pm} / ${sm}`;

            return {
                sn: index + 1,
                id: displayId,
                fullId: String(p._id),
                parent: parentDisplay,
                name: p.projectName,
                company: p.clientName || 'Inexra Client',
                pmSm,
                startDate,
                status: p.status,
                cpi: p.cpi ?? 0,
                completes: p.completes ?? 0,
                requiredCompletes: p.requiredCompletes ?? 0,
            };
        });

        const filtered = searchQuery
            ? formatted.filter(
                  (p) =>
                      p.name.toLowerCase().includes(searchQuery) ||
                      p.company.toLowerCase().includes(searchQuery) ||
                      p.id.toLowerCase().includes(searchQuery) ||
                      p.parent.toLowerCase().includes(searchQuery) ||
                      p.pmSm.toLowerCase().includes(searchQuery)
              )
            : formatted;

        return NextResponse.json({
            success: true,
            status: statusParam,
            count: filtered.length,
            data: filtered,
        });
    } catch (error) {
        console.error('GET /api/dashboard/projects-by-status Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch projects for status' },
            { status: 500 }
        );
    }
}
