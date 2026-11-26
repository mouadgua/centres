'use client';

import React from 'react';
import Link from 'next/link';
import { CalendarDays, QrCode, Receipt } from 'lucide-react';
import { ModuleGate, CapabilityGate } from '@/components/feedback/module-gate';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatMAD } from '@/lib/format/morocco';
import { useDemoSession } from '@/stores/demo-session-context';

export default function StudentHomePage() {
  const { activeUser, activeCenter } = useDemoSession();
  const nextSession = activeCenter.todaySessions[0];

  return (
    <ModuleGate allowedRoles={['student']}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Espace Étudiant — {activeUser.fullName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {activeCenter.name} ({activeCenter.city})
            </p>
          </div>
          <CapabilityGate moduleKey="attendance.qr">
            <Link
              href="/student/qr"
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <QrCode className="size-4" />
              Afficher mon QR (démo)
            </Link>
          </CapabilityGate>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {nextSession && (
            <Card className="border-border shadow-none">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Prochain cours</CardDescription>
                <CardTitle className="text-base">{nextSession.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                <p>
                  {nextSession.startTime}–{nextSession.endTime} ·{' '}
                  {nextSession.roomName}
                </p>
                <p className="mt-1">{nextSession.teacherName}</p>
              </CardContent>
            </Card>
          )}

          <Card className="border-border shadow-none">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Assiduité (démo)</CardDescription>
              <CardTitle className="font-mono text-xl tabular-nums">
                96 %
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              24 séances présentes · 1 retard
            </CardContent>
          </Card>

          <CapabilityGate moduleKey="receipts">
            <Card className="border-border shadow-none">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Situation financière</CardDescription>
                <CardTitle className="font-mono text-xl tabular-nums">
                  {formatMAD(0)}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between text-xs text-muted-foreground">
                <span>À jour ce mois-ci</span>
                <Link
                  href="/student/payments"
                  className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                >
                  <Receipt className="size-3.5" />
                  Reçus
                </Link>
              </CardContent>
            </Card>
          </CapabilityGate>
        </div>

        <CapabilityGate moduleKey="calendar.internal">
          <Link
            href="/student/calendar"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <CalendarDays className="size-4" />
            Consulter mon emploi du temps complet
          </Link>
        </CapabilityGate>
      </div>
    </ModuleGate>
  );
}
