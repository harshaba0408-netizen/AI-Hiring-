import Link from "next/link";
import { getSession } from "@/lib/auth";

export default async function Navbar() {
  const session = await getSession();

  return (
    <nav className="border-b bg-white dark:bg-black dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                HireAI
              </span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {session ? (
              <>
                <Link
                  href={
                    session.role === "CANDIDATE" 
                      ? "/candidate/dashboard" 
                      : session.role === "RECRUITER" 
                      ? "/recruiter/dashboard" 
                      : "/admin/dashboard"
                  }
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                >
                  Dashboard
                </Link>
                <form action="/api/auth/logout" method="POST">
                  <button
                    type="submit"
                    className="text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                  >
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-9 px-4 py-2"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
