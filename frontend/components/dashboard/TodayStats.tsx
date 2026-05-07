"use client";

import React, { useEffect, useState } from "react";
import { MetricCard } from "./MetricCard";

export function TodayStats() {
    // For now, these are zeroed out as requested earlier, until real data is hooked up for "Today".
    const [todayStats] = useState([
        { label: "Completed", value: 0 },
        { label: "Disqualified", value: 0 },
        { label: "Quota Full", value: 0 },
        { label: "Security Fail", value: 0, textColor: "text-red-500" },
        { label: "Drop", value: 0 },
    ]);

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
