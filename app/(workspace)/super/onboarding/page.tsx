'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Compass, RefreshCw, Send } from 'lucide-react';
import { toast } from 'sonner';
import { ModuleGate } from '@/components/feedback/module-gate';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  INITIAL_ONBOARDING_PROGRESS,
  PRESET_MODULES,
} from '@/lib/mock-api/super-admin-data';
import { getActiveOnboardingSteps } from '@/features/onboarding-wizard/onboarding-config';

export default function SuperOnboardingPage() {
  const [rows, setRows] = useState(INITIAL_ONBOARDING_PROGRESS);

  const handleResendInvite = (id: string, email: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              invitationStatus: 'en_attente',
              lastUpdated: "À l'instant (démo)",
            }
          : r
      )
    );
    toast.info(`Invitation simulée régénérée pour ${email}`, {
      description: 'Mode Démo : aucun email réel n’a été envoyé.',
    });
  };

  return (
    <ModuleGate allowedRoles={['super_admin']}>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="space-y-1">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Onboarding &amp; invitations plateformes
            </h1>
            <p className="text-sm text-muted-foreground">
              Suivi de mise en service des instances et nombre d&apos;étapes
              actives calculées selon chaque plan.
            </p>
          </div>
          <Link
            href="/onboarding"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Compass className="size-3.5" />
            Lancer le wizard adaptatif
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {(['Essentiel', 'Plus', 'Tout-en-un'] as const).map((tier) => {
            const steps = getActiveOnboardingSteps(PRESET_MODULES[tier]);
            return (
              <Card key={tier} className="border-border shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Modèle {tier}</CardTitle>
                  <CardDescription className="text-xs">
                    {PRESET_MODULES[tier].length} modules inclus
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="font-mono text-xl font-semibold tabular-nums">
                    {steps.length} / 17 étapes
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Étapes conditionnelles automatiquement filtrées
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="border-border shadow-none">
          <CardHeader>
            <CardTitle className="text-base">
              Progression des centres (démo)
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            {rows.map((row) => (
              <div
                key={row.id}
                className="flex flex-col justify-between gap-3 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{row.centerName}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.directorEmail} · Plan {row.plan} ·{' '}
                    <span className="font-mono tabular-nums">
                      {row.completedSteps}/{row.totalSteps} étapes
                    </span>{' '}
                    · {row.lastUpdated}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium capitalize text-muted-foreground">
                    {row.invitationStatus.replace('_', ' ')}
                  </span>
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    onClick={() =>
                      handleResendInvite(row.id, row.directorEmail)
                    }
                    className="gap-1.5"
                  >
                    <Send className="size-3" />
                    Relancer (démo)
                  </Button>
                  <Link
                    href="/onboarding"
                    className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2.5 text-xs font-medium hover:bg-muted"
                  >
                    <RefreshCw className="size-3" />
                    Ouvrir
                  </Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </ModuleGate>
  );
}
