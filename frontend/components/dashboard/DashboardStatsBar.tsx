"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/frontend/lib/utils";
import { toast } from "@/frontend/lib/toast-store";
import { Loader2 } from "lucide-react";

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
    { key: "total", label: "Total", color: "bg-inexra-navy text-white" },
    { key: "Running", label: "Running", color: "bg-amber-400 text-white" },
    { key: "Bidding", label: "Bidding", color: "bg-slate-500 text-white" },
    { key: "Testing", label: "Testing", color: "bg-blue-400 text-white" },
    { key: "Hold", label: "On Hold", color: "bg-orange-500 text-white bg-gradient-to-r from-orange-400 to-orange-500" },
    { key: "Completed", label: "Completed", color: "bg-green-500 text-white bg-gradient-to-r from-green-500 to-green-600" },
];

export function DashboardStatsBar() {
    const [stats, setStats] = useState<Stats>({});
    const [loading, setLoading] = useState(false);

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
                {STAT_CARDS.map(({ key, label, color }) => (
                    <div
                        key={key}
                        className={cn(
                            "rounded-lg px-5 py-4 shadow-sm",
                            color
                        )}
                    >
                        <div className="text-3xl font-black leading-none mb-1">
                            {stats[key as keyof Stats] ?? 0}
                        </div>
                        <div className="text-xs font-bold opacity-90 uppercase tracking-wider">
                            {label}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
