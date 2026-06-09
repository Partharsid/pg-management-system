"use client";

import { useEffect, useState, useCallback } from "react";
import { Phone, Mail, Calendar, BedDouble, Shield } from "lucide-react";
import Card, { CardContent, CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface TenantProfile {
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
}

export default function TenantProfilePage() {
  const [tenant, setTenant] = useState<TenantProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/tenants");
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) setTenant(data[0]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!tenant) {
    return <div className="text-center py-12"><p className="text-gray-500">No profile found</p></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500">Your account and accommodation details</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Personal Information</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-2xl text-indigo-700 font-bold">
                  {tenant.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{tenant.name}</h3>
                <Badge variant={tenant.status === "ACTIVE" ? "success" : "gray"}>{tenant.status}</Badge>
              </div>
            </div>
            <div className="space-y-3">
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
                <span className="text-sm">Member since {formatDate(tenant.dateOfJoining)}</span>
              </div>
              {tenant.idProofType && (
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{tenant.idProofType}: {tenant.idProofNumber || "N/A"}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Accommodation Details</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <BedDouble className="w-4 h-4 text-gray-400" />
              <span className="text-sm">
                {tenant.bed ? `Room ${tenant.bed.room.roomNumber}, Bed ${tenant.bed.bedNumber}` : "Not Assigned"}
              </span>
            </div>
            {tenant.bed && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">Floor: {tenant.bed.room.floor}</span>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500">Monthly Rent</p>
              <p className="text-2xl font-bold">₹{Number(tenant.baseRent).toLocaleString()}</p>
            </div>
            {tenant.securityDeposit && (
              <div>
                <p className="text-xs text-gray-500">Security Deposit</p>
                <p className="text-lg font-semibold">₹{Number(tenant.securityDeposit).toLocaleString()}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {tenant.emergencyContactName && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Emergency Contact</h3>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{tenant.emergencyContactName}</p>
              <p className="text-sm text-gray-500">{tenant.emergencyContactPhone}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
