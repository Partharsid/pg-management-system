"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  DollarSign,
  TrendingUp,
  Users,
  BedDouble,
  AlertTriangle,
} from "lucide-react";
import Card, { CardContent, CardHeader } from "@/components/ui/card";
import StatCard from "@/components/dashboard/stat-card";
import RevenueChart from "@/components/dashboard/revenue-chart";
import OccupancyChart from "@/components/dashboard/occupancy-chart";
import { formatCurrency } from "@/lib/utils";

interface DashboardData {
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

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await fetch("/api/reports");
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!data) {
    return <div className="text-center text-gray-500 py-8">Failed to load dashboard data</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {session?.user?.name}
        </h1>
        <p className="text-gray-500">Here&apos;s what&apos;s happening with your PG today</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(data.totalRevenue)}
          icon={DollarSign}
          trend={data.totalRevenue > 0 ? "up" : "neutral"}
          trendValue={`+${formatCurrency(data.totalRevenue)}`}
        />
        <StatCard
          title="Monthly Expenses"
          value={formatCurrency(data.totalExpenses)}
          icon={TrendingUp}
          trend="down"
          trendValue={formatCurrency(data.totalExpenses)}
        />
        <StatCard
          title="Profit"
          value={formatCurrency(data.profit)}
          icon={TrendingUp}
          trend={data.profit >= 0 ? "up" : "down"}
          trendValue={data.profit >= 0 ? `+${formatCurrency(data.profit)}` : formatCurrency(data.profit)}
        />
        <StatCard
          title="Occupancy Rate"
          value={`${data.occupancyRate}%`}
          icon={BedDouble}
          trend={data.occupancyRate > 80 ? "up" : data.occupancyRate > 50 ? "neutral" : "down"}
          trendValue={`${data.occupiedBeds}/${data.totalBeds} beds`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Active Tenants"
          value={data.activeTenants}
          icon={Users}
          trend="neutral"
          trendValue={`${data.totalTenants} total`}
        />
        <StatCard
          title="Vacant Beds"
          value={data.vacantBeds}
          icon={BedDouble}
          trend={data.vacantBeds > 0 ? "neutral" : "up"}
          trendValue={`${data.totalBeds} total beds`}
        />
        <StatCard
          title="Outstanding Dues"
          value={formatCurrency(data.totalOutstanding)}
          icon={AlertTriangle}
          trend={data.totalOutstanding > 0 ? "down" : "up"}
          trendValue={data.totalOutstanding > 0 ? "Pending" : "All clear"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Revenue vs Expenses</h3>
          </CardHeader>
          <CardContent>
            <RevenueChart data={data.monthlyTrend} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Bed Occupancy</h3>
          </CardHeader>
          <CardContent>
            <OccupancyChart
              occupied={data.occupiedBeds}
              vacant={data.vacantBeds}
              total={data.totalBeds}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Expense Breakdown</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.categoryExpenses.map((expense) => (
              <div key={expense.category} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">
                  {expense.category.toLowerCase().replace("_", " ")}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(expense.amount)}
                </span>
              </div>
            ))}
            {data.categoryExpenses.length === 0 && (
              <p className="text-sm text-gray-500">No expenses this month</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
