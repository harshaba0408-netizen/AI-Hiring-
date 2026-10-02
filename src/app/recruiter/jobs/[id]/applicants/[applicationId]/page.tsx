import { prisma } from "@/lib/db";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import StatusSelector from "@/components/recruiter/StatusSelector";

export default async function ApplicantDetailsPage({ 
  params 
}: { 
  params: Promise<{ id: string, applicationId: string }> 
}) {
  const { id, applicationId } = await params;

  const session = await getSession();
  if (!session || session.role !== "RECRUITER") {
    redirect("/login");
  }

  const recruiter = await prisma.recruiterProfile.findUnique({
    where: { userId: session.sub }
  });

  if (!recruiter) redirect("/login");

  const application = await prisma.application.findUnique({
    where: { 
      id: applicationId,
      job: {
        id: id,
        recruiterId: recruiter.id
      }
    },
    include: {
      candidate: {
        include: { 
          user: { select: { name: true, email: true } },
          skills: { include: { skill: true } },
          education: true,
          experience: true
        }
      },
      job: true,
      atsScore: true
    }
  });

  if (!application) {
    notFound();
  }

  const candidate = application.candidate;
  const score = application.atsScore;
  const breakdown = score?.breakdown as any;

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between mb-6">
        <Link href={`/recruiter/jobs/${id}`} className="text-sm font-medium text-blue-600 hover:text-blue-500 flex items-center">
          <svg className="mr-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Ranking Board
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Candidate Profile details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-zinc-900 shadow sm:rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-800">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                Candidate Profile
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center mb-6">
                <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-2xl">
                  {candidate.user.name.charAt(0)}
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{candidate.user.name}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{candidate.user.email}</p>
                </div>
              </div>
              
              <div className="space-y-4 text-sm">
                {candidate.phone && (
                  <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <svg className="mr-2 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {candidate.phone}
                  </div>
                )}
                {candidate.location && (
                  <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <svg className="mr-2 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {candidate.location}
                  </div>
                )}
                {(candidate.linkedinUrl || candidate.githubUrl) && (
                  <div className="pt-4 mt-4 border-t border-gray-200 dark:border-zinc-800 flex space-x-4">
                    {candidate.linkedinUrl && (
                      <a href={candidate.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500">
                        LinkedIn
                      </a>
                    )}
                    {candidate.githubUrl && (
                      <a href={candidate.githubUrl} target="_blank" rel="noopener noreferrer" className="text-gray-900 dark:text-white hover:text-gray-600">
                        GitHub
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-zinc-900 shadow sm:rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Manage Status</h3>
                <StatusSelector applicationId={application.id} currentStatus={application.status} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: ATS Evaluation */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white dark:bg-zinc-900 shadow sm:rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                ATS Evaluation & Analysis
              </h3>
              {score && (
                <span className={`px-4 py-1 rounded-full text-lg font-bold ${
                  score.overallScore >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                  score.overallScore >= 50 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                  'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {score.overallScore}% Match
                </span>
              )}
            </div>
            
            {score && breakdown ? (
              <div className="px-4 py-5 sm:p-6 space-y-8">
                
                {/* Score Bars */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <div className="flex justify-between text-sm font-medium mb-1">
                      <span className="text-gray-700 dark:text-gray-300">Skills Alignment ({score.skillScore}/40)</span>
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
                      <span className="text-gray-700 dark:text-gray-300">Semantic Keywords ({score.keywordScore}/15)</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2">
                      <div className="bg-pink-600 h-2 rounded-full" style={{ width: `${(score.keywordScore / 15) * 100}%` }}></div>
                    </div>
                  </div>
                </div>

                {/* Skill Match Breakdown */}
                {breakdown.skills && (
                  <div className="pt-6 border-t border-gray-200 dark:border-zinc-800">
                    <h4 className="text-base font-bold text-gray-900 dark:text-white mb-4">Skill Assessment</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-4 border border-green-100 dark:border-green-900/30">
                        <h5 className="text-sm font-medium text-green-800 dark:text-green-400 mb-3 flex items-center">
                          <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Matched Job Requirements
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {breakdown.skills.matched?.length > 0 ? (
                            breakdown.skills.matched.map((s: string) => (
                              <span key={s} className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-200 text-green-800 dark:bg-green-800/40 dark:text-green-200">
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">None</span>
                          )}
                        </div>
                      </div>

                      <div className="bg-red-50 dark:bg-red-900/10 rounded-lg p-4 border border-red-100 dark:border-red-900/30">
                        <h5 className="text-sm font-medium text-red-800 dark:text-red-400 mb-3 flex items-center">
                          <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Missing Job Requirements
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {breakdown.skills.missing?.length > 0 ? (
                            breakdown.skills.missing.map((s: string) => (
                              <span key={s} className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-200 text-red-800 dark:bg-red-800/40 dark:text-red-200">
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">None</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* AI Extracted Resume Summary */}
                {candidate.resumeText && (
                  <div className="pt-6 border-t border-gray-200 dark:border-zinc-800">
                    <h4 className="text-base font-bold text-gray-900 dark:text-white mb-4">Parsed CV Snippet</h4>
                    <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4 max-h-64 overflow-y-auto">
                      <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap font-mono">
                        {candidate.resumeText.substring(0, 1000)}...
                      </p>
                    </div>
                  </div>
                )}
                
              </div>
            ) : (
              <div className="px-4 py-12 text-center text-gray-500">
                ATS Score is currently being generated...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
