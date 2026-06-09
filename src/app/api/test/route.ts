import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: "admin@pg.com" },
      select: { id: true, email: true, name: true, role: true, isActive: true, password: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" });
    }

    const passwordMatch = await bcrypt.compare("admin123", user.password);

    return NextResponse.json({
      userFound: true,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      passwordMatch,
      passwordHashPrefix: user.password.substring(0, 10),
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}
