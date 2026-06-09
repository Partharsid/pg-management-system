"use client";

import { useEffect, useState } from "react";
import { CreditCard, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import Card, { CardContent, CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Invoice {
  id: string;
  invoiceNumber: string;
  month: number;
  year: number;
  totalAmount: number;
  paidAmount: number;
  status: string;
  dueDate: string;
}

interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMode: string;
  invoice: { invoiceNumber: string } | null;
}

export default function TenantPaymentsPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      const [invRes, payRes] = await Promise.all([
        fetch("/api/invoices"),
        fetch("/api/payments"),
      ]);
      if (invRes.ok) setInvoices(await invRes.json());
      if (payRes.ok) setPayments(await payRes.json());
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  }

  const totalDue = invoices
    .filter((inv) => inv.status !== "PAID")
    .reduce((sum, inv) => sum + (Number(inv.totalAmount) - Number(inv.paidAmount)), 0);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Payments</h1>
        <p className="text-gray-500">View your invoices and payment history</p>
      </div>

      {totalDue > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-800">Total Outstanding</p>
                <p className="text-2xl font-bold text-red-900">{formatCurrency(totalDue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoices */}
      <Card>
        <CardHeader><h3 className="text-lg font-semibold">Invoices</h3></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {invoices.map((invoice) => {
              const due = Number(invoice.totalAmount) - Number(invoice.paidAmount);
              return (
                <div key={invoice.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{invoice.invoiceNumber}</p>
                    <p className="text-sm text-gray-500">Due: {formatDate(invoice.dueDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(Number(invoice.totalAmount))}</p>
                    {due > 0 && <p className="text-sm text-red-600">Due: {formatCurrency(due)}</p>}
                    <Badge variant={invoice.status === "PAID" ? "success" : invoice.status === "OVERDUE" ? "danger" : "warning"}>
                      {invoice.status === "PAID" && <CheckCircle className="w-3 h-3 mr-1" />}
                      {invoice.status === "PENDING" && <Clock className="w-3 h-3 mr-1" />}
                      {invoice.status.toLowerCase().replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              );
            })}
            {invoices.length === 0 && <p className="text-center text-gray-500 py-4">No invoices</p>}
          </div>
        </CardContent>
      </Card>

      {/* Payments */}
      <Card>
        <CardHeader><h3 className="text-lg font-semibold">Payment History</h3></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{formatCurrency(Number(payment.amount))}</p>
                  <p className="text-sm text-gray-500">{formatDate(payment.paymentDate)}</p>
                </div>
                <div className="text-right">
                  <Badge variant="success">{payment.paymentMode}</Badge>
                  {payment.invoice && <p className="text-xs text-gray-500 mt-1">{payment.invoice.invoiceNumber}</p>}
                </div>
              </div>
            ))}
            {payments.length === 0 && <p className="text-center text-gray-500 py-4">No payments</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
