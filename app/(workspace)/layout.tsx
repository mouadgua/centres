import React from 'react';
import { AppShell } from '@/components/shell/app-shell';
import { ProfilesProvider } from '@/stores/profiles-context';
import { PedagogyProvider } from '@/stores/pedagogy-context';
import { AttendanceProvider } from '@/stores/attendance-context';
import { FinanceProvider } from '@/stores/finance-context';

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      <ProfilesProvider>
        <PedagogyProvider>
          <AttendanceProvider>
            <FinanceProvider>{children}</FinanceProvider>
          </AttendanceProvider>
        </PedagogyProvider>
      </ProfilesProvider>
    </AppShell>
  );
}
