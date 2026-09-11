'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, useRef } from 'react';
import Image from 'next/image';

// ─── Status Visual Configurations ──────────────────────────────────────────

const STATUS_CONFIG: Record<string, { title: string; message: string; color: string; bgGradient: string }> = {
    complete: {
        title: 'PROJECT COMPLETE',
        message: 'Project completed successfully',
        color: '#22c55e',
        bgGradient: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)',
    },
    terminate: {
        title: 'PROJECT DISQUALIFY',
        message: 'Survey terminated / disqualified',
        color: '#ef4444',
        bgGradient: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 50%, #fca5a5 100%)',
    },
    disqualify: {
        title: 'PROJECT DISQUALIFY',
        message: 'Survey terminated / disqualified',
        color: '#ef4444',
        bgGradient: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 50%, #fca5a5 100%)',
    },
    disqualified: {
        title: 'PROJECT DISQUALIFY',
        message: 'Survey terminated / disqualified',
        color: '#ef4444',
        bgGradient: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 50%, #fca5a5 100%)',
    },
    quota_full: {
        title: 'QUOTA FULL',
        message: 'Survey quota is full',
        color: '#f97316',
        bgGradient: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 50%, #fdba74 100%)',
    },
    quotafull: {
        title: 'QUOTA FULL',
        message: 'Survey quota is full',
        color: '#f97316',
        bgGradient: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 50%, #fdba74 100%)',
    },
    security_terminate: {
        title: 'SECURITY TERMINATION',
        message: 'Security / fraud check termination',
        color: '#8b5cf6',
        bgGradient: 'linear-gradient(135deg, #f5f3ff 0%, #ddd6fe 50%, #c4b5fd 100%)',
    },
    security: {
        title: 'SECURITY TERMINATION',
        message: 'Security / fraud check termination',
        color: '#8b5cf6',
        bgGradient: 'linear-gradient(135deg, #f5f3ff 0%, #ddd6fe 50%, #c4b5fd 100%)',
    },
};

