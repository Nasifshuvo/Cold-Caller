import { NextResponse } from 'next/server';

export async function GET() {
  // Create sample CSV content
  const csvContent = `phone
+8801712345678
+8801812345678
+8801912345678`;

  // Create response with CSV headers
  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename=sample-messages.csv'
    }
  });
} 