import { NextResponse } from 'next/server';
import mockData from '@/backend/data/mockZampila.json';

// Mock API Route for testing Zampila integration
// Simulates a 2-second network latency before returning data
export async function GET() {
    try {
        // Simulate network latency (2 seconds)
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Return mock data in the same format as the real API would
        return NextResponse.json({
            success: true,
            data: mockData,
            message: `[MOCK] Fetched ${mockData.length} surveys`
        });

    } catch (error) {
        console.error('Mock API Error:', error);
        return NextResponse.json({
            success: false,
            error: 'Mock API error'
        }, { status: 500 });
    }
}
