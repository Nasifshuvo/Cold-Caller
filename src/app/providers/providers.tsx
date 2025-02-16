'use client';

import { SessionProvider } from 'next-auth/react';
import TanstackProvider from './TanstackProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TanstackProvider>
        {children}
      </TanstackProvider>
    </SessionProvider>
  );
} 