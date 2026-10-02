import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function RecruiterDashboard() {
  const session = await getSession();
  
  const profile = await prisma.recruiterProfile.findUnique({
    where: { userId: session?.sub },
    include: {
      jobs: {
        include: {
          _count: {
            select: { applications: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Recruiter Dashboard
        </h1>
        <Link 
          href="/recruiter/jobs/new"
          className="px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700"
        >
          Post New Job
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg dark:bg-zinc-900">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate dark:text-gray-400">
              Active Jobs
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
              {profile?.jobs.filter((j: any) => j.status === 'PUBLISHED').length || 0}
            </dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg dark:bg-zinc-900">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate dark:text-gray-400">
              Total Applicants
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
              {profile?.jobs.reduce((acc: any, job: any) => acc + job._count.applications, 0) || 0}
            </dd>
          </div>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-md dark:bg-zinc-900">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200 dark:border-zinc-800">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            Your Job Postings
          </h3>
        </div>
        <ul className="divide-y divide-gray-200 dark:divide-zinc-800">
          {profile?.jobs && profile.jobs.length > 0 ? (
            profile.jobs.map((job: any) => (
              <li key={job.id}>
                <Link href={`/recruiter/jobs/${job.id}`} className="block hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-blue-600 truncate">
                        {job.title}
                      </p>
                      <div className="ml-2 flex-shrink-0 flex space-x-2">
                        <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${job.status === 'PUBLISHED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : ''}
                          ${job.status === 'DRAFT' ? 'bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-gray-300' : ''}
                          ${job.status === 'CLOSED' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : ''}
                        `}>
                          {job.status}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          {job.location || 'Remote'} &bull; {job.jobType.replace('_', ' ')}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 dark:text-gray-400">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                        </svg>
                        {job._count.applications} Applicants
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))
          ) : (
            <li className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
              No jobs posted yet. Create your first job posting!
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
