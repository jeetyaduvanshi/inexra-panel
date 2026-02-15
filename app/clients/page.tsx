"use client";

import React from "react";
import { Header } from "@/components/layout/Header";
import { CommonList, Entity } from "@/components/admin/CommonList";

const dummyClients: Entity[] = [
    { id: 1, sn: 1, name: "Link Information Technology", email: "sandeep@gmail.com", contactPerson: "Sandeep", number: "8574569858", paymentTerm: "45" },
    { id: 2, sn: 2, name: "ORG", email: "shyam@gmail.com", contactPerson: "Shyam", number: "8700375392", paymentTerm: "45" },
    { id: 3, sn: 3, name: "Azure Knowledge corporation", email: "megha@gmail.com", contactPerson: "Megha", number: "9310383718", paymentTerm: "45" },
];

export default function ClientsPage() {
    return (
        <div className="min-h-screen bg-neutral-50/50 flex flex-col font-sans">
            <Header />
            <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto">
                <CommonList title="Clients" type="Client" data={dummyClients} />
            </main>
        </div>
    );
}
