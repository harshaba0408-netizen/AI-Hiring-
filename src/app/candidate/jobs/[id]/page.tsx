import { prisma } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function JobDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      recruiter: { select: { company: true } },
    }
  });

  if (!job || job.status !== "PUBLISHED") {
    notFound();
  }

  const session = await getSession();
  
  // Check if candidate already applied
  let hasApplied = false;
  if (session?.role === "CANDIDATE") {
    const profile = await prisma.candidateProfile.findUnique({
      where: { userId: session.sub }
    });
    if (profile) {
      const application = await prisma.application.findFirst({
        where: { jobId: job.id, candidateId: profile.id }
      });
      hasApplied = !!application;
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 px-4 sm:px-0">
      <div className="bg-white dark:bg-zinc-900 shadow sm:rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-start border-b border-gray-200 dark:border-zinc-800">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {job.title}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              {job.recruiter.company}
            </p>
          </div>
          <div>
            {hasApplied ? (
              <span className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-green-700 bg-green-100 cursor-not-allowed">
                Already Applied
              </span>
            ) : (
              <Link
                href={`/candidate/jobs/${job.id}/apply`}
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Apply Now
              </Link>
            )}
          </div>
        </div>
        
        <div className="px-4 py-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50 dark:bg-zinc-800/30">
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</h3>
            <p className="mt-1 text-sm text-gray-900 dark:text-white">{job.location || "Remote"}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Job Type</h3>
            <p className="mt-1 text-sm text-gray-900 dark:text-white">{job.jobType.replace("_", " ")}</p>
          </div>
          {job.salaryMin && job.salaryMax && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Salary Range</h3>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}
              </p>
            </div>
          )}
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Required Experience</h3>
            <p className="mt-1 text-sm text-gray-900 dark:text-white">{job.requiredExperience} years</p>
          </div>
        </div>

        <div className="px-4 py-8 sm:px-6 space-y-8">
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Job Description</h2>
            <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
              {job.description.split('\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </section>

          {(job.requiredSkills.length > 0 || job.preferredSkills.length > 0) && (
            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Skills</h2>
              
              {job.requiredSkills.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Required</h3>
                  <div className="flex flex-wrap gap-2">
                    {job.requiredSkills.map(skill => (
                      <span key={skill} className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {job.preferredSkills.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Preferred</h3>
                  <div className="flex flex-wrap gap-2">
                    {job.preferredSkills.map(skill => (
                      <span key={skill} className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-gray-300">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
