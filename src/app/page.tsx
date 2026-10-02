import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-black">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-24 pb-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-8">
              AI-Driven Unified <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Recruitment Platform
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-400 mb-10">
              Streamline your hiring process with automated resume parsing, intelligent candidate matching, and transparent ATS scoring.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/register?role=recruiter"
                className="inline-flex items-center justify-center rounded-full text-base font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 h-12 px-8"
              >
                Start Hiring
              </Link>
              <Link
                href="/register?role=candidate"
                className="inline-flex items-center justify-center rounded-full text-base font-medium transition-colors border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-900 h-12 px-8"
              >
                Find Jobs
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white dark:bg-zinc-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Smart Resume Parsing</h3>
                <p className="text-gray-600 dark:text-gray-400">Instantly extract skills, experience, and education from candidate CVs using advanced NLP.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Intelligent Matching</h3>
                <p className="text-gray-600 dark:text-gray-400">Match candidates to job requirements with automated, explainable ATS scoring.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Unified Workflow</h3>
                <p className="text-gray-600 dark:text-gray-400">Manage everything from job posting to final candidate selection in one dashboard.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
