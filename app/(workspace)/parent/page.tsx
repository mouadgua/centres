'use client';

import React from 'react';
import Link from 'next/link';
import { CalendarDays, Receipt, Users } from 'lucide-react';
import { ModuleGate } from '@/components/feedback/module-gate';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatMAD } from '@/lib/format/morocco';
import { useDemoSession } from '@/stores/demo-session-context';

export default function ParentHomePage() {
  const { activeUser, activeCenter } = useDemoSession();

  return (
    <ModuleGate moduleKey="parent.portal" allowedRoles={['parent']}>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Espace Famille — {activeUser.fullName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {activeCenter.name} · Suivi des enfants inscrits (données fictives)
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-border shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="size-4 text-primary" />
                Yassine Tazi — 2ème Bac SM
              </CardTitle>
              <CardDescription className="text-xs">
                Groupe A · {activeCenter.locations[0]?.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3 text-xs">
              <Link
                href="/parent/calendar"
                className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
              >
                <CalendarDays className="size-3.5" />
                Planning des séances
              </Link>
              <Link
                href="/parent/payments"
                className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
              >
                <Receipt className="size-3.5" />
                Relevé financier ({formatMAD(0)} dû)
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </ModuleGate>
  );
}
