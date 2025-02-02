import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from './providers';
import { getVapiConfig } from '@/lib/vapi';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Voice AI",
  description: "Voice AI",
};

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isConfigured = await initializeVapiConfig();
  
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* {!isConfigured && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
            <p className="font-bold">Vapi Configuration Incomplete</p>
            <p>Some features may be limited. Please check your Vapi settings.</p>
          </div>
        )} */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
