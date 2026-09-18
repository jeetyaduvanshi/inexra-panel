import React from "react";
import { Card, CardContent } from "@/frontend/components/ui/card";
import { cn } from "@/frontend/lib/utils";

interface MetricCardProps {
    label: string;
    value: string | number;
    textColor?: string; // Tailwind class like 'text-red-500'
    className?: string;
    onClick?: () => void;
}

export function MetricCard({ label, value, textColor = "text-gray-900", className, onClick }: MetricCardProps) {
    return (
        <Card
            onClick={onClick}
            className={cn(
                "border-l-4 border-l-transparent transition-all shadow-sm",
                onClick
                    ? "cursor-pointer hover:border-l-blue-500 hover:shadow-md hover:-translate-y-0.5 select-none active:translate-y-0"
                    : "hover:border-l-blue-500 hover:shadow-md",
                className
            )}
        >
            <CardContent className="p-5 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</h3>
                    {onClick && (
                        <span className="text-[10px] text-gray-400 font-normal">View →</span>
                    )}
                </div>
                <p className={cn("text-2xl font-bold", textColor)}>{value}</p>
            </CardContent>
        </Card>
    );
}
