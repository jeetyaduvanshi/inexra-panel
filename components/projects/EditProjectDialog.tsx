"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Copy, Plus, ExternalLink } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Project } from "./ProjectList"; // Import type

interface Supplier {
    _id: string;
    supplierName: string;
    originalLink: string;
    trackingSlug: string;
    hits: number;
    completes: number;
    status: string;
}

interface EditProjectDialogProps {
    project: Project | null;
    open: boolean;
    onClose: () => void;
}

export function EditProjectDialog({ project, open, onClose }: EditProjectDialogProps) {
    const [activeTab, setActiveTab] = useState("suppliers");
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(false);

    // Add Supplier Form State
    const [newSupplierName, setNewSupplierName] = useState("");
    const [newSupplierLink, setNewSupplierLink] = useState("");
    const [addingSupplier, setAddingSupplier] = useState(false);

    useEffect(() => {
        if (open && project && activeTab === "suppliers") {
            fetchSuppliers();
        }
    }, [open, project, activeTab]);

    const fetchSuppliers = async () => {
        if (!project) return;
        setLoading(true);
        try {
            // Mapping UI ID to MongoDB _id if needed, assuming project.id is the _id
            const res = await fetch(`/api/suppliers?projectId=${project.id}`);
            const data = await res.json();
            if (data.success) {
                setSuppliers(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch suppliers", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSupplier = async () => {
        if (!newSupplierName || !newSupplierLink || !project) {
            alert("Please fill in all fields");
            return;
        }

        setAddingSupplier(true);
        try {
            const res = await fetch("/api/suppliers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId: project.id,
                    supplierName: newSupplierName,
                    originalLink: newSupplierLink
                }),
            });

            if (res.ok) {
                setNewSupplierName("");
                setNewSupplierLink("");
                fetchSuppliers(); // Refresh list
            } else {
                alert("Failed to add supplier");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setAddingSupplier(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("Link copied!");
    };

    if (!project) return null;

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle className="uppercase text-lg font-bold text-gray-800">
                        Edit Project: <span className="text-inexra-teal">{project.name}</span>
                    </DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-6 pt-2">
                        <TabsList>
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="suppliers">Suppliers & Links</TabsTrigger>
                            <TabsTrigger value="settings">Settings</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="overview" className="flex-1 p-6">
                        <div className="text-gray-500 text-sm">Project details editing coming soon...</div>
                    </TabsContent>

                    <TabsContent value="suppliers" className="flex-1 flex flex-col overflow-hidden p-0">
                        <div className="flex-1 flex flex-col p-6 gap-6 overflow-hidden">
                            {/* Add Supplier Section */}
                            <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
                                <h3 className="text-sm font-bold text-gray-700 uppercase">Add New Supplier</h3>
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
                                                className="h-8 bg-inexra-teal hover:bg-teal-600 text-white"
                                            >
                                                {addingSupplier ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-4 h-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Suppliers List */}
                            <div className="flex-1 border rounded-md overflow-hidden flex flex-col">
                                <div className="bg-gray-100 px-4 py-2 text-xs font-bold text-gray-600 uppercase border-b">
                                    Connected Suppliers
                                </div>
                                <ScrollArea className="flex-1 bg-white">
                                    {loading ? (
                                        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-gray-400" /></div>
                                    ) : suppliers.length === 0 ? (
                                        <div className="text-center p-8 text-gray-400 text-sm">No suppliers added yet.</div>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="text-xs w-[150px]">Name</TableHead>
                                                    <TableHead className="text-xs">Tracking Link (Send this to Supplier)</TableHead>
                                                    <TableHead className="text-xs w-[80px]">Hits</TableHead>
                                                    <TableHead className="text-xs w-[80px]">Comp</TableHead>
                                                    <TableHead className="text-xs w-[100px] text-right">Action</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {suppliers.map((sup) => {
                                                    const trackingUrl = `${baseUrl}/api/s/${sup.trackingSlug}`;
                                                    return (
                                                        <TableRow key={sup._id}>
                                                            <TableCell className="font-medium text-xs">{sup.supplierName}</TableCell>
                                                            <TableCell className="text-xs">
                                                                <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded border max-w-md">
                                                                    <span className="truncate flex-1 text-gray-600 font-mono text-[10px]">{trackingUrl}</span>
                                                                    <Button variant="ghost" size="icon" className="h-5 w-5 hover:text-blue-600" onClick={() => copyToClipboard(trackingUrl)}>
                                                                        <Copy className="w-3 h-3" />
                                                                    </Button>
                                                                    <Button variant="ghost" size="icon" className="h-5 w-5 hover:text-blue-600" onClick={() => window.open(trackingUrl, '_blank')}>
                                                                        <ExternalLink className="w-3 h-3" />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-xs font-bold text-gray-700">{sup.hits}</TableCell>
                                                            <TableCell className="text-xs font-bold text-green-600">{sup.completes}</TableCell>
                                                            <TableCell className="text-xs text-right">
                                                                <Button variant="ghost" size="sm" className="h-6 text-[10px] text-red-500 hover:text-red-700">Remove</Button>
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
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
