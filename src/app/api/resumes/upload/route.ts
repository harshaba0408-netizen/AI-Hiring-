import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { parseResume } from "@/lib/resume-parser";

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole("CANDIDATE");
    
    // Parse form data containing the file
    const formData = await request.formData();
    const file = formData.get("resume") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(file.type)) {
      return NextResponse.json({ error: "Only PDF and DOCX formats are supported" }, { status: 400 });
    }

    // Read the file as buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse the resume using NLP module
    const parsedData = await parseResume(buffer, file.type);
    
    // Start transaction to update CandidateProfile and Skills
    const updatedProfile = await prisma.$transaction(async (tx) => {
      // Find candidate profile
      const profile = await tx.candidateProfile.findUnique({
        where: { userId: session.sub }
      });

      if (!profile) throw new Error("Profile not found");

      // Clear existing parsed data to prevent duplicates on re-upload
      await tx.candidateSkill.deleteMany({ where: { candidateId: profile.id } });
      await tx.education.deleteMany({ where: { candidateId: profile.id } });
      await tx.experience.deleteMany({ where: { candidateId: profile.id } });

      // Update candidate profile fields
      const updated = await tx.candidateProfile.update({
        where: { id: profile.id },
        data: {
          phone: parsedData.phone || profile.phone,
          location: parsedData.location || profile.location,
          summary: parsedData.summary || profile.summary,
          linkedinUrl: parsedData.links.linkedin || profile.linkedinUrl,
          githubUrl: parsedData.links.github || profile.githubUrl,
          portfolioUrl: parsedData.links.portfolio || profile.portfolioUrl,
          resumeText: parsedData.rawText,
        }
      });

      // Insert extracted skills
      for (const skillName of parsedData.skills) {
        // Upsert skill master record
        const skill = await tx.skill.upsert({
          where: { name: skillName },
          create: { name: skillName },
          update: {}
        });
        
        // Link to candidate
        await tx.candidateSkill.create({
          data: { candidateId: profile.id, skillId: skill.id }
        });
      }

      // Insert education
      for (const edu of parsedData.education) {
        await tx.education.create({
          data: {
            candidateId: profile.id,
            institution: edu.institution,
            degree: edu.degree,
            field: edu.field,
            startYear: edu.startYear,
            endYear: edu.endYear,
            gpa: edu.gpa,
          }
        });
      }

      // Insert experience
      for (const exp of parsedData.experience) {
        await tx.experience.create({
          data: {
            candidateId: profile.id,
            company: exp.company,
            title: exp.title,
            location: exp.location,
            startDate: new Date(exp.startDate || new Date()), // basic fallback
            endDate: exp.endDate ? new Date(exp.endDate) : null,
            isCurrent: exp.isCurrent,
            description: exp.description,
          }
        });
      }

      return updated;
    });

    return NextResponse.json({
      message: "Resume parsed and profile updated successfully",
      parsedData,
    });

  } catch (error: any) {
    if (error.message === "FORBIDDEN" || error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Candidate access required" }, { status: 403 });
    }
    console.error("Resume upload error:", error);
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
  }
}
