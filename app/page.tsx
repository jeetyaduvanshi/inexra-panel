import { Header } from "@/components/layout/Header";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { StatusBreakdown } from "@/components/dashboard/StatusBreakdown";
import { MonthlyStatistics } from "@/components/dashboard/MonthlyStatistics";

export default function Home() {
  // Top Row Stats (Today's Project Statistics)
  const todayStats = [
    { label: "Completed", value: 0 },
    { label: "Disqualified", value: 0 },
    { label: "Quota Full", value: 0 },
    { label: "Security Fail", value: 2, textColor: "text-red-500" }, // Red based on context
    { label: "Drop", value: 4 },
  ];

  // Status Breakdown Data
  const statusItems = [
    { label: "Bidding", value: 0, colorClass: "text-blue-600" },
    { label: "Testing", value: 5, colorClass: "text-yellow-500" },
    { label: "Running", value: 4822, colorClass: "text-cyan-500" },
    { label: "On Holds", value: 115, colorClass: "text-gray-900" },
    { label: "Awaiting - IDs", value: 0, colorClass: "text-gray-500" },
    { label: "Closed", value: 11, colorClass: "text-red-500" },
    { label: "Completed", value: 2, colorClass: "text-green-600" },
  ];

  return (
    <div className="min-h-screen bg-neutral-50/50 flex flex-col font-sans">
      <Header />

      <main className="flex-1 p-6 space-y-8 max-w-[1600px] w-full mx-auto">

        {/* Section 1: Today's Project Statistics */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-inexra-navy tracking-tight">Today&apos;s Project Statistics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {todayStats.map((stat) => (
              <MetricCard
                key={stat.label}
                label={stat.label}
                value={stat.value}
                textColor={stat.textColor}
              />
            ))}
          </div>
        </section>

        {/* Section 2: Project Status Breakdown */}
        <section className="space-y-4">
          {/* Note: In reference, there isn't a visible header for this strip, but it acts as a breakdown */}
          <StatusBreakdown items={statusItems} />
        </section>

        {/* Section 3: Monthly Statistics */}
        <section className="space-y-4">
          {/* The component has its own internal header if needed, but we can wrap it */}
          <MonthlyStatistics />
        </section>

      </main>
    </div>
  );
}
