"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Checkbox } from "@/frontend/components/ui/checkbox";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/frontend/components/ui/select";
import { ScrollArea } from "@/frontend/components/ui/scroll-area";
import { Loader2, RotateCcw } from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import {
    ALL_COUNTRIES, ALL_CURRENCIES, ALL_LANGUAGES, ALL_CLIENTS,
    ALL_STUDY_TYPES, PROJECT_STATUSES, SUPPORTED_DEVICES,
    ALL_PROJECT_MANAGERS, ALL_SALES_MANAGERS, ALL_SELF_PARENTS
} from "@/frontend/lib/constants";
import { toast } from "@/frontend/lib/toast-store";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ParentProject { _id: string; projectName: string }

export interface ProjectFormData {
    parentId          : string;
    projectName       : string;
    studyType         : string;
    country           : string;
    language          : string;
    currency          : string;
    cpi               : string;
    surveyLink        : string;
    surveyTestLink    : string;
    requiredCompletes : string;
    ir                : string;
    loi               : string;
    supportedDevices  : string[];
    clientName        : string;
    pm                : string;
    sm                : string;
    status            : string;
    notes             : string;
    projectBrief      : string;
}

interface AddProjectFormProps {
    onClose    : () => void;
    onSuccess? : () => void;
    /** Pre-filled data + project ID triggers edit mode */
    initialData?: Partial<ProjectFormData>;
    projectId  ?: string;
}

// ─── Initial state ────────────────────────────────────────────────────────────

const BLANK: ProjectFormData = {
    parentId          : "",
    projectName       : "",
    studyType         : "",
    country           : "",
    language          : "English",
    currency          : "US Dollar",
    cpi               : "",
    surveyLink        : "",
    surveyTestLink    : "",
    requiredCompletes : "",
    ir                : "",
    loi               : "",
    supportedDevices  : ["Desktop", "Mobile", "Tablet"],
    clientName        : "",
    pm                : "",
    sm                : "",
    status            : "Bidding",
    notes             : "",
    projectBrief      : "",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
    return (
        <div className="flex items-center gap-3 mb-5">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">
                {title}
            </span>
            <div className="flex-1 h-px bg-gray-200" />
        </div>
    );
}

