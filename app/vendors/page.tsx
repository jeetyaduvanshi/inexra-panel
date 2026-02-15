"use client";

import React from "react";
import { Header } from "@/components/layout/Header";
import { CommonList, Entity } from "@/components/admin/CommonList";

const dummyVendors: Entity[] = [
    { id: 1, sn: 1, name: "Internal Team", email: "sales@sixsenseresearch.com", contactPerson: "Daniel", number: "8802765755", paymentTerm: "15" },
    { id: 2, sn: 2, name: "HX Survey", email: "hx@gmail.com", contactPerson: "hx", number: "8756584525", paymentTerm: "60" },
    { id: 3, sn: 3, name: "TMT Insight", email: "tmt@gmail.com", contactPerson: "tmt", number: "8755958654", paymentTerm: "60" },
];

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
