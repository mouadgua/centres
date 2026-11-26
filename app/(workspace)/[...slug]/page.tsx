'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, Layers } from 'lucide-react';
import { ModuleGate } from '@/components/feedback/module-gate';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ALL_MODULES } from '@/lib/mock-api/demo-data';
import { findNavItemByPath } from '@/lib/permissions/navigation';
import { useDemoSession } from '@/stores/demo-session-context';

export default function WorkspaceRoutePlaceholderPage() {
  const pathname = usePathname();
  const { activeUser } = useDemoSession();
  const navItem = findNavItemByPath(pathname);

  const moduleMeta = navItem?.requiredModule
    ? ALL_MODULES.find((m) => m.key === navItem.requiredModule)
    : undefined;

  return (
    <ModuleGate
      moduleKey={navItem?.requiredModule}
      allowedRoles={navItem?.roles}
    >
      <div className="mx-auto max-w-2xl py-8">
        <Card className="border-border shadow-none">
          <CardHeader className="space-y-2">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-primary">
              <Layers className="size-5" />
            </div>
            <CardTitle className="text-xl">
              {navItem?.label ?? 'Écran du prototype'}
            </CardTitle>
            <CardDescription>
              Route typée vérifiée : <code className="font-mono">{pathname}</code>
              {navItem?.implementedInLot
                ? ` · Livraison complète prévue au Lot ${navItem.implementedInLot}.`
                : ' · Écran réservé aux lots suivants.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {moduleMeta && (
              <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
                <p className="font-medium text-foreground">
                  Module : {moduleMeta.name}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {moduleMeta.description}
                </p>
              </div>
            )}
            <p className="text-xs leading-relaxed text-muted-foreground">
              Dans le cadre du <strong>Lot 1 (Design Foundation & Shell)</strong>,
              cette route valide la navigation latérale, le filtrage par rôle et
              l&apos;activation modulaire Super Admin sans erreur 404.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href={activeUser.defaultRoute}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <ArrowLeft className="size-4" />
                Retour au tableau de bord
              </Link>
              <Link
                href="/demo"
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
              >
                Console Mode Démo
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </ModuleGate>
  );
}
