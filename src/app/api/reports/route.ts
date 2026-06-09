import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as { role?: string })?.role === "TENANT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId") || "property-1";

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Get monthly payments (revenue)
    const monthlyPayments = await prisma.payment.aggregate({
      where: {
        paymentDate: {
          gte: new Date(currentYear, currentMonth - 1, 1),
          lt: new Date(currentYear, currentMonth, 1),
        },
      },
      _sum: { amount: true },
    });

    // Get monthly expenses
    const monthlyExpenses = await prisma.expense.aggregate({
      where: {
        propertyId,
        expenseDate: {
          gte: new Date(currentYear, currentMonth - 1, 1),
          lt: new Date(currentYear, currentMonth, 1),
        },
      },
      _sum: { amount: true },
    });

    // Get bed counts
    const [totalBeds, occupiedBeds] = await Promise.all([
      prisma.bed.count(),
      prisma.bed.count({ where: { status: "OCCUPIED" } }),
    ]);

    // Get tenant counts
    const [totalTenants, activeTenants] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: "ACTIVE" } }),
    ]);

    // Get outstanding amount
    const outstandingInvoices = await prisma.invoice.aggregate({
      where: {
        status: { in: ["PENDING", "PARTIALLY_PAID", "OVERDUE"] },
      },
      _sum: { totalAmount: true, paidAmount: true },
    });

    const totalOutstanding =
      Number(outstandingInvoices._sum.totalAmount || 0) -
      Number(outstandingInvoices._sum.paidAmount || 0);

    // Get monthly trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const month = new Date(currentYear, currentMonth - 1 - i, 1);
      const monthEnd = new Date(currentYear, currentMonth - i, 0);

      const [payments, expenses] = await Promise.all([
        prisma.payment.aggregate({
          where: {
            paymentDate: { gte: month, lte: monthEnd },
          },
          _sum: { amount: true },
        }),
        prisma.expense.aggregate({
          where: {
            propertyId,
            expenseDate: { gte: month, lte: monthEnd },
          },
          _sum: { amount: true },
        }),
      ]);

      monthlyTrend.push({
        month: month.toLocaleString("default", { month: "short" }),
        revenue: Number(payments._sum.amount || 0),
        expenses: Number(expenses._sum.amount || 0),
      });
    }

    // Get category-wise expenses
    const categoryExpenses = await prisma.expense.groupBy({
      by: ["category"],
      where: {
        propertyId,
        expenseDate: {
          gte: new Date(currentYear, currentMonth - 1, 1),
          lt: new Date(currentYear, currentMonth, 1),
        },
      },
      _sum: { amount: true },
    });

    const totalRevenue = Number(monthlyPayments._sum.amount || 0);
    const totalExpenses = Number(monthlyExpenses._sum.amount || 0);

    return NextResponse.json({
      totalRevenue,
      totalExpenses,
      profit: totalRevenue - totalExpenses,
      occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
      totalBeds,
      occupiedBeds,
      vacantBeds: totalBeds - occupiedBeds,
      totalTenants,
      activeTenants,
      totalOutstanding,
      monthlyTrend,
      categoryExpenses: categoryExpenses.map((c) => ({
        category: c.category,
        amount: Number(c._sum.amount || 0),
      })),
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
