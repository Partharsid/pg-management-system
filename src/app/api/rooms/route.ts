import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const roomSchema = z.object({
  roomNumber: z.string().min(1),
  floor: z.number().int().min(0),
  roomType: z.enum(["SINGLE", "DOUBLE", "TRIPLE", "QUAD", "DORMITORY"]),
  baseRent: z.number().positive(),
  propertyId: z.string(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId");

    const rooms = await prisma.room.findMany({
      where: {
        isActive: true,
        ...(propertyId ? { propertyId } : {}),
      },
      include: {
        beds: {
          include: {
            tenant: {
              select: { id: true, name: true, phone: true },
            },
          },
        },
        _count: { select: { beds: true } },
      },
      orderBy: [{ floor: "asc" }, { roomNumber: "asc" }],
    });

    return NextResponse.json(rooms);
  } catch (error) {
    console.error("Error fetching rooms:", error);
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
    const validatedData = roomSchema.parse(body);

    // Check if room number already exists in property
    const existingRoom = await prisma.room.findUnique({
      where: {
        propertyId_roomNumber: {
          propertyId: validatedData.propertyId,
          roomNumber: validatedData.roomNumber,
        },
      },
    });

    if (existingRoom) {
      return NextResponse.json(
        { error: "Room number already exists in this property" },
        { status: 400 }
      );
    }

    const room = await prisma.room.create({
      data: validatedData,
    });

    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error creating room:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

