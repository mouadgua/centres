'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import {
  MarketingFooter,
  MarketingHeader,
} from '@/components/marketing/marketing-shell';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ALL_MODULES } from '@/lib/mock-api/demo-data';
import type { ModuleGroup } from '@/types/core';

const GROUPS: ModuleGroup[] = [
  'Base',
  'Présences',
  'Parents',
  'Communication',
  'Finance',
  'Documents',
  'Données',
  'Calendrier',
  'Qualité',
  'Marque',
];

export default function FeaturesPage() {
  const [selectedGroup, setSelectedGroup] = useState<'all' | ModuleGroup>('all');

  const visibleModules =
    selectedGroup === 'all'
      ? ALL_MODULES
      : ALL_MODULES.filter((m) => m.group === selectedGroup);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />

      <main className="mx-auto max-w-6xl space-y-10 px-4 py-12 sm:px-6">
        <div className="max-w-3xl space-y-3">
          <p className="text-xs font-medium text-muted-foreground">
            Catalogue fonctionnel · {ALL_MODULES.length} capacités modulaires
          </p>
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Fonctionnalités par domaine et par rôle
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            Chaque module ci-dessous est activable indépendamment par le Super
            Admin selon le contrat du centre.
          </p>
        </div>

        {/* Filter bar */}
        <div
          role="group"
          aria-label="Filtrer par domaine"
          className="flex flex-wrap gap-1.5"
        >
          <button
            type="button"
            onClick={() => setSelectedGroup('all')}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              selectedGroup === 'all'
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:text-foreground'
            }`}
          >
            Tous ({ALL_MODULES.length})
          </button>
          {GROUPS.map((grp) => (
            <button
              key={grp}
              type="button"
              onClick={() => setSelectedGroup(grp)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedGroup === grp
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground'
              }`}
            >
              {grp}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleModules.map((mod) => (
            <Card key={mod.key} className="border-border shadow-none">
              <CardHeader className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{mod.group}</span>
                  <span>Plan {mod.planRequirement}</span>
                </div>
                <CardTitle className="text-base">{mod.name}</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  {mod.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-[11px] text-muted-foreground">
                Rôles : {mod.rolesAllowed.join(', ')}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end">
          <Link
            href="/onboarding"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Configurer un centre en démo
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
