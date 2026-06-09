"use client";

import { useEffect, useState } from "react";
import { Plus, CreditCard } from "lucide-react";
import Button from "@/components/ui/button";
import Card, { CardContent, CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Modal from "@/components/ui/modal";
import PaymentForm from "@/components/payments/payment-form";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMode: string;
  referenceNumber: string | null;
  tenant: { id: string; name: string; phone: string };
  invoice: { id: string; invoiceNumber: string } | null;
}

export default function ManagerPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => { fetchPayments(); }, []);

  async function fetchPayments() {
    try {
      const res = await fetch("/api/payments");
      if (res.ok) setPayments(await res.json());
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  }

  const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Payments</h1><p className="text-gray-500">Track rent payments</p></div>
        <Button onClick={() => setShowModal(true)}><Plus className="w-4 h-4" /> Record Payment</Button>
      </div>

      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center"><CreditCard className="w-6 h-6 text-green-600" /></div>
          <div><p className="text-sm text-gray-500">Total Collected</p><p className="text-2xl font-bold">{formatCurrency(totalCollected)}</p></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h3 className="text-lg font-semibold">Payment History</h3></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mode</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3"><p className="font-medium">{payment.tenant.name}</p><p className="text-xs text-gray-500">{payment.tenant.phone}</p></td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(Number(payment.amount))}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(payment.paymentDate)}</td>
                    <td className="px-4 py-3"><Badge variant="info">{payment.paymentMode}</Badge></td>
                    <td className="px-4 py-3 text-gray-500">{payment.invoice?.invoiceNumber || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {payments.length === 0 && <p className="text-center text-gray-500 py-8">No payments recorded</p>}
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Record Payment" size="lg">
        <PaymentForm onSuccess={() => { setShowModal(false); fetchPayments(); }} />
      </Modal>
    </div>
  );
}
