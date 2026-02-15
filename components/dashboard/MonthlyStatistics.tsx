"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface StatItem {
    label: string;
    percentage: string;
    value: number;
    total: number;
    color: string; // Hex or Tailwind class prefix
}

export function MonthlyStatistics() {
    // Dummy data matching reference roughly
    const stats: StatItem[] = [
        { label: "Completed", percentage: "6.06", value: 623, total: 10277, color: "text-blue-600" },
        { label: "Disqualified", percentage: "21.34", value: 2193, total: 10277, color: "text-cyan-500" },
        { label: "Quotafull", percentage: "5.21", value: 535, total: 10277, color: "text-yellow-500" },
        { label: "Security Term", percentage: "36.97", value: 3799, total: 10277, color: "text-red-500" },
    ];

    return (
        <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold text-gray-500">Monthly Statistics</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 py-4">
                    {stats.map((stat) => (
                        <div key={stat.label} className="flex flex-col gap-1">
                            <div className="flex justify-between items-center mb-1">
                                <span className={`font-semibold text-sm ${stat.color}`}>
                                    {stat.label} ({stat.percentage})
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
        </Card>
    );
}
