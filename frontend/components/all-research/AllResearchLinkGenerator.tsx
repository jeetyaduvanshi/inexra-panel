'use client';

import React, { useState, useEffect } from 'react';
import { Copy, CheckCheck, ExternalLink } from 'lucide-react';

interface Props {
    selectedSurveyId: string | null;
}

export function AllResearchLinkGenerator({ selectedSurveyId }: Props) {
    const [surveyId, setSurveyId] = useState('');
    const [uid, setUid] = useState('');
    const [generatedUrl, setGeneratedUrl] = useState('');
    const [txid, setTxid] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    // When a row is clicked in the table, auto-fill Survey ID
    useEffect(() => {
        if (selectedSurveyId) {
            setSurveyId(selectedSurveyId);
            setGeneratedUrl('');
            setTxid('');
            setError('');
        }
    }, [selectedSurveyId]);

    const handleGenerate = async () => {
        if (!surveyId.trim()) {
            setError('Please select a survey from the table first.');
            return;
        }
        if (!uid.trim()) {
            setError('Respondent UID is required.');
            return;
        }

        setError('');
        setIsLoading(true);
        setGeneratedUrl('');
        setTxid('');

        try {
            const response = await fetch('/api/all-research/generate-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ surveyId: surveyId.trim(), uid: uid.trim() }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to generate link');
            }

            setGeneratedUrl(data.data.url);
            setTxid(data.data.txid);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        if (!generatedUrl) return;
        navigator.clipboard.writeText(generatedUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const handleReset = () => {
        setSurveyId('');
        setUid('');
        setGeneratedUrl('');
        setTxid('');
        setError('');
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Generate Respondent Link</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Creates a clean tracking URL for All Research surveys
                    </p>
                </div>
                {(generatedUrl || surveyId) && (
                    <button
                        onClick={handleReset}
                        className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        Reset
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Survey ID — auto-filled, read only */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Survey ID
                    </label>
                    <input
                        type="text"
                        value={surveyId}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 text-sm cursor-not-allowed"
                        placeholder="Click 'Generate Link' on a table row"
                    />
                    <p className="mt-1 text-xs text-gray-400">Auto-filled from table</p>
                </div>

                {/* Respondent UID */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Respondent UID <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={uid}
                        onChange={(e) => setUid(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="e.g. PANELIST_12345"
                    />
                    <p className="mt-1 text-xs text-gray-400">Your unique respondent identifier</p>
                </div>

                {/* Generate Button */}
                <div className="flex items-end">
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || !surveyId}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                Generating...
                            </span>
                        ) : (
                            'Generate Now'
                        )}
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                    ⚠️ {error}
                </div>
            )}

            {/* Success — Generated URL */}
            {generatedUrl && (
                <div className="mt-5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-emerald-800">
                            ✅ Respondent Tracking URL Generated
                        </span>
                        <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full font-mono">
                            Clean Direct Link
                        </span>
                    </div>

                    {/* TXID */}
                    <div className="mb-2 flex items-center gap-2">
                        <span className="text-xs text-gray-500">Transaction ID:</span>
                        <code className="text-xs font-mono text-gray-700 bg-white px-2 py-0.5 rounded border">{txid}</code>
                    </div>

                    {/* URL display */}
                    <div className="flex items-start gap-2">
                        <code className="flex-1 text-xs break-all bg-white p-3 rounded-lg border border-emerald-200 text-gray-800 leading-relaxed">
                            {generatedUrl}
                        </code>
                        <div className="flex flex-col gap-2 shrink-0">
                            <button
                                onClick={handleCopy}
                                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                                    copied
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                                }`}
                            >
                                {copied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                            <a
                                href={generatedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                Test
                            </a>
                        </div>
                    </div>

                    <p className="mt-2 text-xs text-emerald-700">
                        Share this clean tracking URL with your respondent. It embeds your unique transaction identifier (<code className="bg-emerald-100 px-1 rounded">uid</code>) directly.
                    </p>
                </div>
            )}
        </div>
    );
}
