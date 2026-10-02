import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole, getSession } from "@/lib/auth";
import { z } from "zod";
import { JobType, EducationLevel, JobStatus } from "@prisma/client";

const jobSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(20),
  location: z.string().optional(),
  jobType: z.nativeEnum(JobType),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  requiredExperience: z.number().min(0).default(0),
  requiredEducation: z.nativeEnum(EducationLevel).optional(),
  requiredSkills: z.array(z.string()).default([]),
  preferredSkills: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  status: z.nativeEnum(JobStatus).default("PUBLISHED"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole("RECRUITER");
    
    // Get recruiter profile
    const recruiter = await prisma.recruiterProfile.findUnique({
      where: { userId: session.sub }
    });

    if (!recruiter) {
      return NextResponse.json({ error: "Recruiter profile not found" }, { status: 404 });
    }

    const body = await request.json();
    const result = jobSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.format() },
        { status: 400 }
      );
    }

    const job = await prisma.job.create({
      data: {
        ...result.data,
        recruiterId: recruiter.id,
      }
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error: any) {
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Recruiter access required" }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") as JobStatus | null;
    
    const query: any = {};
    if (status) query.status = status;
    
    // If Candidate or Public, only see published jobs
    if (!session || session.role === "CANDIDATE") {
      query.status = "PUBLISHED";
    }

    const jobs = await prisma.job.findMany({
      where: query,
      include: {
        recruiter: {
          select: { company: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(jobs);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
