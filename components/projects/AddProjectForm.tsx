"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
    ALL_COUNTRIES,
    ALL_CURRENCIES,
    ALL_LANGUAGES,
    ALL_CLIENTS
} from "@/lib/constants";

export function AddProjectForm({ onClose, onSuccess }: { onClose: () => void; onSuccess?: () => void }) {
    const [loading, setLoading] = React.useState(false);
    const [formData, setFormData] = React.useState({
        projectName: "",
        studyType: "b2b",
        country: "usa",
        currency: "usd",
        ir: "",
        loi: "",
        status: "Bidding"
    });

    const handleChange = (key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async () => {
        if (!formData.projectName || !formData.ir || !formData.loi) {
            alert("Please fill in required fields (Name, IR, LOI)");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (res.ok) {
                alert("Project Created Successfully!");
                if (onSuccess) onSuccess();
                onClose();
            } else {
                alert(data.error || "Failed to create project");
            }
        } catch (error) {
            console.error(error);
            alert("Error creating project");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollArea className="h-[80vh] pr-4">
            <div className="space-y-8 p-1">

                {/* Section 1: Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-gray-600">Self parent</Label>
                        <Input className="h-9 text-xs" disabled placeholder="Auto-generated" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-gray-600">Project Name <span className="text-red-500">*</span></Label>
                        <Input
                            className="h-9 text-xs"
                            value={formData.projectName}
                            onChange={(e) => handleChange("projectName", e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-gray-600">Study Type <span className="text-red-500">*</span></Label>
                        <Select value={formData.studyType} onValueChange={(val) => handleChange("studyType", val)}>
                            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="b2b">B2B</SelectItem>
                                <SelectItem value="b2c">B2C</SelectItem>
                                <SelectItem value="healthcare">Healthcare</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-gray-600">Countries <span className="text-red-500">*</span></Label>
                        <Select value={formData.country} onValueChange={(val) => handleChange("country", val)}>
                            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent className="h-60">
                                {ALL_COUNTRIES.map((c) => (
                                    <SelectItem key={c} value={c.toLowerCase().replace(/\s+/g, '-')}>{c}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-gray-600">Currency <span className="text-red-500">*</span></Label>
                        <Select value={formData.currency} onValueChange={(val) => handleChange("currency", val)}>
                            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent className="h-60">
                                {ALL_CURRENCIES.map((c) => (
                                    <SelectItem key={c} value={c.toLowerCase().replace(/\s+/g, '-')}>{c}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-gray-600">Survey Link</Label>
                        <Textarea className="h-9 min-h-[38px] text-xs resize-none" placeholder="Not connected yet" />
                    </div>
                </div>

                {/* Section 2: Expected Metrics */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-700 uppercase border-b pb-1">EXPECTED METRICS</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600">IR <span className="text-red-500">*</span></Label>
                            <Input
                                className="h-9 text-xs"
                                type="number"
                                value={formData.ir}
                                onChange={(e) => handleChange("ir", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600">LOI <span className="text-red-500">*</span></Label>
                            <Input
                                className="h-9 text-xs"
                                type="number"
                                value={formData.loi}
                                onChange={(e) => handleChange("loi", e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Section 4: Memorandum */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-700 uppercase border-b pb-1">MEMORANDUM</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600">Current Status <span className="text-red-500">*</span></Label>
                            <Select value={formData.status} onValueChange={(val) => handleChange("status", val)}>
                                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Bidding">Bidding</SelectItem>
                                    <SelectItem value="Running">Running</SelectItem>
                                    <SelectItem value="Awaiting">Awaiting</SelectItem>
                                    <SelectItem value="Closed">Closed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="pt-4">
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]"
                    >
                        {loading ? "Saving..." : "Submit"}
                    </Button>
                </div>
            </div>
        </ScrollArea>
    );
}
