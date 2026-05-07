"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Search, RefreshCcw, ChevronLeft, ChevronRight,
    Loader2, Trash2, LayoutGrid, AlertTriangle, X
} from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/frontend/components/ui/select";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/frontend/components/ui/table";
import { Badge } from "@/frontend/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/frontend/components/ui/dialog";
import { cn } from "@/frontend/lib/utils";
import { toast } from "@/frontend/lib/toast-store";
import { AddProjectForm } from "@/frontend/components/projects/AddProjectForm";
import { EditProjectDialog } from "./EditProjectDialog";
import { ALL_COUNTRIES, ALL_CLIENTS, PROJECT_STATUSES, ALL_SELF_PARENTS, ALL_PROJECT_MANAGERS, ALL_SALES_MANAGERS } from "@/frontend/lib/constants";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Project {
    id             : string;
    sn             : number;
    parent         : string | number;
    name           : string;
    country        : string;
    language       : string;
    currency       : string;
    company        : string;
    pm             : string;
    sm             : string;
    pm_sm          : string;
    startDate      : string;
    quota          : number;
    hits           : number;
    comp           : number;
    disqualify     : number;
    drop           : number;
    ir             : number;
    loi            : number;
    cpi            : number;
    surveyLink     : string;
    surveyTestLink : string;
    supportedDevices: string[];
    notes          : string;
    projectBrief   : string;
    studyType      : string;
    status         : string;
}

interface Stats {
    total     ?: number;
    Running   ?: number;
    Bidding   ?: number;
    Testing   ?: number;
    Hold      ?: number;
    Completed ?: number;
    Closed    ?: number;
}

interface FilterState {
    projectId  : string;
    parentId   : string;
    name       : string;
    status     : string;
    country    : string;
    clientName : string;
    pm         : string;
    sm         : string;
}

const BLANK_FILTER: FilterState = { projectId: "", parentId: "", name: "", status: "", country: "", clientName: "", pm: "", sm: "" };

// ─── Status colours ───────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
    Running   : "bg-amber-400 hover:bg-amber-500 text-white border-0",
    Bidding   : "bg-slate-400 hover:bg-slate-500 text-white border-0",
    Testing   : "bg-blue-400 hover:bg-blue-500 text-white border-0",
    Hold      : "bg-orange-400 hover:bg-orange-500 text-white border-0",
    Completed : "bg-green-500 hover:bg-green-600 text-white border-0",
    Closed    : "bg-red-500 hover:bg-red-600 text-white border-0",
};



// ─── Map raw DB doc → Project ─────────────────────────────────────────────────

function mapProject(p: Record<string, unknown>, idx: number, offset: number): Project {
    return {
        id             : String(p._id),
        sn             : offset + idx + 1,
        parent         : String(p.parentId || "—"),
        name           : String(p.projectName || ""),
        country        : String(p.country || ""),
        language       : String(p.language || ""),
        currency       : String(p.currency || ""),
        company        : String(p.clientName || "—"),
        pm             : String(p.pm || ""),
        sm             : String(p.sm || ""),
        pm_sm          : [p.pm, p.sm].filter(Boolean).join(" / ") || "—",
        startDate      : p.startDate ? new Date(p.startDate as string).toLocaleDateString() : "—",
        quota          : Number(p.requiredCompletes) || 0,
        hits           : Number(p.hits)              || 0,
        comp           : Number(p.completes)         || 0,
        disqualify     : Number(p.disqualify)        || 0,
        drop           : Number(p.drop)              || 0,
        ir             : Number(p.ir)                || 0,
        loi            : Number(p.loi)               || 0,
        cpi            : Number(p.cpi)               || 0,
        surveyLink     : String(p.surveyLink    || ""),
        surveyTestLink : String(p.surveyTestLink || ""),
        supportedDevices: (p.supportedDevices as string[]) || [],
        notes          : String(p.notes        || ""),
        projectBrief   : String(p.projectBrief || ""),
        studyType      : String(p.studyType    || ""),
        status         : String(p.status       || "Bidding"),
    };
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <LayoutGrid className="w-14 h-14 text-gray-300 mb-4" />
            <h3 className="text-base font-semibold text-gray-700">No projects found</h3>
            <p className="text-sm text-gray-400 mt-1 mb-5">
                Try adjusting your filters or create a new project.
            </p>
            <Button
                onClick={onAdd}
                className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-6 text-sm font-semibold"
            >
                + Add First Project
            </Button>
        </div>
    );
}

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────

