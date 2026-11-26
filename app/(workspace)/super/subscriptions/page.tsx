'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Layers } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatMAD } from '@/lib/format/morocco';
import {
  INITIAL_SAAS_SUBSCRIPTIONS,
  PLAN_PRICING_MAD,
  PRESET_MODULES,
} from '@/lib/mock-api/super-admin-data';
import { useDemoSession } from '@/stores/demo-session-context';
import type { PlanTier } from '@/types/core';

export default function SuperSubscriptionsPage() {
  const { setCenterModules } = useDemoSession();
  const [subs, setSubs] = useState(INITIAL_SAAS_SUBSCRIPTIONS);

  const handlePlanChange = (subId: string, centerId: string, nextPlan: PlanTier) => {
    setSubs((prev) =>
      prev.map((s) =>
        s.id === subId
          ? {
              ...s,
              plan: nextPlan,
              monthlyPriceMad: PLAN_PRICING_MAD[nextPlan].monthlyMad,
            }
          : s
      )
    );
    if (nextPlan !== 'Sur mesure') {
      setCenterModules(centerId, PRESET_MODULES[nextPlan], nextPlan);
    }
    toast.success(`Plan basculé vers ${nextPlan} (Mode Démo)`);
  };

  return (
    <ModuleGate allowedRoles={['super_admin']}>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Plans &amp; abonnements centres
          </h1>
          <p className="text-sm text-muted-foreground">
            Tarifs SaaS indicatifs en MAD. Changer un plan ici synchronise le
            preset de modules du centre dans la démo.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {(['Essentiel', 'Plus', 'Tout-en-un', 'Sur mesure'] as PlanTier[]).map(
            (tier) => {
              const info = PLAN_PRICING_MAD[tier];
              return (
                <Card key={tier} className="border-border shadow-none">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{tier}</CardTitle>
                    <CardDescription className="text-xs">
                      {info.audience}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-1 text-xs">
                    <p className="font-mono text-lg font-semibold tabular-nums">
                      {formatMAD(info.monthlyMad)} / mois
                    </p>
                    <p className="text-muted-foreground">
                      {info.studentsLimit} · {info.sitesLimit}
                    </p>
                  </CardContent>
                </Card>
              );
            }
          )}
        </div>

        <Card className="border-border shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="size-4 text-primary" />
              Abonnements actifs (démo)
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            {subs.map((sub) => (
              <div
                key={sub.id}
                className="flex flex-col justify-between gap-3 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{sub.centerName}</p>
                  <p className="text-xs text-muted-foreground">
                    Cycle : {sub.billingCycle} · Renouvellement :{' '}
                    {sub.nextRenewal} ·{' '}
                    <span className="font-mono tabular-nums">
                      {formatMAD(sub.monthlyPriceMad)}/mois
                    </span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={sub.plan}
                    onValueChange={(val) =>
                      handlePlanChange(
                        sub.id,
                        sub.centerId,
                        (val as PlanTier) ?? sub.plan
                      )
                    }
                  >
                    <SelectTrigger className="w-36 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Essentiel">Essentiel</SelectItem>
                      <SelectItem value="Plus">Plus</SelectItem>
                      <SelectItem value="Tout-en-un">Tout-en-un</SelectItem>
                      <SelectItem value="Sur mesure">Sur mesure</SelectItem>
                    </SelectContent>
                  </Select>
                  <Link
                    href={`/super/centers/${sub.centerId}/configuration`}
                    className="inline-flex h-8 items-center rounded-lg border border-border px-2.5 text-xs font-medium hover:bg-muted"
                  >
                    Modules
                  </Link>
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    onClick={() =>
                      toast.info('Facturation SaaS simulée (pas de paiement réel)')
                    }
                  >
                    Détails
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </ModuleGate>
  );
}
