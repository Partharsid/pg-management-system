import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const bedSchema = z.object({
  bedNumber: z.string().min(1),
  roomId: z.string(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get("roomId");
    const status = searchParams.get("status");

    const beds = await prisma.bed.findMany({
      where: {
        ...(roomId ? { roomId } : {}),
        ...(status ? { status: status as any } : {}),
      },
      include: {
        room: true,
        tenant: {
          select: { id: true, name: true, phone: true, status: true },
        },
      },
      orderBy: [{ room: { roomNumber: "asc" } }, { bedNumber: "asc" }],
    });

    return NextResponse.json(beds);
  } catch (error) {
    console.error("Error fetching beds:", error);
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
    const validatedData = bedSchema.parse(body);

    // Check if bed number already exists in room
    const existingBed = await prisma.bed.findUnique({
      where: {
        roomId_bedNumber: {
          roomId: validatedData.roomId,
          bedNumber: validatedData.bedNumber,
        },
      },
    });

    if (existingBed) {
      return NextResponse.json(
        { error: "Bed number already exists in this room" },
        { status: 400 }
      );
    }

    const bed = await prisma.bed.create({
      data: validatedData,
    });

    return NextResponse.json(bed, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error creating bed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

