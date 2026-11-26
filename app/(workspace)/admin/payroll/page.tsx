'use client';

import React, { useMemo, useState } from 'react';
import {
  Banknote,
  Calculator,
  Download,
  Lock,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/feedback/confirm-dialog';
import { ModuleGate } from '@/components/feedback/module-gate';
import { GlobalBanner } from '@/components/feedback/states';
import { CurrencyInput, FormFieldWrapper } from '@/components/forms/form-field';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { downloadSafeCsv } from '@/lib/format/csv';
import { formatMAD } from '@/lib/format/morocco';
import { cn } from '@/lib/utils';
import { useDemoSession } from '@/stores/demo-session-context';
import { useFinanceStore } from '@/stores/finance-context';
import type { PayrollEntryRecord, PayrollStatus } from '@/types/finance';

const PAYROLL_STATUS_META: Record<
  PayrollStatus,
  { label: string; textClass: string }
> = {
  brouillon: { label: 'Brouillon', textClass: 'text-muted-foreground' },
  calcule: { label: 'Calculé', textClass: 'text-sky-700 dark:text-sky-300' },
  valide: { label: 'Validé', textClass: 'text-amber-700 dark:text-amber-300' },
  paye_fictivement: {
    label: 'Payé fictivement (démo)',
    textClass: 'text-emerald-700 dark:text-emerald-300',
  },
};

export default function AdminPayrollPage() {
  const { activeCenter } = useDemoSession();
  const { payroll, updatePayrollEntry, lockPayrollPeriod } = useFinanceStore();

  const [periodFilter, setPeriodFilter] = useState('Novembre 2026');
  const [detailEntry, setDetailEntry] = useState<PayrollEntryRecord | null>(
    null
  );
  const [adjMad, setAdjMad] = useState(0);
  const [adjNote, setAdjNote] = useState('');
  const [postCorrectionNote, setPostCorrectionNote] = useState('');

  const [lockConfirmOpen, setLockConfirmOpen] = useState(false);

  const filtered = useMemo(
    () =>
      periodFilter === 'all'
        ? payroll
        : payroll.filter((p) => p.periodLabel === periodFilter),
    [payroll, periodFilter]
  );

  const totalNet = useMemo(
    () => filtered.reduce((acc, p) => acc + p.netPayableMad, 0),
    [filtered]
  );

  const openAssistant = (entry: PayrollEntryRecord) => {
    setDetailEntry(entry);
    setAdjMad(entry.adjustmentsMad);
    setAdjNote(entry.adjustmentNote);
    setPostCorrectionNote(entry.postClosureCorrectionNote ?? '');
  };

  const handleSaveEntry = () => {
    if (!detailEntry) return;
    if (detailEntry.locked && postCorrectionNote.trim().length < 4) {
      toast.error(
        'Période verrouillée : saisissez une note de correction après clôture (min. 4 caractères).'
      );
      return;
    }
    updatePayrollEntry(detailEntry.id, {
      adjustmentsMad: adjMad,
      adjustmentNote: adjNote.trim(),
      postClosureCorrectionNote: detailEntry.locked
        ? postCorrectionNote.trim()
        : detailEntry.postClosureCorrectionNote,
    });
    toast.success(
      `Calcul mis à jour pour ${detailEntry.teacherName} (indicatif démo).`
    );
    setDetailEntry(null);
  };

  return (
    <ModuleGate moduleKey="payroll" allowedRoles={['director', 'accountant']}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Rémunération des professeurs
            </h1>
            <p className="text-sm text-muted-foreground">
              {activeCenter.name} · Calcul indicatif (horaire / fixe / %),
              ajustements et verrouillage de période
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                downloadSafeCsv(
                  `paie-indicative-${activeCenter.id}.csv`,
                  [
                    'Période',
                    'Professeur',
                    'Méthode',
                    'Séances éligibles',
                    'Absences',
                    'Base MAD',
                    'Ajustements MAD',
                    'Net indicatif MAD',
                    'Statut',
                  ],
                  filtered.map((p) => [
                    p.periodLabel,
                    p.teacherName,
                    p.rateLabel,
                    p.eligibleSessions,
                    p.absentSessions,
                    p.baseAmountMad,
                    p.adjustmentsMad,
                    p.netPayableMad,
                    PAYROLL_STATUS_META[p.status].label,
                  ])
                );
                toast.success('Export CSV indicatif généré.');
              }}
              className="gap-1.5"
            >
              <Download className="size-4" />
              Exporter CSV
            </Button>
            {periodFilter !== 'all' && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setLockConfirmOpen(true)}
                className="gap-1.5"
              >
                <Lock className="size-4" />
                Verrouiller {periodFilter}
              </Button>
            )}
          </div>
        </div>

        <GlobalBanner
          tone="warning"
          title="Simulation indicative — non conforme paie légale / CNSS"
          description="Ce module calcule des montants bruts indicatifs à partir des séances démo. Il ne génère pas de bulletin de paie légal marocain et aucun virement bancaire réel n'est exécuté."
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Select
            value={periodFilter}
            onValueChange={(v) => setPeriodFilter(v ?? 'Novembre 2026')}
          >
            <SelectTrigger className="h-9 w-[220px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Novembre 2026">Novembre 2026</SelectItem>
              <SelectItem value="Octobre 2026">Octobre 2026</SelectItem>
              <SelectItem value="all">Toutes les périodes</SelectItem>
            </SelectContent>
          </Select>

          <div className="rounded-xl border border-border bg-card px-4 py-2 text-xs">
            Total net indicatif filtré :{' '}
            <strong className="font-mono text-sm tabular-nums">
              {formatMAD(totalNet)}
            </strong>
          </div>
        </div>

        <div className="grid gap-4">
          {filtered.map((entry) => {
            const meta = PAYROLL_STATUS_META[entry.status];
            return (
              <Card key={entry.id} className="border-border shadow-none">
                <CardHeader className="pb-2">
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <span>{entry.teacherName}</span>
                        {entry.locked && (
                          <Lock className="size-3.5 text-muted-foreground" />
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {entry.periodLabel} · {entry.rateLabel} ·{' '}
                        <span className="font-mono tabular-nums">
                          {entry.eligibleSessions} séance(s) éligible(s)
                        </span>{' '}
                        · {entry.absentSessions} absence(s)
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-xl font-bold tabular-nums">
                        {formatMAD(entry.netPayableMad)}
                      </p>
                      <p className={cn('text-xs font-medium', meta.textClass)}>
                        {meta.label}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col justify-between gap-3 text-xs sm:flex-row sm:items-center">
                  <div className="space-y-0.5 text-muted-foreground">
                    <p className="font-mono tabular-nums">
                      Base : {formatMAD(entry.baseAmountMad)} · Ajustements :{' '}
                      {formatMAD(entry.adjustmentsMad)} ({entry.adjustmentNote})
                    </p>
                    {entry.postClosureCorrectionNote && (
                      <p className="text-amber-700 dark:text-amber-300">
                        Correction post-clôture :{' '}
                        {entry.postClosureCorrectionNote}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => openAssistant(entry)}
                      className="gap-1.5"
                    >
                      <Calculator className="size-3.5" />
                      {entry.locked ? 'Corriger après clôture' : 'Détail & ajuster'}
                    </Button>
                    {entry.status !== 'paye_fictivement' && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          updatePayrollEntry(entry.id, {
                            status: 'paye_fictivement',
                          });
                          toast.success(
                            `${entry.teacherName} marqué « Payé fictivement (démo) » — aucun virement réel effectué.`
                          );
                        }}
                        className="gap-1.5"
                      >
                        <Banknote className="size-3.5" />
                        Marquer payé (démo)
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Sheet assistant calcul détaillé */}
        <Sheet
          open={Boolean(detailEntry)}
          onOpenChange={(open) => !open && setDetailEntry(null)}
        >
          <SheetContent className="sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Assistant calcul — {detailEntry?.teacherName}</SheetTitle>
              <SheetDescription>
                {detailEntry?.periodLabel} · {detailEntry?.rateLabel}
              </SheetDescription>
            </SheetHeader>
            {detailEntry && (
              <div className="space-y-4 py-4 text-xs">
                {detailEntry.locked && (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-950 dark:text-amber-100">
                    <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <p>
                      Cette période est verrouillée. Toute modification nécessite
                      une note explicite de correction après clôture.
                    </p>
                  </div>
                )}

                <div className="space-y-1.5 rounded-xl border border-border bg-muted/30 p-3">
                  <p className="font-semibold">Détail de la formule démo</p>
                  <p className="text-muted-foreground">
                    Méthode : <strong>{detailEntry.method}</strong> (
                    {detailEntry.rateLabel})
                  </p>
                  <p className="font-mono text-muted-foreground tabular-nums">
                    Séances éligibles : {detailEntry.eligibleSessions} ·
                    Absences déduites : {detailEntry.absentSessions}
                  </p>
                  <p className="font-mono font-semibold tabular-nums">
                    Montant de base : {formatMAD(detailEntry.baseAmountMad)}
                  </p>
                </div>

                <FormFieldWrapper id="payr-adj" label="Ajustement (MAD)">
                  <CurrencyInput
                    id="payr-adj"
                    value={adjMad}
                    onChange={(v) => setAdjMad(Number(v) || 0)}
                  />
                </FormFieldWrapper>
                <FormFieldWrapper id="payr-note" label="Motif ajustement">
                  <Input
                    id="payr-note"
                    value={adjNote}
                    onChange={(e) => setAdjNote(e.target.value)}
                  />
                </FormFieldWrapper>

                {detailEntry.locked && (
                  <FormFieldWrapper
                    id="payr-post"
                    label="Note de correction après clôture"
                    required
                  >
                    <Input
                      id="payr-post"
                      value={postCorrectionNote}
                      onChange={(e) => setPostCorrectionNote(e.target.value)}
                      placeholder="Ex: Rattrapage séance oubliée du 22 oct."
                    />
                  </FormFieldWrapper>
                )}

                <div className="flex items-center justify-between rounded-xl border border-border p-3 font-semibold">
                  <span>Nouveau net indicatif</span>
                  <span className="font-mono text-base tabular-nums">
                    {formatMAD(Math.max(0, detailEntry.baseAmountMad + adjMad))}
                  </span>
                </div>
              </div>
            )}
            <SheetFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDetailEntry(null)}
              >
                Annuler
              </Button>
              <Button type="button" onClick={handleSaveEntry}>
                Enregistrer calcul
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <ConfirmDialog
          open={lockConfirmOpen}
          onOpenChange={setLockConfirmOpen}
          title={`Verrouiller la paie de ${periodFilter}`}
          description="Une fois la période verrouillée, les ajustements ultérieurs seront tracés comme corrections après clôture."
          confirmLabel="Verrouiller la période"
          onConfirm={() => {
            const count = lockPayrollPeriod(periodFilter);
            toast.success(`${count} fiche(s) verrouillée(s) pour ${periodFilter}.`);
            setLockConfirmOpen(false);
          }}
        />
      </div>
    </ModuleGate>
  );
}