function DeleteConfirmDialog({
    open, projectName, onCancel, onConfirm, loading,
}: {
    open: boolean; projectName: string;
    onCancel: () => void; onConfirm: () => void; loading: boolean;
}) {
    return (
        <Dialog open={open} onOpenChange={onCancel}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="w-5 h-5" /> Delete Project
                    </DialogTitle>
                </DialogHeader>
                <p className="text-sm text-gray-600 mt-2">
                    Are you sure you want to permanently delete{" "}
                    <span className="font-semibold text-gray-900">{projectName}</span>?
                    This action cannot be undone.
                </p>
                <div className="flex gap-3 justify-end mt-4">
                    <Button variant="outline" onClick={onCancel} disabled={loading} className="h-9">
                        Cancel
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={loading}
                        className="h-9 bg-red-600 hover:bg-red-700 text-white"
                    >
                        {loading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                        Delete
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const LIMIT = 20;

export function ProjectList() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [stats, setStats]       = useState<Stats>({});
    const [loading, setLoading]   = useState(false);
    const [page, setPage]         = useState(1);
    const [total, setTotal]       = useState(0);
    const [pages, setPages]       = useState(1);

    // dialogs
    const [isAddOpen, setIsAddOpen]   = useState(false);
    const [editProject, setEditProject] = useState<Project | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
    const [deleting, setDeleting]       = useState(false);

    // filters — draft (what user types) vs applied (what was last searched)
    const [draft, setDraft]     = useState<FilterState>(BLANK_FILTER);
    const [applied, setApplied] = useState<FilterState>(BLANK_FILTER);

    // ── Fetch ──────────────────────────────────────────────────
    const fetchProjects = useCallback(async (filter: FilterState, pageNum: number) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(pageNum), limit: String(LIMIT) });
            if (filter.projectId)  params.set("projectId",  filter.projectId);
            if (filter.parentId && filter.parentId !== "all") params.set("parentId",   filter.parentId);
            if (filter.pm && filter.pm !== "all")             params.set("pm",         filter.pm);
            if (filter.sm && filter.sm !== "all")             params.set("sm",         filter.sm);
            if (filter.name)       params.set("name",       filter.name);
            if (filter.status && filter.status !== "all")
                params.set("status",     filter.status);
            if (filter.country && filter.country !== "all")
                params.set("country",    filter.country);
            if (filter.clientName && filter.clientName !== "all")
                params.set("clientName", filter.clientName);

            const res  = await fetch(`/api/projects?${params}`);
            const data = await res.json();
            if (data.success) {
                const offset = (pageNum - 1) * LIMIT;
                setProjects(
                    (data.data as Record<string, unknown>[]).map((p, i) => mapProject(p, i, offset))
                );
                setTotal(data.total || 0);
                setPages(data.pages || 1);
                setStats(data.stats || {});
            } else {
                toast.error("Failed to load projects");
            }
        } catch {
            toast.error("Network error while loading projects");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchProjects(applied, page); }, [applied, page, fetchProjects]);

    const handleSearch = () => {
        setPage(1);
        setApplied({ ...draft });
    };

    const handleReset = () => {
        const blank = BLANK_FILTER;
        setDraft(blank);
        setApplied(blank);
        setPage(1);
    };

    const handleRefresh = () => fetchProjects(applied, page);

    // ── Delete ─────────────────────────────────────────────────
    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/projects/${deleteTarget.id}`, { method: "DELETE" });
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success("Project deleted successfully");
                setDeleteTarget(null);
                fetchProjects(applied, page);
            } else {
                toast.error(data.error || "Failed to delete project");
            }
        } catch {
            toast.error("Network error");
        } finally {
            setDeleting(false);
        }
    };

    const totalPages = pages;
    const from = total === 0 ? 0 : (page - 1) * LIMIT + 1;
    const to   = Math.min(page * LIMIT, total);

    // ── Render ─────────────────────────────────────────────────
    return (
        <div className="space-y-5 relative">

            {/* ── Global loader overlay ─────────────────────── */}
            {loading && (
                <div className="absolute inset-0 bg-white/60 z-50 flex items-center justify-center backdrop-blur-sm rounded-lg">
                    <Loader2 className="w-10 h-10 text-inexra-teal animate-spin" />
                </div>
            )}



            {/* ── Filter / Add panel ────────────────────────── */}
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                    <h2 className="text-sm font-bold text-inexra-navy uppercase tracking-wide">
                        Search &amp; Filter
                    </h2>
                    <Button
                        onClick={() => setIsAddOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-8 px-5 text-xs uppercase"
                    >
                        + Add Project
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {/* ID search */}
                    <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-gray-500">ID</label>
                        <Input
                            className="h-9 text-xs"
                            placeholder="Search by ID…"
                            value={draft.projectId}
                            onChange={(e) => setDraft((p) => ({ ...p, projectId: e.target.value }))}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        />
                    </div>

                    {/* Self Parent */}
                    <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-gray-500">Self parent</label>
                        <Select
                            value={draft.parentId || "all"}
                            onValueChange={(v) => setDraft((p) => ({ ...p, parentId: v === "all" ? "" : v }))}
                        >
                            <SelectTrigger className="h-9 text-xs">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                                <SelectItem value="all">All</SelectItem>
                                {ALL_SELF_PARENTS.map((p) => (
                                    <SelectItem key={p} value={p}>{p}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Name search */}
                    <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-gray-500">Project Name</label>
                        <Input
                            className="h-9 text-xs"
                            placeholder="Search by name…"
                            value={draft.name}
                            onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        />
                    </div>

                    {/* Status */}
                    <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-gray-500">Status</label>
                        <Select
                            value={draft.status || "all"}
                            onValueChange={(v) => setDraft((p) => ({ ...p, status: v === "all" ? "" : v }))}
                        >
                            <SelectTrigger className="h-9 text-xs">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                {PROJECT_STATUSES.map((s) => (
                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Country */}
                    <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-gray-500">Country</label>
                        <Select
                            value={draft.country || "all"}
                            onValueChange={(v) => setDraft((p) => ({ ...p, country: v === "all" ? "" : v }))}
                        >
                            <SelectTrigger className="h-9 text-xs">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                                <SelectItem value="all">All</SelectItem>
                                {ALL_COUNTRIES.map((c) => (
                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Client */}
                    <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-gray-500">Client</label>
                        <Select
                            value={draft.clientName || "all"}
                            onValueChange={(v) => setDraft((p) => ({ ...p, clientName: v === "all" ? "" : v }))}
                        >
                            <SelectTrigger className="h-9 text-xs">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                                <SelectItem value="all">All</SelectItem>
                                {ALL_CLIENTS.map((c) => (
                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Manager */}
                    <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-gray-500">Manager</label>
                        <Select
                            value={draft.pm || "all"}
                            onValueChange={(v) => setDraft((p) => ({ ...p, pm: v === "all" ? "" : v }))}
                        >
                            <SelectTrigger className="h-9 text-xs">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                                <SelectItem value="all">All</SelectItem>
                                {ALL_PROJECT_MANAGERS.map((m) => (
                                    <SelectItem key={m} value={m}>{m}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Sales Manager */}
                    <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-gray-500">Sales Manager</label>
                        <Select
                            value={draft.sm || "all"}
                            onValueChange={(v) => setDraft((p) => ({ ...p, sm: v === "all" ? "" : v }))}
                        >
                            <SelectTrigger className="h-9 text-xs">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                                <SelectItem value="all">All</SelectItem>
                                {ALL_SALES_MANAGERS.map((m) => (
                                    <SelectItem key={m} value={m}>{m}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    
                    {/* Buttons */}
                    <div className="flex items-end gap-2 h-full">
                        <Button
                            onClick={handleSearch}
                            className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-5 text-sm font-bold w-[100px]"
                        >
                            Search <Search className="w-3.5 h-3.5 ml-1.5" />
                        </Button>
                        <Button
                            onClick={handleRefresh}
                            className="bg-inexra-teal hover:bg-teal-500 text-white h-9 px-5 text-sm font-bold w-[100px]"
                        >
                            Refresh
                        </Button>
                        <Button
                            onClick={handleReset}
                            variant="outline"
                            className="h-9 px-5 text-sm text-gray-600 font-semibold"
                        >
                            Reset
                        </Button>
                    </div>
                </div>
            </div>

            {/* ── Data table ────────────────────────────────── */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                {/* Table header info + top pagination */}
                <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/40 flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-500">
                        {total === 0
                            ? "No results"
                            : `Showing ${from}–${to} of ${total} project${total !== 1 ? "s" : ""}`}
                    </span>
                    <PaginationControls page={page} totalPages={totalPages} onChange={setPage} small />
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50 hover:bg-gray-50">
                                {["SN","ID","Parent","Name","Company","PM/SM","Start Date",
                                  "Quota","Hits","Comp","DQ","Drop","IR","LOI","Status","#"]
                                    .map((h) => (
                                        <TableHead key={h}
                                            className="font-bold text-[11px] text-gray-600 uppercase whitespace-nowrap">
                                            {h}
                                        </TableHead>
                                    ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {projects.length === 0 && !loading ? (
                                <TableRow>
                                    <TableCell colSpan={16}>
                                        <EmptyState onAdd={() => setIsAddOpen(true)} />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                projects.map((p) => (
                                    <TableRow key={p.id} className="hover:bg-blue-50/25 transition-colors">
                                        <TableCell className="text-xs text-gray-500">{p.sn}</TableCell>
                                        <TableCell className="text-[10px] text-gray-400 font-mono max-w-[80px] truncate">
                                            {String(p.id).slice(-6)}
                                        </TableCell>
                                        <TableCell className="text-xs text-gray-400">
                                            {p.parent === "—" ? "—" : String(p.parent).slice(-4)}
                                        </TableCell>
                                        <TableCell className="text-xs text-gray-800 min-w-[180px]">
                                            <div className="font-semibold leading-snug">{p.name}</div>
                                            {p.country && (
                                                <div className="text-[10px] text-gray-400 mt-0.5">{p.country}</div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-xs text-gray-600 font-medium min-w-[120px]">
                                            {p.company}
                                        </TableCell>
                                        <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                                            {p.pm_sm}
                                        </TableCell>
                                        <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                                            {p.startDate}
                                        </TableCell>
                                        <TableCell className="text-xs text-gray-600">{p.quota}</TableCell>
                                        <TableCell className="text-xs text-gray-600">{p.hits}</TableCell>
                                        <TableCell className="text-xs font-semibold text-green-700">{p.comp}</TableCell>
                                        <TableCell className="text-xs text-red-500">{p.disqualify}</TableCell>
                                        <TableCell className="text-xs text-gray-600">
                                            {p.drop.toFixed(1)}%
                                        </TableCell>
                                        <TableCell className="text-xs text-gray-600">
                                            {p.ir.toFixed(1)}%
                                        </TableCell>
                                        <TableCell className="text-xs text-gray-600">{p.loi}</TableCell>
                                        <TableCell>
                                            <Badge className={cn(
                                                "text-[10px] font-bold px-2 py-0.5 rounded-sm cursor-default",
                                                STATUS_BADGE[p.status] || "bg-gray-200 text-gray-600"
                                            )}>
                                                {p.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex flex-col gap-1 items-end min-w-[64px]">
                                                <Button
                                                    size="sm"
                                                    className="h-6 text-[10px] bg-blue-600 hover:bg-blue-700 w-16"
                                                    onClick={() => setEditProject(p)}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="h-6 text-[10px] bg-red-500 hover:bg-red-600 w-16"
                                                    onClick={() => setDeleteTarget(p)}
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Footer pagination */}
                <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/40 flex justify-between items-center">
                    <span className="text-xs text-gray-400">
                        Page {page} of {totalPages}
                    </span>
                    <PaginationControls page={page} totalPages={totalPages} onChange={setPage} />
                </div>
            </div>

            {/* ── Add Project Dialog ─────────────────────────── */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent showCloseButton={false} className="sm:max-w-4xl h-[90vh] p-0 flex flex-col gap-0 bg-neutral-50/50">
                    <DialogHeader className="px-6 py-4 bg-white border-b border-gray-100 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <DialogTitle className="text-lg font-bold text-gray-800 uppercase">
                                Add Project
                            </DialogTitle>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsAddOpen(false)}
                                className="h-8 w-8 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                    </DialogHeader>
                    <div className="flex-1 overflow-hidden p-6 bg-white">
                        <AddProjectForm
                            onClose={() => setIsAddOpen(false)}
                            onSuccess={() => { fetchProjects(applied, 1); setPage(1); }}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── Edit Project Dialog ────────────────────────── */}
            <EditProjectDialog
                open={!!editProject}
                project={editProject}
                onClose={() => setEditProject(null)}
                onSuccess={() => fetchProjects(applied, page)}
            />

            {/* ── Delete Confirm ────────────────────────────── */}
            <DeleteConfirmDialog
                open={!!deleteTarget}
                projectName={deleteTarget?.name || ""}
                loading={deleting}
                onCancel={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
            />
        </div>
    );
}

// ─── Pagination Controls ──────────────────────────────────────────────────────

function PaginationControls({
    page, totalPages, onChange, small,
}: {
    page: number; totalPages: number; onChange: (p: number) => void; small?: boolean;
}) {
    if (totalPages <= 1) return null;

    const pages: (number | "…")[] = [];
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        pages.push(1);
        if (page > 3) pages.push("…");
        for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
        if (page < totalPages - 2) pages.push("…");
        pages.push(totalPages);
    }

    return (
        <div className="flex items-center gap-1">
            <Button
                variant="outline"
                size="icon"
                className={cn("p-0", small ? "h-7 w-7" : "h-8 w-8")}
                disabled={page <= 1}
                onClick={() => onChange(page - 1)}
            >
                <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            {pages.map((p, i) =>
                p === "…" ? (
                    <span key={`ellipsis-${i}`} className="text-xs text-gray-400 px-1">…</span>
                ) : (
                    <Button
                        key={p}
                        variant="outline"
                        size="sm"
                        className={cn(
                            "p-0 text-xs",
                            small ? "h-7 w-7" : "h-8 w-8",
                            p === page
                                ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                                : "text-gray-600 hover:bg-gray-100"
                        )}
                        onClick={() => onChange(Number(p))}
                    >
                        {p}
                    </Button>
                )
            )}
            <Button
                variant="outline"
                size="icon"
                className={cn("p-0", small ? "h-7 w-7" : "h-8 w-8")}
                disabled={page >= totalPages}
                onClick={() => onChange(page + 1)}
            >
                <ChevronRight className="w-3.5 h-3.5" />
            </Button>
        </div>
    );
}
