import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { ApplicationStatus } from "@prisma/client";
import { z } from "zod";

const statusSchema = z.object({
  status: z.nativeEnum(ApplicationStatus),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireRole("RECRUITER");
    
    const recruiter = await prisma.recruiterProfile.findUnique({
      where: { userId: session.sub }
    });

    if (!recruiter) {
      return NextResponse.json({ error: "Recruiter profile not found" }, { status: 404 });
    }

    // Verify application belongs to a job posted by this recruiter
    const application = await prisma.application.findUnique({
      where: { id },
      include: { job: true }
    });

    if (!application || application.job.recruiterId !== recruiter.id) {
      return NextResponse.json({ error: "Application not found or unauthorized" }, { status: 404 });
    }

    const body = await request.json();
    const result = statusSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updated = await prisma.application.update({
      where: { id },
      data: { status: result.data.status }
    });

    return NextResponse.json({ message: "Status updated successfully", application: updated });

  } catch (error: any) {
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Recruiter access required" }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
