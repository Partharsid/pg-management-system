import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const tenantSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().nullable().optional(),
  phone: z.string().min(10),
  idProofType: z.enum(["AADHAR", "PAN", "PASSPORT", "DRIVING_LICENSE", "VOTER_ID", "OTHER"]).optional(),
  idProofNumber: z.string().nullable().optional(),
  emergencyContactName: z.string().nullable().optional(),
  emergencyContactPhone: z.string().nullable().optional(),
  dateOfJoining: z.string().transform((str) => new Date(str)),
  baseRent: z.number().positive(),
  securityDeposit: z.number().nullable().optional(),
  bedId: z.string().nullable().optional(),
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
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const userRole = (session.user as { role?: string })?.role;

    // If tenant, only return their own data
    if (userRole === "TENANT") {
      const tenant = await prisma.tenant.findFirst({
        where: { userId: (session.user as { id?: string })?.id },
        include: {
          bed: {
            include: { room: true },
          },
          invoices: {
            orderBy: { createdAt: "desc" },
            take: 12,
          },
          payments: {
            orderBy: { paymentDate: "desc" },
            take: 20,
          },
        },
      });
      return NextResponse.json(tenant ? [tenant] : []);
    }

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        include: {
          bed: {
            include: { room: true },
          },
          invoices: {
            where: { status: { in: ["PENDING", "OVERDUE", "PARTIALLY_PAID"] } },
            orderBy: { dueDate: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.tenant.count({ where }),
    ]);

    return NextResponse.json({
      tenants,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching tenants:", error);
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
    const validatedData = tenantSchema.parse(body);

    // If bed is assigned, check if it's vacant
    if (validatedData.bedId) {
      const bed = await prisma.bed.findUnique({
        where: { id: validatedData.bedId },
      });

      if (!bed || bed.status !== "VACANT") {
        return NextResponse.json(
          { error: "Selected bed is not available" },
          { status: 400 }
        );
      }
    }

    const tenant = await prisma.$transaction(async (tx) => {
      const newTenant = await tx.tenant.create({
        data: {
          ...validatedData,
          status: "ACTIVE",
        },
      });

      // If bed is assigned, update bed status
      if (validatedData.bedId) {
        await tx.bed.update({
          where: { id: validatedData.bedId },
          data: { status: "OCCUPIED" },
        });
      }

      return newTenant;
    });

    return NextResponse.json(tenant, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error creating tenant:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

