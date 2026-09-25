'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Header } from '@/frontend/components/layout/Header';
import { LoaderOverlay } from '@/frontend/components/ui/LoaderOverlay';
import { AllResearchSurveyTable, AllResearchSurvey } from '@/frontend/components/all-research/AllResearchSurveyTable';
import { AllResearchLinkGenerator } from '@/frontend/components/all-research/AllResearchLinkGenerator';
import { RefreshCw, Info } from 'lucide-react';

export default function AllResearchPage() {
    const [surveys, setSurveys] = useState<AllResearchSurvey[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [lastSynced, setLastSynced] = useState<string | null>(null);
    const [showCallbackInfo, setShowCallbackInfo] = useState(false);
    const [filteredCount, setFilteredCount] = useState<number | null>(null);
    const linkGeneratorRef = useRef<HTMLDivElement>(null);

    // Load cached surveys from DB on mount
    useEffect(() => {
        loadCachedSurveys();
    }, []);

    const loadCachedSurveys = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/all-research/fetch-surveys', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                setSurveys(data.data || []);
            }
        } catch (err) {
            console.error('Failed to load cached surveys:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch fresh data from All Research API
    const handleFetchFromAPI = async () => {
        setIsFetching(true);
        setError('');
        try {
            const res = await fetch('/api/all-research/fetch-surveys');
            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Failed to fetch from All Research API');
            }

            setSurveys(data.data || []);
            setLastSynced(new Date().toLocaleTimeString());
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsFetching(false);
        }
    };

    const handleGenerateLink = (surveyId: string) => {
        setSelectedSurveyId(surveyId);
        setTimeout(() => {
            linkGeneratorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <LoaderOverlay isLoading={isFetching} message="Syncing surveys from All Research API..." />

            <main className="max-w-[1700px] mx-auto px-4 py-6 space-y-5">

                {/* Page Header Card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            {/* All Research Logo placeholder */}
                            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                AR
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">All Research</h1>
                                <p className="text-xs text-gray-500">
                                    Supplier API Integration
                                    {lastSynced && (
                                        <span className="ml-2 text-emerald-600">• Last synced: {lastSynced}</span>
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Callback Info Button */}
                            <button
                                onClick={() => setShowCallbackInfo(!showCallbackInfo)}
                                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <Info className="w-4 h-4" />
                                Callback URLs
                            </button>

                            {/* Fetch Surveys Button */}
                            <button
                                onClick={handleFetchFromAPI}
                                disabled={isFetching}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            >
                                <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                                Fetch Surveys
                            </button>
                        </div>
                    </div>

                    {/* Callback URL Info Panel */}
                    {showCallbackInfo && (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                            <p className="font-semibold text-blue-900 mb-3">
                                📌 Share these callback URLs with All Research:
                            </p>
                            <div className="space-y-2">
                                {[
                                    { label: 'Complete (status=1)', url: '/api/all-research/callback?status=1&uid=[identifier]', color: 'text-green-700' },
                                    { label: 'Terminate (status=2)', url: '/api/all-research/callback?status=2&uid=[identifier]', color: 'text-orange-700' },
                                    { label: 'Quota Full (status=3)', url: '/api/all-research/callback?status=3&uid=[identifier]', color: 'text-red-700' },
                                    { label: 'Security Term (status=4)', url: '/api/all-research/callback?status=4&uid=[identifier]', color: 'text-rose-700' },
                                ].map(({ label, url, color }) => (
                                    <div key={label} className="flex items-center gap-3">
                                        <span className={`text-xs font-semibold w-36 shrink-0 ${color}`}>{label}:</span>
                                        <code className="text-xs bg-white border border-blue-200 px-2 py-1 rounded text-gray-800 flex-1 break-all">
                                            https://panel.inexraresearch.com{url}
                                        </code>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(`https://panel.inexraresearch.com${url}`)}
                                            className="text-xs text-blue-600 hover:underline shrink-0"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <p className="mt-3 text-xs text-blue-700">
                                ℹ️ The <code className="bg-blue-100 px-1 rounded">[identifier]</code> will be automatically replaced by All Research with the respondent UID you provided.
                            </p>
                        </div>
                    )}
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-start gap-2">
                        <span className="text-lg">⚠️</span>
                        <div>
                            <p className="font-semibold">Error fetching surveys</p>
                            <p className="mt-0.5 text-red-600">{error}</p>
                        </div>
                    </div>
                )}

                {/* Survey Count Bar */}
                {surveys.length > 0 && (
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>
                            Showing{' '}
                            <span className="font-semibold text-gray-900">
                                {filteredCount !== null ? filteredCount : surveys.length}
                            </span>
                            {filteredCount !== null && filteredCount !== surveys.length && (
                                <span className="text-gray-400 font-normal"> of {surveys.length}</span>
                            )}{' '}
                            surveys
                        </span>
                        <span className="text-gray-300">|</span>
                        <span>
                            Live:{' '}
                            <span className="font-semibold text-green-600">
                                {surveys.filter((s) => s.surveyStatus === 'Live').length}
                            </span>
                        </span>
                        <span>
                            Paused:{' '}
                            <span className="font-semibold text-yellow-600">
                                {surveys.filter((s) => s.surveyStatus === 'Paused').length}
                            </span>
                        </span>
                    </div>
                )}

                {/* Survey Table Card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-gray-700">Live Projects from All Research</h2>
                        <span className="text-xs text-gray-400">
                            {filteredCount !== null && filteredCount !== surveys.length
                                ? `${filteredCount} of ${surveys.length} projects`
                                : `${surveys.length} projects`}
                        </span>
                    </div>
                    <AllResearchSurveyTable
                        surveys={surveys}
                        isLoading={isLoading}
                        onGenerateLink={handleGenerateLink}
                        onFilteredCountChange={setFilteredCount}
                    />
                </div>

                {/* Link Generator Card */}
                <div ref={linkGeneratorRef}>
                    <AllResearchLinkGenerator selectedSurveyId={selectedSurveyId} />
                </div>

            </main>
        </div>
    );
}
