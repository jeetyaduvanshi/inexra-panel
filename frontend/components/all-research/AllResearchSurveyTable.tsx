'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Search, X, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/frontend/components/ui/input';
import { Button } from '@/frontend/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/frontend/components/ui/select';

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
    onFilteredCountChange?: (count: number) => void;
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

function highlightMatch(text: string, query: string) {
    if (!query || !query.trim() || !text) return text;
    const trimmed = query.trim();
    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);
    if (parts.length <= 1) return text;
    return parts.map((part, i) =>
        regex.test(part) ? (
            <mark key={i} className="bg-yellow-200/90 text-yellow-950 font-semibold px-0.5 rounded">
                {part}
            </mark>
        ) : (
            part
        )
    );
}

export function AllResearchSurveyTable({
    surveys,
    isLoading,
    onGenerateLink,
    onFilteredCountChange,
}: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [idFilter, setIdFilter] = useState('');
    const [nameFilter, setNameFilter] = useState('');
    const [countryFilter, setCountryFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showFieldFilters, setShowFieldFilters] = useState(false);

    // Extract unique countries with their counts
    const uniqueCountries = useMemo(() => {
        const counts = new Map<string, number>();
        for (const s of surveys) {
            const c = (s.surveyCountry || '').trim();
            if (c) {
                counts.set(c, (counts.get(c) || 0) + 1);
            }
        }
        return Array.from(counts.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [surveys]);

    // Extract unique statuses with counts
    const uniqueStatuses = useMemo(() => {
        const counts = new Map<string, number>();
        for (const s of surveys) {
            const st = (s.surveyStatus || '').trim();
            if (st) {
                counts.set(st, (counts.get(st) || 0) + 1);
            }
        }
        return Array.from(counts.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [surveys]);

    // Filter surveys based on search query, ID, Name, Country, and Status
    const filteredSurveys = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        const idQ = idFilter.trim().toLowerCase();
        const nameQ = nameFilter.trim().toLowerCase();

        return surveys.filter((survey) => {
            const sId = String(survey.surveyId || '').toLowerCase();
            const sName = String(survey.surveyName || '').toLowerCase();
            const sCountry = String(survey.surveyCountry || '').toLowerCase();
            const sStatus = String(survey.surveyStatus || '').toLowerCase();

            // Universal search across Survey ID, Name, Country, or Code
            if (q) {
                const matchesUniversal =
                    sId.includes(q) ||
                    sName.includes(q) ||
                    sCountry.includes(q) ||
                    String(survey.surveyCode || '').toLowerCase().includes(q);
                if (!matchesUniversal) return false;
            }

            // Dedicated Survey ID filter
            if (idQ && !sId.includes(idQ)) {
                return false;
            }

            // Dedicated Name filter
            if (nameQ && !sName.includes(nameQ)) {
                return false;
            }

            // Country filter
            if (countryFilter !== 'all' && sCountry !== countryFilter.toLowerCase()) {
                return false;
            }

            // Status filter
            if (statusFilter !== 'all' && sStatus !== statusFilter.toLowerCase()) {
                return false;
            }

            return true;
        });
    }, [surveys, searchQuery, idFilter, nameFilter, countryFilter, statusFilter]);

    // Notify parent whenever filtered count changes
    useEffect(() => {
        onFilteredCountChange?.(filteredSurveys.length);
    }, [filteredSurveys.length, onFilteredCountChange]);

    const hasActiveFilters =
        Boolean(searchQuery) ||
        Boolean(idFilter) ||
        Boolean(nameFilter) ||
        countryFilter !== 'all' ||
        statusFilter !== 'all';

    const handleClearAll = () => {
        setSearchQuery('');
        setIdFilter('');
        setNameFilter('');
        setCountryFilter('all');
        setStatusFilter('all');
    };

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
        <div>
            {/* ── Search & Filter Toolbar ────────────────────────────── */}
            <div className="p-4 bg-gray-50/80 border-b border-gray-200 space-y-3">
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                    {/* Unified Search Input (Survey ID, Name, Country) */}
                    <div className="relative flex-1 min-w-[260px] max-w-lg">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <Input
                            placeholder="Search by Survey ID, Name, or Country..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-8 h-9 text-xs bg-white border-gray-200 focus:border-blue-500 shadow-xs"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-100 transition-colors"
                                title="Clear search"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Quick Filters: Country, Status, Field Filters toggle, Reset */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Country Filter */}
                        <div className="w-48">
                            <Select value={countryFilter} onValueChange={setCountryFilter}>
                                <SelectTrigger className="h-9 text-xs bg-white border-gray-200 shadow-xs">
                                    <SelectValue placeholder="All Countries" />
                                </SelectTrigger>
                                <SelectContent className="max-h-64">
                                    <SelectItem value="all">
                                        All Countries ({surveys.length})
                                    </SelectItem>
                                    {uniqueCountries.map(({ name, count }) => (
                                        <SelectItem key={name} value={name}>
                                            {name} ({count})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Status Filter */}
                        <div className="w-36">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="h-9 text-xs bg-white border-gray-200 shadow-xs">
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    {uniqueStatuses.map(({ name, count }) => (
                                        <SelectItem key={name} value={name}>
                                            {name} ({count})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Field-specific Filters Toggle Button */}
                        <Button
                            type="button"
                            variant={showFieldFilters ? 'secondary' : 'outline'}
                            size="sm"
                            onClick={() => setShowFieldFilters(!showFieldFilters)}
                            className={`h-9 text-xs gap-1.5 shadow-xs transition-colors ${
                                showFieldFilters
                                    ? 'bg-blue-50 text-blue-700 border-blue-200 font-semibold'
                                    : 'text-gray-700 bg-white border-gray-200'
                            }`}
                        >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            {showFieldFilters ? 'Hide Fields' : 'Field Filters'}
                            {(idFilter || nameFilter) && (
                                <span className="w-2 h-2 rounded-full bg-blue-600 ml-0.5" />
                            )}
                        </Button>

                        {/* Reset All Filters */}
                        {hasActiveFilters && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleClearAll}
                                className="h-9 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 transition-colors"
                            >
                                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                                Reset
                            </Button>
                        )}
                    </div>
                </div>

                {/* Secondary Row: Specific ID and Name Input Fields */}
                {showFieldFilters && (
                    <div className="pt-3 border-t border-gray-200/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 animate-in fade-in duration-150">
                        <div>
                            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                                Survey ID Filter
                            </label>
                            <div className="relative">
                                <Input
                                    placeholder="Filter by ID (e.g. 27045)..."
                                    value={idFilter}
                                    onChange={(e) => setIdFilter(e.target.value)}
                                    className="h-8 pr-7 text-xs bg-white border-gray-200 shadow-xs"
                                />
                                {idFilter && (
                                    <button
                                        type="button"
                                        onClick={() => setIdFilter('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                                Survey Name Filter
                            </label>
                            <div className="relative">
                                <Input
                                    placeholder="Filter by Name (e.g. ARAPI...)..."
                                    value={nameFilter}
                                    onChange={(e) => setNameFilter(e.target.value)}
                                    className="h-8 pr-7 text-xs bg-white border-gray-200 shadow-xs"
                                />
                                {nameFilter && (
                                    <button
                                        type="button"
                                        onClick={() => setNameFilter('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex items-end">
                            <p className="text-xs text-gray-400 pb-2">
                                💡 Tip: You can also use the main search box above to search ID, Name, or Country in one go.
                            </p>
                        </div>
                    </div>
                )}

                {/* Active Filter Chips / Badges */}
                {hasActiveFilters && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                        <span className="font-semibold text-gray-500 text-[11px] uppercase tracking-wider mr-1">
                            Active Filters:
                        </span>
                        {searchQuery && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium">
                                Search: &quot;{searchQuery}&quot;
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="hover:text-blue-900 rounded-full hover:bg-blue-100 p-0.5"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        )}
                        {idFilter && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-medium">
                                ID: &quot;{idFilter}&quot;
                                <button
                                    type="button"
                                    onClick={() => setIdFilter('')}
                                    className="hover:text-indigo-900 rounded-full hover:bg-indigo-100 p-0.5"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        )}
                        {nameFilter && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-medium">
                                Name: &quot;{nameFilter}&quot;
                                <button
                                    type="button"
                                    onClick={() => setNameFilter('')}
                                    className="hover:text-purple-900 rounded-full hover:bg-purple-100 p-0.5"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        )}
                        {countryFilter !== 'all' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
                                Country: {countryFilter}
                                <button
                                    type="button"
                                    onClick={() => setCountryFilter('all')}
                                    className="hover:text-emerald-900 rounded-full hover:bg-emerald-100 p-0.5"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        )}
                        {statusFilter !== 'all' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
                                Status: {statusFilter}
                                <button
                                    type="button"
                                    onClick={() => setStatusFilter('all')}
                                    className="hover:text-amber-900 rounded-full hover:bg-amber-100 p-0.5"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        )}
                        <span className="ml-auto text-gray-500 font-medium text-xs">
                            Showing <strong className="text-gray-800">{filteredSurveys.length}</strong> of{' '}
                            <strong className="text-gray-800">{surveys.length}</strong> projects
                        </span>
                    </div>
                )}
            </div>

            {/* ── Table Content or Empty Search Results ──────────────── */}
            {filteredSurveys.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-3 shadow-xs">
                        <Search className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">No matching surveys found</h3>
                    <p className="text-xs text-gray-500 max-w-sm mb-4 leading-relaxed">
                        No surveys matched your criteria for Survey ID, Name, or Country. Try clearing your search or selecting a different country.
                    </p>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleClearAll}
                        className="h-8 text-xs gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reset All Filters
                    </Button>
                </div>
            ) : (
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
                            {filteredSurveys.map((survey) => (
                                <tr key={survey._id} className="hover:bg-blue-50/40 transition-colors">
                                    <td className="px-3 py-3">
                                        <button
                                            type="button"
                                            onClick={() => onGenerateLink(survey.surveyId)}
                                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md transition-colors whitespace-nowrap shadow-xs cursor-pointer"
                                        >
                                            Generate Link
                                        </button>
                                    </td>
                                    <td className="px-3 py-3 font-mono text-xs text-gray-800 font-medium">
                                        {highlightMatch(survey.surveyId, idFilter || searchQuery)}
                                    </td>
                                    <td className="px-3 py-3 text-gray-800 max-w-[180px]">
                                        <p className="truncate" title={survey.surveyName}>
                                            {survey.surveyName ? highlightMatch(survey.surveyName, nameFilter || searchQuery) : '—'}
                                        </p>
                                    </td>
                                    <td className="px-3 py-3 text-gray-600">
                                        {survey.surveyCountry ? highlightMatch(survey.surveyCountry, searchQuery) : '—'}
                                    </td>
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
            )}
        </div>
    );
}
