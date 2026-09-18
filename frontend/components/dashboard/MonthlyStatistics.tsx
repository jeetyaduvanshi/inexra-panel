"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Separator } from "@/frontend/components/ui/separator";
import { SessionDetailsModal } from "./SessionDetailsModal";

interface StatItem {
    key: string;
    label: string;
    modalTitle: string;
    percentage: string;
    value: number;
    total: number;
    color: string; // Hex or Tailwind class prefix
}

export function MonthlyStatistics() {
    const [month, setMonth] = useState({
        complete: 0,
        disqualified: 0,
        quota_full: 0,
        security: 0,
        drop: 0,
        total: 0,
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
                if (data.success) setMonth(data.month);
            })
            .catch((error) => console.error('Failed to fetch monthly statistics:', error));
    }, []);

    const percentage = (value: number) =>
        month.total ? ((value / month.total) * 100).toFixed(2) : '0.00';

    const stats: StatItem[] = [
        { key: "complete", label: "Completed", modalTitle: "Complete", percentage: percentage(month.complete), value: month.complete, total: month.total, color: "text-blue-600" },
        { key: "disqualified", label: "Disqualified", modalTitle: "Disqualified", percentage: percentage(month.disqualified), value: month.disqualified, total: month.total, color: "text-cyan-500" },
        { key: "quota_full", label: "Quotafull", modalTitle: "Quota Full", percentage: percentage(month.quota_full), value: month.quota_full, total: month.total, color: "text-yellow-500" },
        { key: "security", label: "Security Term", modalTitle: "Security Term", percentage: percentage(month.security), value: month.security, total: month.total, color: "text-red-500" },
    ];

    return (
        <Card className="border-none shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-bold text-gray-500">Monthly Statistics</CardTitle>
                <span className="text-xs text-gray-400">Click any metric to view monthly sessions</span>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 py-4">
                    {stats.map((stat) => (
                        <div
                            key={stat.label}
                            onClick={() =>
                                setModal({
                                    open: true,
                                    status: stat.key,
                                    label: stat.modalTitle,
                                })
                            }
                            className="flex flex-col gap-1 p-3 -m-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-all select-none group border border-transparent hover:border-gray-200"
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span className={`font-semibold text-sm ${stat.color} group-hover:underline flex items-center gap-1`}>
                                    {stat.label} ({stat.percentage}%)
                                </span>
                                <span className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    View →
                                </span>
                            </div>
                            <div className="flex items-end gap-1">
                                <span className={`text-lg font-bold ${stat.color}`}>
                                    {stat.value}
                                </span>
                                <span className="text-sm text-gray-400 mb-1">
                                    /{stat.total}
                                </span>
                            </div>
                            {/* Visual Bar representation */}
                            <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${stat.color.replace('text-', 'bg-')}`}
                                    style={{ width: `${parseFloat(stat.percentage)}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
                <Separator className="my-2" />
            </CardContent>

            <SessionDetailsModal
                open={modal.open}
                onClose={() => setModal((prev) => ({ ...prev, open: false }))}
                status={modal.status}
                statusLabel={modal.label}
                period="month"
            />
        </Card>
    );
}
