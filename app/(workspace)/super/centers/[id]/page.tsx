'use client';

import React, { use, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  Compass,
  Layers,
  MapPin,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';
import { ModuleGate } from '@/components/feedback/module-gate';
import { ConfirmDialog } from '@/components/feedback/confirm-dialog';
import { ErrorState } from '@/components/feedback/states';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatMAD, formatNumberFR } from '@/lib/format/morocco';
import { useDemoSession } from '@/stores/demo-session-context';

export default function SuperCenterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { centers, updateCenterMeta, switchCenter, switchRole } =
    useDemoSession();

  const center = centers.find((c) => c.id === id);
  const [suspendOpen, setSuspendOpen] = useState(false);

  if (!center) {
    return (
      <ModuleGate allowedRoles={['super_admin']}>
        <ErrorState
          code="404"
          title="Instance centre introuvable"
          description="Aucun centre de démonstration ne correspond à cet identifiant."
        />
      </ModuleGate>
    );
  }

  const isSuspended = center.status === 'suspendu';

  return (
    <ModuleGate allowedRoles={['super_admin']}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/super/centers"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Retour aux centres
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/super/centers/${center.id}/configuration`}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              <SlidersHorizontal className="size-3.5" />
              Configurer les modules
            </Link>
            <Link
              href="/onboarding"
              onClick={() => switchCenter(center.id)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium hover:bg-muted"
            >
              <Compass className="size-3.5" />
              Ouvrir l&apos;onboarding
            </Link>
            <Button
              type="button"
              size="sm"
              variant={isSuspended ? 'outline' : 'destructive'}
              onClick={() => setSuspendOpen(true)}
            >
              {isSuspended ? 'Réactiver le centre' : 'Suspendre (simulation)'}
            </Button>
          </div>
        </div>

        <Card className="border-border shadow-none">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 font-heading text-xl">
                  <Building2 className="size-5 text-primary" />
                  {center.name}
                </CardTitle>
                <CardDescription>
                  {center.city} · {center.branding.subdomain} · Plan{' '}
                  <strong>{center.plan}</strong> · Statut{' '}
                  <strong className="capitalize">{center.status}</strong>
                </CardDescription>
              </div>
              <Link
                href="/admin/dashboard"
                onClick={() => {
                  switchCenter(center.id);
                  switchRole('director');
                }}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium hover:bg-muted"
              >
                <Layers className="size-3.5" />
                Prévisualiser en Directeur
              </Link>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-border p-3.5">
              <p className="text-xs text-muted-foreground">Élèves actifs (agrégé)</p>
              <p className="mt-1 font-mono text-xl font-semibold tabular-nums">
                {formatNumberFR(center.metrics.activeStudents)}
              </p>
            </div>
            <div className="rounded-xl border border-border p-3.5">
              <p className="text-xs text-muted-foreground">Modules activés</p>
              <p className="mt-1 font-mono text-xl font-semibold tabular-nums">
                {center.enabledModules.length} / 57
              </p>
            </div>
            <div className="rounded-xl border border-border p-3.5">
              <p className="text-xs text-muted-foreground">Présence moyenne</p>
              <p className="mt-1 font-mono text-xl font-semibold tabular-nums">
                {center.metrics.attendanceRatePercent.toFixed(1)} %
              </p>
            </div>
            <div className="rounded-xl border border-border p-3.5">
              <p className="text-xs text-muted-foreground">Activité MAD (mois)</p>
              <p className="mt-1 font-mono text-xl font-semibold tabular-nums">
                {formatMAD(center.metrics.collectedRevenueMad)}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-border shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Sites déclarés</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {center.locations.map((loc) => (
                <div
                  key={loc.id}
                  className="flex items-start gap-2.5 rounded-xl border border-border p-3"
                >
                  <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div>
                    <p className="font-medium">{loc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {loc.address}, {loc.city} · {loc.roomsCount} salles
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Confidentialité SaaS</CardTitle>
            </CardHeader>
            <CardContent className="flex items-start gap-3 text-xs leading-relaxed text-muted-foreground">
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-primary" />
              <p>
                Conformément à l&apos;architecture multi-tenant, cette fiche
                Super Admin n&apos;expose aucune liste d&apos;élèves, aucune
                coordonnée de parent et aucun justificatif individuel. Seuls les
                compteurs agrégés et la configuration des modules sont gérés ici.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={suspendOpen}
        onOpenChange={setSuspendOpen}
        variant={isSuspended ? 'default' : 'destructive'}
        requireReason={!isSuspended}
        reasonLabel="Motif de suspension (journal d'audit démo)"
        title={
          isSuspended
            ? `Réactiver l'instance ${center.name} ?`
            : `Suspendre l'instance ${center.name} ?`
        }
        description={
          isSuspended
            ? 'Le centre repassera en statut actif dans le prototype.'
            : 'Cette action simule la suspension d’accès côté centre sans supprimer ses données.'
        }
        confirmLabel={isSuspended ? 'Réactiver' : 'Confirmer la suspension'}
        onConfirm={(reason) => {
          updateCenterMeta(center.id, {
            status: isSuspended ? 'actif' : 'suspendu',
          });
          setSuspendOpen(false);
          toast.success(
            isSuspended
              ? `${center.name} réactivé`
              : `${center.name} suspendu (démo${reason ? ` : ${reason}` : ''})`
          );
        }}
      />
    </ModuleGate>
  );
}
