"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/frontend/components/layout/Header";
import { Copy, CheckCheck } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/frontend/components/ui/table";

const LINK_STATUSES = [
    { sn: 1, status: "Complete",      statusKey: "complete",           label: "Complete" },
    { sn: 2, status: "Disqualify",    statusKey: "terminate",          label: "Terminate" },
    { sn: 3, status: "Quota Full",    statusKey: "quota_full",         label: "Quota Full" },
    { sn: 4, status: "Security Term", statusKey: "security_terminate", label: "Security Terminate" },
];

export default function LinksPage() {
    const [origin, setOrigin] = useState("https://inexra-panel.vercel.app");
    const [copiedSn, setCopiedSn] = useState<number | null>(null);

    // Use actual panel origin on client — ignores marketing website domain if somehow opened from there
    useEffect(() => {
        if (typeof window !== "undefined") {
            const host = window.location.hostname.toLowerCase();
            if (host !== "inexraresearch.com" && host !== "www.inexraresearch.com") {
                setOrigin(window.location.origin);
            }
        }
    }, []);

    const links = LINK_STATUSES.map((s) => ({
        ...s,
        url: `${origin}/api/survey-callback?uid=[uid]&pid=[pid]&status=${s.statusKey}&redirect=true`,
    }));

    const handleCopy = (url: string, sn: number) => {
        navigator.clipboard.writeText(url).then(() => {
            setCopiedSn(sn);
            setTimeout(() => setCopiedSn(null), 2000);
        });
    };

    const handleCopyAll = () => {
        const text = links.map((l) => `${l.status}: ${l.url}`).join("\n");
        navigator.clipboard.writeText(text).then(() => {
            setCopiedSn(-1);
            setTimeout(() => setCopiedSn(null), 2000);
        });
    };

    return (
        <div className="min-h-screen bg-neutral-50/50 flex flex-col font-sans">
            <Header />
            <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto">
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-inexra-navy uppercase">CLIENT REDIRECT LINKS</h1>
                            <p className="text-sm text-gray-600 mt-1">
                                Share these 4 URLs with your client. Replace <code className="bg-gray-100 px-1 rounded">[uid]</code> with the respondent UID and <code className="bg-gray-100 px-1 rounded">[pid]</code> with the Inexra project ID.
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            className="h-9 text-xs font-bold border-blue-200 text-blue-700 hover:bg-blue-50"
                            onClick={handleCopyAll}
                        >
                            {copiedSn === -1 ? <CheckCheck className="w-4 h-4 mr-1 text-green-600" /> : <Copy className="w-4 h-4 mr-1" />}
                            Copy All
                        </Button>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-700">ALL LINKS</span>
                            <span className="text-xs text-gray-400">Panel: <code className="text-blue-600">{origin}</code></span>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50">
                                    <TableHead className="w-[50px] font-bold text-xs">SN</TableHead>
                                    <TableHead className="w-[160px] font-bold text-xs">STATUS</TableHead>
                                    <TableHead className="font-bold text-xs">URL</TableHead>
                                    <TableHead className="text-right font-bold text-xs w-[90px]">#</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {links.map((link) => (
                                    <TableRow key={link.sn}>
                                        <TableCell className="text-xs font-medium text-gray-600">{link.sn}</TableCell>
                                        <TableCell className="text-xs font-bold text-gray-700">{link.status}</TableCell>
                                        <TableCell>
                                            <Input readOnly value={link.url} className="h-8 text-xs text-blue-600 bg-blue-50/50 border-blue-100" />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                size="sm"
                                                className="h-8 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4"
                                                onClick={() => handleCopy(link.url, link.sn)}
                                            >
                                                {copiedSn === link.sn
                                                    ? <><CheckCheck className="w-3.5 h-3.5 mr-1" /> Copied</>  
                                                    : <><Copy className="w-3.5 h-3.5 mr-1" /> Copy</>}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-800">
                        <strong>⚠️ Important:</strong> These URLs point to the <strong>Inexra Panel</strong> app (<code>{origin}</code>), not the marketing website.
                        If you want a custom domain like <code>panel.inexraresearch.com</code>, add it in Vercel → Project Settings → Domains.
                    </div>
                </div>
            </main>
        </div>
    );
}
