import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const bedUpdateSchema = z.object({
  bedNumber: z.string().min(1).optional(),
  status: z.enum(["VACANT", "OCCUPIED", "MAINTENANCE"]).optional(),
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
    const validatedData = bedUpdateSchema.parse(body);

    const bed = await prisma.bed.update({
      where: { id },
      data: validatedData,
      include: {
        room: true,
        tenant: true,
      },
    });

    return NextResponse.json(bed);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error updating bed:", error);
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

    const bed = await prisma.bed.findUnique({
      where: { id },
      include: { tenant: true },
    });

    if (!bed) {
      return NextResponse.json({ error: "Bed not found" }, { status: 404 });
    }

    if (bed.tenant) {
      return NextResponse.json(
        { error: "Cannot delete bed with assigned tenant" },
        { status: 400 }
      );
    }

    await prisma.bed.delete({ where: { id } });

    return NextResponse.json({ message: "Bed deleted successfully" });
  } catch (error) {
    console.error("Error deleting bed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
