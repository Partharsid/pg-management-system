import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const invoiceUpdateSchema = z.object({
  electricityCharge: z.number().nullable().optional(),
  waterCharge: z.number().nullable().optional(),
  otherCharges: z.number().nullable().optional(),
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

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        tenant: { select: { id: true, name: true, phone: true, email: true, userId: true } },
        payments: { orderBy: { paymentDate: "desc" } },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (userRole === "TENANT") {
      const sessionUserId = (session.user as { id?: string })?.id;
      if (invoice.tenant.userId !== sessionUserId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Error fetching invoice:", error);
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
    const validatedData = invoiceUpdateSchema.parse(body);

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { payments: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const paidAmount = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const baseRent = Number(invoice.baseRent);
    const ec = validatedData.electricityCharge ?? Number(invoice.electricityCharge ?? 0);
    const wc = validatedData.waterCharge ?? Number(invoice.waterCharge ?? 0);
    const oc = validatedData.otherCharges ?? Number(invoice.otherCharges ?? 0);
    const totalAmount = baseRent + ec + wc + oc;

    let status = invoice.status;
    if (paidAmount >= totalAmount) status = "PAID";
    else if (paidAmount > 0) status = "PARTIALLY_PAID";
    else status = "PENDING";

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: { ...validatedData, totalAmount, paidAmount, status },
    });

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error updating invoice:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
