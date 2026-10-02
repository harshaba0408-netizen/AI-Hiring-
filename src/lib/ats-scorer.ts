import { EducationLevel } from "@prisma/client";

/**
 * Transparent ATS Scoring Algorithm
 * Calculates an explainable score for a candidate against a job description.
 */

export interface CandidateData {
  skills: string[];
  experienceYears: number;
  educationLevel: EducationLevel | null;
  rawText: string; // Used for keyword matching
}

export interface JobData {
  requiredSkills: string[];
  preferredSkills: string[];
  requiredExperience: number | null; // Years
  requiredEducation: EducationLevel | null;
  keywords: string[];
}

export interface AtsScoreResult {
  overallScore: number;
  skillScore: number;
  experienceScore: number;
  educationScore: number;
  keywordScore: number;
  breakdown: {
    skills: { matched: string[]; missing: string[] };
    experience: { candidate: number; required: number };
    education: { candidate: EducationLevel | null; required: EducationLevel | null };
    keywords: { matched: string[]; total: number };
  };
}

// Map Education levels to a numeric value for comparison
const eduWeights: Record<EducationLevel, number> = {
  OTHER: 0,
  HIGH_SCHOOL: 1,
  ASSOCIATE: 2,
  BACHELOR: 3,
  MASTER: 4,
  PHD: 5,
};

/**
 * Normalizes a string for matching (lowercase, removes special chars)
 */
function normalize(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Calculate the ATS Score
 */
export function calculateAtsScore(
  candidate: CandidateData,
  job: JobData
): AtsScoreResult {
  let overallScore = 0;
  const weights = {
    skills: 40,
    experience: 25,
    education: 20,
    keywords: 15,
  };

  // ─── 1. SKILLS MATCH (40%) ─────────────────────────────────────────────────
  
  const normalizedCandidateSkills = candidate.skills.map(normalize);
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  // Required skills are weighted heavier than preferred
  let skillPoints = 0;
  const totalPossibleSkillPoints = job.requiredSkills.length * 2 + job.preferredSkills.length;

  for (const skill of job.requiredSkills) {
    if (normalizedCandidateSkills.includes(normalize(skill))) {
      skillPoints += 2;
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }

  for (const skill of job.preferredSkills) {
    if (normalizedCandidateSkills.includes(normalize(skill))) {
      skillPoints += 1;
      matchedSkills.push(skill);
    }
  }

  const skillScore = totalPossibleSkillPoints > 0
    ? (skillPoints / totalPossibleSkillPoints) * weights.skills
    : weights.skills; // if no skills required, full points
    
  overallScore += skillScore;

  // ─── 2. EXPERIENCE MATCH (25%) ─────────────────────────────────────────────
  
  let experienceScore = 0;
  const reqExp = job.requiredExperience || 0;
  
  if (reqExp === 0) {
    experienceScore = weights.experience; // No experience required
  } else {
    // Cap at 100% (or weights.experience)
    const ratio = Math.min(candidate.experienceYears / reqExp, 1);
    experienceScore = ratio * weights.experience;
  }

  overallScore += experienceScore;

  // ─── 3. EDUCATION MATCH (20%) ──────────────────────────────────────────────
  
  let educationScore = 0;
  
  if (!job.requiredEducation) {
    educationScore = weights.education; // No education required
  } else if (candidate.educationLevel) {
    const reqLevel = eduWeights[job.requiredEducation];
    const canLevel = eduWeights[candidate.educationLevel];
    
    if (canLevel >= reqLevel) {
      educationScore = weights.education; // Meets or exceeds
    } else {
      // Partial credit for lower degrees (e.g. Associate when Bachelor required)
      const diff = reqLevel - canLevel;
      if (diff === 1) educationScore = weights.education * 0.75;
      else if (diff === 2) educationScore = weights.education * 0.5;
      else educationScore = 0;
    }
  } else {
    // Missing education info but job requires it
    educationScore = 0;
  }

  overallScore += educationScore;

  // ─── 4. KEYWORD MATCH (15%) ────────────────────────────────────────────────
  
  let keywordScore = 0;
  const matchedKeywords: string[] = [];
  const rawTextNorm = candidate.rawText.toLowerCase();

  if (job.keywords.length === 0) {
    keywordScore = weights.keywords;
  } else {
    for (const kw of job.keywords) {
      if (rawTextNorm.includes(kw.toLowerCase())) {
        matchedKeywords.push(kw);
      }
    }
    keywordScore = (matchedKeywords.length / job.keywords.length) * weights.keywords;
  }

  overallScore += keywordScore;

  // ─── RETURN RESULT ─────────────────────────────────────────────────────────

  return {
    overallScore: Math.round(overallScore * 10) / 10, // Round to 1 decimal
    skillScore: Math.round(skillScore * 10) / 10,
    experienceScore: Math.round(experienceScore * 10) / 10,
    educationScore: Math.round(educationScore * 10) / 10,
    keywordScore: Math.round(keywordScore * 10) / 10,
    breakdown: {
      skills: { matched: matchedSkills, missing: missingSkills },
      experience: { candidate: candidate.experienceYears, required: reqExp },
      education: { candidate: candidate.educationLevel, required: job.requiredEducation },
      keywords: { matched: matchedKeywords, total: job.keywords.length },
    },
  };
}
