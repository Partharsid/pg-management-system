"use client";

import { useEffect, useState } from "react";
import { BarChart3, TrendingUp, TrendingDown, DollarSign, BedDouble, Users } from "lucide-react";
import Card, { CardContent, CardHeader } from "@/components/ui/card";
import StatCard from "@/components/dashboard/stat-card";
import RevenueChart from "@/components/dashboard/revenue-chart";
import OccupancyChart from "@/components/dashboard/occupancy-chart";
import { formatCurrency } from "@/lib/utils";

interface ReportData {
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  occupancyRate: number;
  totalBeds: number;
  occupiedBeds: number;
  vacantBeds: number;
  totalTenants: number;
  activeTenants: number;
  totalOutstanding: number;
  monthlyTrend: { month: string; revenue: number; expenses: number }[];
  categoryExpenses: { category: string; amount: number }[];
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchReports(); }, []);

  async function fetchReports() {
    try {
      const res = await fetch("/api/reports");
      if (res.ok) setData(await res.json());
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>;
  if (!data) return <div className="text-center text-gray-500 py-8">Failed to load</div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1><p className="text-gray-500">Financial overview and insights</p></div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Revenue" value={formatCurrency(data.totalRevenue)} icon={DollarSign} trend="up" />
        <StatCard title="Expenses" value={formatCurrency(data.totalExpenses)} icon={TrendingDown} trend="down" />
        <StatCard title="Profit" value={formatCurrency(data.profit)} icon={TrendingUp} trend={data.profit >= 0 ? "up" : "down"} />
        <StatCard title="Occupancy" value={`${data.occupancyRate}%`} icon={BedDouble} trend={data.occupancyRate > 80 ? "up" : "neutral"} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Active Tenants" value={data.activeTenants} icon={Users} trend="neutral" trendValue={`${data.totalTenants} total`} />
        <StatCard title="Vacant Beds" value={data.vacantBeds} icon={BedDouble} trend="neutral" />
        <StatCard title="Outstanding" value={formatCurrency(data.totalOutstanding)} icon={BarChart3} trend={data.totalOutstanding > 0 ? "down" : "up"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><h3 className="text-lg font-semibold">Revenue vs Expenses</h3></CardHeader>
          <CardContent><RevenueChart data={data.monthlyTrend} /></CardContent>
        </Card>
        <Card>
          <CardHeader><h3 className="text-lg font-semibold">Occupancy</h3></CardHeader>
          <CardContent><OccupancyChart occupied={data.occupiedBeds} vacant={data.vacantBeds} total={data.totalBeds} /></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><h3 className="text-lg font-semibold">Expense Breakdown</h3></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.categoryExpenses.map((exp) => (
              <div key={exp.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm capitalize">{exp.category.toLowerCase().replace("_", " ")}</span>
                <span className="font-medium">{formatCurrency(exp.amount)}</span>
              </div>
            ))}
            {data.categoryExpenses.length === 0 && <p className="text-center text-gray-500 py-4">No expenses this month</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
