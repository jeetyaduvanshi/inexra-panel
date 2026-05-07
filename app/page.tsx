import { Header } from "@/frontend/components/layout/Header";
import { MonthlyStatistics } from "@/frontend/components/dashboard/MonthlyStatistics";
import { DashboardStatsBar } from "@/frontend/components/dashboard/DashboardStatsBar";
import { TodayStats } from "@/frontend/components/dashboard/TodayStats";

export default function Home() {

  return (
    <div className="min-h-screen bg-neutral-50/50 flex flex-col font-sans">
      <Header />

      <main className="flex-1 p-6 space-y-8 max-w-[1600px] w-full mx-auto">

        {/* Section 1: Dashboard Stats */}
        <section className="space-y-4">
          <DashboardStatsBar />
        </section>

        {/* Section 2: Today's Project Statistics */}
        <TodayStats />

        {/* Section 3: Monthly Statistics */}
        <section className="space-y-4">
          {/* The component has its own internal header if needed, but we can wrap it */}
          <MonthlyStatistics />
        </section>

      </main>
    </div>
  );
}
