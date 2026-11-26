'use client';

import React from 'react';
import { BarChart3 } from 'lucide-react';
import { ModuleGate } from '@/components/feedback/module-gate';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatMAD, formatNumberFR } from '@/lib/format/morocco';
import { ALL_MODULES } from '@/lib/mock-api/demo-data';
import { PLAN_PRICING_MAD } from '@/lib/mock-api/super-admin-data';
import { useDemoSession } from '@/stores/demo-session-context';

export default function SuperAnalyticsPage() {
  const { centers } = useDemoSession();

  const estimatedMrrMad = centers.reduce(
    (sum, c) => sum + PLAN_PRICING_MAD[c.plan].monthlyMad,
    0
  );
  const totalStudents = centers.reduce(
    (sum, c) => sum + c.metrics.activeStudents,
    0
  );

  const groupAdoption = (
    [
      'Base',
      'Présences',
      'Parents',
      'Communication',
      'Finance',
      'Données',
      'Calendrier',
    ] as const
  ).map((grp) => {
    const mods = ALL_MODULES.filter((m) => m.group === grp);
    const possible = Math.max(1, mods.length * centers.length);
    const active = centers.reduce(
      (sum, c) =>
        sum + mods.filter((m) => c.enabledModules.includes(m.key)).length,
      0
    );
    return {
      group: grp,
      percent: Math.round((active / possible) * 100),
    };
  });

  return (
    <ModuleGate allowedRoles={['super_admin']}>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Analytique Plateforme (Données démo agrégées)
          </h1>
          <p className="text-sm text-muted-foreground">
            Indicateurs consolidés multi-centres sans accès aux profils
            individuels d&apos;élèves.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-border shadow-none">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">
                MRR SaaS simulé (Données démo)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-2xl font-semibold tabular-nums">
                {formatMAD(estimatedMrrMad)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-none">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">
                Instances actives
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-2xl font-semibold tabular-nums">
                {centers.filter((c) => c.status !== 'suspendu').length} /{' '}
                {centers.length}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-none">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">
                Élèves gérés (volume agrégé)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-2xl font-semibold tabular-nums">
                {formatNumberFR(totalStudents)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="size-4 text-primary" />
              Adoption des domaines modulaires (calculée sur vos instances)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {groupAdoption.map((item) => (
              <div key={item.group} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{item.group}</span>
                  <span className="font-mono text-muted-foreground tabular-nums">
                    {item.percent} %
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </ModuleGate>
  );
}
