'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Image from 'next/image';

// Status configuration mapping
const STATUS_CONFIG: Record<string, { title: string; message: string; color: string; bgGradient: string }> = {
    complete: {
        title: 'PROJECT COMPLETE',
        message: 'Project complete',
        color: '#22c55e',
        bgGradient: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)',
    },
    terminate: {
        title: 'PROJECT DISQUALIFY',
        message: 'Project disqualify',
        color: '#ef4444',
        bgGradient: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 50%, #fca5a5 100%)',
    },
    disqualify: {
        title: 'PROJECT DISQUALIFY',
        message: 'Project disqualify',
        color: '#ef4444',
        bgGradient: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 50%, #fca5a5 100%)',
    },
    quota_full: {
        title: 'QUOTA FULL',
        message: 'Quota full',
        color: '#f97316',
        bgGradient: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 50%, #fdba74 100%)',
    },
    security_terminate: {
        title: 'SECURITY TERMINATION',
        message: 'Security termination',
        color: '#8b5cf6',
        bgGradient: 'linear-gradient(135deg, #f5f3ff 0%, #ddd6fe 50%, #c4b5fd 100%)',
    },
};

function RedirectContent() {
    const searchParams = useSearchParams();
    const status = searchParams.get('status') || 'unknown';
    const uid = searchParams.get('uid') || 'N/A';
    const sid = searchParams.get('sid') || 'N/A';

    const config = STATUS_CONFIG[status] || {
        title: 'UNKNOWN STATUS',
        message: 'Unknown',
        color: '#6b7280',
        bgGradient: 'linear-gradient(135deg, #f9fafb 0%, #e5e7eb 50%, #d1d5db 100%)',
    };

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
                maxWidth: '700px',
                width: '100%',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'row' as const,
                minHeight: '380px',
            }}>
                {/* Left: Branding */}
                <div style={{
                    background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
                    display: 'flex',
                    flexDirection: 'column' as const,
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '40px 30px',
                    minWidth: '250px',
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
                        textAlign: 'center' as const,
                    }}>INEXRA RESEARCH</h1>
                    <p style={{
                        color: '#94a3b8',
                        fontSize: '12px',
                        margin: 0,
                        textAlign: 'center' as const,
                        fontStyle: 'italic',
                    }}>!!Research Made Simple!!</p>
                </div>

                {/* Right: Status Info */}
                <div style={{
                    flex: 1,
                    padding: '40px 30px',
                    display: 'flex',
                    flexDirection: 'column' as const,
                    justifyContent: 'center',
                }}>
                    <h2 style={{
                        fontSize: '24px',
                        fontWeight: 700,
                        color: config.color,
                        marginBottom: '24px',
                        textAlign: 'center' as const,
                        letterSpacing: '1px',
                    }}>{config.title}</h2>

                    <table style={{
                        width: '100%',
                        borderCollapse: 'collapse' as const,
                        border: `2px solid ${config.color}40`,
                        borderRadius: '8px',
                        overflow: 'hidden',
                    }}>
                        <tbody>
                            <tr style={{ borderBottom: `1px solid ${config.color}30` }}>
                                <td style={{
                                    padding: '14px 16px',
                                    fontWeight: 600,
                                    color: '#374151',
                                    fontSize: '14px',
                                    borderRight: `1px solid ${config.color}30`,
                                    width: '40%',
                                }}>Message</td>
                                <td style={{
                                    padding: '14px 16px',
                                    color: '#1f2937',
                                    fontSize: '14px',
                                }}>{config.message}</td>
                            </tr>
                            <tr style={{ borderBottom: `1px solid ${config.color}30` }}>
                                <td style={{
                                    padding: '14px 16px',
                                    fontWeight: 600,
                                    color: '#374151',
                                    fontSize: '14px',
                                    borderRight: `1px solid ${config.color}30`,
                                }}>Project ID</td>
                                <td style={{
                                    padding: '14px 16px',
                                    color: '#1f2937',
                                    fontSize: '14px',
                                }}>{sid}</td>
                            </tr>
                            <tr style={{ borderBottom: `1px solid ${config.color}30` }}>
                                <td style={{
                                    padding: '14px 16px',
                                    fontWeight: 600,
                                    color: '#374151',
                                    fontSize: '14px',
                                    borderRight: `1px solid ${config.color}30`,
                                }}>UID</td>
                                <td style={{
                                    padding: '14px 16px',
                                    color: '#1f2937',
                                    fontSize: '14px',
                                    wordBreak: 'break-all' as const,
                                }}>{uid}</td>
                            </tr>
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
                Loading...
            </div>
        }>
            <RedirectContent />
        </Suspense>
    );
}
