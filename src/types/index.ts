import { Decimal } from "@prisma/client/runtime/library";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "MANAGER" | "TENANT";
}

export interface DashboardStats {
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
  monthlyRevenue: { month: string; revenue: number; expenses: number }[];
}

export interface RoomWithBeds {
  id: string;
  roomNumber: string;
  floor: number;
  roomType: string;
  baseRent: number;
  isActive: boolean;
  beds: {
    id: string;
    bedNumber: string;
    status: string;
    tenant: {
      id: string;
      name: string;
      phone: string;
    } | null;
  }[];
  _count: {
    beds: number;
  };
}

export interface TenantWithDetails {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  idProofType: string;
  idProofNumber: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  dateOfJoining: Date;
  dateOfLeaving: Date | null;
  baseRent: number;
  securityDeposit: number | null;
  status: string;
  notes: string | null;
  bed: {
    id: string;
    bedNumber: string;
    room: {
      id: string;
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
    dueDate: Date;
  }[];
}

export function toNumber(value: Decimal | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  return Number(value.toString());
}
