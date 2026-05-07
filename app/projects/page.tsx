import React from "react";
import { Header } from "@/frontend/components/layout/Header";
import { ProjectList } from "@/frontend/components/projects/ProjectList";

export default function ProjectsPage() {
    return (
        <div className="min-h-screen bg-neutral-50/50 flex flex-col font-sans">
            <Header />
            <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto">
                <ProjectList />
            </main>
        </div>
    );
}
