"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  BedDouble,
  CreditCard,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import Card, { CardContent, CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

interface TenantData {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  baseRent: number;
  status: string;
  dateOfJoining: string;
  bed: {
    bedNumber: string;
    room: {
      roomNumber: string;
      floor: number;
    };
  } | null;
  invoices: {
    id: string;
    invoiceNumber: string;
    month: number;
    year: number;
    totalAmount: number;
    paidAmount: number;
    status: string;
    dueDate: string;
  }[];
  payments: {
    id: string;
    amount: number;
    paymentDate: string;
    paymentMode: string;
  }[];
}

export default function TenantDashboard() {
  const { data: session } = useSession();
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTenantData();
  }, []);

  async function fetchTenantData() {
    try {
      const res = await fetch("/api/tenants");
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          setTenantData(data[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching tenant data:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!tenantData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No tenant profile found. Please contact your administrator.</p>
      </div>
    );
  }

  const pendingInvoices = tenantData.invoices.filter(
    (inv) => inv.status === "PENDING" || inv.status === "OVERDUE" || inv.status === "PARTIALLY_PAID"
  );
  const totalDue = pendingInvoices.reduce(
    (sum, inv) => sum + (Number(inv.totalAmount) - Number(inv.paidAmount)),
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {tenantData.name}
        </h1>
        <p className="text-gray-500">Here&apos;s your PG accommodation details</p>
      </div>

      {/* Room & Bed Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                <BedDouble className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Room & Bed</p>
                <p className="text-lg font-semibold text-gray-900">
                  {tenantData.bed
                    ? `Room ${tenantData.bed.room.roomNumber}, Bed ${tenantData.bed.bedNumber}`
                    : "Not Assigned"}
                </p>
                {tenantData.bed && (
                  <p className="text-xs text-gray-500">Floor {tenantData.bed.room.floor}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Monthly Rent</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(Number(tenantData.baseRent))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Member Since</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDate(tenantData.dateOfJoining)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Outstanding Dues */}
      {totalDue > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-800">Outstanding Dues</p>
                <p className="text-2xl font-bold text-red-900">{formatCurrency(totalDue)}</p>
                <p className="text-sm text-red-600">
                  {pendingInvoices.length} pending invoice{pendingInvoices.length > 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Invoices */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Recent Invoices</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tenantData.invoices.slice(0, 5).map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{invoice.invoiceNumber}</p>
                  <p className="text-sm text-gray-500">
                    Due: {formatDate(invoice.dueDate)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {formatCurrency(Number(invoice.totalAmount))}
                  </p>
                  <Badge
                    variant={
                      invoice.status === "PAID"
                        ? "success"
                        : invoice.status === "OVERDUE"
                        ? "danger"
                        : invoice.status === "PARTIALLY_PAID"
                        ? "warning"
                        : "default"
                    }
                  >
                    {invoice.status === "PAID" && <CheckCircle className="w-3 h-3 mr-1" />}
                    {invoice.status === "PENDING" && <Clock className="w-3 h-3 mr-1" />}
                    {invoice.status.toLowerCase().replace("_", " ")}
                  </Badge>
                </div>
              </div>
            ))}
            {tenantData.invoices.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No invoices yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Payments */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tenantData.payments.slice(0, 5).map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {formatCurrency(Number(payment.amount))}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDate(payment.paymentDate)}
                  </p>
                </div>
                <Badge variant="success">{payment.paymentMode}</Badge>
              </div>
            ))}
            {tenantData.payments.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No payments yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
