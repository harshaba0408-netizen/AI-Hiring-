/**
 * Resume Parser
 * Extracts structured information from PDF and DOCX resume files.
 * Uses pdf-parse for PDFs and mammoth for DOCX files.
 */

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface ParsedResume {
  rawText: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  summary: string | null;
  skills: string[];
  education: ParsedEducation[];
  experience: ParsedExperience[];
  links: { linkedin?: string; github?: string; portfolio?: string };
}

export interface ParsedEducation {
  institution: string;
  degree: string;
  field: string | null;
  startYear: number | null;
  endYear: number | null;
  gpa: number | null;
}

export interface ParsedExperience {
  company: string;
  title: string;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEXT EXTRACTION
// ─────────────────────────────────────────────────────────────────────────────

export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  if (mimeType === "application/pdf") {
    const pdfParse = require("pdf-parse");
    const result = await pdfParse(buffer);
    return result.text;
  }

  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword"
  ) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  throw new Error("Unsupported file type. Only PDF and DOCX are accepted.");
}

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL EXTRACTION
// ─────────────────────────────────────────────────────────────────────────────

function extractEmail(text: string): string | null {
  const match = text.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
  return match ? match[0].toLowerCase() : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// PHONE EXTRACTION
// ─────────────────────────────────────────────────────────────────────────────

function extractPhone(text: string): string | null {
  const match = text.match(
    /(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}/
  );
  return match ? match[0].trim() : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// NAME EXTRACTION (heuristic: first line that looks like a name)
// ─────────────────────────────────────────────────────────────────────────────

function extractName(text: string): string | null {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines.slice(0, 5)) {
    // Skip lines that look like section headers or contain email/phone
    if (/[@|0-9]{2,}/.test(line)) continue;
    if (line.length > 60) continue;
    if (/resume|curriculum|vitae|cv|profile/i.test(line)) continue;

    // A name is typically 2–4 words of mostly letters
    const words = line.split(/\s+/).filter((w) => /^[A-Za-z'-]{2,}$/.test(w));
    if (words.length >= 2 && words.length <= 5) {
      return line;
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// LOCATION EXTRACTION
// ─────────────────────────────────────────────────────────────────────────────

function extractLocation(text: string): string | null {
  // Look for "City, State" or "City, Country" patterns
  const match = text.match(
    /([A-Z][a-zA-Z\s]+),\s*([A-Z]{2}|[A-Z][a-zA-Z\s]+)/
  );
  return match ? match[0].trim() : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// SKILLS EXTRACTION
// ─────────────────────────────────────────────────────────────────────────────

const COMMON_SKILLS = [
  // Programming Languages
  "python", "javascript", "typescript", "java", "c++", "c#", "c", "ruby",
  "go", "rust", "php", "swift", "kotlin", "r", "matlab", "scala", "perl",
  "bash", "shell", "powershell",
  // Web Frontend
  "react", "react.js", "next.js", "vue", "vue.js", "angular", "svelte",
  "html", "html5", "css", "css3", "tailwind", "bootstrap", "sass", "less",
  "jquery", "redux", "graphql", "rest api", "restful api",
  // Web Backend
  "node.js", "node", "express", "express.js", "django", "flask", "fastapi",
  "spring", "laravel", "rails", "asp.net", ".net", "nestjs",
  // Databases
  "postgresql", "mysql", "mongodb", "redis", "sqlite", "oracle", "sql server",
  "elasticsearch", "cassandra", "dynamodb", "firebase", "supabase", "neon",
  // Cloud & DevOps
  "aws", "azure", "gcp", "google cloud", "docker", "kubernetes", "k8s",
  "terraform", "ansible", "jenkins", "ci/cd", "github actions", "gitlab",
  "nginx", "apache", "linux", "ubuntu", "debian",
  // AI/ML
  "machine learning", "deep learning", "tensorflow", "pytorch", "scikit-learn",
  "pandas", "numpy", "keras", "nlp", "computer vision", "data science",
  "matplotlib", "seaborn", "jupyter", "hugging face", "langchain",
  // Data
  "sql", "nosql", "data analysis", "tableau", "power bi", "excel",
  "spark", "hadoop", "kafka", "airflow", "dbt",
  // Mobile
  "react native", "flutter", "ios", "android", "xamarin",
  // Tools
  "git", "github", "jira", "confluence", "figma", "postman", "vscode",
  "agile", "scrum", "kanban", "tdd", "bdd",
  // Soft-coded extras
  "prisma", "graphql", "trpc", "websockets", "oauth", "jwt", "rest",
];

function extractSkills(text: string): string[] {
  const lowerText = text.toLowerCase();
  const found = new Set<string>();

  for (const skill of COMMON_SKILLS) {
    // Use word boundary matching
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, "i");
    if (regex.test(lowerText)) {
      // Store properly capitalized version
      found.add(
        skill
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ")
      );
    }
  }

  return Array.from(found).sort();
}

// ─────────────────────────────────────────────────────────────────────────────
// EDUCATION EXTRACTION
// ─────────────────────────────────────────────────────────────────────────────

const DEGREE_PATTERNS = [
  "bachelor", "b.s.", "b.sc.", "b.e.", "b.tech", "b.a.",
  "master", "m.s.", "m.sc.", "m.e.", "m.tech", "m.a.", "mba",
  "phd", "ph.d.", "doctor", "doctorate",
  "associate", "diploma", "high school", "secondary",
];

function extractEducation(text: string): ParsedEducation[] {
  const results: ParsedEducation[] = [];
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // Find sections around education keywords
  let inEducation = false;
  const eduLines: string[] = [];

  for (const line of lines) {
    if (/\b(education|academic|qualification)/i.test(line)) {
      inEducation = true;
      continue;
    }
    if (
      inEducation &&
      /\b(experience|work|employment|skills|project|certification)/i.test(line)
    ) {
      inEducation = false;
    }
    if (inEducation) {
      eduLines.push(line);
    }
  }

  // Also look for degree patterns throughout the document
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    if (DEGREE_PATTERNS.some((d) => lowerLine.includes(d))) {
      if (!eduLines.includes(line)) eduLines.push(line);
    }
  }

  // Parse education blocks (crude but effective)
  let currentEdu: Partial<ParsedEducation> | null = null;

  for (const line of eduLines) {
    const lowerLine = line.toLowerCase();
    const hasDegree = DEGREE_PATTERNS.some((d) => lowerLine.includes(d));

    if (hasDegree) {
      if (currentEdu && currentEdu.institution) {
        results.push(currentEdu as ParsedEducation);
      }
      currentEdu = {
        degree: line,
        institution: "",
        field: null,
        startYear: null,
        endYear: null,
        gpa: null,
      };
    } else if (currentEdu) {
      if (!currentEdu.institution && line.length > 3) {
        currentEdu.institution = line;
      }

      // Extract years
      const yearMatch = line.match(/(\d{4})\s*[-–]\s*(\d{4}|present|current)/i);
      if (yearMatch) {
        currentEdu.startYear = parseInt(yearMatch[1]);
        if (!/present|current/i.test(yearMatch[2])) {
          currentEdu.endYear = parseInt(yearMatch[2]);
        }
      }

      // Extract GPA
      const gpaMatch = line.match(/gpa[:\s]+([0-9.]+)/i);
      if (gpaMatch) {
        currentEdu.gpa = parseFloat(gpaMatch[1]);
      }
    }
  }

  if (currentEdu && currentEdu.institution) {
    results.push(currentEdu as ParsedEducation);
  }

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPERIENCE EXTRACTION
// ─────────────────────────────────────────────────────────────────────────────

function extractExperience(text: string): ParsedExperience[] {
  const results: ParsedExperience[] = [];
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  let inExperience = false;
  const expLines: string[] = [];

  for (const line of lines) {
    if (
      /\b(experience|employment|work history|professional background)/i.test(
        line
      )
    ) {
      inExperience = true;
      continue;
    }
    if (
      inExperience &&
      /\b(education|skills|certification|project|award|reference)/i.test(line)
    ) {
      inExperience = false;
    }
    if (inExperience) {
      expLines.push(line);
    }
  }

  // Parse jobs from experience lines
  let current: Partial<ParsedExperience> | null = null;

  for (const line of expLines) {
    // Date patterns indicate a new job entry
    const dateMatch = line.match(
      /(\w+ \d{4}|\d{4})\s*[-–]\s*(\w+ \d{4}|\d{4}|present|current)/i
    );

    if (dateMatch) {
      if (current && current.company) {
        results.push(current as ParsedExperience);
      }
      const isCurrent = /present|current/i.test(dateMatch[2]);
      current = {
        company: "",
        title: "",
        location: null,
        startDate: dateMatch[1],
        endDate: isCurrent ? null : dateMatch[2],
        isCurrent,
        description: null,
      };
    } else if (current) {
      if (!current.company && line.length > 2) {
        current.company = line;
      } else if (!current.title && line.length > 2) {
        current.title = line;
      } else {
        current.description = current.description
          ? `${current.description} ${line}`
          : line;
      }
    }
  }

  if (current && current.company) {
    results.push(current as ParsedExperience);
  }

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// LINKS EXTRACTION
// ─────────────────────────────────────────────────────────────────────────────

function extractLinks(text: string) {
  const linkedin = text.match(
    /(?:linkedin\.com\/in\/)([\w-]+)/i
  );
  const github = text.match(/(?:github\.com\/)([\w-]+)/i);
  const portfolio = text.match(
    /https?:\/\/(?!linkedin|github)[\w.-]+\.[\w]{2,}(?:\/[\w./%-]*)?/i
  );

  return {
    linkedin: linkedin ? `https://linkedin.com/in/${linkedin[1]}` : undefined,
    github: github ? `https://github.com/${github[1]}` : undefined,
    portfolio: portfolio ? portfolio[0] : undefined,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY EXTRACTION
// ─────────────────────────────────────────────────────────────────────────────

function extractSummary(text: string): string | null {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  let inSummary = false;
  const summaryLines: string[] = [];

  for (const line of lines) {
    if (
      /\b(summary|objective|profile|about|overview)\b/i.test(line) &&
      line.length < 40
    ) {
      inSummary = true;
      continue;
    }
    if (
      inSummary &&
      /\b(education|experience|skills|certification|project)/i.test(line) &&
      line.length < 40
    ) {
      break;
    }
    if (inSummary && line.length > 20) {
      summaryLines.push(line);
      if (summaryLines.length >= 5) break;
    }
  }

  return summaryLines.length > 0 ? summaryLines.join(" ") : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PARSER
// ─────────────────────────────────────────────────────────────────────────────

export async function parseResume(
  buffer: Buffer,
  mimeType: string
): Promise<ParsedResume> {
  const rawText = await extractTextFromFile(buffer, mimeType);

  return {
    rawText,
    name: extractName(rawText),
    email: extractEmail(rawText),
    phone: extractPhone(rawText),
    location: extractLocation(rawText),
    summary: extractSummary(rawText),
    skills: extractSkills(rawText),
    education: extractEducation(rawText),
    experience: extractExperience(rawText),
    links: extractLinks(rawText),
  };
}
