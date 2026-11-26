'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Plus,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/feedback/confirm-dialog';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatMAD } from '@/lib/format/morocco';
import { cn } from '@/lib/utils';
import { useDemoSession } from '@/stores/demo-session-context';
import { useFinanceStore } from '@/stores/finance-context';
import { useProfilesStore } from '@/stores/profiles-context';
import type { RefundRequestRecord, RefundStatus } from '@/types/finance';

const REFUND_STATUS_META: Record<
  RefundStatus,
  { label: string; textClass: string }
> = {
  brouillon: { label: 'Brouillon', textClass: 'text-muted-foreground' },
  a_approuver: {
    label: 'À approuver',
    textClass: 'text-amber-700 dark:text-amber-300',
  },
  approuve: {
    label: 'Approuvé',
    textClass: 'text-sky-700 dark:text-sky-300',
  },
  refuse: {
    label: 'Refusé',
    textClass: 'text-rose-700 dark:text-rose-300',
  },
  execute_simulation: {
    label: 'Exécuté (simulation démo)',
    textClass: 'text-emerald-700 dark:text-emerald-300',
  },
};

export default function AdminRefundsPage() {
  const { activeCenter, activeUser } = useDemoSession();
  const { refunds, payments, addRefund, transitionRefund } =
    useFinanceStore();
  const { students } = useProfilesStore();

  const [createOpen, setCreateOpen] = useState(false);
  const [studentId, setStudentId] = useState(students[0]?.id ?? '');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [linkedPaymentRef, setLinkedPaymentRef] = useState(
    payments[0]?.reference ?? 'ENC-2026-0412'
  );
  const [amountMad, setAmountMad] = useState(300);
  const [reason, setReason] = useState('');
  const [attachmentName, setAttachmentName] = useState('justificatif_demo.pdf');

  const [transitionTarget, setTransitionTarget] = useState<{
    refund: RefundRequestRecord;
    nextStatus: RefundStatus;
    requireReason: boolean;
  } | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const stu = students.find((s) => s.id === studentId);
    if (!stu || !beneficiaryName.trim() || reason.trim().length < 4) {
      toast.error('Renseignez le bénéficiaire et le motif du remboursement.');
      return;
    }
    addRefund({
      beneficiaryName: beneficiaryName.trim(),
      studentId: stu.id,
      studentName: `${stu.firstName} ${stu.lastName}`,
      linkedPaymentRef,
      amountMad,
      reason: reason.trim(),
      attachmentName: attachmentName.trim() || 'piece_demo.pdf',
      status: 'a_approuver',
      requestedBy: activeUser.fullName,
    });
    toast.success('Demande de remboursement soumise pour approbation.');
    setCreateOpen(false);
    setBeneficiaryName('');
    setReason('');
  };

  return (
    <ModuleGate moduleKey="refunds" allowedRoles={['director', 'accountant']}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Remboursements & avoirs
            </h1>
            <p className="text-sm text-muted-foreground">
              {activeCenter.name} · Circuit de validation et journal des
              décisions (Mode Démo)
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="gap-1.5"
          >
            <Plus className="size-4" />
            Nouvelle demande
          </Button>
        </div>

        <GlobalBanner
          tone="info"
          title="Exécution simulée uniquement"
          description="Aucun virement bancaire ou remboursement carte réel n'est déclenché depuis ce prototype. Les statuts « Exécuté (simulation démo) » servent à valider le workflow."
        />

        {refunds.length === 0 ? (
          <EmptyState
            icon={<RotateCcw className="size-5" />}
            title="Aucune demande de remboursement"
            description="Créez une demande fictive pour tester le circuit d'approbation."
            actionLabel="Nouvelle demande"
            onAction={() => setCreateOpen(true)}
          />
        ) : (
          <div className="grid gap-4">
            {refunds.map((ref) => {
              const meta = REFUND_STATUS_META[ref.status];
              return (
                <Card key={ref.id} className="border-border shadow-none">
                  <CardHeader className="pb-2">
                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <span className="font-mono text-xs text-muted-foreground">
                            {ref.reference}
                          </span>
                          <span>{ref.beneficiaryName}</span>
                          <span className="text-xs font-normal text-muted-foreground">
                            (élève : {ref.studentName})
                          </span>
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Paiement source : {ref.linkedPaymentRef} · Demandé le{' '}
                          {ref.requestedAtLabel} par {ref.requestedBy} · Pièce :{' '}
                          {ref.attachmentName}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-lg font-bold tabular-nums">
                          {formatMAD(ref.amountMad)}
                        </p>
                        <p className={cn('text-xs font-semibold', meta.textClass)}>
                          {meta.label}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs">
                    <p className="text-muted-foreground">
                      <strong className="text-foreground">Motif :</strong>{' '}
                      {ref.reason}
                    </p>

                    <div className="rounded-lg border border-border bg-muted/25 p-2.5">
                      <p className="font-medium">Journal :</p>
                      <ul className="mt-1 space-y-0.5 text-muted-foreground">
                        {ref.history.map((h, i) => (
                          <li key={i}>· {h}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-wrap justify-end gap-2">
                      {(ref.status === 'brouillon' ||
                        ref.status === 'a_approuver') && (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              setTransitionTarget({
                                refund: ref,
                                nextStatus: 'refuse',
                                requireReason: true,
                              })
                            }
                            className="gap-1.5"
                          >
                            <XCircle className="size-3.5" />
                            Refuser
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() =>
                              setTransitionTarget({
                                refund: ref,
                                nextStatus: 'approuve',
                                requireReason: false,
                              })
                            }
                            className="gap-1.5"
                          >
                            <CheckCircle2 className="size-3.5" />
                            Approuver
                          </Button>
                        </>
                      )}
                      {ref.status === 'approuve' && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() =>
                            setTransitionTarget({
                              refund: ref,
                              nextStatus: 'execute_simulation',
                              requireReason: true,
                            })
                          }
                        >
                          Exécuter en simulation démo
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Modal nouvelle demande */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nouvelle demande de remboursement</DialogTitle>
              <DialogDescription>
                Soumettez une demande liée à un encaissement existant.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <FormFieldWrapper id="ref-stu" label="Élève concerné" required>
                <Select
                  value={studentId}
                  onValueChange={(v) => setStudentId(v ?? '')}
                >
                  <SelectTrigger id="ref-stu">
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
              <FormFieldWrapper
                id="ref-ben"
                label="Bénéficiaire (parent / payeur)"
                required
              >
                <Input
                  id="ref-ben"
                  value={beneficiaryName}
                  onChange={(e) => setBeneficiaryName(e.target.value)}
                  placeholder="Ex: Mustapha Idrissi"
                />
              </FormFieldWrapper>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormFieldWrapper id="ref-pay" label="Paiement d'origine">
                  <Input
                    id="ref-pay"
                    value={linkedPaymentRef}
                    onChange={(e) => setLinkedPaymentRef(e.target.value)}
                  />
                </FormFieldWrapper>
                <FormFieldWrapper id="ref-amt" label="Montant (MAD)">
                  <CurrencyInput
                    id="ref-amt"
                    value={amountMad}
                    onChange={(v) => setAmountMad(Number(v) || 0)}
                  />
                </FormFieldWrapper>
              </div>
              <FormFieldWrapper id="ref-att" label="Pièce justificative (démo)">
                <Input
                  id="ref-att"
                  value={attachmentName}
                  onChange={(e) => setAttachmentName(e.target.value)}
                />
              </FormFieldWrapper>
              <FormFieldWrapper id="ref-reason" label="Motif" required>
                <Textarea
                  id="ref-reason"
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </FormFieldWrapper>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit">Créer la demande</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={Boolean(transitionTarget)}
          onOpenChange={(open) => !open && setTransitionTarget(null)}
          title={
            transitionTarget
              ? `${REFUND_STATUS_META[transitionTarget.nextStatus].label} — ${transitionTarget.refund.reference}`
              : ''
          }
          description={
            transitionTarget?.nextStatus === 'execute_simulation'
              ? 'Cette action enregistre le remboursement comme exécuté en simulation démo uniquement (aucun virement réel).'
              : 'Confirmez la transition de cette demande dans le journal financier.'
          }
          variant={
            transitionTarget?.nextStatus === 'refuse'
              ? 'destructive'
              : 'default'
          }
          requireReason={Boolean(transitionTarget?.requireReason)}
          reasonLabel="Décision / motif"
          confirmLabel="Confirmer"
          onConfirm={(decisionNote) => {
            if (!transitionTarget) return;
            transitionRefund(
              transitionTarget.refund.id,
              transitionTarget.nextStatus,
              activeUser.fullName,
              decisionNote
            );
            toast.success(
              `Demande ${transitionTarget.refund.reference} mise à jour.`
            );
            setTransitionTarget(null);
          }}
        />
      </div>
    </ModuleGate>
  );
}
