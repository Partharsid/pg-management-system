import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const expenseUpdateSchema = z.object({
  category: z.enum(["ELECTRICITY", "WATER", "GROCERIES", "MAINTENANCE", "SALARY", "INTERNET", "GAS", "RENT", "OTHER"]).optional(),
  description: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  expenseDate: z.string().transform((str) => new Date(str)).optional(),
  notes: z.string().nullable().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user as { role?: string })?.role === "TENANT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const validatedData = expenseUpdateSchema.parse(body);

    const expense = await prisma.expense.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json(expense);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error updating expense:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.expense.delete({ where: { id } });

    return NextResponse.json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Error deleting expense:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
