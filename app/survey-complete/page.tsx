'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function SurveyCompleteRedirect() {
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (!params.has('recorded')) {
            params.set('recorded', '1');
        }
        router.replace(`/client-redirect-url?${params.toString()}`);
    }, [searchParams, router]);

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#1b459c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontFamily: "'Times New Roman', Times, Georgia, serif",
        }}>
            Redirecting...
        </div>
    );
}

export default function SurveyCompletePage() {
    return (
        <Suspense fallback={null}>
            <SurveyCompleteRedirect />
        </Suspense>
    );
}
