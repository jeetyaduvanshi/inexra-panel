'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Header } from '@/components/layout/Header';
import { ApiSettingsModal } from '@/components/zampila/ApiSettingsModal';
import { SurveyDataTable } from '@/components/zampila/SurveyDataTable';
import { GenerateLinkSection } from '@/components/zampila/GenerateLinkSection';
import { LoaderOverlay } from '@/components/ui/LoaderOverlay';

interface Survey {
    _id: string;
    surveyId: string;
    tcr: number;
    cpi: number;
    loi: number;
    ir: number;
    language: string;
    updateTime: string;
    surveyEndDate: string;
    device: string;
    industryId: number;
    types: string;
    createdAt: string;
    conversion?: number;
}

export default function ZampilaPage() {
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null);
    const [error, setError] = useState('');
    const generateLinkRef = useRef<HTMLDivElement>(null);

    // Load cached surveys on mount
    useEffect(() => {
        loadCachedSurveys();
    }, []);

    const loadCachedSurveys = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/zampila/fetch-data', { method: 'POST' });
            const data = await response.json();
            if (data.success) {
                setSurveys(data.data || []);
            }
        } catch (err) {
            console.error('Error loading cached surveys:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFetchData = async () => {
        setIsFetching(true);
        setError('');
        try {
            const response = await fetch('/api/zampila/fetch-data');
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to fetch data');
            }

            setSurveys(data.data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsFetching(false);
        }
    };

    const handleGenerateLink = (surveyId: string) => {
        setSelectedSurveyId(surveyId);
        // Scroll to generate link section
        setTimeout(() => {
            generateLinkRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleSettingsSaved = () => {
        // Optionally refresh data after settings are saved
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <Header />

            <LoaderOverlay isLoading={isFetching} message="Fetching survey data..." />

            <main className="max-w-[1600px] mx-auto px-4 py-6">
                {/* Client Data Header */}
                <div className="bg-white rounded-lg border-2 border-red-400 shadow-sm mb-6">
                    <div className="px-6 py-4 flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-gray-900">Client Data</h1>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleFetchData}
                                disabled={isFetching}
                                className="px-4 py-2 bg-inexra-navy text-white font-medium rounded-md hover:bg-opacity-90 transition-colors disabled:opacity-50"
                            >
                                Fetch Data
                            </button>
                            <button
                                onClick={() => setIsSettingsOpen(true)}
                                className="px-4 py-2 bg-inexra-teal text-white font-medium rounded-md hover:bg-opacity-90 transition-colors"
                            >
                                API Settings
                            </button>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Survey Data Table */}
                <div className="bg-white rounded-lg border-2 border-red-400 shadow-sm mb-6 overflow-hidden">
                    <SurveyDataTable
                        surveys={surveys}
                        onGenerateLink={handleGenerateLink}
                        isLoading={isLoading}
                    />
                </div>

                {/* Generate Survey Link Section */}
                <div ref={generateLinkRef}>
                    <GenerateLinkSection selectedSurveyId={selectedSurveyId} />
                </div>
            </main>

            {/* API Settings Modal */}
            <ApiSettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                onSave={handleSettingsSaved}
            />
        </div>
    );
}