function RedirectContent() {
    const searchParams = useSearchParams();

    const statusParam = (searchParams.get('status') || '').trim();
    const uid = (searchParams.get('uid') || searchParams.get('respondentUid') || '').trim();
    const sid = (searchParams.get('sid') || searchParams.get('pid') || searchParams.get('projectId') || '').trim();
    const sessionId = (searchParams.get('sessionId') || searchParams.get('txid') || '').trim();
    const recorded = searchParams.get('recorded') === '1';

    const normalizedKey = statusParam.toLowerCase();
    const config = STATUS_CONFIG[normalizedKey] || {
        title: statusParam ? statusParam.toUpperCase().replace(/_/g, ' ') : 'UNKNOWN STATUS',
        message: statusParam ? statusParam.replace(/_/g, ' ') : 'Unknown outcome',
        color: '#6b7280',
        bgGradient: 'linear-gradient(135deg, #f9fafb 0%, #e5e7eb 50%, #d1d5db 100%)',
    };

    // Processing states
    const [isProcessing, setIsProcessing] = useState(true);
    const [isVerified, setIsVerified] = useState(false);
    const [isDuplicate, setIsDuplicate] = useState(false);
    const [verificationMessage, setVerificationMessage] = useState<string>('Recording survey completion...');

    const hasExecutedRef = useRef(false);

    // Call callback API once on mount to persist session status
    useEffect(() => {
        if (hasExecutedRef.current) return;
        hasExecutedRef.current = true;

        if (recorded) {
            setIsProcessing(false);
            setIsVerified(true);
            setVerificationMessage('Survey outcome successfully recorded.');
            return;
        }

        if (!statusParam || (!uid && !sessionId)) {
            setIsProcessing(false);
            setVerificationMessage('Missing parameters for tracking verification.');
            return;
        }

        const runCallback = async () => {
            try {
                // 1. Call Primary Survey Callback API
                const url = new URL('/api/survey-callback', window.location.origin);
                url.searchParams.set('status', statusParam);
                if (uid) url.searchParams.set('uid', uid);
                if (sessionId) url.searchParams.set('sessionId', sessionId);
                if (sid) url.searchParams.set('pid', sid);

                const res = await fetch(url.toString(), { method: 'GET' });
                const data = await res.json();

                if (res.ok && data.success) {
                    setIsVerified(true);
                    setIsDuplicate(Boolean(data.duplicate));
                    setVerificationMessage(
                        data.duplicate
                            ? 'Submission previously recorded.'
                            : 'Survey outcome successfully verified and recorded.'
                    );

                } else if (data.notFound) {
                    // 2. Fallback to legacy Zamplia callback if session not found
                    console.log('[CALLBACK-PAGE] Session not found in primary store, attempting Zamplia legacy fallback...');
                    const zampliaRes = await fetch(
                        `/api/zamplia/callback?status=${encodeURIComponent(statusParam)}&uid=${encodeURIComponent(uid)}`
                    );
                    const zampliaData = await zampliaRes.json();

                    if (zampliaRes.ok && zampliaData.success) {
                        setIsVerified(true);
                        setIsDuplicate(Boolean(zampliaData.duplicate));
                        setVerificationMessage('Outcome recorded via legacy channel.');
                    } else {
                        setVerificationMessage('Note: Session ID or Respondent record not found in database.');
                    }
                } else {
                    setVerificationMessage(data.error || 'Status verification failed.');
                }
            } catch (err) {
                console.error('[CALLBACK-PAGE] Verification error:', err);
                setVerificationMessage('Recorded offline. Network error during confirmation.');
            } finally {
                setIsProcessing(false);
            }
        };

        runCallback();
    }, [recorded, statusParam, uid, sid, sessionId]);

    return (
        <div style={{
            minHeight: '100vh',
            background: config.bgGradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            padding: '20px',
        }}>
            <div style={{
                background: '#ffffff',
                borderRadius: '16px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1), 0 4px 20px rgba(0, 0, 0, 0.05)',
                maxWidth: '750px',
                width: '100%',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'row',
                minHeight: '400px',
            }}>
                {/* Left: Branding */}
                <div style={{
                    background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '40px 30px',
                    minWidth: '260px',
                    gap: '16px',
                }}>
                    <Image
                        src="/inexra-logo.jpg"
                        alt="Inexra Research"
                        width={120}
                        height={120}
                        style={{
                            borderRadius: '12px',
                            objectFit: 'contain',
                        }}
                    />
                    <h1 style={{
                        color: '#ffffff',
                        fontSize: '22px',
                        fontWeight: 800,
                        letterSpacing: '1px',
                        margin: 0,
                        textAlign: 'center',
                    }}>INEXRA RESEARCH</h1>
                    <p style={{
                        color: '#94a3b8',
                        fontSize: '12px',
                        margin: 0,
                        textAlign: 'center',
                        fontStyle: 'italic',
                    }}>!!Research Made Simple!!</p>
                </div>

                {/* Right: Status Info */}
                <div style={{
                    flex: 1,
                    padding: '40px 32px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                }}>
                    {/* Status Badge & Header */}
                    <h2 style={{
                        fontSize: '24px',
                        fontWeight: 700,
                        color: config.color,
                        marginBottom: '8px',
                        textAlign: 'center',
                        letterSpacing: '1px',
                    }}>{config.title}</h2>

                    {/* Verification Indicator */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        marginBottom: '20px',
                        fontSize: '12px',
                        color: isProcessing ? '#6b7280' : isVerified ? '#16a34a' : '#d97706',
                    }}>
                        {isProcessing ? (
                            <span>⏳ Verifying completion with system...</span>
                        ) : isVerified ? (
                            <span>{isDuplicate ? 'ℹ️ ' : '✅ '}{verificationMessage}</span>
                        ) : (
                            <span>{verificationMessage}</span>
                        )}
                    </div>

                    {/* Meta Table */}
                    <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        border: `2px solid ${config.color}40`,
                        borderRadius: '8px',
                        overflow: 'hidden',
                        marginBottom: '0',
                    }}>
                        <tbody>
                            <tr style={{ borderBottom: `1px solid ${config.color}30` }}>
                                <td style={{
                                    padding: '12px 16px',
                                    fontWeight: 600,
                                    color: '#374151',
                                    fontSize: '13px',
                                    borderRight: `1px solid ${config.color}30`,
                                    width: '38%',
                                }}>Outcome</td>
                                <td style={{
                                    padding: '12px 16px',
                                    color: '#1f2937',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                }}>{config.message}</td>
                            </tr>
                            {sid && (
                                <tr style={{ borderBottom: `1px solid ${config.color}30` }}>
                                    <td style={{
                                        padding: '12px 16px',
                                        fontWeight: 600,
                                        color: '#374151',
                                        fontSize: '13px',
                                        borderRight: `1px solid ${config.color}30`,
                                    }}>Project ID</td>
                                    <td style={{
                                        padding: '12px 16px',
                                        color: '#1f2937',
                                        fontSize: '13px',
                                    }}>{sid}</td>
                                </tr>
                            )}
                            {uid && (
                                <tr style={{ borderBottom: sessionId ? `1px solid ${config.color}30` : 'none' }}>
                                    <td style={{
                                        padding: '12px 16px',
                                        fontWeight: 600,
                                        color: '#374151',
                                        fontSize: '13px',
                                        borderRight: `1px solid ${config.color}30`,
                                    }}>Respondent UID</td>
                                    <td style={{
                                        padding: '12px 16px',
                                        color: '#1f2937',
                                        fontSize: '13px',
                                        wordBreak: 'break-all',
                                    }}>{uid}</td>
                                </tr>
                            )}
                            {sessionId && (
                                <tr>
                                    <td style={{
                                        padding: '12px 16px',
                                        fontWeight: 600,
                                        color: '#374151',
                                        fontSize: '13px',
                                        borderRight: `1px solid ${config.color}30`,
                                    }}>Session ID</td>
                                    <td style={{
                                        padding: '12px 16px',
                                        color: '#1f2937',
                                        fontSize: '13px',
                                        wordBreak: 'break-all',
                                    }}>{sessionId}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                </div>
            </div>
        </div>
    );
}

export default function ClientRedirectPage() {
    return (
        <Suspense fallback={
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'sans-serif',
                color: '#6b7280',
            }}>
                Loading redirect status...
            </div>
        }>
            <RedirectContent />
        </Suspense>
    );
}
