import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { parseResume } from "@/lib/resume-parser";
import { calculateAtsScore } from "@/lib/ats-scorer";

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole("CANDIDATE");
    
    // Get candidate profile
    const profile = await prisma.candidateProfile.findUnique({
      where: { userId: session.sub }
    });

    if (!profile) {
      return NextResponse.json({ error: "Candidate profile not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const jobId = formData.get("jobId") as string;
    const file = formData.get("resume") as File | null;

    if (!jobId || !file) {
      return NextResponse.json({ error: "Job ID and Resume file are required" }, { status: 400 });
    }

    // 1. Validate Job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });

    if (!job || job.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Job not found or not open for applications" }, { status: 404 });
    }

    // 2. Check if already applied
    const existingApplication = await prisma.application.findFirst({
      where: { jobId, candidateId: profile.id }
    });

    if (existingApplication) {
      return NextResponse.json({ error: "You have already applied for this job" }, { status: 409 });
    }

    // 3. Parse Resume
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const parsedResume = await parseResume(buffer, file.type);

    // 4. Calculate ATS Score
    const maxExp = parsedResume.experience.reduce((max, exp) => {
      if (!exp.startDate) return max;
      const start = new Date(exp.startDate).getTime();
      const end = exp.endDate ? new Date(exp.endDate).getTime() : Date.now();
      const years = (end - start) / (1000 * 60 * 60 * 24 * 365.25);
      return max + (years > 0 ? years : 0);
    }, 0);

    const scoreResult = calculateAtsScore(
      {
        skills: parsedResume.skills,
        experienceYears: maxExp,
        educationLevel: parsedResume.education.length > 0 ? "BACHELOR" : null, // Simplified
        rawText: parsedResume.rawText,
      },
      {
        requiredSkills: job.requiredSkills,
        preferredSkills: job.preferredSkills,
        requiredExperience: job.requiredExperience,
        requiredEducation: job.requiredEducation,
        keywords: job.keywords,
      }
    );

    // 5. Create Application and ATS Score Transactionally
    const application = await prisma.$transaction(async (tx: any) => {
      const newApp = await tx.application.create({
        data: {
          jobId,
          candidateId: profile.id,
          status: "APPLIED",
          coverLetter: formData.get("coverLetter") as string || null,
        }
      });

      await tx.atsScore.create({
        data: {
          applicationId: newApp.id,
          overallScore: scoreResult.overallScore,
          skillScore: scoreResult.skillScore,
          experienceScore: scoreResult.experienceScore,
          educationScore: scoreResult.educationScore,
          keywordScore: scoreResult.keywordScore,
          breakdown: scoreResult.breakdown as any,
        }
      });

      return newApp;
    });

    return NextResponse.json({
      message: "Application submitted successfully",
      applicationId: application.id,
      score: scoreResult.overallScore
    }, { status: 201 });

  } catch (error: any) {
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Candidate access required" }, { status: 403 });
    }
    console.error("Application error:", error);
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
  }
}
