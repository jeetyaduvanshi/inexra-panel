'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, useRef } from 'react';

// ─── Status Visual Configurations ──────────────────────────────────────────

const STATUS_CONFIG: Record<string, { title: string; message: string }> = {
    complete: {
        title: 'PROJECT COMPLETE',
        message: 'Project complete',
    },
    terminate: {
        title: 'PROJECT DISQUALIFY',
        message: 'Project disqualified',
    },
    disqualify: {
        title: 'PROJECT DISQUALIFY',
        message: 'Project disqualified',
    },
    disqualified: {
        title: 'PROJECT DISQUALIFY',
        message: 'Project disqualified',
    },
    quota_full: {
        title: 'QUOTA FULL',
        message: 'Quota full',
    },
    quotafull: {
        title: 'QUOTA FULL',
        message: 'Quota full',
    },
    security_terminate: {
        title: 'SECURITY TERMINATE',
        message: 'Security terminate',
    },
    security: {
        title: 'SECURITY TERMINATE',
        message: 'Security terminate',
    },
};

function RedirectContent() {
    const searchParams = useSearchParams();

    const statusParam = (searchParams.get('status') || '').trim();
    const uid = (searchParams.get('uid') || searchParams.get('respondentUid') || '').trim();
    const sid = (searchParams.get('sid') || searchParams.get('pid') || searchParams.get('projectId') || '').trim();
    const sessionId = (searchParams.get('sessionId') || searchParams.get('txid') || '').trim();
    const recorded = searchParams.get('recorded') === '1';
    const ipParam = (searchParams.get('ip') || '').trim();

    const [ipAddress, setIpAddress] = useState<string>(ipParam);

    const normalizedKey = statusParam.toLowerCase();
    const config = STATUS_CONFIG[normalizedKey] || {
        title: statusParam ? statusParam.toUpperCase().replace(/_/g, ' ') : 'PROJECT COMPLETE',
        message: statusParam ? statusParam.replace(/_/g, ' ') : 'Project complete',
    };

    const hasExecutedRef = useRef(false);

    // Resolve IP address if not already present in searchParams
    useEffect(() => {
        if (!ipAddress || ipAddress === 'unknown') {
            fetch('/api/client-ip')
                .then((res) => res.json())
                .then((data) => {
                    if (data?.ip && data.ip !== 'unknown') {
                        setIpAddress(data.ip);
                    }
                })
                .catch(() => {});
        }
    }, [ipAddress]);

    // Background verification and session update if not already recorded
    useEffect(() => {
        if (hasExecutedRef.current) return;
        hasExecutedRef.current = true;

        if (recorded) return;
        if (!statusParam || (!uid && !sessionId)) return;

        const runCallback = async () => {
            try {
                const url = new URL('/api/survey-callback', window.location.origin);
                url.searchParams.set('status', statusParam);
                if (uid) url.searchParams.set('uid', uid);
                if (sessionId) url.searchParams.set('sessionId', sessionId);
                if (sid) url.searchParams.set('pid', sid);

                const res = await fetch(url.toString(), { method: 'GET' });
                const data = await res.json();

                if (res.ok && data.success) {
                    if (data.session?.ip && data.session.ip !== 'unknown') {
                        setIpAddress(data.session.ip);
                    }
                } else if (data.notFound) {
                    await fetch(
                        `/api/zamplia/callback?status=${encodeURIComponent(statusParam)}&uid=${encodeURIComponent(uid)}`
                    );
                }
            } catch (err) {
                console.error('[CALLBACK-PAGE] Verification error:', err);
            }
        };

        runCallback();
    }, [recorded, statusParam, uid, sid, sessionId]);

    return (
        <div style={{
            minHeight: '100vh',
            width: '100%',
            backgroundColor: '#1b459c',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 16px',
            fontFamily: "'Times New Roman', Times, Georgia, serif",
        }}>
            {/* Yellow bottom-left abstract decorative circle matching Six Sense Research design */}
            <div style={{
                position: 'absolute',
                bottom: '-120px',
                left: '-120px',
                width: '320px',
                height: '320px',
                borderRadius: '50%',
                backgroundColor: '#f1b324',
                pointerEvents: 'none',
            }} />

            {/* White Card Container */}
            <div style={{
                position: 'relative',
                zIndex: 10,
                backgroundColor: '#ffffff',
                width: '100%',
                maxWidth: '520px',
                padding: '44px 36px 40px',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
            }}>
                {/* Title */}
                <h1 style={{
                    fontSize: '25px',
                    fontWeight: 800,
                    color: '#1a1a2e',
                    letterSpacing: '1.2px',
                    textTransform: 'uppercase',
                    textAlign: 'center',
                    margin: '0 0 30px 0',
                    fontFamily: "'Times New Roman', Times, Georgia, serif",
                }}>
                    {config.title}
                </h1>

                {/* Golden Yellow Border Table Grid */}
                <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    border: '2px solid #eab308',
                    tableLayout: 'fixed',
                }}>
                    <tbody>
                        {/* Row 1: Message */}
                        <tr style={{ borderBottom: '1.5px solid #eab308' }}>
                            <td style={{
                                padding: '14px 16px',
                                fontWeight: 700,
                                color: '#1f2937',
                                fontSize: '15px',
                                textAlign: 'center',
                                borderRight: '1.5px solid #eab308',
                                width: '45%',
                                fontFamily: "'Times New Roman', Times, Georgia, serif",
                            }}>
                                Message
                            </td>
                            <td style={{
                                padding: '14px 16px',
                                fontWeight: 700,
                                color: '#1f2937',
                                fontSize: '15px',
                                textAlign: 'center',
                                width: '55%',
                                wordBreak: 'break-word',
                                fontFamily: "'Times New Roman', Times, Georgia, serif",
                            }}>
                                {config.message}
                            </td>
                        </tr>

                        {/* Row 2: Project ID */}
                        <tr style={{ borderBottom: '1.5px solid #eab308' }}>
                            <td style={{
                                padding: '14px 16px',
                                fontWeight: 700,
                                color: '#1f2937',
                                fontSize: '15px',
                                textAlign: 'center',
                                borderRight: '1.5px solid #eab308',
                                fontFamily: "'Times New Roman', Times, Georgia, serif",
                            }}>
                                Project ID
                            </td>
                            <td style={{
                                padding: '14px 16px',
                                fontWeight: 700,
                                color: '#1f2937',
                                fontSize: '15px',
                                textAlign: 'center',
                                wordBreak: 'break-all',
                                fontFamily: "'Times New Roman', Times, Georgia, serif",
                            }}>
                                {sid || 'VM'}
                            </td>
                        </tr>

                        {/* Row 3: UID */}
                        <tr style={{ borderBottom: '1.5px solid #eab308' }}>
                            <td style={{
                                padding: '14px 16px',
                                fontWeight: 700,
                                color: '#1f2937',
                                fontSize: '15px',
                                textAlign: 'center',
                                borderRight: '1.5px solid #eab308',
                                fontFamily: "'Times New Roman', Times, Georgia, serif",
                            }}>
                                UID
                            </td>
                            <td style={{
                                padding: '14px 16px',
                                fontWeight: 700,
                                color: '#1f2937',
                                fontSize: '15px',
                                textAlign: 'center',
                                wordBreak: 'break-all',
                                fontFamily: "'Times New Roman', Times, Georgia, serif",
                            }}>
                                {uid || 'fthhhAM'}
                            </td>
                        </tr>

                        {/* Row 4: IP Address */}
                        <tr>
                            <td style={{
                                padding: '14px 16px',
                                fontWeight: 700,
                                color: '#1f2937',
                                fontSize: '15px',
                                textAlign: 'center',
                                borderRight: '1.5px solid #eab308',
                                fontFamily: "'Times New Roman', Times, Georgia, serif",
                            }}>
                                IP Address
                            </td>
                            <td style={{
                                padding: '14px 16px',
                                fontWeight: 700,
                                color: '#1f2937',
                                fontSize: '15px',
                                textAlign: 'center',
                                wordBreak: 'break-all',
                                fontFamily: "'Times New Roman', Times, Georgia, serif",
                            }}>
                                {ipAddress || '181.117.184.3'}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default function ClientRedirectPage() {
    return (
        <Suspense fallback={
            <div style={{
                minHeight: '100vh',
                backgroundColor: '#1b459c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Times New Roman', Times, Georgia, serif",
                color: '#ffffff',
            }}>
                Loading redirect status...
            </div>
        }>
            <RedirectContent />
        </Suspense>
    );
}
