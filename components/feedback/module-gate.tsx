'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Lock, Layers, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ALL_MODULES } from '@/lib/mock-api/demo-data';
import { useDemoSession } from '@/stores/demo-session-context';
import type { ModuleKey, RoleId } from '@/types/core';

interface ModuleGateProps {
  moduleKey?: ModuleKey;
  allowedRoles?: RoleId[];
  children: React.ReactNode;
}

export function ModuleGate({
  moduleKey,
  allowedRoles,
  children,
}: ModuleGateProps) {
  const { activeRole, activeUser, activeCenter, hasModule } = useDemoSession();
  const [requestSent, setRequestSent] = useState(false);

  const roleAllowed = !allowedRoles || allowedRoles.includes(activeRole);
  const moduleEnabled = hasModule(moduleKey);

  if (!roleAllowed) {
    return (
      <div className="mx-auto max-w-xl py-12">
        <Card className="border-border shadow-none">
          <CardHeader className="space-y-2">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Lock className="size-5" />
            </div>
            <CardTitle className="text-lg">Accès non autorisé pour ce profil</CardTitle>
            <CardDescription>
              Votre rôle actif en Mode Démo ({activeUser.roleLabel}) ne dispose pas de
              l&apos;autorisation pour consulter cet écran. Cette restriction simule les
              permissions UX ; un contrôle serveur s&apos;appliquera en production.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Link
              href={activeUser.defaultRoute}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <ArrowLeft className="size-4" />
              Retour à mon espace
            </Link>
            <Link
              href="/demo"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Changer de profil démo
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (moduleKey && !moduleEnabled) {
    const moduleMeta = ALL_MODULES.find((m) => m.key === moduleKey);
    return (
      <div className="mx-auto max-w-xl py-12">
        <Card className="border-border shadow-none">
          <CardHeader className="space-y-2">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Layers className="size-5" />
            </div>
            <CardTitle className="text-lg">
              Module non activé pour {activeCenter.name}
            </CardTitle>
            <CardDescription>
              La capacité « {moduleMeta?.name ?? moduleKey} » est désactivée par
              l&apos;administrateur plateforme sur l&apos;instance{' '}
              <span className="font-medium text-foreground">
                {activeCenter.plan}
              </span>
              . Aucune donnée de ce module n&apos;est exposée.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {moduleMeta ? (
              <div className="rounded-lg border border-border bg-muted/40 p-3.5 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{moduleMeta.name}</p>
                <p className="mt-1">{moduleMeta.description}</p>
                <p className="mt-2 text-xs">
                  Plan requis indicatif : {moduleMeta.planRequirement} · Catégorie :{' '}
                  {moduleMeta.group}
                </p>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                disabled={requestSent}
                onClick={() => {
                  setRequestSent(true);
                  toast.info('Demande simulée enregistrée', {
                    description: `En production, une notification serait transmise au Super Admin SaaS pour activer « ${moduleMeta?.name ?? moduleKey} ».`,
                  });
                }}
              >
                {requestSent ? (
                  <>
                    <CheckCircle2 className="size-4" />
                    Demande simulée envoyée
                  </>
                ) : (
                  'Demander l’activation (démo)'
                )}
              </Button>
              <Link
                href={activeUser.defaultRoute}
                className="inline-flex h-8 items-center gap-2 rounded-lg border border-border bg-background px-3.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <ArrowLeft className="size-4" />
                Retour
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

export function CapabilityGate({
  moduleKey,
  fallback = null,
  children,
}: {
  moduleKey?: ModuleKey;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { hasModule } = useDemoSession();
  if (!hasModule(moduleKey)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}
