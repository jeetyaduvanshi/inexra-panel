"use client";

import React from "react";
import { Card, CardContent } from "@/frontend/components/ui/card";
import { Input } from "@/frontend/components/ui/input";
import { Search } from "lucide-react";

interface StatusItem {
    label: string;
    value: number;
    colorClass: string; // e.g., "text-blue-600"
}

interface StatusBreakdownProps {
    items: StatusItem[];
}

export function StatusBreakdown({ items }: StatusBreakdownProps) {
    return (
        <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border space-y-4">
                {/* Scrollable Row of Status Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    {items.map((item, index) => (
                        <div
                            key={index}
                            className="flex flex-col p-3 rounded-md bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-sm transition-all"
                        >
                            <span className={cn("text-sm font-semibold mb-1", item.colorClass)}>
                                {item.label}
                            </span>
                            <span className="text-lg font-bold text-gray-800">
                                {item.value}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Helper for classnames since I missed importing it
import { cn } from "@/frontend/lib/utils";
