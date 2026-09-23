'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const STATUS_CONFIG = {
    complete: {
        emoji: '🎉',
        title: 'Survey Completed!',
        message: 'Thank you for completing the survey. Your response has been recorded successfully.',
        color: 'from-emerald-500 to-green-600',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
        textColor: 'text-emerald-800',
        badgeColor: 'bg-emerald-100 text-emerald-700',
    },
    disqualified: {
        emoji: '😕',
        title: 'Not Qualified',
        message: 'Unfortunately, you do not qualify for this survey. Thank you for your time.',
        color: 'from-orange-400 to-amber-500',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        textColor: 'text-orange-800',
        badgeColor: 'bg-orange-100 text-orange-700',
    },
    quota_full: {
        emoji: '🔴',
        title: 'Quota Full',
        message: 'This survey has reached its target responses. Thank you for your interest.',
        color: 'from-red-400 to-rose-500',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        badgeColor: 'bg-red-100 text-red-700',
    },
    security: {
        emoji: '🛡️',
        title: 'Security Terminate',
        message: 'Your response could not be verified or was terminated due to security checks.',
        color: 'from-red-600 to-rose-700',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        badgeColor: 'bg-red-100 text-red-700',
    },
    error: {
        emoji: '⚠️',
        title: 'Something Went Wrong',
        message: 'We encountered an issue processing your response. Please contact support if this persists.',
        color: 'from-gray-400 to-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        textColor: 'text-gray-800',
        badgeColor: 'bg-gray-100 text-gray-600',
    },
};

function SurveyCompleteContent() {
    const searchParams = useSearchParams();
    const status = (searchParams.get('status') || 'error') as keyof typeof STATUS_CONFIG;

    const config = STATUS_CONFIG[status] || STATUS_CONFIG['error'];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Top gradient bar */}
                    <div className={`h-2 w-full bg-gradient-to-r ${config.color}`} />

                    <div className="p-8 text-center">
                        {/* Emoji */}
                        <div className="text-6xl mb-4">{config.emoji}</div>

                        {/* Status Badge */}
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide mb-4 ${config.badgeColor}`}>
                            {status.replace('_', ' ')}
                        </span>

                        {/* Title */}
                        <h1 className="text-2xl font-bold text-gray-900 mb-3">
                            {config.title}
                        </h1>

                        {/* Message */}
                        <div className={`p-4 rounded-xl border ${config.bgColor} ${config.borderColor} mb-6`}>
                            <p className={`text-sm leading-relaxed ${config.textColor}`}>
                                {config.message}
                            </p>
                        </div>

                        {/* Footer */}
                        <p className="text-xs text-gray-400">
                            Powered by <span className="font-semibold text-gray-500">INEXRA Research</span>
                        </p>
                    </div>
                </div>

                {/* Bottom text */}
                <p className="text-center text-xs text-gray-400 mt-4">
                    You may now close this window.
                </p>
            </div>
        </div>
    );
}

export default function SurveyCompletePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
        }>
            <SurveyCompleteContent />
        </Suspense>
    );
}
