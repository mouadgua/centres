'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  Send,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { ModuleGate } from '@/components/feedback/module-gate';
import { EmptyState, GlobalBanner } from '@/components/feedback/states';
import { CurrencyInput, FormFieldWrapper } from '@/components/forms/form-field';
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
import { Textarea } from '@/components/ui/textarea';
import { formatMAD } from '@/lib/format/morocco';
import { useDemoSession } from '@/stores/demo-session-context';
import { useFinanceStore } from '@/stores/finance-context';
import type { DueRecord } from '@/types/finance';

export default function AdminOverduePage() {
  const { activeCenter, activeUser, hasModule } = useDemoSession();
  const { dues, updateDue, addPayment } = useFinanceStore();

  const remindersEnabled = hasModule('payment.reminders');

  const overdueList = useMemo(
    () =>
      dues.filter(
        (d) =>
          d.remainingMad > 0 &&
          (d.status === 'en_retard' ||
            d.status === 'partiel' ||
            d.status === 'litige')
      ),
    [dues]
  );

  const [reminderTarget, setReminderTarget] = useState<DueRecord | null>(null);
  const [reminderLevel, setReminderLevel] = useState<'J+7' | 'J+15'>('J+7');
  const [internalNote, setInternalNote] = useState('');

  const [payTarget, setPayTarget] = useState<DueRecord | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);

  const stats = useMemo(() => {
    const totalMad = overdueList.reduce((acc, d) => acc + d.remainingMad, 0);
    const inDispute = overdueList.filter((d) => d.disputePaused).length;
    return { totalMad, count: overdueList.length, inDispute };
  }, [overdueList]);

  return (
    <ModuleGate moduleKey="dues" allowedRoles={['director', 'accountant']}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Suivi des impayés & relances
            </h1>
            <p className="text-sm text-muted-foreground">
              {activeCenter.name} · Relances progressives prévisualisées, pause
              litige et encaissement direct
            </p>
          </div>
          <Link
            href="/admin/dues"
            className="inline-flex h-9 items-center rounded-lg border border-border bg-card px-3.5 text-xs font-medium hover:bg-muted"
          >
            Voir tout l&apos;échéancier
          </Link>
        </div>

        <GlobalBanner
          tone="warning"
          title="Relances familles strictement simulées (Mode Démo)"
          description="Conformément au respect de la confidentialité, les relances sont sobres, adressées uniquement au responsable financier éligible et jamais exposées dans un groupe. Aucun SMS ou email réel n'est envoyé."
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-border shadow-none">
            <CardHeader className="pb-1.5">
              <CardDescription className="text-xs">
                Total impayés & soldes ouverts
              </CardDescription>
              <CardTitle className="font-mono text-2xl text-rose-600 tabular-nums dark:text-rose-400">
                {formatMAD(stats.totalMad)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-border shadow-none">
            <CardHeader className="pb-1.5">
              <CardDescription className="text-xs">
                Dossiers à suivre
              </CardDescription>
              <CardTitle className="font-mono text-2xl tabular-nums">
                {stats.count}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-border shadow-none">
            <CardHeader className="pb-1.5">
              <CardDescription className="text-xs">
                Relances en pause (litige)
              </CardDescription>
              <CardTitle className="font-mono text-2xl tabular-nums">
                {stats.inDispute}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {overdueList.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 className="size-5" />}
            title="Aucun impayé ouvert"
            description="Toutes les échéances échues de ce centre sont soldées."
          />
        ) : (
          <div className="divide-y divide-border rounded-xl border border-border bg-card">
            {overdueList.map((due) => (
              <div
                key={due.id}
                className="flex flex-col justify-between gap-4 p-4 lg:flex-row lg:items-center"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <AlertCircle className="size-4 text-rose-600 dark:text-rose-400" />
                    <Link
                      href={`/admin/students/${due.studentId}`}
                      className="text-sm font-semibold hover:underline"
                    >
                      {due.studentName}
                    </Link>
                    <span className="font-mono text-xs text-muted-foreground">
                      {due.reference}
                    </span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">
                      {due.groupName} ({due.periodLabel})
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    Échéance : {due.dueDateLabel} · Responsable financier :{' '}
                    <strong className="font-medium text-foreground">
                      {due.guardianName}
                    </strong>{' '}
                    ·{' '}
                    {due.guardianEligible
                      ? 'Canal digital éligible'
                      : 'Appel manuel recommandé (consentement manquant)'}
                  </p>
                  {due.notes && (
                    <p className="text-xs text-muted-foreground">
                      Note : {due.notes}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="mr-2 text-right">
                    <p className="font-mono text-base font-bold text-rose-600 tabular-nums dark:text-rose-400">
                      {formatMAD(due.remainingMad)}
                    </p>
                    <p className="text-[11px] text-muted-foreground tabular-nums">
                      {due.remindersSentDemo} relance(s) simulée(s)
                    </p>
                  </div>

                  {remindersEnabled && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={due.disputePaused || !due.guardianEligible}
                      onClick={() => {
                        setReminderTarget(due);
                        setReminderLevel(
                          due.remindersSentDemo >= 1 ? 'J+15' : 'J+7'
                        );
                        setInternalNote(due.notes);
                      }}
                      className="gap-1.5"
                    >
                      <Send className="size-3.5" />
                      Prévisualiser relance
                    </Button>
                  )}

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const nextPause = !due.disputePaused;
                      updateDue(due.id, {
                        disputePaused: nextPause,
                        status: nextPause ? 'litige' : 'en_retard',
                      });
                      toast.info(
                        nextPause
                          ? 'Relances mises en pause (litige).'
                          : 'Relances réactivées.'
                      );
                    }}
                    className="gap-1.5"
                  >
                    {due.disputePaused ? (
                      <>
                        <PlayCircle className="size-3.5" /> Reprendre
                      </>
                    ) : (
                      <>
                        <PauseCircle className="size-3.5" /> Pause litige
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setPayTarget(due);
                      setPayAmount(due.remainingMad);
                    }}
                    className="gap-1.5"
                  >
                    <Wallet className="size-3.5" />
                    Régler
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal prévisualisation relance */}
        <Dialog
          open={Boolean(reminderTarget)}
          onOpenChange={(open) => !open && setReminderTarget(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                Prévisualiser relance {reminderLevel} (Démo)
              </DialogTitle>
              <DialogDescription>
                Destinataire : {reminderTarget?.guardianName} (responsable
                financier)
              </DialogDescription>
            </DialogHeader>
            {reminderTarget && (
              <div className="space-y-3 text-xs">
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-muted-foreground">
                    « Bonjour {reminderTarget.guardianName}, sauf erreur de notre
                    part, l&apos;échéance {reminderTarget.reference} (
                    {reminderTarget.periodLabel}) pour {reminderTarget.studentName}{' '}
                    présente un solde de {formatMAD(reminderTarget.remainingMad)}.
                    Notre secrétariat reste à votre disposition à {activeCenter.name}. »
                  </p>
                </div>
                <FormFieldWrapper id="ov-note" label="Note interne de suivi">
                  <Textarea
                    id="ov-note"
                    rows={2}
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                  />
                </FormFieldWrapper>
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setReminderTarget(null)}
              >
                Fermer
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (!reminderTarget) return;
                  updateDue(reminderTarget.id, {
                    remindersSentDemo: reminderTarget.remindersSentDemo + 1,
                    notes: internalNote.trim(),
                  });
                  toast.success(
                    'Relance enregistrée comme « Prévisualisée / simulée (démo) ».'
                  );
                  setReminderTarget(null);
                }}
              >
                Enregistrer simulation (démo)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal règlement rapide */}
        <Dialog
          open={Boolean(payTarget)}
          onOpenChange={(open) => !open && setPayTarget(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Régler {payTarget?.reference}</DialogTitle>
              <DialogDescription>
                {payTarget?.studentName} · Solde dû :{' '}
                {payTarget ? formatMAD(payTarget.remainingMad) : ''}
              </DialogDescription>
            </DialogHeader>
            <FormFieldWrapper id="ov-pay" label="Montant encaissé (MAD)">
              <CurrencyInput
                id="ov-pay"
                value={payAmount}
                onChange={(v) => setPayAmount(Number(v) || 0)}
              />
            </FormFieldWrapper>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPayTarget(null)}
              >
                Annuler
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (!payTarget || payAmount <= 0) return;
                  addPayment({
                    studentId: payTarget.studentId,
                    studentName: payTarget.studentName,
                    groupId: payTarget.groupId,
                    groupName: payTarget.groupName,
                    periodLabel: payTarget.periodLabel,
                    amountMad: payAmount,
                    method: 'Espèces',
                    externalRef: '',
                    linkedDueId: payTarget.id,
                    notes: `Règlement depuis suivi impayés (${payTarget.reference})`,
                    actor: activeUser.fullName,
                  });
                  toast.success(
                    `Règlement de ${formatMAD(payAmount)} enregistré.`
                  );
                  setPayTarget(null);
                }}
              >
                Enregistrer paiement
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ModuleGate>
  );
}