function FieldWrapper({
    label, required, error, children, className,
}: {
    label: string; required?: boolean; error?: string;
    children: React.ReactNode; className?: string;
}) {
    return (
        <div className={cn("space-y-1.5", className)}>
            <Label className="text-xs font-semibold text-gray-600">
                {label}
                {required && <span className="text-red-500 ml-0.5">*</span>}
            </Label>
            {children}
            {error && <p className="text-[11px] text-red-500 mt-0.5">{error}</p>}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AddProjectForm({
    onClose, onSuccess, initialData, projectId,
}: AddProjectFormProps) {
    const isEditMode = !!projectId;

    const [form, setForm]       = useState<ProjectFormData>({ ...BLANK, ...initialData });
    const [errors, setErrors]   = useState<Partial<Record<keyof ProjectFormData, string>>>({});
    const [loading, setLoading] = useState(false);
    // (Dynamic fetch removed as options are now hardcoded)

    // ── Sync initialData changes (for edit mode) ───────────────
    useEffect(() => {
        if (initialData) setForm({ ...BLANK, ...initialData });
    }, [initialData]);

    // ── Field helpers ──────────────────────────────────────────
    const set = useCallback(
        (key: keyof ProjectFormData, value: string) =>
            setForm((prev) => ({ ...prev, [key]: value })),
        []
    );

    const toggleDevice = (device: string) => {
        setForm((prev) => {
            const devs = prev.supportedDevices.includes(device)
                ? prev.supportedDevices.filter((d) => d !== device)
                : [...prev.supportedDevices, device];
            return { ...prev, supportedDevices: devs };
        });
    };

    const clearError = (key: keyof ProjectFormData) =>
        setErrors((prev) => { const e = { ...prev }; delete e[key]; return e; });

    // ── Validation ─────────────────────────────────────────────
    const validate = (): boolean => {
        const e: Partial<Record<keyof ProjectFormData, string>> = {};
        if (!form.projectName.trim())  e.projectName  = "Project name is required";
        if (!form.studyType)           e.studyType    = "Study type is required";
        if (!form.country)             e.country      = "Country is required";
        if (!form.currency)            e.currency     = "Currency is required";
        if (!form.ir || isNaN(Number(form.ir)) || Number(form.ir) < 0 || Number(form.ir) > 100)
            e.ir = "IR must be a number between 0 and 100";
        if (!form.loi || isNaN(Number(form.loi)) || Number(form.loi) <= 0)
            e.loi = "LOI must be a positive number";
        if (!form.clientName)          e.clientName   = "Client is required";
        if (!form.status)              e.status       = "Status is required";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    // ── Submit ─────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!validate()) {
            toast.error("Please fix the highlighted errors before submitting.");
            return;
        }

        setLoading(true);
        try {
            const url    = isEditMode ? `/api/projects/${projectId}` : "/api/projects";
            const method = isEditMode ? "PUT" : "POST";

            const payload = {
                ...form,
                ir                : Number(form.ir)               || 0,
                loi               : Number(form.loi)              || 0,
                cpi               : Number(form.cpi)              || 0,
                requiredCompletes : Number(form.requiredCompletes) || 0,
                parentId          : form.parentId || null,
            };

            const res  = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body   : JSON.stringify(payload),
            });
            const data = await res.json();

            if (res.ok && data.success) {
                toast.success(isEditMode ? "Project updated successfully!" : "Project created successfully!");
                onSuccess?.();
                onClose();
            } else {
                toast.error(data.error || (isEditMode ? "Failed to update project" : "Failed to create project"));
            }
        } catch {
            toast.error("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setForm({ ...BLANK, ...initialData });
        setErrors({});
    };

    // ── Render ─────────────────────────────────────────────────
    return (
        <ScrollArea className="h-full pr-2">
            <div className="space-y-8 p-1 pb-6">

                {/* ══════════════════════════════════════════════════════
                    SECTION 1 — BASIC INFORMATION
                ══════════════════════════════════════════════════════ */}
                <section>
                    <SectionHeader title="Basic Information" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">

                        {/* Self Parent */}
                        <FieldWrapper label="Self Parent">
                            <Select
                                value={form.parentId || "Selp Project"}
                                onValueChange={(v) => set("parentId", v === "Selp Project" ? "" : v)}
                            >
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue placeholder="Selp Project" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Selp Project">Selp Project</SelectItem>
                                    {ALL_SELF_PARENTS.map((p) => (
                                        <SelectItem key={p} value={p}>
                                            {p}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FieldWrapper>

                        {/* Project Name */}
                        <FieldWrapper label="Project Name" required error={errors.projectName}>
                            <Input
                                className={cn("h-9 text-xs", errors.projectName && "border-red-400 focus-visible:ring-red-400")}
                                placeholder="Enter project name"
                                value={form.projectName}
                                onChange={(e) => { set("projectName", e.target.value); clearError("projectName"); }}
                            />
                        </FieldWrapper>

                        {/* Study Type */}
                        <FieldWrapper label="Study Type" required error={errors.studyType}>
                            <Select
                                value={form.studyType}
                                onValueChange={(v) => { set("studyType", v); clearError("studyType"); }}
                            >
                                <SelectTrigger className={cn("h-9 text-xs", errors.studyType && "border-red-400")}>
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ALL_STUDY_TYPES.map((t) => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FieldWrapper>

                        {/* Countries */}
                        <FieldWrapper label="Countries" required error={errors.country}>
                            <Select
                                value={form.country}
                                onValueChange={(v) => { set("country", v); clearError("country"); }}
                            >
                                <SelectTrigger className={cn("h-9 text-xs", errors.country && "border-red-400")}>
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                    {ALL_COUNTRIES.map((c) => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FieldWrapper>

                        {/* Languages */}
                        <FieldWrapper label="Languages" required>
                            <Select
                                value={form.language}
                                onValueChange={(v) => set("language", v)}
                            >
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                    {ALL_LANGUAGES.map((l) => (
                                        <SelectItem key={l} value={l}>{l}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FieldWrapper>

                        {/* Currency */}
                        <FieldWrapper label="Currency" required error={errors.currency}>
                            <Select
                                value={form.currency}
                                onValueChange={(v) => { set("currency", v); clearError("currency"); }}
                            >
                                <SelectTrigger className={cn("h-9 text-xs", errors.currency && "border-red-400")}>
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                    {ALL_CURRENCIES.map((c) => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FieldWrapper>

                        {/* Client Budget (CPI) */}
                        <FieldWrapper label="Client's Budget (CPI)">
                            <Input
                                className="h-9 text-xs"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Input cost per interview"
                                value={form.cpi}
                                onChange={(e) => set("cpi", e.target.value)}
                            />
                        </FieldWrapper>

                        {/* Survey Link */}
                        <FieldWrapper label="Survey Link" className="md:col-span-2">
                            <Textarea
                                className="min-h-[60px] text-xs resize-y"
                                placeholder="Paste live survey link here"
                                value={form.surveyLink}
                                onChange={(e) => set("surveyLink", e.target.value)}
                            />
                        </FieldWrapper>

                        {/* Survey Test Link */}
                        <FieldWrapper label="Survey Test Link" className="md:col-span-2">
                            <Textarea
                                className="min-h-[60px] text-xs resize-y"
                                placeholder="Paste test survey link here"
                                value={form.surveyTestLink}
                                onChange={(e) => set("surveyTestLink", e.target.value)}
                            />
                        </FieldWrapper>
                    </div>
                </section>

                {/* ══════════════════════════════════════════════════════
                    SECTION 2 — EXPECTED METRICS & DATA
                ══════════════════════════════════════════════════════ */}
                <section>
                    <SectionHeader title="Expected Metrics & Data" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">

                        {/* Required Completes */}
                        <FieldWrapper label="Req. Completes">
                            <Input
                                className="h-9 text-xs"
                                type="number"
                                min="0"
                                placeholder="Required completes"
                                value={form.requiredCompletes}
                                onChange={(e) => set("requiredCompletes", e.target.value)}
                            />
                        </FieldWrapper>

                        {/* IR */}
                        <FieldWrapper label="IR (Incidence Rate %)" required error={errors.ir}>
                            <Input
                                className={cn("h-9 text-xs", errors.ir && "border-red-400 focus-visible:ring-red-400")}
                                type="number"
                                min="0"
                                max="100"
                                placeholder="e.g. 35"
                                value={form.ir}
                                onChange={(e) => { set("ir", e.target.value); clearError("ir"); }}
                            />
                        </FieldWrapper>

                        {/* LOI */}
                        <FieldWrapper label="LOI (Length of Interview, mins)" required error={errors.loi}>
                            <Input
                                className={cn("h-9 text-xs", errors.loi && "border-red-400 focus-visible:ring-red-400")}
                                type="number"
                                min="0"
                                placeholder="e.g. 15"
                                value={form.loi}
                                onChange={(e) => { set("loi", e.target.value); clearError("loi"); }}
                            />
                        </FieldWrapper>
                    </div>

                    {/* Supported Devices */}
                    <div className="mt-4">
                        <Label className="text-xs font-semibold text-gray-600">
                            Supported Devices
                        </Label>
                        <div className="flex items-center gap-6 mt-2">
                            {SUPPORTED_DEVICES.map((device) => (
                                <label
                                    key={device}
                                    className="flex items-center gap-2 cursor-pointer select-none"
                                >
                                    <Checkbox
                                        id={`device-${device}`}
                                        checked={form.supportedDevices.includes(device)}
                                        onCheckedChange={() => toggleDevice(device)}
                                        className="data-[state=checked]:bg-inexra-teal data-[state=checked]:border-inexra-teal"
                                    />
                                    <span className="text-xs text-gray-700">{device}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ══════════════════════════════════════════════════════
                    SECTION 3 — PEOPLE
                ══════════════════════════════════════════════════════ */}
                <section>
                    <SectionHeader title="People" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">

                        {/* Client */}
                        <FieldWrapper label="Client" required error={errors.clientName}>
                            <Select
                                value={form.clientName}
                                onValueChange={(v) => { set("clientName", v); clearError("clientName"); }}
                            >
                                <SelectTrigger className={cn("h-9 text-xs", errors.clientName && "border-red-400")}>
                                    <SelectValue placeholder="Select client" />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                    {ALL_CLIENTS.map((c) => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FieldWrapper>

                        {/* Project Manager */}
                        <FieldWrapper label="Project Manager">
                            <Select
                                value={form.pm}
                                onValueChange={(v) => set("pm", v)}
                            >
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue placeholder="Select PM" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ALL_PROJECT_MANAGERS.map((m) => (
                                        <SelectItem key={m} value={m}>{m}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FieldWrapper>

                        {/* Sales Manager */}
                        <FieldWrapper label="Sales Manager">
                            <Select
                                value={form.sm}
                                onValueChange={(v) => set("sm", v)}
                            >
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue placeholder="Select SM" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ALL_SALES_MANAGERS.map((m) => (
                                        <SelectItem key={m} value={m}>{m}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FieldWrapper>
                    </div>
                </section>

                {/* ══════════════════════════════════════════════════════
                    SECTION 4 — MEMORANDUM
                ══════════════════════════════════════════════════════ */}
                <section>
                    <SectionHeader title="Memorandum" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">

                        {/* Notes */}
                        <FieldWrapper label="Notes">
                            <Textarea
                                className="min-h-[90px] text-xs resize-none"
                                placeholder="Internal notes about this project"
                                value={form.notes}
                                onChange={(e) => set("notes", e.target.value)}
                            />
                        </FieldWrapper>

                        {/* Project Brief */}
                        <FieldWrapper label="Project Brief">
                            <Textarea
                                className="min-h-[90px] text-xs resize-none"
                                placeholder="Brief description of project objectives"
                                value={form.projectBrief}
                                onChange={(e) => set("projectBrief", e.target.value)}
                            />
                        </FieldWrapper>

                        {/* Current Status */}
                        <FieldWrapper label="Current Status" required error={errors.status}>
                            <Select
                                value={form.status}
                                onValueChange={(v) => { set("status", v); clearError("status"); }}
                            >
                                <SelectTrigger className={cn("h-9 text-xs", errors.status && "border-red-400")}>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {PROJECT_STATUSES.map((s) => (
                                        <SelectItem key={s} value={s}>{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FieldWrapper>
                    </div>
                </section>

                {/* ══════════════════════════════════════════════════════
                    ACTION BUTTONS
                ══════════════════════════════════════════════════════ */}
                <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px] h-9 text-sm font-semibold"
                    >
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {loading ? "Saving…" : isEditMode ? "Save Changes" : "Submit"}
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleReset}
                        disabled={loading}
                        className="h-9 text-sm text-gray-600 hover:text-gray-800"
                    >
                        <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                        Reset
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        disabled={loading}
                        className="h-9 text-sm text-gray-500 hover:text-gray-700 ml-auto"
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </ScrollArea>
    );
}
