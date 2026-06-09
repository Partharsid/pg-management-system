"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";

interface PaymentFormProps {
  onSuccess: () => void;
}

export default function PaymentForm({ onSuccess }: PaymentFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tenants, setTenants] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    tenantId: "",
    invoiceId: "",
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMode: "CASH",
    referenceNumber: "",
    notes: "",
  });

  useEffect(() => { fetchTenants(); }, []);

  useEffect(() => {
    if (formData.tenantId) fetchInvoices(formData.tenantId);
    else setInvoices([]);
  }, [formData.tenantId]);

  async function fetchTenants() {
    try {
      const res = await fetch("/api/tenants?status=ACTIVE");
      if (res.ok) {
        const data = await res.json();
        setTenants(data.tenants || []);
      }
    } catch (error) { console.error(error); }
  }

  async function fetchInvoices(tenantId: string) {
    try {
      const res = await fetch(`/api/invoices?tenantId=${tenantId}&status=PENDING,PARTIALLY_PAID,OVERDUE`);
      if (res.ok) setInvoices(await res.json());
    } catch (error) { console.error(error); }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          invoiceId: formData.invoiceId || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to record payment");
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <Select
        label="Tenant"
        value={formData.tenantId}
        onChange={(e) => setFormData({ ...formData, tenantId: e.target.value, invoiceId: "" })}
        options={[
          { value: "", label: "Select tenant" },
          ...tenants.map((t) => ({ value: t.id, label: `${t.name} - ${t.phone}` })),
        ]}
        required
      />

      {invoices.length > 0 && (
        <Select
          label="Invoice (Optional)"
          value={formData.invoiceId}
          onChange={(e) => {
            setFormData({ ...formData, invoiceId: e.target.value });
            if (e.target.value) {
              const inv = invoices.find((i) => i.id === e.target.value);
              if (inv) {
                const due = Number(inv.totalAmount) - Number(inv.paidAmount);
                setFormData((prev) => ({ ...prev, invoiceId: e.target.value, amount: due.toString() }));
              }
            }
          }}
          options={[
            { value: "", label: "No specific invoice" },
            ...invoices.map((inv) => ({
              value: inv.id,
              label: `${inv.invoiceNumber} - Due: ₹${(Number(inv.totalAmount) - Number(inv.paidAmount)).toLocaleString()}`,
            })),
          ]}
        />
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Amount (₹)"
          type="number"
          min="1"
          step="1"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          required
        />
        <Input
          label="Payment Date"
          type="date"
          value={formData.paymentDate}
          onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Payment Mode"
          value={formData.paymentMode}
          onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
          options={[
            { value: "CASH", label: "Cash" },
            { value: "UPI", label: "UPI" },
            { value: "BANK_TRANSFER", label: "Bank Transfer" },
            { value: "CARD", label: "Card" },
            { value: "OTHER", label: "Other" },
          ]}
        />
        <Input
          label="Reference Number"
          value={formData.referenceNumber}
          onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
          placeholder="Transaction ID / UPI Ref"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={2}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onSuccess}>Cancel</Button>
        <Button type="submit" loading={loading}>Record Payment</Button>
      </div>
    </form>
  );
}
