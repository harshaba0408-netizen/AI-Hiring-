import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { signToken, setAuthCookie } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["CANDIDATE", "RECRUITER"]).default("CANDIDATE"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.format() },
        { status: 400 }
      );
    }

    const { name, email, password, role } = result.data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists with this email" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user and profile transactionally
    const user = await prisma.$transaction(async (tx: any) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role,
        },
      });

      if (role === "CANDIDATE") {
        await tx.candidateProfile.create({
          data: { userId: newUser.id },
        });
      } else if (role === "RECRUITER") {
        // We'll create a default company name to be updated later
        await tx.recruiterProfile.create({
          data: {
            userId: newUser.id,
            company: "Please Update Company Profile",
          },
        });
      }

      return newUser;
    });

    // Create session
    const token = await signToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
    
    await setAuthCookie(token);

    return NextResponse.json(
      {
        message: "Registration successful",
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
