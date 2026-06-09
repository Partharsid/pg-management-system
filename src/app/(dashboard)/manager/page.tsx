"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Users,
  BedDouble,
  CreditCard,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import Card, { CardContent, CardHeader } from "@/components/ui/card";
import StatCard from "@/components/dashboard/stat-card";
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
}

export default function ManagerDashboard() {
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
        <p className="text-gray-500">Here&apos;s your daily operations overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Tenants"
          value={data.activeTenants}
          icon={Users}
          trend="neutral"
          trendValue={`${data.totalTenants} total`}
        />
        <StatCard
          title="Occupied Beds"
          value={data.occupiedBeds}
          icon={BedDouble}
          trend="neutral"
          trendValue={`${data.totalBeds} total`}
        />
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(data.totalRevenue)}
          icon={CreditCard}
          trend="up"
        />
        <StatCard
          title="Outstanding Dues"
          value={formatCurrency(data.totalOutstanding)}
          icon={AlertTriangle}
          trend={data.totalOutstanding > 0 ? "down" : "up"}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/manager/tenants">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Manage Tenants</h3>
                  <p className="text-sm text-gray-500">Add, edit, or view tenants</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/manager/rooms">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                  <BedDouble className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Room Management</h3>
                  <p className="text-sm text-gray-500">View rooms and bed allocation</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/manager/payments">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Record Payments</h3>
                  <p className="text-sm text-gray-500">Log rent payments</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Occupancy Overview</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Occupancy Rate</span>
              <span className="text-sm font-medium text-gray-900">{data.occupancyRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-indigo-600 h-3 rounded-full transition-all"
                style={{ width: `${data.occupancyRate}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-indigo-600">{data.occupiedBeds}</p>
                <p className="text-xs text-gray-500">Occupied</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-400">{data.vacantBeds}</p>
                <p className="text-xs text-gray-500">Vacant</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{data.totalBeds}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
