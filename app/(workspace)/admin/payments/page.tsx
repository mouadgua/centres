'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { type ColumnDef } from '@tanstack/react-table';
import {
  CheckCircle2,
  Copy,
  Download,
  FileText,
  Plus,
  Printer,
  RotateCcw,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/feedback/confirm-dialog';
import { ModuleGate } from '@/components/feedback/module-gate';
import { GlobalBanner } from '@/components/feedback/states';
import { CurrencyInput, FormFieldWrapper } from '@/components/forms/form-field';
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { downloadSafeCsv } from '@/lib/format/csv';
import { formatMAD } from '@/lib/format/morocco';
import { cn } from '@/lib/utils';
import { useDemoSession } from '@/stores/demo-session-context';
import { useFinanceStore } from '@/stores/finance-context';
import { usePedagogyStore } from '@/stores/pedagogy-context';
import { useProfilesStore } from '@/stores/profiles-context';
import type {
  PaymentMethod,
  PaymentRecord,
  PaymentStatus,
} from '@/types/finance';

const PAYMENT_STATUS_META: Record<
  PaymentStatus,
  { label: string; dotClass: string; textClass: string }
> = {
  encaisse: {
    label: 'Encaissé',
    dotClass: 'bg-emerald-500',
    textClass: 'text-emerald-700 dark:text-emerald-300',
  },
  partiel: {
    label: 'Partiel / Brouillon',
    dotClass: 'bg-amber-500',
    textClass: 'text-amber-700 dark:text-amber-300',
  },
  annule: {
    label: 'Annulé',
    dotClass: 'bg-rose-500',
    textClass: 'text-rose-700 dark:text-rose-300',
  },
  contrepasse: {
    label: 'Contrepassé',
    dotClass: 'bg-slate-400',
    textClass: 'text-muted-foreground line-through',
  },
};

export default function AdminPaymentsPage() {
  const { activeCenter, activeUser } = useDemoSession();
  const {
    payments,
    dues,
    addPayment,
    duplicateDraftPayment,
    updatePaymentNonAccounting,
    reversePayment,
  } = useFinanceStore();
  const { students } = useProfilesStore();
  const { groups } = usePedagogyStore();

  const [addOpen, setAddOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(
    students[0]?.id ?? ''
  );
  const [selectedGroupId, setSelectedGroupId] = useState(groups[0]?.id ?? '');
  const [linkedDueId, setLinkedDueId] = useState<string>('none');
  const [periodLabel, setPeriodLabel] = useState('Novembre 2026');
  const [amountMad, setAmountMad] = useState<number>(600);
  const [method, setMethod] = useState<PaymentMethod>('Espèces');
  const [externalRef, setExternalRef] = useState('');
  const [notes, setNotes] = useState('');

  const [detailPayment, setDetailPayment] = useState<PaymentRecord | null>(
    null
  );
  const [editExtRef, setEditExtRef] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const [receiptPayment, setReceiptPayment] = useState<PaymentRecord | null>(
    null
  );
  const [reverseTarget, setReverseTarget] = useState<PaymentRecord | null>(
    null
  );

  const openDues = useMemo(
    () =>
      dues.filter(
        (d) =>
          d.remainingMad > 0 &&
          (selectedStudentId ? d.studentId === selectedStudentId : true)
      ),
    [dues, selectedStudentId]
  );

  const totals = useMemo(() => {
    const collected = payments
      .filter((p) => p.status === 'encaisse' || p.status === 'partiel')
      .reduce((acc, p) => acc + p.amountMad, 0);
    const reconciledCount = payments.filter((p) => p.reconciled).length;
    const reversedCount = payments.filter(
      (p) => p.status === 'contrepasse' || p.status === 'annule'
    ).length;
    return { collected, reconciledCount, reversedCount };
  }, [payments]);

  const handleOpenAdd = () => {
    setSelectedStudentId(students[0]?.id ?? '');
    setSelectedGroupId(groups[0]?.id ?? '');
    setLinkedDueId('none');
    setAmountMad(groups[0]?.monthlyFeeMad ?? 1000);
    setMethod('Espèces');
    setExternalRef('');
    setNotes('');
    setAddOpen(true);
  };

  const handleCreatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const stu = students.find((s) => s.id === selectedStudentId);
    const grp = groups.find((g) => g.id === selectedGroupId);
    if (!stu || !grp) {
      toast.error('Sélectionnez un élève et un groupe.');
      return;
    }
    if (!amountMad || amountMad <= 0) {
      toast.error('Le montant doit être supérieur à 0 MAD.');
      return;
    }

    const created = addPayment({
      studentId: stu.id,
      studentName: `${stu.firstName} ${stu.lastName}`,
      groupId: grp.id,
      groupName: grp.name,
      periodLabel,
      amountMad,
      method,
      externalRef: externalRef.trim(),
      linkedDueId: linkedDueId !== 'none' ? linkedDueId : undefined,
      notes: notes.trim(),
      actor: activeUser.fullName,
    });

    toast.success(
      `Encaissement ${created.reference} enregistré (${formatMAD(created.amountMad)}).`
    );
    setAddOpen(false);
  };

  const openDetailSheet = (pay: PaymentRecord) => {
    setDetailPayment(pay);
    setEditExtRef(pay.externalRef);
    setEditNotes(pay.notes);
  };

  const handleExportCsv = () => {
    downloadSafeCsv(
      `encaissements-${activeCenter.id}.csv`,
      [
        'Référence',
        'Reçu',
        'Élève',
        'Groupe',
        'Période',
        'Date',
        'Montant MAD',
        'Mode',
        'Réf externe',
        'Statut',
        'Rapproché',
        'Agent',
      ],
      payments.map((p) => [
        p.reference,
        p.receiptNumber,
        p.studentName,
        p.groupName,
        p.periodLabel,
        p.dateISO,
        p.amountMad,
        p.method,
        p.externalRef,
        PAYMENT_STATUS_META[p.status].label,
        p.reconciled ? 'Oui' : 'Non',
        p.agentName,
      ])
    );
    toast.success('Export CSV UTF-8 généré (cellules protégées).');
  };

  const columns: ColumnDef<PaymentRecord>[] = [
    {
      accessorKey: 'reference',
      header: 'Réf & reçu',
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div>
            <button
              type="button"
              onClick={() => openDetailSheet(p)}
              className="font-mono text-xs font-semibold text-primary hover:underline"
            >
              {p.reference}
            </button>
            <p className="font-mono text-[11px] text-muted-foreground">
              {p.receiptNumber}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: 'studentName',
      header: 'Élève & groupe',
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div>
            <Link
              href={`/admin/students/${p.studentId}`}
              className="text-xs font-medium hover:underline"
            >
              {p.studentName}
            </Link>
            <p className="text-[11px] text-muted-foreground">
              {p.groupName} · {p.periodLabel}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: 'amountMad',
      header: 'Montant',
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="font-mono text-xs font-semibold tabular-nums">
            <span
              className={
                p.status === 'contrepasse' ? 'line-through opacity-60' : ''
              }
            >
              {formatMAD(p.amountMad)}
            </span>
            <p className="font-sans text-[11px] font-normal text-muted-foreground">
              {p.method} · {p.dateLabel}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Statut & rapprochement',
      cell: ({ row }) => {
        const p = row.original;
        const meta = PAYMENT_STATUS_META[p.status];
        return (
          <div className="space-y-0.5 text-xs">
            <div className="flex items-center gap-1.5">
              <span className={cn('size-2 rounded-full', meta.dotClass)} />
              <span className={cn('font-medium', meta.textClass)}>
                {meta.label}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {p.reconciled ? 'Rapproché (démo)' : 'Non rapproché'} ·{' '}
              {p.agentName}
            </p>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setReceiptPayment(p)}
              className="h-7 px-2 text-xs"
            >
              Reçu
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => openDetailSheet(p)}
              className="h-7 px-2.5 text-xs"
            >
              Détails
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <ModuleGate
      moduleKey="billing"
      allowedRoles={['director', 'accountant', 'secretary']}
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Encaissements & reçus
            </h1>
            <p className="text-sm text-muted-foreground">
              {activeCenter.name} · Paiements complets/partiels, contrepassations
              traçables et reçus (Mode Démo)
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="gap-1.5"
            >
              <Download className="size-4" />
              Exporter CSV
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleOpenAdd}
              className="gap-1.5"
            >
              <Plus className="size-4" />
              Ajouter paiement
            </Button>
          </div>
        </div>

        <GlobalBanner
          tone="info"
          title="Intégrité comptable simulée"
          description="Aucune écriture financière n'est supprimée silencieusement : toute annulation génère une contrepassation avec motif obligatoire. Aucun paiement TPE/en ligne réel n'est traité."
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-border shadow-none">
            <CardHeader className="pb-1.5">
              <CardDescription className="text-xs">
                Total encaissé actif (démo)
              </CardDescription>
              <CardTitle className="font-mono text-2xl tabular-nums">
                {formatMAD(totals.collected)}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Hors écritures contrepassées
            </CardContent>
          </Card>
          <Card className="border-border shadow-none">
            <CardHeader className="pb-1.5">
              <CardDescription className="text-xs">
                Écritures rapprochées
              </CardDescription>
              <CardTitle className="font-mono text-2xl tabular-nums">
                {totals.reconciledCount} / {payments.length}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Pointage caisse/banque simulé
            </CardContent>
          </Card>
          <Card className="border-border shadow-none">
            <CardHeader className="pb-1.5">
              <CardDescription className="text-xs">
                Contrepassations tracées
              </CardDescription>
              <CardTitle className="font-mono text-2xl tabular-nums">
                {totals.reversedCount}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Historique conservé intégralement
            </CardContent>
          </Card>
        </div>

        <DataTable
          columns={columns}
          data={payments}
          searchPlaceholder="Rechercher référence, reçu, élève..."
          facetColumnId="status"
          facetOptions={[
            { value: 'encaisse', label: 'Encaissé' },
            { value: 'partiel', label: 'Partiel / Brouillon' },
            { value: 'contrepasse', label: 'Contrepassé' },
          ]}
          emptyTitle="Aucun encaissement enregistré"
          emptyDescription="Ajoutez un premier règlement élève en mode démo."
          emptyActionLabel="Ajouter paiement"
          onEmptyAction={handleOpenAdd}
          renderMobileCard={(p) => {
            const meta = PAYMENT_STATUS_META[p.status];
            return (
              <div className="space-y-2 rounded-xl border border-border bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-xs font-semibold">
                      {p.reference}
                    </p>
                    <p className="text-sm font-medium">{p.studentName}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.groupName} · {p.method}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-semibold tabular-nums">
                      {formatMAD(p.amountMad)}
                    </p>
                    <span className={cn('text-[11px] font-medium', meta.textClass)}>
                      {meta.label}
                    </span>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setReceiptPayment(p)}
                  >
                    Reçu
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => openDetailSheet(p)}
                  >
                    Détails
                  </Button>
                </div>
              </div>
            );
          }}
        />

        {/* Modal ajout paiement / paiement partiel */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Enregistrer un encaissement (Démo)</DialogTitle>
              <DialogDescription>
                Saisissez un règlement complet ou un paiement partiel affecté à
                une échéance.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreatePayment} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <FormFieldWrapper id="pay-stu" label="Élève" required>
                  <Select
                    value={selectedStudentId}
                    onValueChange={(v) => {
                      setSelectedStudentId(v ?? '');
                      setLinkedDueId('none');
                    }}
                  >
                    <SelectTrigger id="pay-stu">
                      <SelectValue placeholder="Choisir élève" />
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

                <FormFieldWrapper id="pay-grp" label="Groupe concerné" required>
                  <Select
                    value={selectedGroupId}
                    onValueChange={(v) => setSelectedGroupId(v ?? '')}
                  >
                    <SelectTrigger id="pay-grp">
                      <SelectValue placeholder="Choisir groupe" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormFieldWrapper>
              </div>

              <FormFieldWrapper
                id="pay-due"
                label="Affecter à une échéance ouverte (optionnel)"
              >
                <Select
                  value={linkedDueId}
                  onValueChange={(v) => {
                    const next = v ?? 'none';
                    setLinkedDueId(next);
                    const found = openDues.find((d) => d.id === next);
                    if (found) {
                      setAmountMad(found.remainingMad);
                      setPeriodLabel(found.periodLabel);
                    }
                  }}
                >
                  <SelectTrigger id="pay-due">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      Aucune échéance liée (saisie libre)
                    </SelectItem>
                    {openDues.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.reference} · {d.periodLabel} (reste{' '}
                        {formatMAD(d.remainingMad)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormFieldWrapper>

              <div className="grid gap-3 sm:grid-cols-2">
                <FormFieldWrapper
                  id="pay-amount"
                  label="Montant encaissé (MAD)"
                  required
                >
                  <CurrencyInput
                    id="pay-amount"
                    value={amountMad}
                    onChange={(val) => setAmountMad(Number(val) || 0)}
                  />
                </FormFieldWrapper>

                <FormFieldWrapper id="pay-method" label="Mode de règlement">
                  <Select
                    value={method}
                    onValueChange={(v) =>
                      setMethod((v as PaymentMethod) ?? 'Espèces')
                    }
                  >
                    <SelectTrigger id="pay-method">
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

              <div className="grid gap-3 sm:grid-cols-2">
                <FormFieldWrapper id="pay-period" label="Période couverte">
                  <Input
                    id="pay-period"
                    value={periodLabel}
                    onChange={(e) => setPeriodLabel(e.target.value)}
                  />
                </FormFieldWrapper>
                <FormFieldWrapper
                  id="pay-ext"
                  label="Référence externe (chèque / virement)"
                >
                  <Input
                    id="pay-ext"
                    value={externalRef}
                    onChange={(e) => setExternalRef(e.target.value)}
                    placeholder="Ex: VIR-CIH-90211"
                  />
                </FormFieldWrapper>
              </div>

              <FormFieldWrapper id="pay-notes" label="Notes de caisse">
                <Textarea
                  id="pay-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observation facultative..."
                />
              </FormFieldWrapper>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" className="gap-1.5">
                  <Wallet className="size-4" />
                  Valider l&apos;encaissement
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Sheet détail encaissement */}
        <Sheet
          open={Boolean(detailPayment)}
          onOpenChange={(open) => !open && setDetailPayment(null)}
        >
          <SheetContent className="overflow-y-auto sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>
                Détail {detailPayment?.reference}
              </SheetTitle>
              <SheetDescription>
                {detailPayment?.studentName} · {detailPayment?.receiptNumber}
              </SheetDescription>
            </SheetHeader>

            {detailPayment && (
              <div className="space-y-5 py-4 text-xs">
                <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-muted/30 p-3">
                  <div>
                    <p className="text-muted-foreground">Montant initial</p>
                    <p className="mt-0.5 font-mono text-base font-semibold tabular-nums">
                      {formatMAD(detailPayment.amountMad)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Affecté / Statut</p>
                    <p className="mt-0.5 font-medium">
                      {formatMAD(detailPayment.allocatedMad)} ·{' '}
                      {PAYMENT_STATUS_META[detailPayment.status].label}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Mode & agent</p>
                    <p className="mt-0.5">
                      {detailPayment.method} · {detailPayment.agentName}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Rapprochement</p>
                    <p className="mt-0.5 font-medium">
                      {detailPayment.reconciled
                        ? 'Rapproché (démo)'
                        : 'En attente'}
                    </p>
                  </div>
                </div>

                {/* Édition informations non comptables */}
                <div className="space-y-3 rounded-xl border border-border p-3">
                  <p className="font-semibold text-foreground">
                    Corriger informations non comptables
                  </p>
                  <FormFieldWrapper
                    id="edit-ext"
                    label="Référence externe (bordereau / virement)"
                  >
                    <Input
                      id="edit-ext"
                      value={editExtRef}
                      onChange={(e) => setEditExtRef(e.target.value)}
                    />
                  </FormFieldWrapper>
                  <FormFieldWrapper id="edit-notes" label="Notes internes">
                    <Textarea
                      id="edit-notes"
                      rows={2}
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                    />
                  </FormFieldWrapper>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        updatePaymentNonAccounting(
                          detailPayment.id,
                          { externalRef: editExtRef, notes: editNotes },
                          activeUser.fullName
                        );
                        toast.success('Informations non comptables mises à jour.');
                        setDetailPayment(null);
                      }}
                    >
                      Enregistrer infos
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        updatePaymentNonAccounting(
                          detailPayment.id,
                          {
                            externalRef: editExtRef,
                            notes: editNotes,
                            reconciled: !detailPayment.reconciled,
                          },
                          activeUser.fullName
                        );
                        toast.success(
                          detailPayment.reconciled
                            ? 'Rapprochement retiré (démo).'
                            : 'Écriture marquée rapprochée (démo).'
                        );
                        setDetailPayment(null);
                      }}
                      className="gap-1.5"
                    >
                      <CheckCircle2 className="size-3.5" />
                      {detailPayment.reconciled
                        ? 'Annuler rapprochement'
                        : 'Rapprocher (démo)'}
                    </Button>
                  </div>
                </div>

                {/* Actions secondaires */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setReceiptPayment(detailPayment)}
                    className="gap-1.5"
                  >
                    <FileText className="size-3.5" />
                    Afficher reçu
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const draft = duplicateDraftPayment(
                        detailPayment.id,
                        activeUser.fullName
                      );
                      if (draft) {
                        toast.success(`Reçu brouillon ${draft.reference} créé.`);
                        setDetailPayment(null);
                      }
                    }}
                    className="gap-1.5"
                  >
                    <Copy className="size-3.5" />
                    Dupliquer brouillon
                  </Button>
                  {detailPayment.status !== 'contrepasse' && (
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => setReverseTarget(detailPayment)}
                      className="gap-1.5"
                    >
                      <RotateCcw className="size-3.5" />
                      Annuler / Contrepasser
                    </Button>
                  )}
                </div>

                {/* Journal d'audit */}
                <div className="space-y-2">
                  <p className="font-semibold">Journal des opérations</p>
                  <div className="divide-y divide-border rounded-xl border border-border">
                    {detailPayment.auditTrail.map((entry) => (
                      <div key={entry.id} className="p-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{entry.action}</span>
                          <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                            {entry.dateLabel}
                          </span>
                        </div>
                        <p className="mt-0.5 text-muted-foreground">
                          {entry.actor} · {entry.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <SheetFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDetailPayment(null)}
              >
                Fermer
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Aperçu Reçu PDF / Imprimable Démo */}
        <Dialog
          open={Boolean(receiptPayment)}
          onOpenChange={(open) => !open && setReceiptPayment(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Reçu de démonstration (non fiscal)</DialogTitle>
              <DialogDescription>
                {activeCenter.name} · {receiptPayment?.receiptNumber}
              </DialogDescription>
            </DialogHeader>
            {receiptPayment && (
              <div className="space-y-3 rounded-xl border border-border bg-card p-4 text-xs">
                <div className="flex items-start justify-between border-b border-border pb-3">
                  <div>
                    <p className="font-heading text-sm font-semibold">
                      {activeCenter.name}
                    </p>
                    <p className="text-muted-foreground">{activeCenter.city}</p>
                  </div>
                  <span className="font-mono font-semibold">
                    {receiptPayment.receiptNumber}
                  </span>
                </div>
                <div className="space-y-1">
                  <p>
                    <span className="text-muted-foreground">Élève :</span>{' '}
                    <strong>{receiptPayment.studentName}</strong>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Groupe :</span>{' '}
                    {receiptPayment.groupName}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Période :</span>{' '}
                    {receiptPayment.periodLabel}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Mode :</span>{' '}
                    {receiptPayment.method} ({receiptPayment.externalRef || '—'})
                  </p>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="font-medium">Montant réglé</span>
                  <span className="font-mono text-base font-bold tabular-nums">
                    {formatMAD(receiptPayment.amountMad)}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Document généré en Mode Démo — ne constitue pas une pièce
                  comptable ou fiscale officielle.
                </p>
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setReceiptPayment(null)}
              >
                Fermer
              </Button>
              <Button
                type="button"
                onClick={() => {
                  window.print();
                  toast.success("Impression / Export PDF navigateur ouvert.");
                }}
                className="gap-1.5"
              >
                <Printer className="size-4" />
                Imprimer / PDF démo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirmation contrepassation */}
        <ConfirmDialog
          open={Boolean(reverseTarget)}
          onOpenChange={(open) => !open && setReverseTarget(null)}
          title={
            reverseTarget
              ? `Contrepasser ${reverseTarget.reference} (${formatMAD(reverseTarget.amountMad)})`
              : ''
          }
          description="L'historique financier n'est jamais effacé. Cette action passera l'écriture au statut « Contrepassé » et réouvrira le solde de l'échéance liée."
          consequences={[
            'Conservation de la trace originale dans le journal.',
            'Réajustement immédiat du solde restant sur l’échéance associée.',
          ]}
          variant="destructive"
          requireReason
          reasonLabel="Motif de contrepassation obligatoire"
          reasonPlaceholder="Ex: Chèque impayé, erreur de saisie caisse..."
          confirmLabel="Confirmer la contrepassation"
          onConfirm={(reason) => {
            if (!reverseTarget || !reason) return;
            reversePayment(reverseTarget.id, reason, activeUser.fullName);
            toast.warning(
              `Écriture ${reverseTarget.reference} contrepassée avec traçabilité.`
            );
            setReverseTarget(null);
            setDetailPayment(null);
          }}
        />
      </div>
    </ModuleGate>
  );
}
