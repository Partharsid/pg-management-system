import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const roomUpdateSchema = z.object({
  roomNumber: z.string().min(1).optional(),
  floor: z.number().int().min(0).optional(),
  roomType: z.enum(["SINGLE", "DOUBLE", "TRIPLE", "QUAD", "DORMITORY"]).optional(),
  baseRent: z.number().positive().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        beds: {
          include: {
            tenant: {
              select: { id: true, name: true, phone: true, status: true },
            },
          },
        },
        property: true,
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    return NextResponse.json(room);
  } catch (error) {
    console.error("Error fetching room:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
    const validatedData = roomUpdateSchema.parse(body);

    const room = await prisma.room.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json(room);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error updating room:", error);
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

    // Check if room has occupied beds
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        beds: {
          include: { tenant: true },
        },
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const hasOccupiedBeds = room.beds.some((bed) => bed.tenant);
    if (hasOccupiedBeds) {
      return NextResponse.json(
        { error: "Cannot delete room with occupied beds" },
        { status: 400 }
      );
    }

    // Soft delete
    await prisma.room.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: "Room deleted successfully" });
  } catch (error) {
    console.error("Error deleting room:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
