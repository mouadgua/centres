'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, Building2, Layers, ShieldCheck } from 'lucide-react';
import { ModuleGate } from '@/components/feedback/module-gate';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ALL_MODULES } from '@/lib/mock-api/demo-data';
import { formatMAD, formatNumberFR } from '@/lib/format/morocco';
import { useDemoSession } from '@/stores/demo-session-context';

export default function SuperAdminDashboardPage() {
  const { centers, switchCenter, switchRole } = useDemoSession();

  const totalStudentsAggregated = centers.reduce(
    (sum, c) => sum + c.metrics.activeStudents,
    0
  );
  const totalRevenueAggregated = centers.reduce(
    (sum, c) => sum + c.metrics.collectedRevenueMad,
    0
  );

  return (
    <ModuleGate allowedRoles={['super_admin']}>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Vue globale Plateforme SaaS
          </h1>
          <p className="text-sm text-muted-foreground">
            Supervision agrégée des instances centres — aucune donnée nominative
            d&apos;élève n&apos;est exposée à ce niveau.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border shadow-none">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Centres actifs (démo)</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-2xl font-semibold tabular-nums">
                {centers.length}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                3 plans configurés (Essentiel, Plus, Tout-en-un)
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-none">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Volume élèves agrégé</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-2xl font-semibold tabular-nums">
                {formatNumberFR(totalStudentsAggregated)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Compteurs consolidés multi-centres
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-none">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Catalogue de modules</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-2xl font-semibold tabular-nums">
                {ALL_MODULES.length}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Clés de capacités activables par instance
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-none">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Activité financière agrégée</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-2xl font-semibold tabular-nums">
                {formatMAD(totalRevenueAggregated)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Flux simulés ce mois
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border shadow-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Instances gérées</CardTitle>
              <CardDescription className="text-xs">
                Chaque centre dispose d&apos;un périmètre modulaire indépendant
              </CardDescription>
            </div>
            <Link
              href="/super/instances"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Configurer les modules
              <ArrowUpRight className="size-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            {centers.map((center) => (
              <div
                key={center.id}
                className="flex flex-col justify-between gap-3 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
              >
                <div className="space-y-0.5">
                  <Link
                    href={`/super/centers/${center.id}`}
                    className="flex items-center gap-2 text-sm font-medium hover:text-primary hover:underline"
                  >
                    <Building2 className="size-4 text-muted-foreground" />
                    {center.name} — {center.city}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    Plan {center.plan} · {center.enabledModules.length} modules
                    actifs · {center.branding.subdomain}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono text-xs text-muted-foreground tabular-nums">
                    {formatNumberFR(center.metrics.activeStudents)} élèves
                  </span>
                  <Link
                    href={`/super/centers/${center.id}/configuration`}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium transition-colors hover:bg-muted"
                  >
                    Modules
                  </Link>
                  <Link
                    href="/admin/dashboard"
                    onClick={() => {
                      switchCenter(center.id);
                      switchRole('director');
                    }}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium transition-colors hover:bg-muted"
                  >
                    <Layers className="size-3.5" />
                    Prévisualiser en Directeur
                  </Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
          <p>
            Séparation de confidentialité : le configurateur d&apos;instances
            permet d&apos;activer ou désactiver chaque capacité par centre avec
            vérification explicite des dépendances et aperçu de l&apos;impact sur
            la navigation Directeur et l&apos;onboarding.
          </p>
        </div>
      </div>
    </ModuleGate>
  );
}
