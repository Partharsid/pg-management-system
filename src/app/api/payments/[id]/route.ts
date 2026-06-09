import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

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

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        tenant: { select: { id: true, name: true, phone: true, userId: true } },
        invoice: true,
        recordedBy: { select: { id: true, name: true } },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (userRole === "TENANT") {
      const sessionUserId = (session.user as { id?: string })?.id;
      if (payment.tenant.userId !== sessionUserId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error("Error fetching payment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
