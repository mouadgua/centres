'use client';

import React, { useMemo, useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import {
  CalendarClock,
  Download,
  Plus,
  Printer,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/feedback/confirm-dialog';
import { ModuleGate } from '@/components/feedback/module-gate';
import { FormFieldWrapper, CurrencyInput } from '@/components/forms/form-field';
import { DataTable } from '@/components/tables/data-table';
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
  DialogFooter,
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
import { downloadSafeCsv } from '@/lib/format/csv';
import { formatMAD } from '@/lib/format/morocco';
import { cn } from '@/lib/utils';
import { useDemoSession } from '@/stores/demo-session-context';
import { useFinanceStore } from '@/stores/finance-context';
import { usePedagogyStore } from '@/stores/pedagogy-context';
import { useProfilesStore } from '@/stores/profiles-context';
import type { DueRecord, DueStatus, PaymentMethod } from '@/types/finance';

const DUE_STATUS_META: Record<
  DueStatus,
  { label: string; dotClass: string; textClass: string }
> = {
  a_venir: {
    label: 'À venir',
    dotClass: 'bg-sky-500',
    textClass: 'text-sky-700 dark:text-sky-300',
  },
  partiel: {
    label: 'Partiel',
    dotClass: 'bg-amber-500',
    textClass: 'text-amber-700 dark:text-amber-300',
  },
  en_retard: {
    label: 'En retard',
    dotClass: 'bg-rose-500',
    textClass: 'text-rose-700 dark:text-rose-300',
  },
  regle: {
    label: 'Réglé',
    dotClass: 'bg-emerald-500',
    textClass: 'text-emerald-700 dark:text-emerald-300',
  },
  litige: {
    label: 'En litige',
    dotClass: 'bg-slate-400',
    textClass: 'text-muted-foreground',
  },
};

export default function AdminDuesPage() {
  const { activeCenter, activeUser } = useDemoSession();
  const { dues, generateDuesSchedule, updateDue, addPayment } =
    useFinanceStore();
  const { students, guardians } = useProfilesStore();
  const { groups } = usePedagogyStore();

  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [genOpen, setGenOpen] = useState(false);
  const [genStudentId, setGenStudentId] = useState(students[0]?.id ?? '');
  const [genGroupId, setGenGroupId] = useState(groups[0]?.id ?? '');
  const [genMonths, setGenMonths] = useState(3);

  const [payDue, setPayDue] = useState<DueRecord | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Espèces');

  const [moveDue, setMoveDue] = useState<DueRecord | null>(null);
  const [moveDateISO, setMoveDateISO] = useState('2026-12-10');

  const [discountTarget, setDiscountTarget] = useState<DueRecord | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(100);

  const totals = useMemo(() => {
    const dueTotal = dues.reduce((acc, d) => acc + d.remainingMad, 0);
    const upcoming = dues.filter((d) => d.status === 'a_venir').length;
    const overdue = dues.filter((d) => d.status === 'en_retard').length;
    return { dueTotal, upcoming, overdue };
  }, [dues]);

  const calendarGroups = useMemo(() => {
    const map = new Map<string, DueRecord[]>();
    dues.forEach((d) => {
      const list = map.get(d.dueDateLabel) ?? [];
      list.push(d);
      map.set(d.dueDateLabel, list);
    });
    return Array.from(map.entries());
  }, [dues]);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const stu = students.find((s) => s.id === genStudentId);
    const grp = groups.find((g) => g.id === genGroupId);
    if (!stu || !grp) return;
    const gua = guardians.find((g) => stu.guardianIds.includes(g.id));
    const createdCount = generateDuesSchedule({
      studentId: stu.id,
      studentName: `${stu.firstName} ${stu.lastName}`,
      guardianName: gua ? `${gua.firstName} ${gua.lastName}` : 'Responsable démo',
      guardianEligible: Boolean(gua && !gua.isRestricted),
      groupId: grp.id,
      groupName: grp.name,
      monthlyMad: grp.monthlyFeeMad,
      monthsCount: genMonths,
    });
    toast.success(`${createdCount} échéance(s) générée(s) depuis le tarif.`);
    setGenOpen(false);
  };

  const columns: ColumnDef<DueRecord>[] = [
    {
      accessorKey: 'reference',
      header: 'Échéance',
      cell: ({ row }) => {
        const d = row.original;
        return (
          <div>
            <p className="font-mono text-xs font-semibold">{d.reference}</p>
            <p className="text-[11px] text-muted-foreground tabular-nums">
              {d.dueDateLabel} · {d.periodLabel}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: 'studentName',
      header: 'Élève & groupe',
      cell: ({ row }) => {
        const d = row.original;
        return (
          <div>
            <p className="text-xs font-medium">{d.studentName}</p>
            <p className="text-[11px] text-muted-foreground">{d.groupName}</p>
          </div>
        );
      },
    },
    {
      accessorKey: 'remainingMad',
      header: 'Montants (MAD)',
      cell: ({ row }) => {
        const d = row.original;
        return (
          <div className="font-mono text-xs tabular-nums">
            <p className="font-semibold">
              Reste : {formatMAD(d.remainingMad)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Total {formatMAD(d.amountMad)} · Payé {formatMAD(d.paidMad)}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Statut',
      cell: ({ row }) => {
        const meta = DUE_STATUS_META[row.original.status];
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium">
            <span className={cn('size-2 rounded-full', meta.dotClass)} />
            <span className={meta.textClass}>{meta.label}</span>
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const d = row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            {d.remainingMad > 0 && (
              <>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setPayDue(d);
                    setPayAmount(d.remainingMad);
                    setPayMethod('Espèces');
                  }}
                  className="h-7 px-2.5 text-xs"
                >
                  Encaisser
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setMoveDue(d);
                    setMoveDateISO(d.dueDateISO);
                  }}
                  className="h-7 px-2 text-xs"
                >
                  Décaler
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setDiscountTarget(d);
                    setDiscountAmount(100);
                  }}
                  className="h-7 px-2 text-xs"
                >
                  Remise
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <ModuleGate moduleKey="dues" allowedRoles={['director', 'accountant']}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Échéances de paiement
            </h1>
            <p className="text-sm text-muted-foreground">
              {activeCenter.name} · Échéancier mensuel, paiements partiels et
              remises justifiées
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg bg-muted p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={cn(
                  'rounded-md px-2.5 py-1 font-medium',
                  viewMode === 'table'
                    ? 'bg-background shadow-xs'
                    : 'text-muted-foreground'
                )}
              >
                Tableau
              </button>
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                className={cn(
                  'rounded-md px-2.5 py-1 font-medium',
                  viewMode === 'calendar'
                    ? 'bg-background shadow-xs'
                    : 'text-muted-foreground'
                )}
              >
                Échéancier calendrier
              </button>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                downloadSafeCsv(
                  `echeances-${activeCenter.id}.csv`,
                  ['Référence', 'Élève', 'Groupe', 'Période', 'Échéance', 'Total', 'Payé', 'Reste', 'Statut'],
                  dues.map((d) => [
                    d.reference,
                    d.studentName,
                    d.groupName,
                    d.periodLabel,
                    d.dueDateISO,
                    d.amountMad,
                    d.paidMad,
                    d.remainingMad,
                    DUE_STATUS_META[d.status].label,
                  ])
                );
                toast.success('Export CSV des échéances généré.');
              }}
              className="gap-1.5"
            >
              <Download className="size-4" />
              Exporter
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                window.print();
                toast.info('Aperçu relevé prêt pour impression.');
              }}
              className="gap-1.5"
            >
              <Printer className="size-4" />
              Imprimer relevé
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => setGenOpen(true)}
              className="gap-1.5"
            >
              <Plus className="size-4" />
              Générer échéancier
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-border shadow-none">
            <CardHeader className="pb-1.5">
              <CardDescription className="text-xs">
                Total restant à percevoir
              </CardDescription>
              <CardTitle className="font-mono text-2xl tabular-nums">
                {formatMAD(totals.dueTotal)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-border shadow-none">
            <CardHeader className="pb-1.5">
              <CardDescription className="text-xs">
                Échéances à venir
              </CardDescription>
              <CardTitle className="font-mono text-2xl tabular-nums">
                {totals.upcoming}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-border shadow-none">
            <CardHeader className="pb-1.5">
              <CardDescription className="text-xs">
                Échéances en retard
              </CardDescription>
              <CardTitle className="font-mono text-2xl text-rose-600 tabular-nums dark:text-rose-400">
                {totals.overdue}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {viewMode === 'table' ? (
          <DataTable
            columns={columns}
            data={dues}
            searchPlaceholder="Rechercher référence, élève, groupe..."
            facetColumnId="status"
            facetOptions={[
              { value: 'a_venir', label: 'À venir' },
              { value: 'partiel', label: 'Partiel' },
              { value: 'en_retard', label: 'En retard' },
              { value: 'regle', label: 'Réglé' },
              { value: 'litige', label: 'En litige' },
            ]}
            renderMobileCard={(d) => (
              <div className="space-y-2 rounded-xl border border-border bg-card p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-xs font-semibold">
                      {d.reference}
                    </p>
                    <p className="text-sm font-medium">{d.studentName}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.dueDateLabel} · {d.groupName}
                    </p>
                  </div>
                  <p className="font-mono text-sm font-semibold tabular-nums">
                    {formatMAD(d.remainingMad)}
                  </p>
                </div>
                {d.remainingMad > 0 && (
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setPayDue(d);
                        setPayAmount(d.remainingMad);
                      }}
                    >
                      Encaisser
                    </Button>
                  </div>
                )}
              </div>
            )}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {calendarGroups.map(([dateLabel, items]) => (
              <Card key={dateLabel} className="border-border shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <CalendarClock className="size-4 text-primary" />
                    {dateLabel}
                  </CardTitle>
                </CardHeader>
                <CardContent className="divide-y divide-border">
                  {items.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between gap-2 py-2.5 text-xs first:pt-0 last:pb-0"
                    >
                      <div>
                        <p className="font-medium">{d.studentName}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {d.groupName} · {DUE_STATUS_META[d.status].label}
                        </p>
                      </div>
                      <span className="font-mono font-semibold tabular-nums">
                        {formatMAD(d.remainingMad)}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Générer échéancier */}
        <Dialog open={genOpen} onOpenChange={setGenOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Générer un échéancier depuis tarif</DialogTitle>
              <DialogDescription>
                Crée automatiquement les prochaines mensualités selon le tarif
                du groupe.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleGenerate} className="space-y-4">
              <FormFieldWrapper id="gen-stu" label="Élève" required>
                <Select
                  value={genStudentId}
                  onValueChange={(v) => setGenStudentId(v ?? '')}
                >
                  <SelectTrigger id="gen-stu">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.firstName} {s.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormFieldWrapper>
              <FormFieldWrapper id="gen-grp" label="Groupe & tarif" required>
                <Select
                  value={genGroupId}
                  onValueChange={(v) => setGenGroupId(v ?? '')}
                >
                  <SelectTrigger id="gen-grp">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name} ({formatMAD(g.monthlyFeeMad)}/mois)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormFieldWrapper>
              <FormFieldWrapper id="gen-months" label="Nombre de mois (1–4)">
                <Input
                  id="gen-months"
                  type="number"
                  min={1}
                  max={4}
                  value={genMonths}
                  onChange={(e) => setGenMonths(Number(e.target.value) || 1)}
                />
              </FormFieldWrapper>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setGenOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit">Générer</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Encaisser depuis échéance */}
        <Dialog
          open={Boolean(payDue)}
          onOpenChange={(open) => !open && setPayDue(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Encaisser {payDue?.reference}</DialogTitle>
              <DialogDescription>
                {payDue?.studentName} · Reste dû :{' '}
                {payDue ? formatMAD(payDue.remainingMad) : ''}
              </DialogDescription>
            </DialogHeader>
            {payDue && (
              <div className="space-y-4">
                <FormFieldWrapper id="d-pay-amt" label="Montant reçu (MAD)">
                  <CurrencyInput
                    id="d-pay-amt"
                    value={payAmount}
                    onChange={(v) => setPayAmount(Number(v) || 0)}
                  />
                </FormFieldWrapper>
                <FormFieldWrapper id="d-pay-meth" label="Mode">
                  <Select
                    value={payMethod}
                    onValueChange={(v) =>
                      setPayMethod((v as PaymentMethod) ?? 'Espèces')
                    }
                  >
                    <SelectTrigger id="d-pay-meth">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Espèces">Espèces</SelectItem>
                      <SelectItem value="Virement">Virement</SelectItem>
                      <SelectItem value="Chèque">Chèque</SelectItem>
                      <SelectItem value="TPE / Carte (démo)">
                        TPE / Carte (démo)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormFieldWrapper>
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPayDue(null)}
              >
                Annuler
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (!payDue || payAmount <= 0) return;
                  addPayment({
                    studentId: payDue.studentId,
                    studentName: payDue.studentName,
                    groupId: payDue.groupId,
                    groupName: payDue.groupName,
                    periodLabel: payDue.periodLabel,
                    amountMad: payAmount,
                    method: payMethod,
                    externalRef: '',
                    linkedDueId: payDue.id,
                    notes: `Règlement direct échéance ${payDue.reference}`,
                    actor: activeUser.fullName,
                  });
                  toast.success(
                    `Paiement de ${formatMAD(payAmount)} enregistré sur ${payDue.reference}.`
                  );
                  setPayDue(null);
                }}
                className="gap-1.5"
              >
                <Wallet className="size-4" />
                Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Déplacer date d'échéance avec avertissement */}
        <Dialog
          open={Boolean(moveDue)}
          onOpenChange={(open) => !open && setMoveDue(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Déplacer l&apos;échéance {moveDue?.reference}</DialogTitle>
              <DialogDescription>
                Avertissement : le report d&apos;échéance décale le suivi de
                relance de {moveDue?.studentName}.
              </DialogDescription>
            </DialogHeader>
            <FormFieldWrapper id="move-iso" label="Nouvelle date d'échéance">
              <Input
                id="move-iso"
                type="date"
                value={moveDateISO}
                onChange={(e) => setMoveDateISO(e.target.value)}
              />
            </FormFieldWrapper>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setMoveDue(null)}
              >
                Annuler
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (!moveDue) return;
                  updateDue(moveDue.id, {
                    dueDateISO: moveDateISO,
                    dueDateLabel: moveDateISO,
                    status: 'a_venir',
                  });
                  toast.success(
                    `Échéance ${moveDue.reference} déplacée au ${moveDateISO}.`
                  );
                  setMoveDue(null);
                }}
              >
                Confirmer le report
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Remise exceptionnelle avec justification obligatoire */}
        <ConfirmDialog
          open={Boolean(discountTarget)}
          onOpenChange={(open) => !open && setDiscountTarget(null)}
          title={
            discountTarget
              ? `Accorder remise de ${formatMAD(discountAmount)} sur ${discountTarget.reference}`
              : ''
          }
          description="Tout ajustement sur une échéance doit être justifié et tracé."
          requireReason
          reasonLabel="Motif de la remise / ajustement"
          reasonPlaceholder="Ex: Accord exceptionnel direction, bourse sociale..."
          confirmLabel="Appliquer la remise"
          onConfirm={(reason) => {
            if (!discountTarget) return;
            const nextAmount = Math.max(
              discountTarget.paidMad,
              discountTarget.amountMad - discountAmount
            );
            const nextRem = Math.max(0, nextAmount - discountTarget.paidMad);
            updateDue(discountTarget.id, {
              amountMad: nextAmount,
              discountMad: discountTarget.discountMad + discountAmount,
              remainingMad: nextRem,
              status: nextRem === 0 ? 'regle' : discountTarget.status,
              notes: `${discountTarget.notes} · Remise ${formatMAD(discountAmount)} (${reason})`,
            });
            toast.success(
              `Remise appliquée sur ${discountTarget.reference}.`
            );
            setDiscountTarget(null);
          }}
        />
      </div>
    </ModuleGate>
  );
}
