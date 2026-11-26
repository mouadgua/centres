'use client';

import React, { use, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Edit3,
  Files,
  QrCode,
  Send,
  ShieldAlert,
  Users,
  Wallet,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

export default function AdminStudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { hasModule } = useDemoSession();
  const { students, guardians, updateStudent } = useProfilesStore();

  const student = students.find((s) => s.id === id);
  const [editOpen, setEditOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const [editPhone, setEditPhone] = useState(student?.phone ?? '');
  const [editLevel, setEditLevel] = useState(student?.level ?? '2ème Bac');
  const [targetTransferGroup, setTargetTransferGroup] = useState(
    'Sup MPSI — Intensif'
  );

  if (!student) {
    return (
      <ModuleGate moduleKey="students" allowedRoles={['director', 'secretary']}>
        <ErrorState
          code="404"
          title="Fiche élève introuvable"
          description="Cet élève n'appartient pas au centre actuellement sélectionné."
        />
      </ModuleGate>
    );
  }

  const linkedGuardians = guardians.filter((g) =>
    student.guardianIds.includes(g.id)
  );

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    updateStudent(student.id, { phone: editPhone, level: editLevel });
    setEditOpen(false);
    toast.success('Élève mis à jour (Mode Démo)');
  };

  return (
    <ModuleGate moduleKey="students" allowedRoles={['director', 'secretary']}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/admin/students"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Retour aux élèves
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            {hasModule('attendance.qr') && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQrOpen(true)}
                className="gap-1.5"
              >
                <QrCode className="size-3.5" />
                QR étudiant (démo)
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEditPhone(student.phone);
                setEditLevel(student.level);
                setEditOpen(true);
              }}
              className="gap-1.5"
            >
              <Edit3 className="size-3.5" />
              Éditer
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setTransferOpen(true)}
            >
              Transférer groupe
            </Button>
            <Button
              type="button"
              size="sm"
              variant={student.status === 'actif' ? 'destructive' : 'default'}
              onClick={() => setSuspendOpen(true)}
            >
              {student.status === 'actif' ? 'Suspendre' : 'Réactiver'}
            </Button>
          </div>
        </div>

        {/* Identity Header Card */}
        <Card className="border-border shadow-none">
          <CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-heading text-lg font-bold text-primary">
                {student.initials}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-heading text-xl font-semibold">
                    {student.firstName} {student.lastName}
                  </h1>
                  <span className="font-mono text-xs text-muted-foreground">
                    · {student.code}
                  </span>
                  <span
                    className={`text-xs font-medium capitalize ${
                      student.status === 'actif'
                        ? 'text-success'
                        : 'text-warning'
                    }`}
                  >
                    · {student.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {student.level} · {student.siteName} · {student.phone} ·
                  Inscrit le {student.enrolledAt}
                </p>
              </div>
            </div>

            <div className="flex gap-6 text-right">
              <div>
                <p className="text-[11px] text-muted-foreground">Assiduité</p>
                <p className="font-mono text-lg font-semibold tabular-nums">
                  {student.attendanceRatePercent} %
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Solde dû</p>
                <p
                  className={`font-mono text-lg font-semibold tabular-nums ${
                    student.balanceMad > 0
                      ? 'text-destructive'
                      : 'text-foreground'
                  }`}
                >
                  {formatMAD(student.balanceMad)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 8 Domain Tabs */}
        <Tabs defaultValue="summary" className="space-y-4">
          <TabsList className="flex h-auto flex-wrap justify-start gap-1">
            <TabsTrigger value="summary">Résumé</TabsTrigger>
            <TabsTrigger value="enrollments">Inscriptions</TabsTrigger>
            <TabsTrigger value="calendar">Calendrier</TabsTrigger>
            <TabsTrigger value="attendance">Présences</TabsTrigger>
            <TabsTrigger value="finance">Finances</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="comms">Communications</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="grid gap-4 md:grid-cols-2">
            <Card className="border-border shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="size-4 text-primary" />
                  Responsables familiaux associés ({linkedGuardians.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                {linkedGuardians.length === 0 ? (
                  <p className="text-muted-foreground">
                    Aucun responsable rattaché pour le moment.
                  </p>
                ) : (
                  linkedGuardians.map((g) => (
                    <div
                      key={g.id}
                      className="flex items-center justify-between rounded-xl border border-border p-3"
                    >
                      <div>
                        <Link
                          href={`/admin/guardians/${g.id}`}
                          className="text-sm font-medium hover:text-primary hover:underline"
                        >
                          {g.firstName} {g.lastName}
                        </Link>
                        <p className="text-muted-foreground">
                          {g.relation} · {g.phone}
                          {g.isFinancialResponsible
                            ? ' · Responsable financier'
                            : ''}
                          {g.isPrimary ? ' · Contact prioritaire' : ''}
                        </p>
                      </div>
                      <Link
                        href={`/admin/guardians/${g.id}`}
                        className="font-medium text-primary"
                      >
                        Ouvrir
                      </Link>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-border shadow-none">
              <CardHeader>
                <CardTitle className="text-base">Notes &amp; remise</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <p>
                  Remise accordée :{' '}
                  <strong className="font-mono text-foreground">
                    {student.discountPercent} %
                  </strong>
                </p>
                <p>{student.notes || 'Aucune note particulière enregistrée.'}</p>
                <div className="pt-2">
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    onClick={() =>
                      toast.info(
                        'Réinitialisation des identifiants simulée (aucun SMS/email envoyé)'
                      )
                    }
                  >
                    Réinitialiser accès étudiant (démo)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="enrollments">
            <Card className="border-border shadow-none">
              <CardHeader>
                <CardTitle className="text-base">
                  Groupes &amp; inscriptions actives
                </CardTitle>
                <CardDescription className="text-xs">
                  La gestion détaillée des créneaux sera enrichie au Lot 5.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {student.groupNames.map((g) => (
                  <div
                    key={g}
                    className="flex items-center justify-between rounded-xl border border-border p-3 text-sm"
                  >
                    <span className="font-medium">{g}</span>
                    <span className="text-xs text-success">Inscrit actif</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar">
            <Card className="border-border shadow-none">
              <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
                <CalendarDays className="size-5 text-primary" />
                Emploi du temps personnalisé connecté au module Calendrier (Lot
                6).
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance">
            <Card className="border-border shadow-none">
              <CardContent className="flex items-center justify-between p-6 text-sm">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="size-5 text-success" />
                  <div>
                    <p className="font-medium">
                      Taux d&apos;assiduité : {student.attendanceRatePercent} %
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Dernier pointage : {student.lastAttendanceLabel}
                    </p>
                  </div>
                </div>
                <Link
                  href="/admin/attendance"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Feuilles de présence →
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="finance">
            <Card className="border-border shadow-none">
              <CardContent className="flex items-center justify-between p-6 text-sm">
                <div className="flex items-center gap-3">
                  <Wallet className="size-5 text-primary" />
                  <div>
                    <p className="font-medium">
                      Solde restant dû : {formatMAD(student.balanceMad)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Remise dossier : {student.discountPercent} % (données démo)
                    </p>
                  </div>
                </div>
                {hasModule('billing') && (
                  <Link
                    href="/admin/payments"
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Encaissements (Lot 8) →
                  </Link>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card className="border-border shadow-none">
              <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
                <Files className="size-5 text-primary" />
                {hasModule('documents.students')
                  ? 'Docothèque élève disponible (fiches et attestations en Lot 10).'
                  : 'Module Documents désactivé sur cette instance.'}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comms">
            <Card className="border-border shadow-none">
              <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
                <Send className="size-5 text-primary" />
                Journal de communications parents (prévisualisations uniquement
                en Mode Démo).
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card className="border-border shadow-none">
              <CardContent className="space-y-2 p-5 text-xs text-muted-foreground">
                <p>
                  · {student.enrolledAt} — Création du dossier {student.code}
                </p>
                <p>
                  · {student.lastAttendanceLabel} — Dernier passage enregistré
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Sheet */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader className="pb-4">
            <SheetTitle>Modifier {student.firstName}</SheetTitle>
            <SheetDescription className="text-xs">
              Mise à jour instantanée en mémoire Mode Démo.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4 px-4">
            <div className="space-y-1.5">
              <Label htmlFor="ed-phone" className="text-xs">
                Téléphone
              </Label>
              <Input
                id="ed-phone"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ed-level" className="text-xs">
                Niveau scolaire
              </Label>
              <Input
                id="ed-level"
                value={editLevel}
                onChange={(e) => setEditLevel(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full">
              Enregistrer
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* Transfer Group Dialog */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Transférer vers un autre groupe</DialogTitle>
            <DialogDescription className="text-xs">
              Vérification simulée de capacité : 18 / 24 places occupées dans le
              groupe cible.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select
              value={targetTransferGroup}
              onValueChange={(v) =>
                setTargetTransferGroup(v ?? 'Sup MPSI — Intensif')
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sup MPSI — Intensif">
                  Sup MPSI — Intensif (18/24)
                </SelectItem>
                <SelectItem value="2Bac PC — Excellence">
                  2Bac PC — Excellence (21/24)
                </SelectItem>
                <SelectItem value="1ère Bac Régional — A">
                  1ère Bac Régional — A (15/20)
                </SelectItem>
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setTransferOpen(false)}
              >
                Annuler
              </Button>
              <Button
                type="button"
                onClick={() => {
                  updateStudent(student.id, {
                    groupNames: [targetTransferGroup],
                  });
                  setTransferOpen(false);
                  toast.success(
                    `${student.firstName} transféré vers ${targetTransferGroup}`
                  );
                }}
              >
                Confirmer le transfert
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Demo Modal */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="sm:max-w-xs text-center">
          <DialogHeader>
            <DialogTitle>Badge QR de démonstration</DialogTitle>
            <DialogDescription className="text-xs">
              Jeton fictif non signé côté serveur ({student.code}).
            </DialogDescription>
          </DialogHeader>
          <div className="mx-auto flex size-40 flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/40 p-4">
            <QrCode className="size-20 text-foreground" />
            <span className="mt-2 font-mono text-[11px] text-muted-foreground">
              DEMO-{student.code}
            </span>
          </div>
          <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldAlert className="size-3.5 text-warning" />
            Ne pas utiliser comme badge sécurisé de production
          </p>
        </DialogContent>
      </Dialog>

      {/* Suspend / Reactivate */}
      <ConfirmDialog
        open={suspendOpen}
        onOpenChange={setSuspendOpen}
        variant={student.status === 'actif' ? 'destructive' : 'default'}
        requireReason={student.status === 'actif'}
        title={
          student.status === 'actif'
            ? `Suspendre ${student.firstName} ${student.lastName} ?`
            : `Réactiver ${student.firstName} ${student.lastName} ?`
        }
        description="Cette modification met à jour le statut d'inscription dans la démo."
        confirmLabel={student.status === 'actif' ? 'Suspendre' : 'Réactiver'}
        onConfirm={() => {
          const next = student.status === 'actif' ? 'suspendu' : 'actif';
          updateStudent(student.id, { status: next });
          setSuspendOpen(false);
          toast.success(`Statut mis à jour : ${next}`);
        }}
      />
    </ModuleGate>
  );
}
