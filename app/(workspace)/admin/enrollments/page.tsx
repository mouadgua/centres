'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import {
  ArrowRightLeft,
  CheckCircle2,
  ClipboardList,
  FileText,
  Plus,
  Printer,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { ModuleGate } from '@/components/feedback/module-gate';
import { ConfirmDialog } from '@/components/feedback/confirm-dialog';
import { DataTable } from '@/components/tables/data-table';
import { CurrencyInput, FormFieldWrapper } from '@/components/forms/form-field';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatMAD } from '@/lib/format/morocco';
import { useDemoSession } from '@/stores/demo-session-context';
import { usePedagogyStore } from '@/stores/pedagogy-context';
import { useProfilesStore } from '@/stores/profiles-context';
import type { EnrollmentRecord, EnrollmentStatus } from '@/types/pedagogy';

let enrollSeq = 900;
function nextEnrollmentId() {
  enrollSeq += 1;
  return {
    id: `enr-${enrollSeq}`,
    reference: `INS-2026-0${enrollSeq}`,
  };
}

export default function AdminEnrollmentsPage() {
  const { activeCenter } = useDemoSession();
  const {
    enrollments,
    groups,
    addEnrollment,
    updateEnrollment,
    transferEnrollment,
  } = usePedagogyStore();
  const { students } = useProfilesStore();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');

  // Multi-step Enrollment Wizard
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [wStudentId, setWStudentId] = useState('');
  const [wGroupId, setWGroupId] = useState('');
  const [wPeriod, setWPeriod] = useState('Nov 2026 – Juin 2027');
  const [wFee, setWFee] = useState('750');
  const [wDiscount, setWDiscount] = useState('0');
  const [wInstallments, setWInstallments] = useState('8');
  const [wSource, setWSource] =
    useState<EnrollmentRecord['source']>('Accueil');

  // Suspend / Cancel ConfirmDialog with mandatory reason
  const [actionTarget, setActionTarget] = useState<{
    record: EnrollmentRecord;
    nextStatus: 'suspendue' | 'annulée';
  } | null>(null);

  // Transfer Dialog
  const [transferTarget, setTransferTarget] = useState<EnrollmentRecord | null>(
    null
  );
  const [targetGroupId, setTargetGroupId] = useState('');

  // Receipt Preview Dialog
  const [receiptTarget, setReceiptTarget] = useState<EnrollmentRecord | null>(
    null
  );

  const filteredEnrollments = useMemo(() => {
    return enrollments.filter((e) => {
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      if (groupFilter !== 'all' && e.groupId !== groupFilter) return false;
      return true;
    });
  }, [enrollments, statusFilter, groupFilter]);

  const openWizard = () => {
    const firstStu = students[0];
    const firstGrp = groups.find((g) => g.status !== 'fermé') ?? groups[0];
    setStep(1);
    setWStudentId(firstStu?.id ?? '');
    setWGroupId(firstGrp?.id ?? '');
    setWPeriod('Nov 2026 – Juin 2027');
    setWFee(String(firstGrp?.monthlyFeeMad ?? 750));
    setWDiscount(String(firstStu?.discountPercent ?? 0));
    setWInstallments('8');
    setWSource('Accueil');
    setWizardOpen(true);
  };

  const wSelectedStudent = students.find((s) => s.id === wStudentId);
  const wSelectedGroup = groups.find((g) => g.id === wGroupId);
  const netMonthlyPreview = Math.max(
    0,
    Math.round((Number(wFee) || 0) * (1 - (Number(wDiscount) || 0) / 100))
  );

  const handleCompleteWizard = () => {
    if (!wSelectedStudent || !wSelectedGroup) {
      toast.error('Veuillez sélectionner un élève et un groupe.');
      return;
    }
    const { id, reference } = nextEnrollmentId();
    const isWaitlist = wSelectedGroup.enrolledCount >= wSelectedGroup.capacity;
    addEnrollment({
      id,
      centerId: activeCenter.id,
      reference,
      studentId: wSelectedStudent.id,
      studentName: `${wSelectedStudent.firstName} ${wSelectedStudent.lastName}`,
      groupId: wSelectedGroup.id,
      groupName: wSelectedGroup.name,
      periodLabel: wPeriod,
      status: isWaitlist ? 'liste_attente' : 'active',
      agreedFeeMad: Number(wFee) || wSelectedGroup.monthlyFeeMad,
      discountPercent: Number(wDiscount) || 0,
      netMonthlyMad: netMonthlyPreview,
      installmentsCount: Math.max(1, Number(wInstallments) || 1),
      source: wSource,
      createdAtLabel: "Aujourd'hui",
    });
    toast.success(
      isWaitlist
        ? `Inscription ${reference} placée en liste d'attente`
        : `Inscription ${reference} validée et échéancier généré (Mode Démo)`
    );
    setWizardOpen(false);
  };

  const columns = useMemo<ColumnDef<EnrollmentRecord>[]>(
    () => [
      {
        accessorKey: 'reference',
        header: 'Référence',
        cell: ({ row }) => (
          <div>
            <p className="font-mono text-xs font-semibold">
              {row.original.reference}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {row.original.createdAtLabel} · {row.original.source}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'studentName',
        header: 'Élève & groupe',
        cell: ({ row }) => (
          <div>
            <Link
              href={`/admin/students/${row.original.studentId}`}
              className="font-medium hover:text-primary hover:underline"
            >
              {row.original.studentName}
            </Link>
            <p className="text-[11px] text-muted-foreground">
              {row.original.groupName} · {row.original.periodLabel}
            </p>
          </div>
        ),
      },
      {
        id: 'pricing',
        header: 'Tarif & échéances',
        cell: ({ row }) => (
          <div className="text-xs tabular-nums">
            <p className="font-mono font-medium">
              {formatMAD(row.original.netMonthlyMad)}/mois
              {row.original.discountPercent > 0 && (
                <span className="ml-1 text-[11px] text-success">
                  (-{row.original.discountPercent}%)
                </span>
              )}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {row.original.installmentsCount} échéance(s)
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Statut',
        cell: ({ row }) => {
          const st: EnrollmentStatus = row.original.status;
          const color =
            st === 'active'
              ? 'text-success'
              : st === 'liste_attente' || st === 'suspendue'
                ? 'text-warning'
                : 'text-destructive';
          return (
            <div>
              <span className={`text-xs font-medium ${color}`}>
                {st === 'liste_attente'
                  ? "Liste d'attente"
                  : st.charAt(0).toUpperCase() + st.slice(1)}
              </span>
              {row.original.reason && (
                <p className="max-w-44 truncate text-[11px] text-muted-foreground">
                  Motif : {row.original.reason}
                </p>
              )}
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              title="Reçu d'inscription démo"
              aria-label={`Reçu ${row.original.reference}`}
              onClick={() => setReceiptTarget(row.original)}
            >
              <FileText className="size-3.5" />
            </Button>
            {row.original.status === 'active' && (
              <>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  title="Transférer de groupe"
                  aria-label={`Transférer ${row.original.studentName}`}
                  onClick={() => {
                    setTransferTarget(row.original);
                    const alt = groups.find(
                      (g) =>
                        g.id !== row.original.groupId && g.status !== 'fermé'
                    );
                    setTargetGroupId(alt?.id ?? '');
                  }}
                >
                  <ArrowRightLeft className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  title="Suspendre"
                  aria-label={`Suspendre ${row.original.reference}`}
                  onClick={() =>
                    setActionTarget({
                      record: row.original,
                      nextStatus: 'suspendue',
                    })
                  }
                >
                  <XCircle className="size-3.5 text-warning" />
                </Button>
              </>
            )}
            {row.original.status === 'suspendue' && (
              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={() => {
                  updateEnrollment(row.original.id, {
                    status: 'active',
                    reason: undefined,
                  });
                  toast.success(`Inscription ${row.original.reference} renouvelée`);
                }}
              >
                <RefreshCw className="size-3" />
                Renouveler
              </Button>
            )}
          </div>
        ),
      },
    ],
    [groups, updateEnrollment]
  );

  return (
    <ModuleGate
      moduleKey="enrollments"
      allowedRoles={['director', 'secretary']}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Inscriptions élèves–groupes
            </h1>
            <p className="text-sm text-muted-foreground">
              {activeCenter.name} · {enrollments.length} dossier(s) · tarifs
              convenus, remises & échéanciers
            </p>
          </div>
          <Button type="button" size="sm" onClick={openWizard}>
            <Plus className="size-4" />
            Nouvelle inscription
          </Button>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v ?? 'all')}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="active">Actives</SelectItem>
              <SelectItem value="liste_attente">Liste d&apos;attente</SelectItem>
              <SelectItem value="suspendue">Suspendues</SelectItem>
              <SelectItem value="annulée">Annulées</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={groupFilter}
            onValueChange={(v) => setGroupFilter(v ?? 'all')}
          >
            <SelectTrigger className="w-60">
              <SelectValue placeholder="Groupe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les groupes</SelectItem>
              {groups.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DataTable
          columns={columns}
          data={filteredEnrollments}
          searchPlaceholder="Rechercher par élève, référence ou groupe..."
          emptyTitle="Aucune inscription correspondante"
          emptyDescription="Lancez l'assistant d'inscription pour affecter un élève à un groupe."
          emptyActionLabel="Nouvelle inscription"
          onEmptyAction={openWizard}
          renderMobileCard={(enr) => (
            <div className="space-y-2 rounded-lg border border-border bg-card p-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-semibold">{enr.reference}</span>
                <span className="font-medium">{enr.status}</span>
              </div>
              <p className="text-sm font-medium">{enr.studentName}</p>
              <p className="text-muted-foreground">
                {enr.groupName} · {formatMAD(enr.netMonthlyMad)}/mois
              </p>
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() => setReceiptTarget(enr)}
                >
                  Reçu démo
                </Button>
              </div>
            </div>
          )}
        />
      </div>

      {/* Multi-step Enrollment Assistant */}
      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="size-4 text-primary" />
              Assistant d&apos;inscription — Étape {step}/3
            </DialogTitle>
            <DialogDescription>
              Affectez un élève, négociez le tarif/remise et prévisualisez les échéances.
            </DialogDescription>
          </DialogHeader>

          {step === 1 && (
            <div className="space-y-4">
              <FormFieldWrapper id="wiz-stu" label="Élève" required>
                <Select
                  value={wStudentId}
                  onValueChange={(v) => {
                    setWStudentId(v ?? '');
                    const stu = students.find((s) => s.id === v);
                    if (stu) setWDiscount(String(stu.discountPercent));
                  }}
                >
                  <SelectTrigger id="wiz-stu" className="w-full">
                    <SelectValue placeholder="Sélectionner un élève" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.firstName} {s.lastName} · {s.level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormFieldWrapper>

              <FormFieldWrapper id="wiz-grp" label="Groupe cible" required>
                <Select
                  value={wGroupId}
                  onValueChange={(v) => {
                    setWGroupId(v ?? '');
                    const grp = groups.find((g) => g.id === v);
                    if (grp) setWFee(String(grp.monthlyFeeMad));
                  }}
                >
                  <SelectTrigger id="wiz-grp" className="w-full">
                    <SelectValue placeholder="Sélectionner un groupe" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups
                      .filter((g) => g.status !== 'fermé')
                      .map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.name} ({g.enrolledCount}/{g.capacity} places ·{' '}
                          {formatMAD(g.monthlyFeeMad)})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </FormFieldWrapper>

              <FormFieldWrapper id="wiz-src" label="Source d'inscription">
                <Select
                  value={wSource}
                  onValueChange={(v) =>
                    setWSource((v as EnrollmentRecord['source']) ?? 'Accueil')
                  }
                >
                  <SelectTrigger id="wiz-src" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Accueil">Accueil</SelectItem>
                    <SelectItem value="Réinscription">Réinscription</SelectItem>
                    <SelectItem value="Recommandation">Recommandation</SelectItem>
                    <SelectItem value="En ligne (démo)">En ligne (démo)</SelectItem>
                  </SelectContent>
                </Select>
              </FormFieldWrapper>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setWizardOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  disabled={!wStudentId || !wGroupId}
                  onClick={() => setStep(2)}
                >
                  Étape suivante
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <FormFieldWrapper id="wiz-per" label="Période d'engagement">
                <Input
                  id="wiz-per"
                  value={wPeriod}
                  onChange={(e) => setWPeriod(e.target.value)}
                />
              </FormFieldWrapper>
              <div className="grid gap-4 sm:grid-cols-3">
                <FormFieldWrapper id="wiz-fee" label="Tarif convenu">
                  <CurrencyInput
                    id="wiz-fee"
                    value={wFee}
                    onChange={(e) => setWFee(e.target.value)}
                  />
                </FormFieldWrapper>
                <FormFieldWrapper id="wiz-disc" label="Remise (%)">
                  <Input
                    id="wiz-disc"
                    type="number"
                    min={0}
                    max={100}
                    value={wDiscount}
                    onChange={(e) => setWDiscount(e.target.value)}
                  />
                </FormFieldWrapper>
                <FormFieldWrapper id="wiz-inst" label="Nb échéances">
                  <Input
                    id="wiz-inst"
                    type="number"
                    min={1}
                    max={12}
                    value={wInstallments}
                    onChange={(e) => setWInstallments(e.target.value)}
                  />
                </FormFieldWrapper>
              </div>
              <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs">
                Mensualité nette calculée :{' '}
                <strong className="font-mono tabular-nums">
                  {formatMAD(netMonthlyPreview)} / mois
                </strong>
              </div>
              <div className="flex justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                >
                  Précédent
                </Button>
                <Button type="button" onClick={() => setStep(3)}>
                  Vérifier le récapitulatif
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-4 text-xs">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <CheckCircle2 className="size-4 text-success" />
                  Récapitulatif de l&apos;inscription
                </div>
                <p>
                  Élève :{' '}
                  <strong>
                    {wSelectedStudent?.firstName} {wSelectedStudent?.lastName}
                  </strong>
                </p>
                <p>
                  Groupe : <strong>{wSelectedGroup?.name}</strong> (
                  {wSelectedGroup &&
                  wSelectedGroup.enrolledCount >= wSelectedGroup.capacity
                    ? "Placé en liste d'attente"
                    : 'Place disponible'}
                  )
                </p>
                <p>Période : {wPeriod}</p>
                <p>
                  Engagement :{' '}
                  <strong className="font-mono tabular-nums">
                    {formatMAD(netMonthlyPreview)} × {wInstallments} échéance(s)
                  </strong>
                </p>
              </div>
              <div className="flex justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
                >
                  Modifier
                </Button>
                <Button type="button" onClick={handleCompleteWizard}>
                  Confirmer l&apos;inscription
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Suspend / Cancel ConfirmDialog with mandatory reason */}
      <ConfirmDialog
        open={Boolean(actionTarget)}
        onOpenChange={(o) => {
          if (!o) setActionTarget(null);
        }}
        variant="destructive"
        requireReason
        title={`Passer l'inscription ${actionTarget?.record.reference} en statut « ${actionTarget?.nextStatus} » ?`}
        description="Un motif est obligatoire pour tracer l'interruption ou l'annulation dans le dossier élève."
        confirmLabel="Confirmer"
        onConfirm={(reason) => {
          if (!actionTarget) return;
          updateEnrollment(actionTarget.record.id, {
            status: actionTarget.nextStatus,
            reason: reason || 'Motif saisi en administration',
          });
          toast.success(`Inscription ${actionTarget.record.reference} mise à jour`);
          setActionTarget(null);
        }}
      />

      {/* Transfer Dialog */}
      <Dialog
        open={Boolean(transferTarget)}
        onOpenChange={(o) => {
          if (!o) setTransferTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Transférer {transferTarget?.studentName}
            </DialogTitle>
            <DialogDescription>
              Met à jour l&apos;inscription et ajuste les compteurs d&apos;occupation des groupes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <FormFieldWrapper id="enr-trf" label="Groupe de destination">
              <Select
                value={targetGroupId}
                onValueChange={(v) => setTargetGroupId(v ?? '')}
              >
                <SelectTrigger id="enr-trf" className="w-full">
                  <SelectValue placeholder="Sélectionner un groupe" />
                </SelectTrigger>
                <SelectContent>
                  {groups
                    .filter(
                      (g) =>
                        g.id !== transferTarget?.groupId && g.status !== 'fermé'
                    )
                    .map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name} ({g.enrolledCount}/{g.capacity})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </FormFieldWrapper>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setTransferTarget(null)}
              >
                Annuler
              </Button>
              <Button
                type="button"
                disabled={!targetGroupId}
                onClick={() => {
                  if (!transferTarget) return;
                  const tg = groups.find((g) => g.id === targetGroupId);
                  if (!tg) return;
                  transferEnrollment(transferTarget.id, tg.id, tg.name);
                  toast.success(
                    `Inscription transférée vers ${tg.name}`
                  );
                  setTransferTarget(null);
                }}
              >
                Confirmer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Demo Enrollment Receipt Modal */}
      <Dialog
        open={Boolean(receiptTarget)}
        onOpenChange={(o) => {
          if (!o) setReceiptTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Attestation & reçu d&apos;inscription (démo)</DialogTitle>
            <DialogDescription>
              Document non contractuel généré en Mode Démo.
            </DialogDescription>
          </DialogHeader>
          {receiptTarget && (
            <div className="space-y-4">
              <div className="space-y-2 rounded-lg border border-border bg-card p-4 text-xs">
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="font-semibold">{activeCenter.name}</span>
                  <span className="font-mono">{receiptTarget.reference}</span>
                </div>
                <p>
                  Élève : <strong>{receiptTarget.studentName}</strong>
                </p>
                <p>
                  Groupe : <strong>{receiptTarget.groupName}</strong>
                </p>
                <p>Période : {receiptTarget.periodLabel}</p>
                <p>
                  Tarif convenu :{' '}
                  <strong className="font-mono tabular-nums">
                    {formatMAD(receiptTarget.netMonthlyMad)}/mois
                  </strong>{' '}
                  ({receiptTarget.installmentsCount} échéances)
                </p>
                <p className="text-muted-foreground">
                  Émis le {receiptTarget.createdAtLabel} · Mode Démo
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    toast.success('Impression du reçu démo lancée');
                    if (typeof window !== 'undefined') window.print();
                  }}
                >
                  <Printer className="size-3.5" />
                  Imprimer
                </Button>
                <Button type="button" onClick={() => setReceiptTarget(null)}>
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ModuleGate>
  );
}
