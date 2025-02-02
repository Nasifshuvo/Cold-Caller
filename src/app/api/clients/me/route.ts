import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log("The session", session);
    console.log("The user ID", session.user.id);

    // Log the query we're about to make
    console.log("Attempting to find client with query:", {
      where: {
        userId: session.user.id
      }
    });

    try {
      const client = await prisma.client.findFirst({
        where: {
          userId: Number(session.user.id)
        }
      });
      console.log("Database response:", client);

      if (!client) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }
      return NextResponse.json(client);
    } catch (dbError) {
      console.error("Database error details:", {
        error: dbError,
        errorMessage: dbError instanceof Error ? dbError.message : 'Unknown error',
        query: {
          where: {
            userId: session.user.id
          }
        }
      });
      throw dbError;
    }
  } catch (error) {
    console.error("Full error object:", error);
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 });
  }
} 