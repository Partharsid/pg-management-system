"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Filter, Edit, Trash2, Eye, BedDouble } from "lucide-react";
import Button from "@/components/ui/button";
import Card, { CardContent, CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Modal from "@/components/ui/modal";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import TenantForm from "@/components/tenants/tenant-form";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Tenant {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  status: string;
  baseRent: number;
  dateOfJoining: string;
  bed: {
    id: string;
    bedNumber: string;
    room: { roomNumber: string; floor: number };
  } | null;
  invoices: { status: string; totalAmount: number; paidAmount: number }[];
}

export default function TenantsPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchTenants();
  }, []);

  async function fetchTenants() {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/tenants?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTenants(data.tenants || []);
      }
    } catch (error) {
      console.error("Error fetching tenants:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this tenant?")) return;

    try {
      const res = await fetch(`/api/tenants/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchTenants();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (error) {
      console.error("Error deleting tenant:", error);
    }
  }

  const filteredTenants = tenants.filter((t) => {
    if (search) {
      const q = search.toLowerCase();
      return t.name.toLowerCase().includes(q) || t.phone.includes(q) || t.email?.toLowerCase().includes(q);
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
          <p className="text-gray-500">Manage your PG tenants</p>
        </div>
        <Button onClick={() => { setSelectedTenant(null); setShowModal(true); }}>
          <Plus className="w-4 h-4" />
          Add Tenant
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchTenants()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setTimeout(fetchTenants, 100); }}
            options={[
              { value: "", label: "All Status" },
              { value: "ACTIVE", label: "Active" },
              { value: "INACTIVE", label: "Inactive" },
              { value: "LEFT", label: "Left" },
            ]}
          />
        </CardContent>
      </Card>

      {/* Tenant List */}
      <div className="grid gap-4">
        {filteredTenants.map((tenant) => {
          const pendingAmount = tenant.invoices
            .filter((inv) => inv.status !== "PAID")
            .reduce((sum, inv) => sum + (Number(inv.totalAmount) - Number(inv.paidAmount)), 0);

          return (
            <Card key={tenant.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-700 font-semibold">
                        {tenant.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{tenant.name}</h3>
                      <p className="text-sm text-gray-500">{tenant.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Room</p>
                      <p className="font-medium text-gray-900">
                        {tenant.bed ? `${tenant.bed.room.roomNumber} - ${tenant.bed.bedNumber}` : "N/A"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Rent</p>
                      <p className="font-medium text-gray-900">{formatCurrency(Number(tenant.baseRent))}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Status</p>
                      <Badge variant={tenant.status === "ACTIVE" ? "success" : tenant.status === "LEFT" ? "gray" : "warning"}>
                        {tenant.status}
                      </Badge>
                    </div>
                    {pendingAmount > 0 && (
                      <div className="text-right">
                        <p className="text-sm text-red-500">Due</p>
                        <p className="font-medium text-red-600">{formatCurrency(pendingAmount)}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => router.push(`/admin/tenants/${tenant.id}`)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <Eye className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => { setSelectedTenant(tenant); setShowModal(true); }}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <Edit className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => handleDelete(tenant.id)}
                        className="p-2 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredTenants.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <BedDouble className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No tenants found</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setSelectedTenant(null); }}
        title={selectedTenant ? "Edit Tenant" : "Add Tenant"}
        size="xl"
      >
        <TenantForm
          tenant={selectedTenant}
          onSuccess={() => { setShowModal(false); setSelectedTenant(null); fetchTenants(); }}
        />
      </Modal>
    </div>
  );
}
