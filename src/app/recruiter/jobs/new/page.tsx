"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
const JobType = {
  FULL_TIME: "FULL_TIME",
  PART_TIME: "PART_TIME",
  CONTRACT: "CONTRACT",
  INTERNSHIP: "INTERNSHIP",
  FREELANCE: "FREELANCE"
} as const;

const EducationLevel = {
  HIGH_SCHOOL: "HIGH_SCHOOL",
  ASSOCIATE: "ASSOCIATE",
  BACHELOR: "BACHELOR",
  MASTER: "MASTER",
  PHD: "PHD",
  OTHER: "OTHER"
} as const;

export default function NewJobPage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    jobType: JobType.FULL_TIME,
    salaryMin: "",
    salaryMax: "",
    requiredExperience: "0",
    requiredEducation: EducationLevel.BACHELOR,
    requiredSkills: "",
    preferredSkills: "",
    keywords: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        ...formData,
        salaryMin: formData.salaryMin ? parseInt(formData.salaryMin) : undefined,
        salaryMax: formData.salaryMax ? parseInt(formData.salaryMax) : undefined,
        requiredExperience: parseInt(formData.requiredExperience),
        requiredSkills: formData.requiredSkills.split(",").map(s => s.trim()).filter(s => s),
        preferredSkills: formData.preferredSkills.split(",").map(s => s.trim()).filter(s => s),
        keywords: formData.keywords.split(",").map(k => k.trim()).filter(k => k),
      };

      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create job");
      }

      router.push(`/recruiter/dashboard`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-0">
      <div className="bg-white dark:bg-zinc-900 shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-zinc-800">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Post a New Job
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Fill out the details below to publish a new job opening.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Job Title *
              </label>
              <input
                type="text"
                name="title"
                id="title"
                required
                minLength={5}
                value={formData.title}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-700 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:bg-zinc-900 dark:text-white sm:text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Job Description *
              </label>
              <textarea
                name="description"
                id="description"
                rows={6}
                required
                minLength={20}
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-700 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:bg-zinc-900 dark:text-white sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Location
              </label>
              <input
                type="text"
                name="location"
                id="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. New York, NY or Remote"
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-700 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:bg-zinc-900 dark:text-white sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="jobType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Job Type *
              </label>
              <select
                name="jobType"
                id="jobType"
                value={formData.jobType}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-700 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:bg-zinc-900 dark:text-white sm:text-sm"
              >
                {Object.values(JobType).map((type) => (
                  <option key={type} value={type}>{type.replace("_", " ")}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="salaryMin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Minimum Salary (USD)
              </label>
              <input
                type="number"
                name="salaryMin"
                id="salaryMin"
                min="0"
                value={formData.salaryMin}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-700 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:bg-zinc-900 dark:text-white sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="salaryMax" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Maximum Salary (USD)
              </label>
              <input
                type="number"
                name="salaryMax"
                id="salaryMax"
                min="0"
                value={formData.salaryMax}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-700 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:bg-zinc-900 dark:text-white sm:text-sm"
              />
            </div>
            
            <div className="sm:col-span-2 pt-4 border-t border-gray-200 dark:border-zinc-800">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">ATS Requirements</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                These fields power the AI ATS scoring engine. Candidates will be ranked against these requirements.
              </p>
            </div>

            <div>
              <label htmlFor="requiredExperience" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Required Experience (Years)
              </label>
              <input
                type="number"
                name="requiredExperience"
                id="requiredExperience"
                min="0"
                value={formData.requiredExperience}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-700 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:bg-zinc-900 dark:text-white sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="requiredEducation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Required Education
              </label>
              <select
                name="requiredEducation"
                id="requiredEducation"
                value={formData.requiredEducation}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-700 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:bg-zinc-900 dark:text-white sm:text-sm"
              >
                {Object.values(EducationLevel).map((type) => (
                  <option key={type} value={type}>{type.replace("_", " ")}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="requiredSkills" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Required Skills (Comma separated) *
              </label>
              <input
                type="text"
                name="requiredSkills"
                id="requiredSkills"
                required
                value={formData.requiredSkills}
                onChange={handleChange}
                placeholder="e.g. React, Node.js, TypeScript"
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-700 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:bg-zinc-900 dark:text-white sm:text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="preferredSkills" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Preferred Skills (Comma separated)
              </label>
              <input
                type="text"
                name="preferredSkills"
                id="preferredSkills"
                value={formData.preferredSkills}
                onChange={handleChange}
                placeholder="e.g. Docker, AWS, GraphQL"
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-700 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:bg-zinc-900 dark:text-white sm:text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Semantic Keywords (Comma separated)
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Used by the NLP scanner to search the raw resume text for specific terms.</p>
              <input
                type="text"
                name="keywords"
                id="keywords"
                value={formData.keywords}
                onChange={handleChange}
                placeholder="e.g. Leadership, Agile, B2B"
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-700 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:bg-zinc-900 dark:text-white sm:text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-zinc-800 space-x-4">
            <Link
              href="/recruiter/dashboard"
              className="py-2 px-4 border border-gray-300 dark:border-zinc-700 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? "Publishing..." : "Publish Job"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
