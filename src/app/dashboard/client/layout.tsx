import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/client/Sidebar";
import Header from "@/components/client/Header";
import { getVapiConfig } from '@/lib/vapi';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function initializeVapiConfig() {
  const vapiConfig = getVapiConfig();
  
  if (!vapiConfig.isInitialized()) {
    try {
      const session = await getServerSession(authOptions);
      
      // If no session, initialize with empty config
      if (!session?.user?.id) {
        await vapiConfig.initialize({
          apiKey: '',
          defaultCallSettings: {
            recordingEnabled: true,
            transcriptionEnabled: true,
          }
        });
        return false;
      }

      // Get configuration from database
      const client = await prisma.client.findFirst({
        where: { 
          userId: parseInt(session.user.id) // Convert string ID to number
        }
      });

    if (!client || !client.vapiKey || !client.vapiAssistantId || !client.vapiPhoneNumberId) {
      console.warn('No active Vapi settings found');
      return;
    }

      await vapiConfig.initialize({
        apiKey: client.vapiKey,
        assistantId: client.vapiAssistantId,
        phoneNumberId: client.vapiPhoneNumberId,
        defaultCallSettings: {
          recordingEnabled: true,
          transcriptionEnabled: true,
        }
      });
      return true;
    } catch (error) {
      console.error('Failed to initialize Vapi config:', error);
      return false;
    }
  }
  return vapiConfig.isInitialized();
}

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isConfigured = await initializeVapiConfig();
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
        {!isConfigured && (
          <div className="bg-yellow-100 p-4">
            Warning: Vapi not configured
          </div>
        )}
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