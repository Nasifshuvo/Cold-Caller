import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/client/Sidebar";
import Header from "@/components/client/Header";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const session = await auth();
    console.log('Session:', session); // Debug log

    if (!session) {
      console.log('No session, redirecting to signin'); // Debug log
      redirect("/auth/signin");
    }

    if (session.user.role !== "CLIENT") {
      console.log('Not a client, redirecting'); // Debug log
      redirect("/dashboard/admin");
    }

    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
            {children}
          </main>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Layout error:", error);
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Something went wrong. Please try again.</p>
      </div>
    );
  }
} 