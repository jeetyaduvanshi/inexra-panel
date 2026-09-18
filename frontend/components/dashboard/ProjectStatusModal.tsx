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
import { X, Search, RefreshCw, Loader2, ExternalLink } from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import { toast } from "@/frontend/lib/toast-store";
import Link from "next/link";

export interface ProjectStatusRow {
    sn: number;
    id: string;
    fullId: string;
    parent: string;
    name: string;
    company: string;
    pmSm: string;
    startDate: string;
    status: string;
    cpi: number;
    completes: number;
    requiredCompletes: number;
}

interface ProjectStatusModalProps {
    open: boolean;
    onClose: () => void;
    status: string; // e.g. "Running", "Bidding", "Testing", "Hold", "Completed", "Closed", "total"
    statusLabel?: string; // e.g. "Runnings", "Biddings"
}

export function ProjectStatusModal({
    open,
    onClose,
    status,
    statusLabel,
}: ProjectStatusModalProps) {
    const [projects, setProjects] = useState<ProjectStatusRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    // Title formatting matching Screenshot 2 (e.g. "Runnings", "Biddings", "Testings")
    const getModalTitle = (rawStatus: string, customLabel?: string) => {
        if (customLabel) return customLabel;
        const s = rawStatus.toLowerCase();
        if (s === "running") return "Runnings";
        if (s === "bidding") return "Biddings";
        if (s === "testing") return "Testings";
        if (s === "hold" || s === "on hold") return "On Holds";
        if (s === "completed") return "Completed Projects";
        if (s === "closed") return "Closed Projects";
        if (s === "total") return "All Projects";
        return rawStatus;
    };

    const title = getModalTitle(status, statusLabel);

    const fetchProjects = async () => {
        if (!open) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/dashboard/projects-by-status?status=${encodeURIComponent(status)}`);
            const data = await res.json();
            if (data.success && Array.isArray(data.data)) {
                setProjects(data.data);
            } else {
                setProjects([]);
            }
        } catch (err) {
            console.error("Failed to fetch projects by status:", err);
            toast.error("Failed to load projects");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchProjects();
            setSearch("");
        }
    }, [open, status]);

    const filtered = useMemo(() => {
        if (!search.trim()) return projects;
        const q = search.toLowerCase().trim();
        return projects.filter(
            (p) =>
                p.name.toLowerCase().includes(q) ||
                p.company.toLowerCase().includes(q) ||
                p.id.toLowerCase().includes(q) ||
                p.parent.toLowerCase().includes(q) ||
                p.pmSm.toLowerCase().includes(q)
        );
    }, [projects, search]);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent
                showCloseButton={false}
                className="w-[96vw] sm:max-w-5xl h-[88vh] max-h-[88vh] flex flex-col p-0 gap-0 bg-white overflow-hidden shadow-2xl rounded-xl border border-gray-200"
            >
                {/* Header */}
                <DialogHeader className="px-6 py-4 border-b border-gray-200 flex-shrink-0 bg-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <DialogTitle className="text-xl font-bold text-gray-800 tracking-tight">
                                {title}
                            </DialogTitle>
                            <Badge variant="outline" className="text-xs font-semibold px-2.5 py-0.5 border-gray-200 text-gray-600">
                                {filtered.length} {filtered.length === 1 ? "Project" : "Projects"}
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

                    {/* Toolbar */}
                    <div className="flex items-center justify-between gap-3 pt-3">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <Input
                                placeholder="Search by Project Name, Company, ID..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-9 pl-9 pr-3 text-xs bg-gray-50/70 border-gray-200 focus:bg-white"
                            />
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchProjects}
                            disabled={loading}
                            className="h-9 text-xs border-gray-200 text-gray-700 hover:bg-gray-50"
                        >
                            <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", loading && "animate-spin")} />
                            Refresh
                        </Button>
                    </div>
                </DialogHeader>

                {/* Table Container */}
                <div className="flex-1 overflow-auto bg-white relative">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-3">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                            <p className="text-xs text-gray-500 font-medium">Loading {title}...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-2 text-center p-6">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-1">
                                <Search className="w-6 h-6" />
                            </div>
                            <h4 className="text-sm font-bold text-gray-700">No {title} Found</h4>
                            <p className="text-xs text-gray-500 max-w-sm">
                                {search ? `No projects match "${search}".` : `There are currently no projects marked as "${status}".`}
                            </p>
                        </div>
                    ) : (
                        <Table className="w-full text-left border-collapse">
                            <TableHeader className="sticky top-0 bg-gray-50/95 backdrop-blur-sm z-10 border-b border-gray-200 shadow-sm">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[50px] font-bold text-[11px] text-gray-600 uppercase tracking-wider py-3 pl-4">SN</TableHead>
                                    <TableHead className="w-[80px] font-bold text-[11px] text-gray-600 uppercase tracking-wider py-3">ID</TableHead>
                                    <TableHead className="w-[80px] font-bold text-[11px] text-gray-600 uppercase tracking-wider py-3">PARENT</TableHead>
                                    <TableHead className="min-w-[220px] font-bold text-[11px] text-gray-600 uppercase tracking-wider py-3">NAME</TableHead>
                                    <TableHead className="min-w-[180px] font-bold text-[11px] text-gray-600 uppercase tracking-wider py-3">COMPANY</TableHead>
                                    <TableHead className="min-w-[180px] font-bold text-[11px] text-gray-600 uppercase tracking-wider py-3">PM/SM</TableHead>
                                    <TableHead className="w-[110px] font-bold text-[11px] text-gray-600 uppercase tracking-wider py-3 pr-4">START DATE</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((row) => (
                                    <TableRow
                                        key={row.fullId}
                                        className="hover:bg-blue-50/30 transition-colors border-b border-gray-100 text-xs text-gray-700"
                                    >
                                        <TableCell className="font-semibold text-gray-500 py-3 pl-4">{row.sn}</TableCell>
                                        <TableCell className="font-mono text-gray-600 py-3">{row.id}</TableCell>
                                        <TableCell className="font-mono text-gray-400 py-3">{row.parent}</TableCell>
                                        <TableCell className="font-semibold text-blue-900 py-3">
                                            <Link
                                                href={`/projects?search=${encodeURIComponent(row.name)}`}
                                                onClick={onClose}
                                                className="hover:underline flex items-center gap-1 group"
                                            >
                                                <span>{row.name}</span>
                                                <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-gray-700 py-3">{row.company}</TableCell>
                                        <TableCell className="text-gray-600 py-3 font-medium">{row.pmSm}</TableCell>
                                        <TableCell className="text-gray-600 py-3 pr-4">{row.startDate}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-gray-200 bg-gray-50/70 flex items-center justify-between flex-shrink-0">
                    <span className="text-xs text-gray-500">
                        Total {filtered.length} {filtered.length === 1 ? "project" : "projects"}
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
