import { prisma } from "@/lib/db";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function ApplicationDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const session = await getSession();
  if (!session || session.role !== "CANDIDATE") {
    redirect("/login");
  }

  const profile = await prisma.candidateProfile.findUnique({
    where: { userId: session.sub }
  });

  if (!profile) redirect("/login");

  const application = await prisma.application.findUnique({
    where: { id: id, candidateId: profile.id },
    include: {
      job: {
        include: { recruiter: true }
      },
      atsScore: true
    }
  });

  if (!application) {
    notFound();
  }

  const score = application.atsScore;
  // Parse the JSON breakdown if it exists
  const breakdown = score?.breakdown as any;

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between mb-6">
        <Link href="/candidate/dashboard" className="text-sm font-medium text-blue-600 hover:text-blue-500 flex items-center">
          <svg className="mr-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Dashboard
        </Link>
      </div>

      <div className="bg-white dark:bg-zinc-900 shadow sm:rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-start border-b border-gray-200 dark:border-zinc-800">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              Application for {application.job.title}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {application.job.recruiter.company} &bull; Applied on {new Date(application.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium 
              ${application.status === 'APPLIED' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : ''}
              ${application.status === 'SELECTED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : ''}
              ${application.status === 'REJECTED' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : ''}
              ${['UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW'].includes(application.status) ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : ''}
            `}>
              {application.status.replace("_", " ")}
            </span>
          </div>
        </div>

        {score && (
          <div className="px-4 py-5 sm:p-6 bg-gray-50 dark:bg-zinc-800/30 border-b border-gray-200 dark:border-zinc-800">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">ATS Match Analysis</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <span className="block text-5xl font-extrabold text-blue-600 dark:text-blue-400">
                    {score.overallScore}%
                  </span>
                  <span className="block mt-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Overall Match Score
                  </span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm font-medium mb-1">
                    <span className="text-gray-700 dark:text-gray-300">Skills ({score.skillScore}/40)</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(score.skillScore / 40) * 100}%` }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm font-medium mb-1">
                    <span className="text-gray-700 dark:text-gray-300">Experience ({score.experienceScore}/25)</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2">
                    <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${(score.experienceScore / 25) * 100}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm font-medium mb-1">
                    <span className="text-gray-700 dark:text-gray-300">Education ({score.educationScore}/20)</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${(score.educationScore / 20) * 100}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm font-medium mb-1">
                    <span className="text-gray-700 dark:text-gray-300">Keywords ({score.keywordScore}/15)</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2">
                    <div className="bg-pink-600 h-2 rounded-full" style={{ width: `${(score.keywordScore / 15) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {breakdown && breakdown.skills && (
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-zinc-700">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Skills Breakdown</h4>
                
                {breakdown.skills.matched?.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">Matched Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {breakdown.skills.matched.map((s: string) => (
                        <span key={s} className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {breakdown.skills.missing?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">Missing Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {breakdown.skills.missing.map((s: string) => (
                        <span key={s} className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
