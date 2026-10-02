import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function CandidateDashboard() {
  const session = await getSession();
  
  const profile = await prisma.candidateProfile.findUnique({
    where: { userId: session?.sub },
    include: {
      applications: {
        include: {
          job: true,
          atsScore: true
        }
      }
    }
  });

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome, {session?.name}
        </h1>
        <Link 
          href="/candidate/profile"
          className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-700"
        >
          Edit Profile
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg dark:bg-zinc-900">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate dark:text-gray-400">
              Total Applications
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
              {profile?.applications.length || 0}
            </dd>
          </div>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-md dark:bg-zinc-900">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            Recent Applications
          </h3>
          <Link href="/candidate/jobs" className="text-sm text-blue-600 hover:text-blue-500">
            Browse Jobs
          </Link>
        </div>
        <ul className="divide-y divide-gray-200 dark:divide-zinc-800">
          {profile?.applications && profile.applications.length > 0 ? (
            profile.applications.map((app: any) => (
              <li key={app.id}>
                <Link href={`/candidate/applications/${app.id}`} className="block hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-blue-600 truncate">
                        {app.job.title}
                      </p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${app.status === 'APPLIED' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : ''}
                          ${app.status === 'SELECTED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : ''}
                          ${app.status === 'REJECTED' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : ''}
                          ${['UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW'].includes(app.status) ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : ''}
                        `}>
                          {app.status.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          Applied on {new Date(app.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {app.atsScore && (
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 dark:text-gray-400">
                          Match Score: <span className="ml-1 font-semibold text-gray-900 dark:text-gray-200">{app.atsScore.overallScore}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))
          ) : (
            <li className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
              No applications yet. Start browsing jobs to apply!
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
