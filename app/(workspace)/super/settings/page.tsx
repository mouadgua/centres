'use client';

import React, { useState } from 'react';
import { Save, Settings } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';

export default function SuperSettingsPage() {
  const [allowSelfOnboarding, setAllowSelfOnboarding] = useState(true);
  const [maintenancePreview, setMaintenancePreview] = useState(false);

  return (
    <ModuleGate allowedRoles={['super_admin']}>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Paramètres globaux de la plateforme
          </h1>
          <p className="text-sm text-muted-foreground">
            Réglages par défaut appliqués aux nouvelles instances (Mode Démo).
          </p>
        </div>

        <Card className="border-border shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings className="size-4 text-primary" />
              Paramètres régionaux par défaut
            </CardTitle>
            <CardDescription className="text-xs">
              Valeurs adaptées au marché marocain.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-xl border border-border p-3">
              <p className="text-xs text-muted-foreground">Devise</p>
              <p className="font-mono font-semibold">MAD (Dirham)</p>
            </div>
            <div className="rounded-xl border border-border p-3">
              <p className="text-xs text-muted-foreground">Fuseau horaire</p>
              <p className="font-mono font-semibold">Africa/Casablanca</p>
            </div>
            <div className="rounded-xl border border-border p-3">
              <p className="text-xs text-muted-foreground">Langues</p>
              <p className="font-semibold">FR (défaut) + AR RTL</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-none">
          <CardHeader>
            <CardTitle className="text-base">
              Comportement d&apos;exploitation (simulation)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-border p-3.5">
              <div>
                <p className="text-sm font-medium">
                  Autoriser la reprise libre du wizard d&apos;onboarding
                </p>
                <p className="text-xs text-muted-foreground">
                  Les directeurs peuvent enregistrer leur brouillon en local
                </p>
              </div>
              <Switch
                checked={allowSelfOnboarding}
                onCheckedChange={setAllowSelfOnboarding}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border p-3.5">
              <div>
                <p className="text-sm font-medium">
                  Simuler fenêtre de maintenance programmée
                </p>
                <p className="text-xs text-muted-foreground">
                  Indicateur visuel uniquement (aucune coupure réelle)
                </p>
              </div>
              <Switch
                checked={maintenancePreview}
                onCheckedChange={setMaintenancePreview}
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                className="gap-1.5"
                onClick={() =>
                  toast.success('Paramètres plateforme enregistrés (Mode Démo)')
                }
              >
                <Save className="size-3.5" />
                Enregistrer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ModuleGate>
  );
}
