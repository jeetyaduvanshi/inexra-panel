"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/frontend/components/ui/dialog";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Badge } from "@/frontend/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/frontend/components/ui/table";
import { X, Search, Copy, Check, Download, RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import { toast } from "@/frontend/lib/toast-store";

export interface SessionRow {
    sn: number;
    id: string;
    fullId: string;
    supplierId: string;
    supplierName: string;
    ourPo: string;
    client: string;
    startIp: string;
    endIp: string;
    startTime: string;
    endTime: string;
    startDate: string;
    endDate: string;
    refId: string;
    uid: string;
    loi: string;
    status: string;
    rawStatus: string;
    country: string;
}

export function formatTo12Hour(timeStr: string): string {
    if (!timeStr || timeStr === '-' || timeStr === 'N/A') return '-';
    if (/am|pm/i.test(timeStr)) return timeStr;
    const parts = timeStr.trim().split(':');
    if (parts.length >= 2) {
        let hour = parseInt(parts[0], 10);
        const minute = parts[1];
        const second = parts[2] ? `:${parts[2]}` : '';
        if (isNaN(hour)) return timeStr;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12;
        hour = hour ? hour : 12;
        const hourStr = hour < 10 ? `0${hour}` : `${hour}`;
        return `${hourStr}:${minute}${second} ${ampm}`;
    }
    return timeStr;
}

interface SessionDetailsModalProps {
    open: boolean;
    onClose: () => void;
    status: string; // e.g. "complete", "disqualified", "quota_full", "security", "drop", "all"
    statusLabel?: string; // e.g. "Complete", "Disqualified", "Quota Full"
    period?: "today" | "month" | "all";
}

export function SessionDetailsModal({
    open,
    onClose,
    status,
    statusLabel,
    period = "today",
}: SessionDetailsModalProps) {
    const [sessions, setSessions] = useState<SessionRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [copiedUid, setCopiedUid] = useState<string | null>(null);
    const [copiedAll, setCopiedAll] = useState(false);

    const title = statusLabel || (status ? status.charAt(0).toUpperCase() + status.slice(1) : "Sessions");

    const fetchSessions = async () => {
        if (!open) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/dashboard/sessions?status=${encodeURIComponent(status)}&period=${period}`);
            const data = await res.json();
            if (data.success && Array.isArray(data.data)) {
                setSessions(data.data);
            } else {
                setSessions([]);
            }
        } catch (err) {
            console.error("Failed to fetch sessions:", err);
            toast.error("Failed to load session details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchSessions();
            setSearch("");
        }
    }, [open, status, period]);

    const filtered = useMemo(() => {
        if (!search.trim()) return sessions;
        const q = search.toLowerCase().trim();
        return sessions.filter(
            (s) =>
                s.uid.toLowerCase().includes(q) ||
                s.client.toLowerCase().includes(q) ||
                s.supplierName.toLowerCase().includes(q) ||
                s.ourPo.toLowerCase().includes(q) ||
                s.startIp.toLowerCase().includes(q) ||
                s.endIp.toLowerCase().includes(q) ||
                s.refId.toLowerCase().includes(q)
        );
    }, [sessions, search]);

    const handleCopyUid = (uid: string) => {
        navigator.clipboard.writeText(uid);
        setCopiedUid(uid);
        setTimeout(() => setCopiedUid(null), 2000);
        toast.info(`Copied Test ID / UID: ${uid}`);
    };

    const handleCopyAllUids = () => {
        if (filtered.length === 0) return;
        const uidsText = filtered.map((s) => s.uid).join("\n");
        navigator.clipboard.writeText(uidsText);
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 2000);
        toast.success(`Copied ${filtered.length} Test IDs / UIDs to clipboard`);
    };

    const handleExportCsv = () => {
        if (filtered.length === 0) return;
        const headers = [
            "SN", "ID", "SUPLIER ID", "SUPLIER NAME", "OUR PO", "CLIENT",
            "START IP", "END IP", "START TIME (IST)", "END TIME (IST)", "START DATE (IST)", "END DATE (IST)",
            "REF ID", "UID", "LOI", "STATUS", "COUNTRY"
        ];
        const rows = filtered.map((r, i) => [
            i + 1,
            `"${r.id}"`,
            `"${r.supplierId}"`,
            `"${r.supplierName}"`,
            `"${r.ourPo.replace(/"/g, '""')}"`,
            `"${r.client.replace(/"/g, '""')}"`,
            `"${r.startIp}"`,
            `"${r.endIp}"`,
            `"${formatTo12Hour(r.startTime)}"`,
            `"${formatTo12Hour(r.endTime)}"`,
            `"${r.startDate}"`,
            `"${r.endDate}"`,
            `"${r.refId}"`,
            `"${r.uid}"`,
            `"${r.loi}"`,
            `"${r.status}"`,
            `"${r.country}"`,
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Inexra_${title}_Sessions_${period}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getBadgeStyle = (st: string) => {
        const s = st.toLowerCase();
        if (s.includes("complete")) return "bg-emerald-100 text-emerald-800 border-emerald-200";
        if (s.includes("disqualif") || s.includes("terminate")) return "bg-red-100 text-red-800 border-red-200";
        if (s.includes("quota")) return "bg-amber-100 text-amber-800 border-amber-200";
        if (s.includes("security")) return "bg-purple-100 text-purple-800 border-purple-200";
        return "bg-gray-100 text-gray-800 border-gray-200";
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent
                showCloseButton={false}
                className="w-[98vw] sm:max-w-[1440px] h-[92vh] max-h-[92vh] flex flex-col p-0 gap-0 bg-white overflow-hidden shadow-2xl rounded-xl border border-gray-200"
            >
                {/* Header */}
                <DialogHeader className="px-6 py-4 border-b border-gray-200 flex-shrink-0 bg-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <DialogTitle className="text-xl font-bold text-gray-800 tracking-tight">
                                {title}
                            </DialogTitle>
                            <Badge variant="outline" className="text-xs font-semibold px-2.5 py-0.5 border-gray-200 text-gray-600 uppercase">
                                {period === "today" ? "Today" : period === "month" ? "This Month" : "All Time"} ({filtered.length})
                            </Badge>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="h-8 w-8 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* Toolbar: Search, Refresh, Copy All, Export */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
                        <div className="relative flex-1 min-w-[240px] max-w-md">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <Input
                                placeholder="Search by UID, Client, Supplier, PO, IP..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-9 pl-9 pr-3 text-xs bg-gray-50/70 border-gray-200 focus:bg-white"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={fetchSessions}
                                disabled={loading}
                                className="h-9 text-xs border-gray-200 text-gray-700 hover:bg-gray-50"
                                title="Refresh"
                            >
                                <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", loading && "animate-spin")} />
                                Refresh
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCopyAllUids}
                                disabled={filtered.length === 0}
                                className="h-9 text-xs font-semibold border-blue-200 text-blue-700 hover:bg-blue-50"
                            >
                                {copiedAll ? <Check className="w-3.5 h-3.5 mr-1.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
                                Copy All UIDs
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleExportCsv}
                                disabled={filtered.length === 0}
                                className="h-9 text-xs font-semibold border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            >
                                <Download className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                                Export CSV
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                {/* Table Container with Horizontal and Vertical Scrolling */}
                <div className="flex-1 overflow-auto bg-white relative">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-3">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                            <p className="text-xs text-gray-500 font-medium">Loading session logs...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-2 text-center p-6">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-1">
                                <Search className="w-6 h-6" />
                            </div>
                            <h4 className="text-sm font-bold text-gray-700">No {title} Sessions Found</h4>
                            <p className="text-xs text-gray-500 max-w-sm">
                                {search
                                    ? `No sessions match "${search}". Try clearing the search.`
                                    : `No survey sessions recorded under "${title}" for ${period === "today" ? "today" : "this period"}. Run a test link to view live logs.`}
                            </p>
                        </div>
                    ) : (
                        <Table className="w-full text-left border-collapse min-w-[1400px]">
                            <TableHeader className="sticky top-0 bg-gray-50/95 backdrop-blur-sm z-10 border-b border-gray-200 shadow-sm">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[50px] font-bold text-[11px] text-gray-600 uppercase tracking-wider py-3 pl-4">SN</TableHead>
                                    <TableHead className="w-[80px] font-bold text-[11px] text-gray-600 uppercase tracking-wider py-3">ID</TableHead>
                                    <TableHead className="w-[100px] font-bold text-[11px] text-gray-600 uppercase tracking-wider py-3">SUPLIER ID</TableHead>
                                    <TableHead className="w-[140px] font-bold text-[11px] text-gray-600 uppercase tracking-wider py-3">SUPLIER NAME</TableHead>
                                    <TableHead className="w-[160px] font-bold text-[11px] text-gray-600 uppercase tracking-wider py-3">OUR PO</TableHead>
                                    <TableHead className="w-[130px] font-bold text-[11px] text-gray-600 uppercase tracking-wider py-3">CLIENT</TableHead>
                                    <TableHead className="w-[120px] font-bold text-[11px] text-gray-600 uppercase tracking-wider py-3">START IP</TableHead>
                                    <TableHead className="w-[120px] font-bold text-[11px] text-gray-600 uppercase tracking-wider py-3">END IP</TableHead>
                                    <TableHead className="w-[125px] font-bold text-[11px] text-gray-600 uppercase tracking-wider py-3 whitespace-nowrap">START TIME (IST)</TableHead>
                                    <TableHead className="w-[125px] font-bold text-[11px] text-gray-600 uppercase tracking-wider py-3 whitespace-nowrap">END TIME (IST)</TableHead>
                                    <TableHead className="w-[95px] font-bold text-[11px] text-gray-600 uppercase tracking-wider py-3">START DATE</TableHead>
                                    <TableHead className="w-[95px] font-bold text-[11px] text-gray-600 uppercase tracking-wider py-3">END DATE</TableHead>
                                    <TableHead className="w-[110px] font-bold text-[11px] text-gray-600 uppercase tracking-wider py-3">REF ID</TableHead>
                                    <TableHead className="w-[140px] font-bold text-[11px] text-gray-800 uppercase tracking-wider py-3 bg-blue-50/50">UID</TableHead>
                                    <TableHead className="w-[85px] font-bold text-[11px] text-gray-600 uppercase tracking-wider py-3">LOI</TableHead>
                                    <TableHead className="w-[110px] font-bold text-[11px] text-gray-600 uppercase tracking-wider py-3">STATUS</TableHead>
                                    <TableHead className="w-[110px] font-bold text-[11px] text-gray-600 uppercase tracking-wider py-3 pr-4">COUNTRY</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((row, idx) => {
                                    const isUidCopied = copiedUid === row.uid;
                                    return (
                                        <TableRow
                                            key={row.fullId || `${row.uid}-${idx}`}
                                            className="hover:bg-blue-50/30 transition-colors border-b border-gray-100 text-xs text-gray-700"
                                        >
                                            <TableCell className="font-semibold text-gray-500 py-3 pl-4">{row.sn}</TableCell>
                                            <TableCell className="font-mono text-gray-600 py-3">{row.id}</TableCell>
                                            <TableCell className="font-mono text-gray-500 py-3">{row.supplierId}</TableCell>
                                            <TableCell className="font-medium text-gray-800 py-3 max-w-[140px] truncate" title={row.supplierName}>
                                                {row.supplierName}
                                            </TableCell>
                                            <TableCell className="font-medium text-gray-800 py-3 max-w-[160px] truncate" title={row.ourPo}>
                                                {row.ourPo}
                                            </TableCell>
                                            <TableCell className="text-gray-700 py-3 max-w-[130px] truncate" title={row.client}>
                                                {row.client}
                                            </TableCell>
                                            <TableCell className="font-mono text-[11px] text-gray-600 py-3">{row.startIp}</TableCell>
                                            <TableCell className="font-mono text-[11px] text-gray-600 py-3">{row.endIp}</TableCell>
                                            <TableCell className="text-gray-600 py-3 whitespace-nowrap font-mono text-[11px]">{formatTo12Hour(row.startTime)}</TableCell>
                                            <TableCell className="text-gray-600 py-3 whitespace-nowrap font-mono text-[11px]">{formatTo12Hour(row.endTime)}</TableCell>
                                            <TableCell className="text-gray-600 py-3">{row.startDate}</TableCell>
                                            <TableCell className="text-gray-600 py-3">{row.endDate}</TableCell>
                                            <TableCell className="font-mono text-[11px] text-gray-500 py-3 max-w-[110px] truncate" title={row.refId}>
                                                {row.refId.length > 8 ? `${row.refId.slice(0, 8)}...` : row.refId}
                                            </TableCell>

                                            {/* UID Highlight Column with Copy button */}
                                            <TableCell className="bg-blue-50/30 py-2">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-mono font-bold text-blue-900 truncate max-w-[100px]" title={row.uid}>
                                                        {row.uid}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopyUid(row.uid)}
                                                        className="p-1 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-100 transition-colors"
                                                        title="Copy UID"
                                                    >
                                                        {isUidCopied ? (
                                                            <Check className="w-3 h-3 text-green-600" />
                                                        ) : (
                                                            <Copy className="w-3 h-3" />
                                                        )}
                                                    </button>
                                                </div>
                                            </TableCell>

                                            <TableCell className="font-medium text-gray-600 py-3">{row.loi}</TableCell>
                                            <TableCell className="py-3">
                                                <Badge
                                                    variant="outline"
                                                    className={cn("text-[10px] font-semibold px-2 py-0.5", getBadgeStyle(row.status))}
                                                >
                                                    {row.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-gray-600 py-3 pr-4 max-w-[110px] truncate" title={row.country}>
                                                {row.country}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-gray-200 bg-gray-50/70 flex items-center justify-between flex-shrink-0">
                    <span className="text-xs text-gray-500">
                        Total {filtered.length} {filtered.length === 1 ? "record" : "records"} displayed
                    </span>
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={onClose}
                        className="h-8 px-5 text-xs font-semibold bg-gray-200 hover:bg-gray-300 text-gray-800"
                    >
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
