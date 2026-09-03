"use client";

import React, { useState, useEffect } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/frontend/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/frontend/components/ui/tabs";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Badge } from "@/frontend/components/ui/badge";
import { ScrollArea } from "@/frontend/components/ui/scroll-area";
import {
    Loader2, Copy, Plus, ExternalLink, X, Check, ChevronDown, ChevronUp,
    Trash2, Play, Pause, Link2, RefreshCw
} from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import { toast } from "@/frontend/lib/toast-store";
import { AddProjectForm, type ProjectFormData } from "./AddProjectForm";
import type { Project } from "./ProjectList";
import { PROJECT_STATUSES } from "@/frontend/lib/constants";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Supplier {
    _id                : string;
    projectId          : string;
    supplierName       : string;
    originalLink       : string;
    trackingSlug       : string;
    cpi?               : number;
    requiredCompletes? : number;
    maxRedirects?      : number;
    surveyLink?        : string;
    testLink?          : string;
    completionUrl?     : string;
    terminateUrl?      : string;
    quotaFullUrl?      : string;
    securityUrl?       : string;
    hits?              : number;
    completes?         : number;
    disqualified?      : number;
    quotaFull?         : number;
    securityTerm?      : number;
    drop?              : number;
    status?            : "active" | "paused" | string;
    notes?             : string;
    createdAt?         : string;
}

interface EditProjectDialogProps {
    project  : Project | null;
    open     : boolean;
    onClose  : () => void;
    onSuccess?: () => void;
}

// ─── Status badge helper ──────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
    Running   : "bg-amber-400 text-white border-0",
    Bidding   : "bg-slate-400 text-white border-0",
    Testing   : "bg-blue-400 text-white border-0",
    Hold      : "bg-orange-400 text-white border-0",
    Completed : "bg-green-500 text-white border-0",
    Closed    : "bg-red-500 text-white border-0",
};

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({
    project, onSuccess, onClose,
}: { project: Project; onSuccess?: () => void; onClose: () => void }) {
    // Map Project (table type) → ProjectFormData (form type)
    const toFormData = (p: Project): Partial<ProjectFormData> => ({
        parentId          : String(p.parent || ""),
        projectName       : p.name,
        country           : p.country,
        language          : p.language || "English",
        currency          : p.currency || "US Dollar",
        cpi               : String(p.cpi || ""),
        surveyLink        : p.surveyLink || "",
        surveyTestLink    : p.surveyTestLink || "",
        requiredCompletes : String(p.quota || ""),
        ir                : String(p.ir || ""),
        loi               : String(p.loi || ""),
        supportedDevices  : p.supportedDevices || ["Desktop", "Mobile", "Tablet"],
        clientName        : p.company || "",
        pm                : p.pm || "",
        sm                : p.sm || "",
        status            : p.status,
        notes             : p.notes || "",
        projectBrief      : p.projectBrief || "",
        studyType         : p.studyType || "",
    });

    return (
        <AddProjectForm
            onClose={onClose}
            onSuccess={onSuccess}
            initialData={toFormData(project)}
            projectId={String(project.id)}
        />
    );
}

// ─── Status Tab ───────────────────────────────────────────────────────────────

