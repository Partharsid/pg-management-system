import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const invoiceSchema = z.object({
  tenantId: z.string(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2024),
  baseRent: z.number().positive(),
  electricityCharge: z.number().nullable().optional(),
  waterCharge: z.number().nullable().optional(),
  otherCharges: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const tenantId = searchParams.get("tenantId");

    const userRole = (session.user as { role?: string })?.role;

    const where: any = {};
    if (status) where.status = status;
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);
    if (tenantId) where.tenantId = tenantId;

    // Tenant can only see their own invoices
    if (userRole === "TENANT") {
      const tenant = await prisma.tenant.findFirst({
        where: { userId: (session.user as { id?: string })?.id },
      });
      if (tenant) {
        where.tenantId = tenant.id;
      } else {
        return NextResponse.json([]);
      }
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        tenant: {
          select: { id: true, name: true, phone: true },
        },
        payments: true,
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as { role?: string })?.role === "TENANT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = invoiceSchema.parse(body);

    // Check if invoice already exists for this tenant/month/year
    const existingInvoice = await prisma.invoice.findUnique({
      where: {
        tenantId_month_year: {
          tenantId: validatedData.tenantId,
          month: validatedData.month,
          year: validatedData.year,
        },
      },
    });

    if (existingInvoice) {
      return NextResponse.json(
        { error: "Invoice already exists for this month" },
        { status: 400 }
      );
    }

    const totalAmount =
      validatedData.baseRent +
      (validatedData.electricityCharge || 0) +
      (validatedData.waterCharge || 0) +
      (validatedData.otherCharges || 0);

    const invoiceNumber = `INV-${validatedData.year}${validatedData.month.toString().padStart(2, "0")}-${validatedData.tenantId.slice(-6).toUpperCase()}`;

    const invoice = await prisma.invoice.create({
      data: {
        ...validatedData,
        totalAmount,
        invoiceNumber,
        dueDate: new Date(validatedData.year, validatedData.month - 1, 5),
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error creating invoice:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

