"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/frontend/lib/utils";
import { Loader2 } from "lucide-react";
import { ProjectStatusModal } from "./ProjectStatusModal";

interface Stats {
    total?: number;
    Running?: number;
    Bidding?: number;
    Testing?: number;
    Hold?: number;
    Completed?: number;
    Closed?: number;
}

const STAT_CARDS = [
    { key: "total", label: "Total", modalTitle: "All Projects", color: "bg-inexra-navy text-white hover:bg-slate-900" },
    { key: "Running", label: "Running", modalTitle: "Runnings", color: "bg-amber-400 text-white hover:bg-amber-500" },
    { key: "Bidding", label: "Bidding", modalTitle: "Biddings", color: "bg-slate-500 text-white hover:bg-slate-600" },
    { key: "Testing", label: "Testing", modalTitle: "Testings", color: "bg-blue-400 text-white hover:bg-blue-500" },
    { key: "Hold", label: "On Hold", modalTitle: "On Holds", color: "bg-orange-500 text-white bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600" },
    { key: "Completed", label: "Completed", modalTitle: "Completed Projects", color: "bg-green-500 text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700" },
];

export function DashboardStatsBar() {
    const [stats, setStats] = useState<Stats>({});
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState<{
        open: boolean;
        status: string;
        label: string;
    }>({
        open: false,
        status: "Running",
        label: "Runnings",
    });

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                // Fetch stats by hitting projects API with limit=1 to minimize payload
                const res = await fetch(`/api/projects?limit=1`);
                const data = await res.json();
                if (data.success && data.stats) {
                    setStats(data.stats);
                }
            } catch (error) {
                console.error("Failed to fetch stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="relative">
            {loading && (
                <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center backdrop-blur-sm rounded-lg">
                    <Loader2 className="w-6 h-6 text-inexra-teal animate-spin" />
                </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {STAT_CARDS.map(({ key, label, modalTitle, color }) => (
                    <div
                        key={key}
                        onClick={() =>
                            setModal({
                                open: true,
                                status: key,
                                label: modalTitle,
                            })
                        }
                        className={cn(
                            "rounded-lg px-5 py-4 shadow-sm cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 active:translate-y-0 select-none group relative overflow-hidden",
                            color
                        )}
                        title={`Click to view ${modalTitle}`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="text-3xl font-black leading-none mb-1">
                                {stats[key as keyof Stats] ?? 0}
                            </div>
                            <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity uppercase font-semibold">
                                View →
                            </span>
                        </div>
                        <div className="text-xs font-bold opacity-90 uppercase tracking-wider">
                            {label}
                        </div>
                    </div>
                ))}
            </div>

            <ProjectStatusModal
                open={modal.open}
                onClose={() => setModal((prev) => ({ ...prev, open: false }))}
                status={modal.status}
                statusLabel={modal.label}
            />
        </div>
    );
}
