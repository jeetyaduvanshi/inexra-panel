'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw, Search, Check, Copy, CheckCircle2, XCircle, AlertCircle, Clock, DollarSign, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/frontend/components/ui/input';
import { Button } from '@/frontend/components/ui/button';
import { Badge } from '@/frontend/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/frontend/components/ui/select';

interface TelemetrySummary {
    totalSurveys: number;
    totalClicks: number;
    totalCompletes: number;
    totalTerminates: number;
    totalQuotaFull: number;
    totalRevenue: string;
    todayClicks: number;
    todayCompletes: number;
    todayTerminates: number;
    todayQuotaFull: number;
}

interface TelemetrySession {
    txid: string;
    uid: string;
    surveyId: string;
    surveyName: string;
    country: string;
    status: string;
    cpi: string;
    currency: string;
    loi: string;
    ip: string;
    startTime: string;
    endTime: string;
    date: string;
}

export function AllResearchTelemetry() {
    const [summary, setSummary] = useState<TelemetrySummary | null>(null);
    const [sessions, setSessions] = useState<TelemetrySession[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [copiedUid, setCopiedUid] = useState<string | null>(null);
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        fetchTelemetry();
    }, []);

    const fetchTelemetry = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/all-research/stats');
            const data = await res.json();
            if (data.success) {
                setSummary(data.summary);
                setSessions(data.sessions || []);
            }
        } catch (err) {
            console.error('Failed to load All Research telemetry:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedUid(text);
        setTimeout(() => setCopiedUid(null), 2000);
    };

    const filteredSessions = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return sessions.filter((s) => {
            if (q) {
                const matches =
                    s.uid.toLowerCase().includes(q) ||
                    s.surveyId.toLowerCase().includes(q) ||
                    s.surveyName.toLowerCase().includes(q) ||
                    s.country.toLowerCase().includes(q);
                if (!matches) return false;
            }
            if (statusFilter !== 'all') {
                if (s.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
            }
            return true;
        });
    }, [sessions, searchQuery, statusFilter]);

    const getStatusBadge = (status: string) => {
        const normalized = status.toLowerCase();
        if (normalized === 'complete') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Complete
                </span>
            );
        }
        if (normalized === 'disqualified' || normalized === 'terminate') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                    <XCircle className="w-3 h-3 text-red-600" /> Terminated
                </span>
            );
        }
        if (normalized === 'quota_full') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                    <AlertCircle className="w-3 h-3 text-amber-600" /> Quota Full
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                <Clock className="w-3 h-3 text-blue-500" /> {status}
            </span>
        );
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-white">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                        <Activity className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                            All Research Telemetry & Activity
                            <Badge variant="outline" className="text-[11px] font-normal border-blue-200 text-blue-700 bg-blue-50/60">
                                Dedicated Feed
                            </Badge>
                        </h2>
                        <p className="text-xs text-gray-500">
                            Live tracking, completions and respondent activity specifically for All Research partner surveys
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchTelemetry}
                        disabled={isLoading}
                        className="h-8 text-xs gap-1.5 border-gray-200 text-gray-700 hover:bg-gray-50"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="h-8 text-xs text-gray-500 hover:text-gray-700"
                    >
                        {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </Button>
                </div>
            </div>

            {!isCollapsed && (
                <div>
                    {/* Summary KPI Cards */}
                    {summary && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-4 bg-gray-50/60 border-b border-gray-100">
                            {/* Clicks */}
                            <div className="bg-white p-3.5 rounded-lg border border-gray-200/80 shadow-2xs">
                                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                    <span>Total Hits / Clicks</span>
                                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                                        +{summary.todayClicks} Today
                                    </span>
                                </div>
                                <p className="text-xl font-bold text-gray-900">{summary.totalClicks}</p>
                            </div>

                            {/* Completes */}
                            <div className="bg-white p-3.5 rounded-lg border border-gray-200/80 shadow-2xs">
                                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                    <span>Completes</span>
                                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                                        +{summary.todayCompletes} Today
                                    </span>
                                </div>
                                <p className="text-xl font-bold text-emerald-600">{summary.totalCompletes}</p>
                            </div>

                            {/* Terminates */}
                            <div className="bg-white p-3.5 rounded-lg border border-gray-200/80 shadow-2xs">
                                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                    <span>Terminates</span>
                                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-50 text-red-700">
                                        +{summary.todayTerminates} Today
                                    </span>
                                </div>
                                <p className="text-xl font-bold text-red-600">{summary.totalTerminates}</p>
                            </div>

                            {/* Quota Full */}
                            <div className="bg-white p-3.5 rounded-lg border border-gray-200/80 shadow-2xs">
                                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                    <span>Quota Full</span>
                                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">
                                        +{summary.todayQuotaFull} Today
                                    </span>
                                </div>
                                <p className="text-xl font-bold text-amber-600">{summary.totalQuotaFull}</p>
                            </div>

                            {/* Revenue */}
                            <div className="bg-white p-3.5 rounded-lg border border-gray-200/80 shadow-2xs">
                                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                    <span>Est. Revenue</span>
                                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                                </div>
                                <p className="text-xl font-bold text-gray-900">${summary.totalRevenue}</p>
                            </div>
                        </div>
                    )}

                    {/* Filter toolbar */}
                    <div className="px-6 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-white">
                        <div className="relative flex-1 min-w-[240px] max-w-sm">
                            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <Input
                                placeholder="Search by UID, Survey ID, Name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-8 pl-8 pr-3 text-xs bg-gray-50/70 border-gray-200 focus:bg-white"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="w-36">
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="h-8 text-xs bg-white border-gray-200">
                                        <SelectValue placeholder="All Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="complete">Complete</SelectItem>
                                        <SelectItem value="disqualified">Terminated</SelectItem>
                                        <SelectItem value="quota_full">Quota Full</SelectItem>
                                        <SelectItem value="clicked">Clicked / In Progress</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <span className="text-xs text-gray-400 font-medium">
                                Showing {filteredSessions.length} sessions
                            </span>
                        </div>
                    </div>

                    {/* Table */}
                    {filteredSessions.length === 0 ? (
                        <div className="py-12 text-center text-gray-400 text-xs">
                            No All Research sessions found matching your filters.
                        </div>
                    ) : (
                        <div className="overflow-x-auto max-h-[420px]">
                            <table className="w-full text-xs">
                                <thead className="bg-gray-50/80 sticky top-0 z-10 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-2.5 text-left font-semibold text-gray-600">Respondent UID</th>
                                        <th className="px-4 py-2.5 text-left font-semibold text-gray-600">Survey ID</th>
                                        <th className="px-4 py-2.5 text-left font-semibold text-gray-600">Survey Name</th>
                                        <th className="px-4 py-2.5 text-left font-semibold text-gray-600">Country</th>
                                        <th className="px-4 py-2.5 text-left font-semibold text-gray-600">Status</th>
                                        <th className="px-4 py-2.5 text-left font-semibold text-gray-600">CPI</th>
                                        <th className="px-4 py-2.5 text-left font-semibold text-gray-600">LOI</th>
                                        <th className="px-4 py-2.5 text-left font-semibold text-gray-600">Date & Time (IST)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredSessions.map((s) => (
                                        <tr key={s.txid} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="px-4 py-2.5 font-mono text-gray-800 font-medium">
                                                <div className="flex items-center gap-1.5">
                                                    <span>{s.uid}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopy(s.uid)}
                                                        className="text-gray-400 hover:text-blue-600"
                                                        title="Copy UID"
                                                    >
                                                        {copiedUid === s.uid ? (
                                                            <Check className="w-3 h-3 text-green-600" />
                                                        ) : (
                                                            <Copy className="w-3 h-3" />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2.5 font-mono text-gray-700">{s.surveyId}</td>
                                            <td className="px-4 py-2.5 text-gray-800 max-w-[200px] truncate" title={s.surveyName}>
                                                {s.surveyName}
                                            </td>
                                            <td className="px-4 py-2.5 text-gray-600">{s.country}</td>
                                            <td className="px-4 py-2.5">{getStatusBadge(s.status)}</td>
                                            <td className="px-4 py-2.5 font-semibold text-emerald-700">
                                                {s.currency} {s.cpi}
                                            </td>
                                            <td className="px-4 py-2.5 text-gray-600">{s.loi}</td>
                                            <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">
                                                {s.date} {s.endTime !== '-' ? s.endTime : s.startTime}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
