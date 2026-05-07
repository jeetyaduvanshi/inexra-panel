import React from "react";
import { Card, CardContent } from "@/frontend/components/ui/card";
import { cn } from "@/frontend/lib/utils";

interface MetricCardProps {
    label: string;
    value: string | number;
    textColor?: string; // Tailwind class like 'text-red-500'
    className?: string;
}

export function MetricCard({ label, value, textColor = "text-gray-900", className }: MetricCardProps) {
    return (
        <Card className={cn("border-l-4 border-l-transparent hover:border-l-blue-500 transition-all shadow-sm hover:shadow-md", className)}>
            <CardContent className="p-6 flex flex-col gap-2">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">{label}</h3>
                <p className={cn("text-2xl font-bold", textColor)}>{value}</p>
            </CardContent>
        </Card>
    );
}
