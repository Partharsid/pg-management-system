import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const tenantUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().min(10).optional(),
  idProofType: z.enum(["AADHAR", "PAN", "PASSPORT", "DRIVING_LICENSE", "VOTER_ID", "OTHER"]).optional(),
  idProofNumber: z.string().nullable().optional(),
  emergencyContactName: z.string().nullable().optional(),
  emergencyContactPhone: z.string().nullable().optional(),
  dateOfJoining: z.string().transform((str) => new Date(str)).optional(),
  dateOfLeaving: z.string().nullable().transform((str) => str ? new Date(str) : null).optional(),
  baseRent: z.number().positive().optional(),
  securityDeposit: z.number().nullable().optional(),
  bedId: z.string().nullable().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "LEFT"]).optional(),
  notes: z.string().nullable().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userRole = (session.user as { role?: string })?.role;

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        bed: { include: { room: true } },
        invoices: { orderBy: { createdAt: "desc" } },
        payments: { orderBy: { paymentDate: "desc" } },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    if (userRole === "TENANT") {
      const sessionUserId = (session.user as { id?: string })?.id;
      if (tenant.userId !== sessionUserId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json(tenant);
  } catch (error) {
    console.error("Error fetching tenant:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string })?.role === "TENANT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const validatedData = tenantUpdateSchema.parse(body);

    const currentTenant = await prisma.tenant.findUnique({ where: { id } });
    if (!currentTenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const tenant = await prisma.$transaction(async (tx) => {
      if (validatedData.bedId !== undefined) {
        if (currentTenant.bedId) {
          await tx.bed.update({ where: { id: currentTenant.bedId }, data: { status: "VACANT" } });
        }
        if (validatedData.bedId) {
          const newBed = await tx.bed.findUnique({ where: { id: validatedData.bedId } });
          if (!newBed || newBed.status !== "VACANT") throw new Error("Selected bed is not available");
          await tx.bed.update({ where: { id: validatedData.bedId }, data: { status: "OCCUPIED" } });
        }
      }

      if (validatedData.status === "LEFT" && currentTenant.status !== "LEFT") {
        validatedData.dateOfLeaving = new Date() as any;
        if (currentTenant.bedId) {
          await tx.bed.update({ where: { id: currentTenant.bedId }, data: { status: "VACANT" } });
          validatedData.bedId = null as any;
        }
      }

      return tx.tenant.update({
        where: { id },
        data: validatedData,
        include: { bed: { include: { room: true } } },
      });
    });

    return NextResponse.json(tenant);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error updating tenant:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: { invoices: { where: { status: { in: ["PENDING", "OVERDUE"] } } } },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    if (tenant.invoices.length > 0) {
      return NextResponse.json({ error: "Cannot delete tenant with pending invoices" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      if (tenant.bedId) {
        await tx.bed.update({ where: { id: tenant.bedId }, data: { status: "VACANT" } });
      }
      await tx.tenant.delete({ where: { id } });
    });

    return NextResponse.json({ message: "Tenant deleted successfully" });
  } catch (error) {
    console.error("Error deleting tenant:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
