"use client";

import React, { useEffect, useState } from "react";
import { MetricCard } from "./MetricCard";

export function TodayStats() {
    const [counts, setCounts] = useState({
        complete: 0,
        disqualified: 0,
        quota_full: 0,
        security: 0,
        drop: 0,
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
        { label: "Completed", value: counts.complete },
        { label: "Disqualified", value: counts.disqualified },
        { label: "Quota Full", value: counts.quota_full },
        { label: "Security Fail", value: counts.security, textColor: "text-red-500" },
        { label: "Drop", value: counts.drop },
    ];

    return (
        <section className="space-y-4">
            <h2 className="text-xl font-bold text-inexra-navy tracking-tight">Today&apos;s Project Statistics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {todayStats.map((stat) => (
                    <MetricCard
                        key={stat.label}
                        label={stat.label}
                        value={stat.value}
                        textColor={stat.textColor}
                    />
                ))}
            </div>
        </section>
    );
}
