"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";

interface TenantFormProps {
  tenant?: any;
  onSuccess: () => void;
}

export default function TenantForm({ tenant, onSuccess }: TenantFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [beds, setBeds] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: tenant?.name || "",
    email: tenant?.email || "",
    phone: tenant?.phone || "",
    idProofType: tenant?.idProofType || "OTHER",
    idProofNumber: tenant?.idProofNumber || "",
    emergencyContactName: tenant?.emergencyContactName || "",
    emergencyContactPhone: tenant?.emergencyContactPhone || "",
    dateOfJoining: tenant?.dateOfJoining ? new Date(tenant.dateOfJoining).toISOString().split("T")[0] : "",
    baseRent: tenant?.baseRent?.toString() || "",
    securityDeposit: tenant?.securityDeposit?.toString() || "",
    bedId: tenant?.bedId || "",
    notes: tenant?.notes || "",
  });

  useEffect(() => {
    fetchBeds();
  }, []);

  async function fetchBeds() {
    try {
      const res = await fetch("/api/beds?status=VACANT");
      if (res.ok) {
        const data = await res.json();
        setBeds(data);
      }
    } catch (error) {
      console.error("Error fetching beds:", error);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const method = tenant ? "PUT" : "POST";
      const url = tenant ? `/api/tenants/${tenant.id}` : "/api/tenants";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          baseRent: parseFloat(formData.baseRent),
          securityDeposit: formData.securityDeposit ? parseFloat(formData.securityDeposit) : null,
          bedId: formData.bedId || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save tenant");
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
      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Full Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        <Input
          label="Phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        <Select
          label="ID Proof Type"
          value={formData.idProofType}
          onChange={(e) => setFormData({ ...formData, idProofType: e.target.value })}
          options={[
            { value: "AADHAR", label: "Aadhar Card" },
            { value: "PAN", label: "PAN Card" },
            { value: "PASSPORT", label: "Passport" },
            { value: "DRIVING_LICENSE", label: "Driving License" },
            { value: "VOTER_ID", label: "Voter ID" },
            { value: "OTHER", label: "Other" },
          ]}
        />
      </div>

      <Input
        label="ID Proof Number"
        value={formData.idProofNumber}
        onChange={(e) => setFormData({ ...formData, idProofNumber: e.target.value })}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Emergency Contact Name"
          value={formData.emergencyContactName}
          onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
        />
        <Input
          label="Emergency Contact Phone"
          value={formData.emergencyContactPhone}
          onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Input
          label="Date of Joining"
          type="date"
          value={formData.dateOfJoining}
          onChange={(e) => setFormData({ ...formData, dateOfJoining: e.target.value })}
          required
        />
        <Input
          label="Base Rent (₹)"
          type="number"
          min="0"
          step="100"
          value={formData.baseRent}
          onChange={(e) => setFormData({ ...formData, baseRent: e.target.value })}
          required
        />
        <Input
          label="Security Deposit (₹)"
          type="number"
          min="0"
          step="100"
          value={formData.securityDeposit}
          onChange={(e) => setFormData({ ...formData, securityDeposit: e.target.value })}
        />
      </div>

      <Select
        label="Assign Bed"
        value={formData.bedId}
        onChange={(e) => setFormData({ ...formData, bedId: e.target.value })}
        options={[
          { value: "", label: "No bed assigned" },
          ...beds.map((bed) => ({
            value: bed.id,
            label: `Room ${bed.room.roomNumber} - ${bed.bedNumber} (Floor ${bed.room.floor})`,
          })),
        ]}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {tenant ? "Update Tenant" : "Add Tenant"}
        </Button>
      </div>
    </form>
  );
}
