import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const expenseSchema = z.object({
  category: z.enum(["ELECTRICITY", "WATER", "GROCERIES", "MAINTENANCE", "SALARY", "INTERNET", "GAS", "RENT", "OTHER"]),
  description: z.string().min(1),
  amount: z.number().positive(),
  expenseDate: z.string().transform((str) => new Date(str)),
  propertyId: z.string(),
  notes: z.string().nullable().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as { role?: string })?.role === "TENANT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const propertyId = searchParams.get("propertyId");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (category) where.category = category;
    if (propertyId) where.propertyId = propertyId;
    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) where.expenseDate.gte = new Date(startDate);
      if (endDate) where.expenseDate.lte = new Date(endDate);
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        recordedBy: {
          select: { id: true, name: true },
        },
        property: {
          select: { id: true, name: true },
        },
      },
      orderBy: { expenseDate: "desc" },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
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
    const validatedData = expenseSchema.parse(body);

    const expense = await prisma.expense.create({
      data: {
        ...validatedData,
        recordedById: (session.user as { id?: string })?.id,
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error creating expense:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

