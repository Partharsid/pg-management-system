import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const paymentSchema = z.object({
  tenantId: z.string(),
  invoiceId: z.string().nullable().optional(),
  amount: z.number().positive(),
  paymentDate: z.string().transform((str) => new Date(str)),
  paymentMode: z.enum(["CASH", "UPI", "BANK_TRANSFER", "CARD", "OTHER"]),
  referenceNumber: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenantId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const userRole = (session.user as { role?: string })?.role;

    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate.gte = new Date(startDate);
      if (endDate) where.paymentDate.lte = new Date(endDate);
    }

    // Tenant can only see their own payments
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

    const payments = await prisma.payment.findMany({
      where,
      include: {
        tenant: {
          select: { id: true, name: true, phone: true },
        },
        invoice: {
          select: { id: true, invoiceNumber: true, month: true, year: true },
        },
        recordedBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: { paymentDate: "desc" },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
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
    const validatedData = paymentSchema.parse(body);

    const payment = await prisma.$transaction(async (tx) => {
      const newPayment = await tx.payment.create({
        data: {
          ...validatedData,
          recordedById: (session.user as { id?: string })?.id,
        },
        include: {
          tenant: true,
          invoice: true,
        },
      });

      // Update invoice paid amount if invoice is linked
      if (validatedData.invoiceId) {
        const invoice = await tx.invoice.findUnique({
          where: { id: validatedData.invoiceId },
          include: { payments: true },
        });

        if (invoice) {
          const totalPaid = invoice.payments.reduce(
            (sum, p) => sum + Number(p.amount),
            0
          ) + validatedData.amount;

          let status = invoice.status;
          if (totalPaid >= Number(invoice.totalAmount)) {
            status = "PAID";
          } else if (totalPaid > 0) {
            status = "PARTIALLY_PAID";
          }

          await tx.invoice.update({
            where: { id: validatedData.invoiceId },
            data: {
              paidAmount: totalPaid,
              status,
            },
          });
        }
      }

      return newPayment;
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error creating payment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

