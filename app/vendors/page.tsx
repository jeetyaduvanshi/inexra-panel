"use client";

import React from "react";
import { Header } from "@/frontend/components/layout/Header";
import { CommonList, Entity } from "@/frontend/components/admin/CommonList";

const dummyVendors: Entity[] = [];

export default function VendorsPage() {
    return (
        <div className="min-h-screen bg-neutral-50/50 flex flex-col font-sans">
            <Header />
            <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto">
                <CommonList title="Vendors" type="Vendor" data={dummyVendors} />
            </main>
        </div>
    );
}
