'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
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
import { formatMAD } from '@/lib/format/morocco';
import {
  PLAN_PRICING_MAD,
  PRESET_MODULES,
} from '@/lib/mock-api/super-admin-data';
import type { PlanTier } from '@/types/core';

const PLANS: PlanTier[] = ['Essentiel', 'Plus', 'Tout-en-un', 'Sur mesure'];

const COMPARISON_ROWS = [
  {
    feature: 'Dossiers élèves, professeurs, groupes & séances',
    values: ['Inclus', 'Inclus', 'Inclus', 'Inclus'],
  },
  {
    feature: 'Présences QR (prototype) & alertes absences',
    values: ['Appel manuel', 'Inclus', 'Inclus', 'Inclus'],
  },
  {
    feature: 'Encaissements MAD, échéances & reçus PDF démo',
    values: ['Inclus', 'Inclus', 'Inclus', 'Inclus'],
  },
  {
    feature: 'Rémunération professeurs & exports comptables',
    values: ['Non inclus', 'Sur option', 'Inclus', 'Inclus'],
  },
  {
    feature: 'Studio de données (Tableur & Import 7 étapes)',
    values: ['Exports seuls', 'Imports + Exports', 'Inclus complet', 'Inclus complet'],
  },
  {
    feature: 'Portail Parent & prise de rendez-vous',
    values: ['Non inclus', 'Contacts seuls', 'Inclus complet', 'Inclus complet'],
  },
  {
    feature: 'Marque blanche & sous-domaine personnalisé',
    values: ['Non inclus', 'Logo + couleurs', 'Complet', 'Complet'],
  },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />

      <main className="mx-auto max-w-6xl space-y-12 px-4 py-12 sm:px-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Tarifs indicatifs Mode Démo · Devise MAD HT
            </p>
            <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Des plans alignés sur vos modules activés
            </h1>
            <p className="text-sm text-muted-foreground">
              Aucun paiement réel n&apos;est traité dans ce prototype frontend.
            </p>
          </div>

          <div
            role="group"
            aria-label="Cadence de facturation"
            className="inline-flex w-fit items-center rounded-lg border border-border bg-muted/50 p-0.5"
          >
            <button
              type="button"
              onClick={() => setAnnual(false)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                !annual
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground'
              }`}
            >
              Mensuel
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                annual
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground'
              }`}
            >
              Annuel (-15 % indicatif)
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => {
            const info = PLAN_PRICING_MAD[plan];
            const price = annual
              ? Math.round(info.monthlyMad * 0.85)
              : info.monthlyMad;
            const modCount =
              plan === 'Sur mesure'
                ? 'À la carte'
                : `${PRESET_MODULES[plan].length} modules`;

            return (
              <Card
                key={plan}
                className={`flex flex-col justify-between shadow-none ${
                  plan === 'Plus' ? 'border-primary/60' : 'border-border'
                }`}
              >
                <CardHeader className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {info.audience}
                  </p>
                  <CardTitle className="text-lg">{plan}</CardTitle>
                  <p className="font-mono text-2xl font-bold tabular-nums">
                    {formatMAD(price)}
                    <span className="font-sans text-xs font-normal text-muted-foreground">
                      {' '}
                      / mois
                    </span>
                  </p>
                  <CardDescription className="text-xs leading-relaxed">
                    {info.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check className="size-3.5 text-primary" />
                      {info.studentsLimit}
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="size-3.5 text-primary" />
                      {info.sitesLimit}
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="size-3.5 text-primary" />
                      {modCount}
                    </li>
                  </ul>
                  <Link
                    href={`/onboarding?plan=${encodeURIComponent(plan)}`}
                    className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-background text-xs font-medium transition-colors hover:bg-muted"
                  >
                    Essayer en démo
                    <ArrowRight className="size-3.5" />
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Comparison Table */}
        <section className="space-y-4">
          <h2 className="font-heading text-xl font-semibold">
            Matrice comparative des capacités
          </h2>
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="border-b border-border bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="p-3.5 font-medium">Capacité</th>
                  {PLANS.map((p) => (
                    <th key={p} className="p-3.5 font-medium whitespace-nowrap">
                      {p}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.feature}>
                    <td className="p-3.5 font-medium text-foreground">
                      {row.feature}
                    </td>
                    {row.values.map((val, idx) => (
                      <td
                        key={`${row.feature}-${idx}`}
                        className="p-3.5 text-muted-foreground whitespace-nowrap"
                      >
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
