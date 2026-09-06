"use client";

import React from "react";
import Link from "next/link";
import { Header } from "@/frontend/components/layout/Header";
import { Button } from "@/frontend/components/ui/button";
import { Badge } from "@/frontend/components/ui/badge";
import {
    Database,
    Clock,
    Sparkles,
    ArrowRight,
    Activity,
    Webhook,
    Radio,
    FileText,
    ArrowLeft
} from "lucide-react";

export default function ClientApiDataPage() {
    return (
        <div className="min-h-screen bg-neutral-50/50 flex flex-col font-sans">
            <Header />

            <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto flex flex-col gap-6">
                {/* Breadcrumbs & Title */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                            <Link href="/" className="hover:text-inexra-navy transition-colors">Dashboard</Link>
                            <span>/</span>
                            <span className="text-gray-800 font-medium">Client API Data</span>
                        </div>
                        <h1 className="text-2xl font-bold text-inexra-navy uppercase tracking-tight flex items-center gap-2.5">
                            <Database className="w-6 h-6 text-inexra-teal" />
                            Client API Data
                        </h1>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href="/projects">
                            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 text-gray-700">
                                <ArrowLeft className="w-3.5 h-3.5" /> Back to Projects
                            </Button>
                        </Link>
                        <Link href="/links">
                            <Button size="sm" className="h-8 text-xs gap-1.5 bg-inexra-teal hover:bg-teal-600 text-white shadow-sm">
                                View Redirect Links <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Coming Soon Hero Card */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="relative p-8 sm:p-12 flex flex-col items-center text-center max-w-2xl mx-auto">
                        {/* Background subtle glow */}
                        <div className="absolute inset-0 bg-gradient-to-b from-teal-50/50 via-transparent to-transparent pointer-events-none" />

                        {/* Icon Pill */}
                        <div className="relative w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-inexra-teal shadow-inner mb-6">
                            <Database className="w-8 h-8 animate-pulse" />
                            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-inexra-teal" />
                            </span>
                        </div>

                        {/* Status Badge */}
                        <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs px-3 py-1 font-semibold uppercase tracking-wider mb-4">
                            <Clock className="w-3 h-3 mr-1.5 inline-block" /> Coming Soon • Under Integration
                        </Badge>

                        {/* Heading */}
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                            No Client API Feeds Configured Yet
                        </h2>

                        {/* Description */}
                        <p className="text-sm text-gray-600 leading-relaxed mb-8">
                            This module is reserved for direct Client & Partner API connections. Once connected, automated survey ingestion, live quota tracking, and real-time respondent telemetry will populate here.
                        </p>

                        {/* Action buttons */}
                        <div className="flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
                            <Link href="/projects" className="w-full sm:w-auto">
                                <Button className="w-full sm:w-auto h-9 bg-inexra-navy hover:bg-slate-800 text-white text-xs font-semibold px-5">
                                    Go to Projects Dashboard
                                </Button>
                            </Link>
                            <Link href="/links" className="w-full sm:w-auto">
                                <Button variant="outline" className="w-full sm:w-auto h-9 text-xs font-semibold px-5">
                                    Manage Client Redirect Links
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Feature Teasers Grid */}
                    <div className="border-t border-gray-100 bg-gray-50/60 p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Radio className="w-4 h-4" />
                            </div>
                            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                                Real-Time Feed
                            </h3>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Stream client survey invites directly into your routing panel with zero manual link creation.
                            </p>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <Activity className="w-4 h-4" />
                            </div>
                            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                                Automated Quotas
                            </h3>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Dynamic quota checks sync automatically with client systems to prevent unwanted over-quotas.
                            </p>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-2">
                            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                                <Webhook className="w-4 h-4" />
                            </div>
                            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                                Webhook Telemetry
                            </h3>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Complete callback logging, response reconciliation, and instant notification triggers.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