function StatusTab({
    project, onSuccess,
}: { project: Project; onSuccess?: () => void }) {
    const [saving, setSaving] = useState(false);

    const changeStatus = async (newStatus: string) => {
        if (newStatus === project.status) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/projects/${project.id}`, {
                method : "PUT",
                headers: { "Content-Type": "application/json" },
                body   : JSON.stringify({ status: newStatus }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success(`Status changed to ${newStatus}`);
                onSuccess?.();
            } else {
                toast.error(data.error || "Failed to update status");
            }
        } catch {
            toast.error("Network error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div>
                <p className="text-xs text-gray-500 mb-1">Current Status</p>
                <Badge className={cn("text-sm px-3 py-1", STATUS_COLORS[project.status] || "bg-gray-200 text-gray-600")}>
                    {project.status}
                </Badge>
            </div>

            <div>
                <p className="text-xs font-semibold text-gray-600 uppercase mb-3">
                    Change Status
                </p>
                <div className="flex flex-wrap gap-2">
                    {PROJECT_STATUSES.map((s) => (
                        <Button
                            key={s}
                            size="sm"
                            disabled={saving || s === project.status}
                            onClick={() => changeStatus(s)}
                            className={cn(
                                "h-8 text-xs font-semibold",
                                s === project.status
                                    ? "opacity-50 cursor-not-allowed"
                                    : "",
                                STATUS_COLORS[s] || "bg-gray-200 text-gray-700"
                            )}
                        >
                            {saving && s === project.status && (
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            )}
                            {s}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                <strong>Note:</strong> Changing the status here will immediately update the project record in the database and refresh the project list.
            </div>
        </div>
    );
}

// ─── Suppliers Tab ────────────────────────────────────────────────────────────

function SuppliersTab({ project }: { project: Project }) {
    const [suppliers, setSuppliers]                     = useState<Supplier[]>([]);
    const [loading, setLoading]                         = useState(false);
    const [newSupplierName, setNewSupplierName]         = useState("");
    const [newSupplierLink, setNewSupplierLink]         = useState("");
    const [newSupplierCpi, setNewSupplierCpi]           = useState("");
    const [newSupplierReqComp, setNewSupplierReqComp]   = useState("");
    const [newSupplierMaxRedir, setNewSupplierMaxRedir] = useState("500000");
    const [addingSupplier, setAddingSupplier]           = useState(false);
    const [copiedKey, setCopiedKey]                     = useState<string | null>(null);
    const [expandedSuppliers, setExpandedSuppliers]     = useState<Record<string, boolean>>({});
    const [actionLoadingId, setActionLoadingId]         = useState<string | null>(null);

    const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://www.inexraresearch.com";

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const res  = await fetch(`/api/suppliers?projectId=${project.id}`);
            const data = await res.json();
            if (data.success) {
                setSuppliers(data.data);
                setExpandedSuppliers((prev) => {
                    const next = { ...prev };
                    data.data.forEach((s: Supplier) => {
                        if (next[s._id] === undefined) next[s._id] = true;
                    });
                    return next;
                });
            }
        } catch {
            toast.error("Failed to load suppliers");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, [project.id]);

    const handleAddSupplier = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newSupplierName.trim() || !newSupplierLink.trim()) {
            toast.warning("Please fill in supplier name and original survey link");
            return;
        }

        setAddingSupplier(true);
        try {
            const res = await fetch("/api/suppliers", {
                method : "POST",
                headers: { "Content-Type": "application/json" },
                body   : JSON.stringify({
                    projectId         : project.id,
                    supplierName      : newSupplierName.trim(),
                    originalLink      : newSupplierLink.trim(),
                    cpi               : parseFloat(newSupplierCpi) || 0,
                    requiredCompletes : parseInt(newSupplierReqComp, 10) || 0,
                    maxRedirects      : parseInt(newSupplierMaxRedir, 10) || 500000,
                }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success("Supplier added successfully with auto-generated links!");
                setNewSupplierName("");
                setNewSupplierLink("");
                setNewSupplierCpi("");
                setNewSupplierReqComp("");
                setNewSupplierMaxRedir("500000");
                fetchSuppliers();
            } else {
                toast.error(data.error || "Failed to add supplier");
            }
        } catch {
            toast.error("Network error adding supplier");
        } finally {
            setAddingSupplier(false);
        }
    };

    const copyToClipboard = (text: string, key: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
        toast.info(`${label} copied to clipboard`);
    };

    const toggleSupplierExpansion = (id: string) => {
        setExpandedSuppliers((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const handleToggleStatus = async (sup: Supplier) => {
        const nextStatus = sup.status === "paused" ? "active" : "paused";
        setActionLoadingId(sup._id);
        try {
            const res = await fetch("/api/suppliers", {
                method : "PATCH",
                headers: { "Content-Type": "application/json" },
                body   : JSON.stringify({ id: sup._id, status: nextStatus }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success(`Supplier "${sup.supplierName}" marked as ${nextStatus}`);
                fetchSuppliers();
            } else {
                toast.error(data.error || "Failed to update supplier status");
            }
        } catch {
            toast.error("Network error");
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleDeleteSupplier = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to remove supplier "${name}"? This action cannot be undone.`)) {
            return;
        }
        setActionLoadingId(id);
        try {
            const res = await fetch(`/api/suppliers?id=${id}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success(`Supplier "${name}" removed successfully`);
                fetchSuppliers();
            } else {
                toast.error(data.error || "Failed to delete supplier");
            }
        } catch {
            toast.error("Network error");
        } finally {
            setActionLoadingId(null);
        }
    };

    return (
        <div className="flex flex-col gap-4 p-5 h-full overflow-hidden bg-neutral-50/50">
            {/* ── Add New Supplier Card ────────────────────────────────────── */}
            <form onSubmit={handleAddSupplier} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3 flex-shrink-0">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5 text-inexra-teal" /> Add New Supplier
                    </span>
                    <span className="text-[11px] text-gray-400">Configure partner targeting, caps & links</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    {/* Supplier Name */}
                    <div className="md:col-span-4 space-y-1">
                        <Label className="text-[11px] font-semibold text-gray-600">Supplier Name *</Label>
                        <Input
                            value={newSupplierName}
                            onChange={(e) => setNewSupplierName(e.target.value)}
                            placeholder="e.g. Cint, Lucid, PureSpectrum"
                            className="h-8 text-xs bg-gray-50/50 focus:bg-white"
                        />
                    </div>

                    {/* Original Survey Link */}
                    <div className="md:col-span-8 space-y-1">
                        <Label className="text-[11px] font-semibold text-gray-600">Original Survey Link *</Label>
                        <Input
                            value={newSupplierLink}
                            onChange={(e) => setNewSupplierLink(e.target.value)}
                            placeholder="https://client-survey.com/entry?pid=...&uid=[uid]"
                            className="h-8 text-xs bg-gray-50/50 focus:bg-white font-mono text-[11px]"
                        />
                    </div>

                    {/* CPI */}
                    <div className="md:col-span-3 space-y-1">
                        <Label className="text-[11px] font-semibold text-gray-600">Supplier CPI ($)</Label>
                        <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={newSupplierCpi}
                            onChange={(e) => setNewSupplierCpi(e.target.value)}
                            placeholder="0.00"
                            className="h-8 text-xs bg-gray-50/50 focus:bg-white"
                        />
                    </div>

                    {/* Required Completes */}
                    <div className="md:col-span-3 space-y-1">
                        <Label className="text-[11px] font-semibold text-gray-600">Req Completes</Label>
                        <Input
                            type="number"
                            min="0"
                            step="1"
                            value={newSupplierReqComp}
                            onChange={(e) => setNewSupplierReqComp(e.target.value)}
                            placeholder="0 (Unlimited)"
                            className="h-8 text-xs bg-gray-50/50 focus:bg-white"
                        />
                    </div>

                    {/* Max Redirects */}
                    <div className="md:col-span-3 space-y-1">
                        <Label className="text-[11px] font-semibold text-gray-600">Max Redirects (Cap)</Label>
                        <Input
                            type="number"
                            min="0"
                            step="100"
                            value={newSupplierMaxRedir}
                            onChange={(e) => setNewSupplierMaxRedir(e.target.value)}
                            placeholder="500000"
                            className="h-8 text-xs bg-gray-50/50 focus:bg-white"
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="md:col-span-3 flex items-end">
                        <Button
                            type="submit"
                            disabled={addingSupplier}
                            size="sm"
                            className="w-full h-8 bg-inexra-teal hover:bg-teal-600 text-white text-xs font-semibold shadow-sm"
                        >
                            {addingSupplier ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Adding...
                                </>
                            ) : (
                                <>
                                    <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Supplier
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </form>

            {/* ── Connected Suppliers List ─────────────────────────────────── */}
            <div className="border border-gray-200 rounded-xl overflow-hidden flex flex-col flex-1 min-h-0 bg-white shadow-sm">
                <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Connected Suppliers ({suppliers.length})
                        </span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={fetchSuppliers}
                        disabled={loading}
                        className="h-7 text-xs text-gray-500 hover:text-gray-800"
                    >
                        <RefreshCw className={cn("w-3 h-3 mr-1", loading && "animate-spin")} /> Refresh
                    </Button>
                </div>

                <ScrollArea className="flex-1 p-4">
                    {loading && suppliers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-gray-400 gap-2">
                            <Loader2 className="w-6 h-6 animate-spin text-inexra-teal" />
                            <span className="text-xs">Loading suppliers...</span>
                        </div>
                    ) : suppliers.length === 0 ? (
                        <div className="text-center p-12 text-gray-400 text-xs">
                            No suppliers connected to this project yet. Use the form above to add one.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {suppliers.map((sup) => {
                                const isExpanded = expandedSuppliers[sup._id] ?? true;
                                const isActionLoading = actionLoadingId === sup._id;

                                // Auto-generated links
                                const liveSurveyUrl = sup.surveyLink || `${baseUrl}/api/s/${sup.trackingSlug}?uid=[uid]`;
                                const testSurveyUrl = sup.testLink || `${baseUrl}/api/s/${sup.trackingSlug}?uid=TEST_USER`;
                                const completeUrl   = sup.completionUrl || `${baseUrl}/client-redirect-url?uid=[uid]&status=complete`;
                                const terminateUrl  = sup.terminateUrl || `${baseUrl}/client-redirect-url?uid=[uid]&status=terminate`;
                                const quotaFullUrl  = sup.quotaFullUrl || `${baseUrl}/client-redirect-url?uid=[uid]&status=quota_full`;
                                const securityUrl   = sup.securityUrl || `${baseUrl}/client-redirect-url?uid=[uid]&status=security_terminate`;

                                const isPaused = sup.status === "paused";

                                return (
                                    <div
                                        key={sup._id}
                                        className={cn(
                                            "border rounded-xl transition-all overflow-hidden bg-white shadow-sm",
                                            isPaused ? "border-amber-200 bg-amber-50/20" : "border-gray-200 hover:border-gray-300"
                                        )}
                                    >
                                        {/* Card Header & Controls */}
                                        <div className="p-3.5 bg-gradient-to-r from-gray-50/80 to-white border-b border-gray-100 flex flex-wrap items-center justify-between gap-2.5">
                                            {/* Supplier identity & status */}
                                            <div className="flex items-center gap-2.5">
                                                <span className="font-bold text-sm text-gray-800">
                                                    {sup.supplierName}
                                                </span>
                                                <Badge
                                                    className={cn(
                                                        "text-[10px] px-2 py-0.5 font-semibold uppercase tracking-wider",
                                                        isPaused
                                                            ? "bg-amber-100 text-amber-700 border-amber-200"
                                                            : "bg-emerald-100 text-emerald-700 border-emerald-200"
                                                    )}
                                                >
                                                    {sup.status || "active"}
                                                </Badge>

                                                {/* Target info pills */}
                                                <div className="hidden sm:flex items-center gap-2 text-[11px] text-gray-500 bg-gray-100/70 px-2 py-0.5 rounded-md border border-gray-200/60">
                                                    <span>CPI: <strong className="text-gray-700">${(sup.cpi ?? 0).toFixed(2)}</strong></span>
                                                    <span className="text-gray-300">•</span>
                                                    <span>Req: <strong className="text-gray-700">{sup.completes ?? 0} / {sup.requiredCompletes ? sup.requiredCompletes : "∞"}</strong></span>
                                                    <span className="text-gray-300">•</span>
                                                    <span>Cap: <strong className="text-gray-700">{(sup.maxRedirects ?? 500000).toLocaleString()}</strong></span>
                                                </div>
                                            </div>

                                            {/* Per-Supplier Stats Pills */}
                                            <div className="flex items-center flex-wrap gap-1.5">
                                                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium" title="Total hits / clicks">
                                                    <span className="text-slate-400 font-normal">Hits:</span>
                                                    <strong className="font-bold">{sup.hits ?? 0}</strong>
                                                </div>

                                                <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded text-[11px] font-medium" title="Completed surveys">
                                                    <span className="text-emerald-400 font-normal">Completes:</span>
                                                    <strong className="font-bold">{sup.completes ?? 0}</strong>
                                                </div>

                                                <div className="flex items-center gap-1 bg-red-50 border border-red-200 text-red-700 px-2 py-0.5 rounded text-[11px] font-medium" title="Disqualified / Terminated">
                                                    <span className="text-red-400 font-normal">DQ:</span>
                                                    <strong className="font-bold">{sup.disqualified ?? 0}</strong>
                                                </div>

                                                <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded text-[11px] font-medium" title="Quota Full">
                                                    <span className="text-amber-400 font-normal">Quota:</span>
                                                    <strong className="font-bold">{sup.quotaFull ?? 0}</strong>
                                                </div>

                                                <div className="flex items-center gap-1 bg-purple-50 border border-purple-200 text-purple-700 px-2 py-0.5 rounded text-[11px] font-medium" title="Security Terminated">
                                                    <span className="text-purple-400 font-normal">Security:</span>
                                                    <strong className="font-bold">{sup.securityTerm ?? 0}</strong>
                                                </div>

                                                {/* Action buttons */}
                                                <div className="flex items-center gap-1 ml-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        disabled={isActionLoading}
                                                        onClick={() => handleToggleStatus(sup)}
                                                        className={cn(
                                                            "h-7 px-2 text-[11px] font-medium",
                                                            isPaused
                                                                ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                                : "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                                        )}
                                                        title={isPaused ? "Activate Supplier" : "Pause Supplier"}
                                                    >
                                                        {isPaused ? <Play className="w-3 h-3 mr-1" /> : <Pause className="w-3 h-3 mr-1" />}
                                                        {isPaused ? "Resume" : "Pause"}
                                                    </Button>

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => toggleSupplierExpansion(sup._id)}
                                                        className="h-7 px-2 text-[11px] text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                                    >
                                                        <Link2 className="w-3 h-3 mr-1 text-inexra-teal" />
                                                        Links
                                                        {isExpanded ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                                                    </Button>

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        disabled={isActionLoading}
                                                        onClick={() => handleDeleteSupplier(sup._id, sup.supplierName)}
                                                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        title="Remove supplier"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Auto-Generated Links Section */}
                                        {isExpanded && (
                                            <div className="p-3.5 space-y-3 bg-white text-xs">
                                                {/* Entry Links */}
                                                <div>
                                                    <div className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                        <span className="w-2 h-2 rounded-full bg-inexra-teal inline-block" />
                                                        Supplier Entry Links (Provide to Partner)
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                                        {/* Live Survey Link */}
                                                        <div className="space-y-1 bg-gray-50/70 p-2 rounded-lg border border-gray-100">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[11px] font-semibold text-gray-700 flex items-center gap-1">
                                                                    <Badge className="bg-blue-100 text-blue-700 border-0 text-[9px] px-1.5 py-0">LIVE</Badge>
                                                                    Survey Entry Link
                                                                </span>
                                                                <span className="text-[10px] text-gray-400 font-mono">replace [uid]</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <Input
                                                                    readOnly
                                                                    value={liveSurveyUrl}
                                                                    className="h-7 text-[11px] font-mono bg-white text-gray-700 select-all"
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className={cn(
                                                                        "h-7 px-2.5 text-[10px] font-semibold flex-shrink-0 transition-colors",
                                                                        copiedKey === `${sup._id}-live`
                                                                            ? "bg-emerald-50 text-emerald-600 border-emerald-300"
                                                                            : "hover:bg-gray-100 text-gray-700"
                                                                    )}
                                                                    onClick={() => copyToClipboard(liveSurveyUrl, `${sup._id}-live`, "Live Survey Link")}
                                                                >
                                                                    {copiedKey === `${sup._id}-live` ? (
                                                                        <><Check className="w-3 h-3 mr-1 text-emerald-600" /> Copied</>
                                                                    ) : (
                                                                        <><Copy className="w-3 h-3 mr-1" /> Copy</>
                                                                    )}
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-7 w-7 p-0 flex-shrink-0 text-gray-400 hover:text-blue-600"
                                                                    onClick={() => window.open(liveSurveyUrl.replace("[uid]", "PREVIEW_USER"), "_blank")}
                                                                    title="Open preview in new tab"
                                                                >
                                                                    <ExternalLink className="w-3 h-3" />
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        {/* Test Survey Link */}
                                                        <div className="space-y-1 bg-gray-50/70 p-2 rounded-lg border border-gray-100">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[11px] font-semibold text-gray-700 flex items-center gap-1">
                                                                    <Badge className="bg-purple-100 text-purple-700 border-0 text-[9px] px-1.5 py-0">TEST</Badge>
                                                                    Test Entry Link
                                                                </span>
                                                                <span className="text-[10px] text-gray-400 font-mono">uid=TEST_USER</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <Input
                                                                    readOnly
                                                                    value={testSurveyUrl}
                                                                    className="h-7 text-[11px] font-mono bg-white text-gray-700 select-all"
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className={cn(
                                                                        "h-7 px-2.5 text-[10px] font-semibold flex-shrink-0 transition-colors",
                                                                        copiedKey === `${sup._id}-test`
                                                                            ? "bg-emerald-50 text-emerald-600 border-emerald-300"
                                                                            : "hover:bg-gray-100 text-gray-700"
                                                                    )}
                                                                    onClick={() => copyToClipboard(testSurveyUrl, `${sup._id}-test`, "Test Link")}
                                                                >
                                                                    {copiedKey === `${sup._id}-test` ? (
                                                                        <><Check className="w-3 h-3 mr-1 text-emerald-600" /> Copied</>
                                                                    ) : (
                                                                        <><Copy className="w-3 h-3 mr-1" /> Copy</>
                                                                    )}
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-7 w-7 p-0 flex-shrink-0 text-gray-400 hover:text-purple-600"
                                                                    onClick={() => window.open(testSurveyUrl, "_blank")}
                                                                    title="Open test link in new tab"
                                                                >
                                                                    <ExternalLink className="w-3 h-3" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* 4 Auto-Generated Redirect URLs */}
                                                <div>
                                                    <div className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                                                        <span className="flex items-center gap-1.5">
                                                            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                                                            Auto-Generated Redirect URLs (Give to Supplier)
                                                        </span>
                                                        <span className="text-[10px] font-normal text-gray-400">
                                                            Redirects respondent back on survey outcome
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                                        {/* 1. Complete Redirect */}
                                                        <div className="space-y-1 bg-emerald-50/40 p-2 rounded-lg border border-emerald-100">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
                                                                    <Badge className="bg-emerald-500 text-white border-0 text-[9px] px-1.5 py-0">Complete</Badge>
                                                                    Success Redirect
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <Input
                                                                    readOnly
                                                                    value={completeUrl}
                                                                    className="h-7 text-[11px] font-mono bg-white text-gray-700 select-all border-emerald-200"
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className={cn(
                                                                        "h-7 px-2.5 text-[10px] font-semibold flex-shrink-0 transition-colors border-emerald-200",
                                                                        copiedKey === `${sup._id}-comp`
                                                                            ? "bg-emerald-600 text-white"
                                                                            : "hover:bg-emerald-50 text-emerald-700"
                                                                    )}
                                                                    onClick={() => copyToClipboard(completeUrl, `${sup._id}-comp`, "Complete Redirect URL")}
                                                                >
                                                                    {copiedKey === `${sup._id}-comp` ? (
                                                                        <><Check className="w-3 h-3 mr-1 text-white" /> Copied</>
                                                                    ) : (
                                                                        <><Copy className="w-3 h-3 mr-1" /> Copy</>
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        {/* 2. Disqualify / Terminate Redirect */}
                                                        <div className="space-y-1 bg-red-50/40 p-2 rounded-lg border border-red-100">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[11px] font-bold text-red-800 flex items-center gap-1.5">
                                                                    <Badge className="bg-red-500 text-white border-0 text-[9px] px-1.5 py-0">DQ</Badge>
                                                                    Disqualify / Terminate
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <Input
                                                                    readOnly
                                                                    value={terminateUrl}
                                                                    className="h-7 text-[11px] font-mono bg-white text-gray-700 select-all border-red-200"
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className={cn(
                                                                        "h-7 px-2.5 text-[10px] font-semibold flex-shrink-0 transition-colors border-red-200",
                                                                        copiedKey === `${sup._id}-dq`
                                                                            ? "bg-red-600 text-white"
                                                                            : "hover:bg-red-50 text-red-700"
                                                                    )}
                                                                    onClick={() => copyToClipboard(terminateUrl, `${sup._id}-dq`, "Disqualify URL")}
                                                                >
                                                                    {copiedKey === `${sup._id}-dq` ? (
                                                                        <><Check className="w-3 h-3 mr-1 text-white" /> Copied</>
                                                                    ) : (
                                                                        <><Copy className="w-3 h-3 mr-1" /> Copy</>
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        {/* 3. Quota Full Redirect */}
                                                        <div className="space-y-1 bg-amber-50/40 p-2 rounded-lg border border-amber-100">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[11px] font-bold text-amber-800 flex items-center gap-1.5">
                                                                    <Badge className="bg-amber-500 text-white border-0 text-[9px] px-1.5 py-0">Quota</Badge>
                                                                    Quota Full Redirect
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <Input
                                                                    readOnly
                                                                    value={quotaFullUrl}
                                                                    className="h-7 text-[11px] font-mono bg-white text-gray-700 select-all border-amber-200"
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className={cn(
                                                                        "h-7 px-2.5 text-[10px] font-semibold flex-shrink-0 transition-colors border-amber-200",
                                                                        copiedKey === `${sup._id}-quota`
                                                                            ? "bg-amber-600 text-white"
                                                                            : "hover:bg-amber-50 text-amber-700"
                                                                    )}
                                                                    onClick={() => copyToClipboard(quotaFullUrl, `${sup._id}-quota`, "Quota Full URL")}
                                                                >
                                                                    {copiedKey === `${sup._id}-quota` ? (
                                                                        <><Check className="w-3 h-3 mr-1 text-white" /> Copied</>
                                                                    ) : (
                                                                        <><Copy className="w-3 h-3 mr-1" /> Copy</>
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        {/* 4. Security Terminate Redirect */}
                                                        <div className="space-y-1 bg-purple-50/40 p-2 rounded-lg border border-purple-100">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[11px] font-bold text-purple-800 flex items-center gap-1.5">
                                                                    <Badge className="bg-purple-500 text-white border-0 text-[9px] px-1.5 py-0">Security</Badge>
                                                                    Security Terminate Redirect
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <Input
                                                                    readOnly
                                                                    value={securityUrl}
                                                                    className="h-7 text-[11px] font-mono bg-white text-gray-700 select-all border-purple-200"
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className={cn(
                                                                        "h-7 px-2.5 text-[10px] font-semibold flex-shrink-0 transition-colors border-purple-200",
                                                                        copiedKey === `${sup._id}-sec`
                                                                            ? "bg-purple-600 text-white"
                                                                            : "hover:bg-purple-50 text-purple-700"
                                                                    )}
                                                                    onClick={() => copyToClipboard(securityUrl, `${sup._id}-sec`, "Security URL")}
                                                                >
                                                                    {copiedKey === `${sup._id}-sec` ? (
                                                                        <><Check className="w-3 h-3 mr-1 text-white" /> Copied</>
                                                                    ) : (
                                                                        <><Copy className="w-3 h-3 mr-1" /> Copy</>
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Original Destination Link reference */}
                                                <div className="pt-2 border-t border-gray-100 flex items-center gap-2 text-[11px] text-gray-500">
                                                    <span className="font-semibold text-gray-600 flex-shrink-0">Destination:</span>
                                                    <span className="truncate font-mono text-[10px] text-gray-600 bg-gray-50 px-2 py-0.5 rounded border">
                                                        {sup.originalLink}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => copyToClipboard(sup.originalLink, `${sup._id}-orig`, "Destination URL")}
                                                        className="hover:text-inexra-teal flex-shrink-0"
                                                        title="Copy original link"
                                                    >
                                                        <Copy className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
            </div>
        </div>
    );
}

// ─── Main Dialog ──────────────────────────────────────────────────────────────

export function EditProjectDialog({ project, open, onClose, onSuccess }: EditProjectDialogProps) {
    const [activeTab, setActiveTab] = useState("overview");

    useEffect(() => {
        if (open) {
            setTimeout(() => setActiveTab("overview"), 0);
        }
    }, [open]);

    if (!project) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent showCloseButton={false} className="sm:max-w-5xl h-[90vh] flex flex-col p-0 gap-0 bg-neutral-50/50">
                {/* Header */}
                <DialogHeader className="px-6 py-4 bg-white border-b border-gray-100 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-base font-bold text-gray-800 uppercase">
                                Edit Project
                            </DialogTitle>
                            <p className="text-xs text-inexra-teal font-medium mt-0.5">{project.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge className={cn("text-xs", STATUS_COLORS[project.status] || "bg-gray-200 text-gray-600")}>
                                {project.status}
                            </Badge>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="h-8 w-8 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                {/* Tabs */}
                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="flex-1 flex flex-col overflow-hidden"
                >
                    <div className="px-6 pt-3 pb-0 bg-white border-b border-gray-100 flex-shrink-0">
                        <TabsList className="h-9 bg-gray-100">
                            <TabsTrigger value="overview"  className="text-xs">Overview</TabsTrigger>
                            <TabsTrigger value="status"    className="text-xs">Status</TabsTrigger>
                            <TabsTrigger value="suppliers" className="text-xs">Suppliers & Links</TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Overview — reuses the AddProjectForm in edit mode */}
                    <TabsContent value="overview" className="flex-1 overflow-hidden p-6 bg-white m-0">
                        <OverviewTab
                            project={project}
                            onSuccess={onSuccess}
                            onClose={onClose}
                        />
                    </TabsContent>

                    {/* Status */}
                    <TabsContent value="status" className="flex-1 overflow-auto m-0 bg-white">
                        <StatusTab project={project} onSuccess={onSuccess} />
                    </TabsContent>

                    {/* Suppliers */}
                    <TabsContent value="suppliers" className="flex-1 flex flex-col overflow-hidden m-0 bg-white">
                        <SuppliersTab project={project} />
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
