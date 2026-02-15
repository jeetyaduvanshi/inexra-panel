"use client";

import React from "react";
import { Header } from "@/components/layout/Header";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const links = [
    { sn: 1, status: "Complete", url: "https://panel.sixsenseresearch.com/client-redirect-url?uid=xxx&status=complete" },
    { sn: 2, status: "Disqualify", url: "https://panel.sixsenseresearch.com/client-redirect-url?uid=xxx&status=disqualify" },
    { sn: 3, status: "Quota Full", url: "https://panel.sixsenseresearch.com/client-redirect-url?uid=xxx&status=quotaFull" },
    { sn: 4, status: "Security Term", url: "https://panel.sixsenseresearch.com/client-redirect-url?uid=xxx&status=securityTerm" },
];

export default function LinksPage() {

    const handleCopy = (url: string) => {
        navigator.clipboard.writeText(url);
        alert("Copied to clipboard: " + url);
    };

    return (
        <div className="min-h-screen bg-neutral-50/50 flex flex-col font-sans">
            <Header />
            <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto">
                <div className="space-y-6">
                    <h1 className="text-2xl font-bold text-inexra-navy uppercase">CLIENT REDIRECT LINKS</h1>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/30">
                            <span className="text-sm font-semibold text-gray-700">ALL LINKS</span>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50">
                                    <TableHead className="w-[50px] font-bold text-xs">SN</TableHead>
                                    <TableHead className="w-[150px] font-bold text-xs">STATUS</TableHead>
                                    <TableHead className="font-bold text-xs">URL</TableHead>
                                    <TableHead className="text-right font-bold text-xs">#</TableHead>
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
                                                onClick={() => handleCopy(link.url)}
                                            >
                                                Copy
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </main>
        </div>
    );
}
