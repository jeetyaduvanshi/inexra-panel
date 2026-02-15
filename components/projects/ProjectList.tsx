"use client";

import React, { useState, useEffect } from "react";
import {
    Search,
    RefreshCcw,
    Edit,
    Trash2,
    Eye,
    MoreHorizontal,
    ChevronLeft,
    ChevronRight,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { AddProjectForm } from "@/components/projects/AddProjectForm";
import { ALL_COUNTRIES, ALL_CLIENTS } from "@/lib/constants";

// --- Types ---
export interface Project {
    id: string | number;
    sn: number;
    parent: string | number;
    name: string;
    country: string;
    company: string;
    pm_sm: string;
    startDate: string;
    quota: number;
    hits: number;
    comp: number;
    disqualify: number;
    drop: number; // percentage
    ir: number;   // percentage
    loi: number;
    status: "Running" | "Bidding" | "Testing" | "Hold" | "Completed" | "Closed";
}

// --- Dummy Data ---
const dummyProjects: Project[] = [
    {
        sn: 1,
        id: 5036,
        parent: 0,
        name: "ERS38336",
        country: "USA",
        company: "Epitome Research",
        pm_sm: "Mohd Jilani / R.K Shukla",
        startDate: "23-01-2026",
        quota: 0,
        hits: 73,
        comp: 0,
        disqualify: 66,
        drop: 95.89,
        ir: -90.41,
        loi: 15,
        status: "Running",
    },
    {
        sn: 2,
        id: 5035,
        parent: 5031,
        name: "MMRS12649 - JP - Opinion Elites",
        country: "",
        company: "Market Mirror",
        pm_sm: "Master Ji / R.K Shukla",
        startDate: "23-01-2026",
        quota: 0,
        hits: 1,
        comp: 0,
        disqualify: 0,
        drop: 100.00,
        ir: 0.00,
        loi: 15,
        status: "Running",
    },
    // Add more dummy data if needed to layout rows
    {
        sn: 3,
        id: 5034,
        parent: 0,
        name: "Global Tech Survey 2026",
        country: "UK",
        company: "Inexra Internal",
        pm_sm: "Sarah Smith / KO Shukla",
        startDate: "22-01-2026",
        quota: 500,
        hits: 120,
        comp: 45,
        disqualify: 10,
        drop: 12.5,
        ir: 37.5,
        loi: 10,
        status: "Testing",
    },
    {
        sn: 4,
        id: 5033,
        parent: 0,
        name: "Consumer Goods Index",
        country: "Germany",
        company: "Client X",
        pm_sm: "John Doe / R.K Shukla",
        startDate: "21-01-2026",
        quota: 1000,
        hits: 850,
        comp: 600,
        disqualify: 50,
        drop: 5.0,
        ir: 70.0,
        loi: 20,
        status: "Completed",
    },
];

import { EditProjectDialog } from "./EditProjectDialog";

export function ProjectList() {
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const [isAddOpen, setIsAddOpen] = useState(false);

    // Edit Dialog State
    const [editProject, setEditProject] = useState<Project | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/projects");
            const data = await res.json();
            if (res.ok && data.data) {
                // Map MongoDB documents to the Table interface
                const mappedProjects = data.data.map((p: any, idx: number) => ({
                    id: p._id,
                    sn: idx + 1,
                    parent: 0, // Not in schema yet
                    name: p.projectName,
                    country: p.country,
                    company: "Client X", // Not in schema yet
                    pm_sm: "PM / SM",     // Not in schema yet
                    startDate: new Date(p.createdAt).toLocaleDateString(),
                    quota: 0,
                    hits: p.hits || 0, // Now coming from DB
                    comp: 0,
                    disqualify: 0,
                    drop: 0,
                    ir: p.ir,
                    loi: p.loi,
                    status: p.status
                }));
                setProjects(mappedProjects);
            }
        } catch (error) {
            console.error("Failed to fetch projects", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleEdit = (project: Project) => {
        setEditProject(project);
        setIsEditOpen(true);
    };

    const handleRefresh = () => {
        fetchProjects();
    };

    return (
        <div className="space-y-6 relative">
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="max-w-5xl h-[90vh] p-0 flex flex-col gap-0 bg-neutral-50/50">
                    <DialogHeader className="px-6 py-4 bg-white border-b border-gray-100 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <DialogTitle className="text-xl font-bold text-gray-800 uppercase">ADD PROJECT</DialogTitle>
                            <Button variant="ghost" size="sm" onClick={() => setIsAddOpen(false)} className="bg-slate-500 hover:bg-slate-600 text-white h-7 px-3 text-xs">BACK</Button>
                        </div>
                    </DialogHeader>
                    <div className="flex-1 overflow-hidden p-6 bg-white">
                        <AddProjectForm onClose={() => setIsAddOpen(false)} onSuccess={fetchProjects} />
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Project Dialog */}
            <EditProjectDialog
                open={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                project={editProject}
            />


            {/* Loader Overlay */}
            {loading && (
                <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center backdrop-blur-sm rounded-lg">
                    <Loader2 className="w-10 h-10 text-inexra-teal animate-spin" />
                </div>
            )}

            {/* 1. Filter Header */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 space-y-4">
                <div className="flex justify-between items-center border-b pb-2 mb-4">
                    <h2 className="text-lg font-bold text-inexra-navy uppercase">ADD PROJECT</h2>
                    <Button
                        onClick={() => setIsAddOpen(true)}
                        className="bg-slate-500 hover:bg-slate-600 text-white font-bold h-8 px-4 text-xs uppercase"
                    >
                        Add
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-4">
                    {/* Row 1 */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500">ID</label>
                        <Input placeholder="" className="h-9 text-xs" />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500">Self parent</label>
                        <Select>
                            <SelectTrigger className="h-9 text-xs">
                                <SelectValue placeholder="" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">Parent 1</SelectItem>
                                <SelectItem value="2">Parent 2</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500">Project Name</label>
                        <Input placeholder="" className="h-9 text-xs" />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500">Status</label>
                        <Select>
                            <SelectTrigger className="h-9 text-xs text-gray-400">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="bidding">Bidding</SelectItem>
                                <SelectItem value="testing">Testing</SelectItem>
                                <SelectItem value="running">Running</SelectItem>
                                <SelectItem value="hold">Hold</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Row 2 */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500">Country</label>
                        <Select>
                            <SelectTrigger className="h-9 text-xs text-gray-400">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent className="h-60">
                                {ALL_COUNTRIES.map((c) => (
                                    <SelectItem key={c} value={c.toLowerCase().replace(/\s+/g, '-')}>{c}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500">Client</label>
                        <Select>
                            <SelectTrigger className="h-9 text-xs text-gray-400">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent className="h-60">
                                {ALL_CLIENTS.map((c) => (
                                    <SelectItem key={c} value={c.toLowerCase().replace(/\s+/g, '-')}>{c}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500">Manager</label>
                        <Select>
                            <SelectTrigger className="h-9 text-xs text-gray-400">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="m1">Manager 1</SelectItem>
                                <SelectItem value="m2">Manager 2</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500">Sales Manager</label>
                        <Select>
                            <SelectTrigger className="h-9 text-xs text-gray-400">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ko">KO Shukla</SelectItem>
                                <SelectItem value="rk">R.K Shukla</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Buttons Row */}
                    <div className="col-span-1 md:col-span-2 lg:col-span-4 flex items-center gap-2 pt-2">
                        <Button
                            onClick={handleRefresh}
                            className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-6 text-sm font-bold shadow-sm"
                        >
                            Search <Search className="w-4 h-4 ml-2" />
                        </Button>
                        <Button
                            onClick={handleRefresh}
                            className="bg-inexra-teal hover:bg-teal-500 text-white border-none h-9 px-6 text-sm font-bold shadow-sm"
                        >
                            Refresh
                        </Button>
                    </div>
                </div>
            </div>

            {/* 2. Data Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                {/* Table Info Header */}
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/30 flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700">Showing 1 - 20 of 4955</span>
                    {/* Pagination Controls (Top) */}
                    <div className="flex gap-1">
                        <Button variant="outline" size="icon" className="h-8 w-8"><ChevronLeft className="w-4 h-4" /></Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs bg-blue-50 text-blue-600 border-blue-200">1</Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs text-gray-500">2</Button>
                        <Button variant="outline" size="icon" className="h-8 w-8"><ChevronRight className="w-4 h-4" /></Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50 hover:bg-gray-50">
                                <TableHead className="w-[50px] font-bold text-xs text-gray-600 uppercase">SN</TableHead>
                                <TableHead className="font-bold text-xs text-gray-600 uppercase">ID</TableHead>
                                <TableHead className="font-bold text-xs text-gray-600 uppercase">Parent</TableHead>
                                <TableHead className="min-w-[200px] font-bold text-xs text-gray-600 uppercase">Name</TableHead>
                                <TableHead className="min-w-[150px] font-bold text-xs text-gray-600 uppercase">Company</TableHead>
                                <TableHead className="min-w-[150px] font-bold text-xs text-gray-600 uppercase">PM/SM</TableHead>
                                <TableHead className="font-bold text-xs text-gray-600 uppercase">Start Date</TableHead>
                                <TableHead className="font-bold text-xs text-gray-600 uppercase">Quota</TableHead>
                                <TableHead className="font-bold text-xs text-gray-600 uppercase">Hits</TableHead>
                                <TableHead className="font-bold text-xs text-gray-600 uppercase">Comp</TableHead>
                                <TableHead className="font-bold text-xs text-gray-600 uppercase">Disqualify</TableHead>
                                <TableHead className="font-bold text-xs text-gray-600 uppercase">Drop</TableHead>
                                <TableHead className="font-bold text-xs text-gray-600 uppercase">IR</TableHead>
                                <TableHead className="font-bold text-xs text-gray-600 uppercase">LOI</TableHead>
                                <TableHead className="font-bold text-xs text-gray-600 uppercase">Status</TableHead>
                                <TableHead className="text-right font-bold text-xs text-gray-600 uppercase">#</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {projects.map((project) => (
                                <TableRow key={project.id} className="hover:bg-blue-50/30 transition-colors">
                                    <TableCell className="text-xs text-gray-600">{project.sn}</TableCell>
                                    <TableCell className="text-xs text-gray-600 font-medium">{project.id}</TableCell>
                                    <TableCell className="text-xs text-gray-600">{project.parent}</TableCell>
                                    <TableCell className="text-xs text-gray-700">
                                        <div className="font-semibold">{project.name}</div>
                                        {project.country && (
                                            <div className="text-[10px] text-gray-400 mt-1">{project.country}</div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-xs text-gray-600 font-medium">{project.company}</TableCell>
                                    <TableCell className="text-xs text-gray-500 whitespace-pre-wrap">{project.pm_sm}</TableCell>
                                    <TableCell className="text-xs text-gray-500 whitespace-nowrap">{project.startDate.replace(' ', '\n')}</TableCell>
                                    <TableCell className="text-xs text-gray-600">{project.quota}</TableCell>
                                    <TableCell className="text-xs text-gray-600">{project.hits}</TableCell>
                                    <TableCell className="text-xs text-gray-600">{project.comp}</TableCell>
                                    <TableCell className="text-xs text-gray-600">{project.disqualify}</TableCell>
                                    <TableCell className="text-xs text-gray-600">{project.drop.toFixed(2)} %</TableCell>
                                    <TableCell className="text-xs text-gray-600">{project.ir.toFixed(2)} %</TableCell>
                                    <TableCell className="text-xs text-gray-600">{project.loi}</TableCell>
                                    <TableCell>
                                        <Badge
                                            className={cn(
                                                "text-[10px] font-bold px-2 py-0.5 rounded-sm shadow-none",
                                                project.status === 'Running' ? "bg-amber-400 hover:bg-amber-500 text-white border-0" :
                                                    project.status === 'Completed' ? "bg-green-500 hover:bg-green-600 text-white border-0" :
                                                        project.status === 'Testing' ? "bg-blue-400 hover:bg-blue-500 text-white border-0" :
                                                            "bg-gray-200 text-gray-600 hover:bg-gray-300"
                                            )}
                                        >
                                            {project.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex flex-col gap-1 items-end">
                                            <Button size="sm" className="h-6 text-[10px] bg-green-600 hover:bg-green-700 w-16">
                                                View
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="h-6 text-[10px] bg-blue-600 hover:bg-blue-700 w-16"
                                                onClick={() => handleEdit(project)}
                                            >
                                                Edit
                                            </Button>
                                            <Button size="sm" className="h-6 text-[10px] bg-red-500 hover:bg-red-600 w-16">
                                                Delete
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                {/* Footer Pagination */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30 flex justify-end">
                    <div className="flex gap-1">
                        <Button variant="outline" size="sm" disabled className="h-8 w-8 p-0"><ChevronLeft className="w-4 h-4" /></Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs bg-blue-600 text-white border-blue-600">1</Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs hover:bg-gray-100">2</Button>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0"><ChevronRight className="w-4 h-4" /></Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
