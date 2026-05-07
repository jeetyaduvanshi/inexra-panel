import { NextResponse } from 'next/server';
import dbConnect from '@/backend/lib/db';
import ClientConfiguration from '@/backend/models/ClientConfiguration';
import ZampilaSurvey from '@/backend/models/ZampilaSurvey';
import mockData from '@/backend/data/mockZampila.json';

// GET - Fetch data from Zampila API (server-side proxy to avoid CORS)
export async function GET() {
    try {
        await dbConnect();

        // Get Zampila API configuration
        const config = await ClientConfiguration.findOne({ clientName: 'Zampila' });

        if (!config) {
            return NextResponse.json({
                success: false,
                error: 'Zampila API not configured. Please set up API settings first.'
            }, { status: 400 });
        }

        let apiData;
        const isTestMode = config.apiKey === 'TEST_MODE';

        if (isTestMode) {
            // TEST_MODE: Use mock data with simulated latency
            console.log('🧪 TEST_MODE active - using mock data');
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
            apiData = mockData;
        } else {
            // Production mode: Fetch from real Zampila API
            const response = await fetch(config.apiEndpoint, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${config.apiKey}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Zampila API error: ${response.status}`);
            }

            const rawData = await response.json();
            apiData = Array.isArray(rawData) ? rawData : rawData.data || rawData.surveys || [];
        }

        // Parse and store the survey data
        const surveys = Array.isArray(apiData) ? apiData : [];

        // Upsert each survey into our database
        const savedSurveys = [];
        for (const survey of surveys) {
            const surveyData = {
                surveyId: String(survey.surveyId || survey.survey_id || survey.id),
                tcr: Number(survey.tcr || survey.targetCompletes || 0),
                cpi: Number(survey.cpi || survey.costPerInterview || 0),
                loi: Number(survey.loi || survey.lengthOfInterview || 0),
                ir: Number(survey.ir || survey.incidenceRate || 0),
                language: survey.language || survey.lang || 'En-US',
                updateTime: survey.updateTime || survey.update_time || new Date(),
                surveyEndDate: survey.surveyEndDate || survey.survey_end_date || survey.endDate,
                device: survey.device || 'Both',
                industryId: Number(survey.industryId || survey.industry_id || 0),
                types: survey.types || survey.type || 'ADHOC',
            };

            const savedSurvey = await ZampilaSurvey.findOneAndUpdate(
                { surveyId: surveyData.surveyId },
                surveyData,
                { upsert: true, new: true }
            );
            savedSurveys.push(savedSurvey);
        }

        return NextResponse.json({
            success: true,
            data: savedSurveys,
            message: isTestMode
                ? `[MOCK] Fetched and saved ${savedSurveys.length} surveys`
                : `Fetched and saved ${savedSurveys.length} surveys`
        });

    } catch (error) {
        console.error('Fetch Zampila Data Error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch Zampila data'
        }, { status: 500 });
    }
}

// POST - Get cached data from our database
export async function POST() {
    try {
        await dbConnect();

        const surveys = await ZampilaSurvey.find().sort({ createdAt: -1 });
        return NextResponse.json({ success: true, data: surveys });

    } catch (error) {
        console.error('Get Cached Surveys Error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to get cached surveys'
        }, { status: 500 });
    }
}

