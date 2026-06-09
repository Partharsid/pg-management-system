"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, Phone, Mail, Calendar, BedDouble } from "lucide-react";
import Button from "@/components/ui/button";
import Card, { CardContent, CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Modal from "@/components/ui/modal";
import TenantForm from "@/components/tenants/tenant-form";
import { formatCurrency, formatDate } from "@/lib/utils";

interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  month: number;
  year: number;
  totalAmount: number;
  paidAmount: number;
  status: string;
  dueDate: string;
}

interface PaymentRecord {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMode: string;
}

interface TenantDetail {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  status: string;
  dateOfJoining: string;
  baseRent: number;
  securityDeposit: number | null;
  idProofType: string | null;
  idProofNumber: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  bed: {
    bedNumber: string;
    room: { roomNumber: string; floor: number };
  } | null;
  invoices: InvoiceRecord[];
  payments: PaymentRecord[];
}

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchTenant = useCallback(async () => {
    try {
      const res = await fetch(`/api/tenants/${params.id}`);
      if (res.ok) setTenant(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchTenant();
  }, [fetchTenant]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!tenant) {
    return <div className="text-center text-gray-500 py-8">Tenant not found</div>;
  }

  const pendingAmount = tenant.invoices
    ?.filter((inv) => inv.status !== "PAID")
    .reduce((sum, inv) => sum + (Number(inv.totalAmount) - Number(inv.paidAmount)), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{tenant.name}</h1>
            <p className="text-gray-500">Tenant Details</p>
          </div>
        </div>
        <Button onClick={() => setShowEditModal(true)}>
          <Edit className="w-4 h-4" /> Edit Tenant
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Personal Information</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-gray-400" />
              <span className="text-sm">{tenant.phone}</span>
            </div>
            {tenant.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{tenant.email}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm">Joined {formatDate(tenant.dateOfJoining)}</span>
            </div>
            {tenant.idProofType && (
              <div>
                <p className="text-xs text-gray-500">ID Proof</p>
                <p className="text-sm">{tenant.idProofType}: {tenant.idProofNumber || "N/A"}</p>
              </div>
            )}
            {tenant.emergencyContactName && (
              <div>
                <p className="text-xs text-gray-500">Emergency Contact</p>
                <p className="text-sm">{tenant.emergencyContactName} - {tenant.emergencyContactPhone}</p>
              </div>
            )}
            <Badge variant={tenant.status === "ACTIVE" ? "success" : tenant.status === "LEFT" ? "gray" : "warning"}>
              {tenant.status}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Room & Rent</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <BedDouble className="w-4 h-4 text-gray-400" />
              <span className="text-sm">
                {tenant.bed ? `Room ${tenant.bed.room.roomNumber}, Bed ${tenant.bed.bedNumber}` : "Not Assigned"}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-500">Monthly Rent</p>
              <p className="text-xl font-bold">{formatCurrency(Number(tenant.baseRent))}</p>
            </div>
            {tenant.securityDeposit && (
              <div>
                <p className="text-xs text-gray-500">Security Deposit</p>
                <p className="text-lg font-semibold">{formatCurrency(Number(tenant.securityDeposit))}</p>
              </div>
            )}
            {pendingAmount > 0 && (
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-xs text-red-600">Outstanding Dues</p>
                <p className="text-xl font-bold text-red-700">{formatCurrency(pendingAmount)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Payment Summary</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-gray-500">Total Invoices</p>
              <p className="text-2xl font-bold">{tenant.invoices?.length || 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Paid</p>
              <p className="text-lg font-semibold text-green-600">
                {formatCurrency(tenant.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Invoices</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tenant.invoices?.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{invoice.invoiceNumber}</p>
                  <p className="text-sm text-gray-500">Due: {formatDate(invoice.dueDate)}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(Number(invoice.totalAmount))}</p>
                  <Badge variant={invoice.status === "PAID" ? "success" : invoice.status === "OVERDUE" ? "danger" : "warning"}>
                    {invoice.status}
                  </Badge>
                </div>
              </div>
            ))}
            {(!tenant.invoices || tenant.invoices.length === 0) && (
              <p className="text-sm text-gray-500 text-center py-4">No invoices</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Payment History</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tenant.payments?.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{formatCurrency(Number(payment.amount))}</p>
                  <p className="text-sm text-gray-500">{formatDate(payment.paymentDate)}</p>
                </div>
                <Badge variant="success">{payment.paymentMode}</Badge>
              </div>
            ))}
            {(!tenant.payments || tenant.payments.length === 0) && (
              <p className="text-sm text-gray-500 text-center py-4">No payments</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Tenant" size="xl">
        <TenantForm tenant={tenant} onSuccess={() => { setShowEditModal(false); fetchTenant(); }} />
      </Modal>
    </div>
  );
}
