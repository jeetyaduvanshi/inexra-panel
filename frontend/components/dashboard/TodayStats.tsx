"use client";

import React, { useEffect, useState } from "react";
import { MetricCard } from "./MetricCard";
import { SessionDetailsModal } from "./SessionDetailsModal";

export function TodayStats() {
    const [counts, setCounts] = useState({
        complete: 0,
        disqualified: 0,
        quota_full: 0,
        security: 0,
        drop: 0,
    });

    const [modal, setModal] = useState<{
        open: boolean;
        status: string;
        label: string;
    }>({
        open: false,
        status: "complete",
        label: "Complete",
    });

    useEffect(() => {
        fetch('/api/dashboard/stats')
            .then((res) => res.json())
            .then((data) => {
                if (data.success) setCounts(data.today);
            })
            .catch((error) => console.error('Failed to fetch today statistics:', error));
    }, []);

    const todayStats = [
        { key: "complete", label: "Completed", modalTitle: "Complete", value: counts.complete },
        { key: "disqualified", label: "Disqualified", modalTitle: "Disqualified", value: counts.disqualified },
        { key: "quota_full", label: "Quota Full", modalTitle: "Quota Full", value: counts.quota_full },
        { key: "security", label: "Security Fail", modalTitle: "Security Term", value: counts.security, textColor: "text-red-500" },
        { key: "drop", label: "Drop", modalTitle: "Drop", value: counts.drop },
    ];

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-inexra-navy tracking-tight">Today&apos;s Project Statistics</h2>
                <span className="text-xs text-gray-400">Click any card to view detailed sessions</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {todayStats.map((stat) => (
                    <MetricCard
                        key={stat.label}
                        label={stat.label}
                        value={stat.value}
                        textColor={stat.textColor}
                        onClick={() =>
                            setModal({
                                open: true,
                                status: stat.key,
                                label: stat.modalTitle,
                            })
                        }
                    />
                ))}
            </div>

            <SessionDetailsModal
                open={modal.open}
                onClose={() => setModal((prev) => ({ ...prev, open: false }))}
                status={modal.status}
                statusLabel={modal.label}
                period="today"
            />
        </section>
    );
}
