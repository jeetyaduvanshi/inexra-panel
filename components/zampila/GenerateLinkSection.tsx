'use client';

import React, { useState, useEffect } from 'react';

interface GenerateLinkSectionProps {
    selectedSurveyId: string | null;
    selectedIpAddress?: string | null;
}

export function GenerateLinkSection({ selectedSurveyId, selectedIpAddress }: GenerateLinkSectionProps) {
    const [surveyId, setSurveyId] = useState('');
    const [uid, setUid] = useState('');
    const [ipAddress, setIpAddress] = useState('');
    const [generatedUrl, setGeneratedUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isDetectingIp, setIsDetectingIp] = useState(false);

    // Auto-detect user's IP on mount
    useEffect(() => {
        const detectIp = async () => {
            if (!selectedIpAddress) {
                setIsDetectingIp(true);
                try {
                    const res = await fetch('https://api.ipify.org?format=json');
                    const data = await res.json();
                    setIpAddress(data.ip);
                } catch {
                    // Fallback to placeholder
                    setIpAddress('Auto-detected');
                } finally {
                    setIsDetectingIp(false);
                }
            }
        };
        detectIp();
    }, [selectedIpAddress]);

    // Update when a row is selected
    useEffect(() => {
        if (selectedSurveyId) {
            setSurveyId(selectedSurveyId);
            setGeneratedUrl('');
            setError('');
        }
    }, [selectedSurveyId]);

    // Update IP when provided from selected row
    useEffect(() => {
        if (selectedIpAddress) {
            setIpAddress(selectedIpAddress);
        }
    }, [selectedIpAddress]);

    const handleGenerate = async () => {
        if (!surveyId || !uid) {
            setError('Survey ID and Transaction ID are required');
            return;
        }

        setError('');
        setIsLoading(true);
        setGeneratedUrl('');

        try {
            const response = await fetch('/api/zampila/generate-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ surveyId, uid, ipAddress: ipAddress || 'unknown' }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to generate link');
            }

            setGeneratedUrl(data.data.url);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedUrl);
    };

    return (
        <div className="bg-white rounded-lg border-2 border-red-400 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Generate Surveys Link</h2>
                <button className="p-1 hover:bg-gray-100 rounded">
                    <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                        <circle cx="10" cy="4" r="1.5" />
                        <circle cx="10" cy="10" r="1.5" />
                        <circle cx="10" cy="16" r="1.5" />
                    </svg>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Survey ID - Auto-filled, Read-only style */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Survey ID
                    </label>
                    <input
                        type="text"
                        value={surveyId}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed"
                        placeholder="Click 'Generate Link' on a table row"
                    />
                    <p className="mt-1 text-xs text-gray-500">Auto-filled from selected survey</p>
                </div>

                {/* Transaction ID (UID) - User Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Transaction ID (UID) <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={uid}
                        onChange={(e) => setUid(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-inexra-teal focus:border-transparent"
                        placeholder="Enter your custom identifier"
                    />
                    <p className="mt-1 text-xs text-gray-500">Your custom string to track respondent</p>
                </div>

                {/* IP Address - Auto-detected, Read-only */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        IP Address
                    </label>
                    <input
                        type="text"
                        value={isDetectingIp ? 'Detecting...' : ipAddress}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-gray-500">Auto-detected from user's network</p>
                </div>

                {/* Generate Button */}
                <div className="flex items-end">
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || !surveyId}
                        className="px-6 py-2 bg-inexra-teal text-white font-medium rounded-md hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Generating...' : 'Generate Now'}
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                    {error}
                </div>
            )}

            {/* Generated URL */}
            {generatedUrl && (
                <div className="mt-6 p-4 bg-green-50 rounded-md">
                    <label className="block text-sm font-medium text-green-800 mb-2">
                        Generated Tracking URL:
                    </label>
                    <div className="flex items-center gap-2">
                        <code className="flex-1 p-2 bg-white rounded border text-sm break-all">
                            {generatedUrl}
                        </code>
                        <button
                            onClick={copyToClipboard}
                            className="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                        >
                            Copy
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
