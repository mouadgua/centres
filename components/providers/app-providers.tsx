'use client';

import React from 'react';
import { ThemeProvider } from 'next-themes';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { DemoSessionProvider } from '@/stores/demo-session-context';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <DemoSessionProvider>
        <TooltipProvider delay={200}>
          {children}
          <Toaster position="bottom-right" richColors closeButton />
        </TooltipProvider>
      </DemoSessionProvider>
    </ThemeProvider>
  );
}
