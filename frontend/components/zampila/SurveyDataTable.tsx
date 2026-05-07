'use client';

import React from 'react';

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

interface SurveyDataTableProps {
    surveys: Survey[];
    onGenerateLink: (surveyId: string) => void;
    isLoading?: boolean;
}

export function SurveyDataTable({ surveys, onGenerateLink, isLoading }: SurveyDataTableProps) {
    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return date.toISOString().slice(0, -5).replace('T', '\n') + 'Z';
        } catch {
            return dateString;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-inexra-teal"></div>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-gray-50 text-gray-600 uppercase text-xs">
                        <th className="px-3 py-3 text-left font-semibold">LINK</th>
                        <th className="px-3 py-3 text-left font-semibold">SURVEY ID</th>
                        <th className="px-3 py-3 text-left font-semibold">TCR</th>
                        <th className="px-3 py-3 text-left font-semibold">CPI</th>
                        <th className="px-3 py-3 text-left font-semibold">LOI</th>
                        <th className="px-3 py-3 text-left font-semibold">IR</th>
                        <th className="px-3 py-3 text-left font-semibold">LANGUAGE</th>
                        <th className="px-3 py-3 text-left font-semibold">UPDATE TIME</th>
                        <th className="px-3 py-3 text-left font-semibold">SURVEY END DATE</th>
                        <th className="px-3 py-3 text-left font-semibold">DEVICE</th>
                        <th className="px-3 py-3 text-left font-semibold">INDUSTRY ID</th>
                        <th className="px-3 py-3 text-left font-semibold">TYPES</th>
                        <th className="px-3 py-3 text-left font-semibold">CREATED AT</th>
                        <th className="px-3 py-3 text-left font-semibold">CONVERSION</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {surveys.length === 0 ? (
                        <tr>
                            <td colSpan={14} className="px-3 py-8 text-center text-gray-500">
                                No survey data available. Click "Fetch Data" to load surveys.
                            </td>
                        </tr>
                    ) : (
                        surveys.map((survey) => (
                            <tr key={survey._id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-3 py-3">
                                    <button
                                        onClick={() => onGenerateLink(survey.surveyId)}
                                        className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors whitespace-nowrap"
                                    >
                                        Generate<br />Link
                                    </button>
                                </td>
                                <td className="px-3 py-3 font-mono text-gray-900">{survey.surveyId}</td>
                                <td className="px-3 py-3 text-gray-700">{survey.tcr}</td>
                                <td className="px-3 py-3 text-gray-700">{survey.cpi}</td>
                                <td className="px-3 py-3 text-gray-700">{survey.loi}</td>
                                <td className="px-3 py-3 text-gray-700">{survey.ir}</td>
                                <td className="px-3 py-3 text-gray-700">{survey.language}</td>
                                <td className="px-3 py-3 text-gray-600 text-xs whitespace-pre-line">
                                    {formatDate(survey.updateTime)}
                                </td>
                                <td className="px-3 py-3 text-gray-600 text-xs whitespace-pre-line">
                                    {formatDate(survey.surveyEndDate)}
                                </td>
                                <td className="px-3 py-3 text-gray-700">{survey.device}</td>
                                <td className="px-3 py-3 text-gray-700">{survey.industryId}</td>
                                <td className="px-3 py-3 text-gray-700">{survey.types}</td>
                                <td className="px-3 py-3 text-gray-600 text-xs whitespace-pre-line">
                                    {formatDate(survey.createdAt)}
                                </td>
                                <td className="px-3 py-3 text-gray-700">{survey.conversion || 0}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
