"use client";

import React, { useState, useEffect } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/frontend/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/frontend/components/ui/tabs";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/frontend/components/ui/table";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/frontend/components/ui/select";
import { Badge } from "@/frontend/components/ui/badge";
import { ScrollArea } from "@/frontend/components/ui/scroll-area";
import { Loader2, Copy, Plus, ExternalLink, X } from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import { toast } from "@/frontend/lib/toast-store";
import { AddProjectForm, type ProjectFormData } from "./AddProjectForm";
import type { Project } from "./ProjectList";
import { PROJECT_STATUSES } from "@/frontend/lib/constants";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Supplier {
    _id          : string;
    supplierName : string;
    originalLink : string;
    trackingSlug : string;
    hits         : number;
    completes    : number;
    status       : string;
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
    const [suppliers, setSuppliers]           = useState<Supplier[]>([]);
    const [loading, setLoading]               = useState(false);
    const [newSupplierName, setNewSupplierName] = useState("");
    const [newSupplierLink, setNewSupplierLink] = useState("");
    const [addingSupplier, setAddingSupplier] = useState(false);

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const res  = await fetch(`/api/suppliers?projectId=${project.id}`);
            const data = await res.json();
            if (data.success) setSuppliers(data.data);
        } catch {
            toast.error("Failed to load suppliers");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSuppliers(); }, [project.id]);

    const handleAddSupplier = async () => {
        if (!newSupplierName.trim() || !newSupplierLink.trim()) {
            toast.warning("Please fill in supplier name and link");
            return;
        }
        setAddingSupplier(true);
        try {
            const res = await fetch("/api/suppliers", {
                method : "POST",
                headers: { "Content-Type": "application/json" },
                body   : JSON.stringify({
                    projectId    : project.id,
                    supplierName : newSupplierName.trim(),
                    originalLink : newSupplierLink.trim(),
                }),
            });
            if (res.ok) {
                toast.success("Supplier added successfully");
                setNewSupplierName("");
                setNewSupplierLink("");
                fetchSuppliers();
            } else {
                toast.error("Failed to add supplier");
            }
        } catch {
            toast.error("Network error");
        } finally {
            setAddingSupplier(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.info("Link copied to clipboard");
    };

    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

    return (
        <div className="flex flex-col gap-4 p-6 h-full overflow-hidden">
            {/* Add Supplier */}
            <div className="bg-gray-50 p-4 rounded-lg border space-y-3 flex-shrink-0">
                <h3 className="text-xs font-bold text-gray-700 uppercase">Add New Supplier</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <Label className="text-xs">Supplier Name</Label>
                        <Input
                            value={newSupplierName}
                            onChange={(e) => setNewSupplierName(e.target.value)}
                            placeholder="e.g. Cint, Lucid"
                            className="h-8 text-xs bg-white"
                        />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                        <Label className="text-xs">Original Survey Link</Label>
                        <div className="flex gap-2">
                            <Input
                                value={newSupplierLink}
                                onChange={(e) => setNewSupplierLink(e.target.value)}
                                placeholder="https://client-survey.com/..."
                                className="h-8 text-xs bg-white"
                            />
                            <Button
                                onClick={handleAddSupplier}
                                disabled={addingSupplier}
                                size="sm"
                                className="h-8 bg-inexra-teal hover:bg-teal-600 text-white flex-shrink-0"
                            >
                                {addingSupplier ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-4 h-4" />}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Suppliers list */}
            <div className="border rounded-md overflow-hidden flex flex-col flex-1 min-h-0">
                <div className="bg-gray-100 px-4 py-2 text-xs font-bold text-gray-600 uppercase border-b flex-shrink-0">
                    Connected Suppliers ({suppliers.length})
                </div>
                <ScrollArea className="flex-1 bg-white">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="animate-spin text-gray-400" />
                        </div>
                    ) : suppliers.length === 0 ? (
                        <div className="text-center p-8 text-gray-400 text-sm">
                            No suppliers added yet.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-xs w-[150px]">Name</TableHead>
                                    <TableHead className="text-xs">Tracking Link</TableHead>
                                    <TableHead className="text-xs w-[80px]">Hits</TableHead>
                                    <TableHead className="text-xs w-[80px]">Comp</TableHead>
                                    <TableHead className="text-xs w-[80px] text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {suppliers.map((sup) => {
                                    const trackingUrl = `${baseUrl}/api/s/${sup.trackingSlug}`;
                                    return (
                                        <TableRow key={sup._id}>
                                            <TableCell className="font-medium text-xs">{sup.supplierName}</TableCell>
                                            <TableCell className="text-xs">
                                                <div className="flex items-center gap-1.5 bg-gray-50 p-1.5 rounded border max-w-xs">
                                                    <span className="truncate flex-1 text-gray-600 font-mono text-[10px]">
                                                        {trackingUrl}
                                                    </span>
                                                    <button onClick={() => copyToClipboard(trackingUrl)} className="hover:text-blue-600 transition-colors">
                                                        <Copy className="w-3 h-3" />
                                                    </button>
                                                    <button onClick={() => window.open(trackingUrl, "_blank")} className="hover:text-blue-600 transition-colors">
                                                        <ExternalLink className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs font-bold text-gray-700">{sup.hits}</TableCell>
                                            <TableCell className="text-xs font-bold text-green-600">{sup.completes}</TableCell>
                                            <TableCell className="text-xs text-right">
                                                <Button variant="ghost" size="sm" className="h-6 text-[10px] text-red-500 hover:text-red-700">
                                                    Remove
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
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
        if (open) setActiveTab("overview");
    }, [open]);

    if (!project) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent showCloseButton={false} className="sm:max-w-4xl h-[90vh] flex flex-col p-0 gap-0 bg-neutral-50/50">
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
