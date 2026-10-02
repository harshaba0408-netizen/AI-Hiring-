import { requireRole } from "@/lib/auth";

export default async function RecruiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("RECRUITER");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
