'use client';

import React from 'react';

export interface AllResearchSurvey {
    _id: string;
    surveyId: string;
    surveyCode: string;
    surveyName: string;
    surveyCountry: string;
    surveyLanguage: string;
    surveyCategory: string;
    surveyCurrency: string;
    audienceType: string;
    incidenceRate: number;
    lengthOfInterview: number;
    costPerInterview: number;
    completeNeeded: number;
    liveClickQuota: number;
    surveyStartDate: string;
    surveyEndDate: string;
    entryLiveUrl: string;
    deviceType: string;
    surveyStatus: string;
    hits: number;
    completes: number;
    terminates: number;
    quotaFull: number;
    createdAt: string;
}

interface Props {
    surveys: AllResearchSurvey[];
    isLoading: boolean;
    onGenerateLink: (surveyId: string) => void;
}

function StatusBadge({ status }: { status: string }) {
    const colors: Record<string, string> = {
        Live: 'bg-green-100 text-green-700 border border-green-200',
        Paused: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
        Closed: 'bg-red-100 text-red-700 border border-red-200',
        Completed: 'bg-gray-100 text-gray-600 border border-gray-200',
    };
    const cls = colors[status] || 'bg-blue-100 text-blue-700 border border-blue-200';
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
            {status}
        </span>
    );
}

export function AllResearchSurveyTable({ surveys, isLoading, onGenerateLink }: Props) {
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-blue-600" />
                <p className="text-sm text-gray-500">Loading surveys...</p>
            </div>
        );
    }

    if (surveys.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl">📋</div>
                <p className="text-gray-500 font-medium">No surveys found</p>
                <p className="text-sm text-gray-400">Click &quot;Fetch Surveys&quot; to load live projects from All Research</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Survey ID</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Country</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Language</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">IR%</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">LOI</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">CPI</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Quota</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Device</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">End Date</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Hits</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Completes</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {surveys.map((survey) => (
                        <tr key={survey._id} className="hover:bg-blue-50/40 transition-colors">
                            <td className="px-3 py-3">
                                <button
                                    onClick={() => onGenerateLink(survey.surveyId)}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md transition-colors whitespace-nowrap shadow-sm"
                                >
                                    Generate Link
                                </button>
                            </td>
                            <td className="px-3 py-3 font-mono text-xs text-gray-800 font-medium">
                                {survey.surveyId}
                            </td>
                            <td className="px-3 py-3 text-gray-800 max-w-[180px]">
                                <p className="truncate" title={survey.surveyName}>{survey.surveyName || '—'}</p>
                            </td>
                            <td className="px-3 py-3 text-gray-600">{survey.surveyCountry || '—'}</td>
                            <td className="px-3 py-3 text-gray-600">{survey.surveyLanguage || '—'}</td>
                            <td className="px-3 py-3 text-gray-700 font-medium">{survey.incidenceRate}%</td>
                            <td className="px-3 py-3 text-gray-700">{survey.lengthOfInterview} min</td>
                            <td className="px-3 py-3 text-green-700 font-semibold">
                                {survey.surveyCurrency} {Number(survey.costPerInterview).toFixed(2)}
                            </td>
                            <td className="px-3 py-3 text-gray-700">{survey.completeNeeded}</td>
                            <td className="px-3 py-3 text-gray-600 text-xs">{survey.deviceType}</td>
                            <td className="px-3 py-3">
                                <StatusBadge status={survey.surveyStatus} />
                            </td>
                            <td className="px-3 py-3 text-gray-600 text-xs">{survey.surveyEndDate || '—'}</td>
                            <td className="px-3 py-3 text-gray-700">{survey.hits}</td>
                            <td className="px-3 py-3 text-emerald-700 font-semibold">{survey.completes}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
