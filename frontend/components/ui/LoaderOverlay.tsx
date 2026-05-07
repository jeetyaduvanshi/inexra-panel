'use client';

import React from 'react';

interface LoaderOverlayProps {
    isLoading: boolean;
    message?: string;
}

export function LoaderOverlay({ isLoading, message = 'Loading...' }: LoaderOverlayProps) {
    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 flex flex-col items-center gap-4">
                <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-inexra-navy/20 border-t-inexra-teal animate-spin"></div>
                </div>
                <p className="text-gray-700 font-medium">{message}</p>
            </div>
        </div>
    );
}
