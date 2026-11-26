'use client';

import React, { use, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  Files,
  ShieldAlert,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatMAD } from '@/lib/format/morocco';
import { useDemoSession } from '@/stores/demo-session-context';
import { useProfilesStore } from '@/stores/profiles-context';

export default function AdminTeacherDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { hasModule } = useDemoSession();
  const { teachers, updateTeacher } = useProfilesStore();

  const teacher = teachers.find((t) => t.id === id);
  const [payrollOpen, setPayrollOpen] = useState(false);
  const [adjustmentMad, setAdjustmentMad] = useState('0');
  const [suspendOpen, setSuspendOpen] = useState(false);

  if (!teacher) {
    return (
      <ModuleGate
        moduleKey="teachers"
        allowedRoles={['director', 'secretary']}
      >
        <ErrorState
          code="404"
          title="Fiche professeur introuvable"
          description="Cet enseignant n'est pas rattaché au centre sélectionné."
        />
      </ModuleGate>
    );
  }

  const adjValue = Number(adjustmentMad) || 0;
  const computedTotalMad = Math.max(0, teacher.estimatedPayMad + adjValue);

  return (
    <ModuleGate moduleKey="teachers" allowedRoles={['director', 'secretary']}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/admin/teachers"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Retour aux professeurs
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            {hasModule('payroll') && (
              <Button
                type="button"
                size="sm"
                onClick={() => setPayrollOpen(true)}
                className="gap-1.5"
              >
                <Banknote className="size-3.5" />
                Calculer paie indicative
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant={teacher.status === 'actif' ? 'destructive' : 'outline'}
              onClick={() => setSuspendOpen(true)}
            >
              {teacher.status === 'actif' ? 'Suspendre' : 'Réactiver'}
            </Button>
          </div>
        </div>

        <Card className="border-border shadow-none">
          <CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-heading text-lg font-bold text-primary">
                {teacher.initials}
              </div>
              <div className="space-y-1">
                <h1 className="font-heading text-xl font-semibold">
                  {teacher.fullName}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {teacher.subjects.join(', ')} · {teacher.sites.join(', ')} ·{' '}
                  {teacher.phone} · Statut{' '}
                  <strong className="capitalize">{teacher.status}</strong>
                </p>
              </div>
            </div>

            <div className="flex gap-6 text-right">
              <div>
                <p className="text-[11px] text-muted-foreground">
                  Séances ce mois
                </p>
                <p className="font-mono text-lg font-semibold tabular-nums">
                  {teacher.completedSessionsMonth}/
                  {teacher.plannedSessionsMonth}
                </p>
              </div>
              {hasModule('payroll') && (
                <div>
                  <p className="text-[11px] text-muted-foreground">
                    Paie estimée (démo)
                  </p>
                  <p className="font-mono text-lg font-semibold tabular-nums">
                    {formatMAD(teacher.estimatedPayMad)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="summary" className="space-y-4">
          <TabsList className="flex h-auto flex-wrap justify-start gap-1">
            <TabsTrigger value="summary">Résumé</TabsTrigger>
            <TabsTrigger value="planning">Planning</TabsTrigger>
            <TabsTrigger value="groups">Groupes</TabsTrigger>
            <TabsTrigger value="sessions">Séances réalisées</TabsTrigger>
            <TabsTrigger value="attendance">Présences</TabsTrigger>
            <TabsTrigger value="payroll">Rémunération</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="access">Accès</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="grid gap-4 md:grid-cols-2">
            <Card className="border-border shadow-none">
              <CardHeader>
                <CardTitle className="text-base">
                  Disponibilités &amp; coordonnées
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <p>
                  Créneaux déclarés :{' '}
                  <strong className="text-foreground">
                    {teacher.availabilitySummary}
                  </strong>
                </p>
                <p>Email : {teacher.email}</p>
                <p>Téléphone : {teacher.phone}</p>
              </CardContent>
            </Card>

            <Card className="border-border shadow-none">
              <CardHeader>
                <CardTitle className="text-base">Groupes assignés</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {teacher.groups.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Aucun groupe assigné pour le moment.
                  </p>
                ) : (
                  teacher.groups.map((g) => (
                    <div
                      key={g}
                      className="rounded-lg border border-border px-3 py-2 text-xs font-medium"
                    >
                      {g}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="planning">
            <Card className="border-border shadow-none">
              <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
                <CalendarDays className="size-5 text-primary" />
                Planning individuel et détection de conflits disponibles au Lot
                6.
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="groups">
            <Card className="border-border shadow-none">
              <CardContent className="space-y-2 p-6 text-sm">
                {teacher.groups.map((g) => (
                  <p key={g} className="font-medium">
                    · {g}
                  </p>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions">
            <Card className="border-border shadow-none">
              <CardContent className="flex items-center gap-3 p-6 text-sm">
                <Clock className="size-5 text-primary" />
                <span>
                  {teacher.completedSessionsMonth} séance(s) effectuée(s) sur{' '}
                  {teacher.plannedSessionsMonth} planifiée(s) ce mois.
                </span>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance">
            <Card className="border-border shadow-none">
              <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
                <CheckCircle2 className="size-5 text-success" />
                Feuilles d&apos;appel complétées par ce professeur (Lot 7).
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payroll">
            <Card className="border-border shadow-none">
              <CardHeader>
                <CardTitle className="text-base">
                  Rémunération indicative (Mode Démo)
                </CardTitle>
                <CardDescription className="text-xs">
                  Simulation non contractuelle — ne constitue pas un bulletin de
                  paie légal.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-4">
                <p className="font-mono text-xl font-semibold tabular-nums">
                  {formatMAD(teacher.estimatedPayMad)}
                </p>
                {hasModule('payroll') && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setPayrollOpen(true)}
                  >
                    Ouvrir assistant de calcul
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card className="border-border shadow-none">
              <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
                <Files className="size-5 text-primary" />
                Contrats et justificatifs professeur (docothèque Lot 10).
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="access">
            <Card className="border-border shadow-none">
              <CardContent className="flex items-center justify-between p-6 text-sm">
                <div>
                  <p className="font-medium">Compte Espace Professeur (/teacher)</p>
                  <p className="text-xs text-muted-foreground">
                    {teacher.email} · Accès limité à ses groupes et séances
                  </p>
                </div>
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() =>
                    toast.info(
                      'Réinitialisation d’accès simulée (aucun email envoyé)'
                    )
                  }
                >
                  Réinitialiser (démo)
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card className="border-border shadow-none">
              <CardContent className="p-6 text-xs text-muted-foreground">
                · Affectation active sur {teacher.sites.join(', ')} (Mode Démo).
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Indicative Payroll Drawer */}
      <Sheet open={payrollOpen} onOpenChange={setPayrollOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle>Calcul de paie indicatif (démo)</SheetTitle>
            <SheetDescription className="text-xs">
              {teacher.fullName} · Période : Novembre 2026
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4 text-sm">
            <div className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs text-muted-foreground flex items-start gap-2">
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning" />
              <span>
                Calcul indicatif de démonstration uniquement. Validation
                comptable et bulletin légal hors périmètre frontend.
              </span>
            </div>

            <div className="space-y-2 rounded-xl border border-border p-3.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Formule</span>
                <span className="font-medium capitalize">{teacher.compType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Séances retenues</span>
                <span className="font-mono tabular-nums">
                  {teacher.completedSessionsMonth}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base calculée</span>
                <span className="font-mono tabular-nums">
                  {formatMAD(teacher.estimatedPayMad)}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pay-adj" className="text-xs">
                Ajustement manuel démo (MAD, positif ou négatif)
              </Label>
              <Input
                id="pay-adj"
                type="number"
                value={adjustmentMad}
                onChange={(e) => setAdjustmentMad(e.target.value)}
                className="font-mono tabular-nums"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-3.5">
              <span className="text-xs font-semibold">Net indicatif estimé</span>
              <span className="font-mono text-lg font-bold tabular-nums">
                {formatMAD(computedTotalMad)}
              </span>
            </div>

            <Button
              type="button"
              className="w-full gap-1.5"
              onClick={() => {
                updateTeacher(teacher.id, {
                  estimatedPayMad: computedTotalMad,
                });
                toast.info(
                  'Fiche de paie indicative enregistrée en démo (pas de virement réel)'
                );
                setPayrollOpen(false);
              }}
            >
              <Download className="size-4" />
              Valider calcul indicatif (démo)
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={suspendOpen}
        onOpenChange={setSuspendOpen}
        variant={teacher.status === 'actif' ? 'destructive' : 'default'}
        requireReason={teacher.status === 'actif'}
        title={
          teacher.status === 'actif'
            ? `Suspendre ${teacher.fullName} ?`
            : `Réactiver ${teacher.fullName} ?`
        }
        description="Les séances futures liées à ce professeur devront être réassignées."
        confirmLabel="Confirmer"
        onConfirm={() => {
          updateTeacher(teacher.id, {
            status: teacher.status === 'actif' ? 'suspendu' : 'actif',
          });
          setSuspendOpen(false);
          toast.success('Statut professeur mis à jour');
        }}
      />
    </ModuleGate>
  );
}
