import { prisma } from "@/lib/db";
import Link from "next/link";
import { JobType } from "@prisma/client";

export default async function CandidateJobsPage() {
  // Fetch all published jobs
  const jobs = await prisma.job.findMany({
    where: { status: "PUBLISHED" },
    include: {
      recruiter: { select: { company: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Explore Jobs
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {jobs.length > 0 ? (
          jobs.map((job) => (
            <div key={job.id} className="bg-white dark:bg-zinc-900 shadow rounded-lg overflow-hidden flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                    {job.title}
                  </h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    {job.jobType.replace("_", " ")}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {job.recruiter.company}
                </p>
                <div className="mt-4 flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  {job.location || "Remote"}
                </div>
                {job.salaryMin && job.salaryMax && (
                  <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                    </svg>
                    ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}
                  </div>
                )}
                <div className="mt-4 text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                  {job.description}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-zinc-800/50 px-6 py-4 border-t border-gray-100 dark:border-zinc-800">
                <Link
                  href={`/candidate/jobs/${job.id}`}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-gray-500 dark:text-gray-400">
            No active jobs found right now. Check back later!
          </div>
        )}
      </div>
    </div>
  );
}
