'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, QrCode, CalendarDays } from 'lucide-react';
import { ModuleGate, CapabilityGate } from '@/components/feedback/module-gate';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useDemoSession } from '@/stores/demo-session-context';

export default function TeacherHomePage() {
  const { activeUser, activeCenter } = useDemoSession();

  return (
    <ModuleGate allowedRoles={['teacher']}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Bonjour, {activeUser.fullName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {activeCenter.name} · Vos séances du jour et accès rapides
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <CapabilityGate moduleKey="attendance.manual">
              <Link
                href="/teacher/scan"
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <QrCode className="size-4" />
                Présences / Scanner QR
              </Link>
            </CapabilityGate>
            <CapabilityGate moduleKey="calendar.internal">
              <Link
                href="/teacher/calendar"
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium transition-colors hover:bg-muted"
              >
                <CalendarDays className="size-4" />
                Mon calendrier
              </Link>
            </CapabilityGate>
          </div>
        </div>

        <Card className="border-border shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Séances planifiées aujourd&apos;hui</CardTitle>
            <CardDescription className="text-xs">
              Extrait des cours affectés sur {activeCenter.name} (Mode Démo)
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            {activeCenter.todaySessions.map((ses) => (
              <div
                key={ses.id}
                className="flex flex-col justify-between gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
              >
                <div>
                  <p className="text-sm font-medium">{ses.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {ses.groupName} · {ses.roomName} ({ses.siteName})
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-1 font-mono text-muted-foreground tabular-nums">
                    <Clock className="size-3.5" />
                    {ses.startTime}–{ses.endTime}
                  </span>
                  <span className="font-mono font-medium tabular-nums">
                    {ses.expectedStudents} élèves attendus
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </ModuleGate>
  );
}
