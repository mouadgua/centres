'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import {
  INITIAL_ACCOUNTING_TEMPLATES,
  INITIAL_DUES,
  INITIAL_EXPENSES,
  INITIAL_PAYMENTS,
  INITIAL_PAYROLL,
  INITIAL_PRICING_LOGS,
  INITIAL_PRICING_RULES,
  INITIAL_REFUNDS,
} from '@/lib/mock-api/finance-data';
import { useDemoSession } from '@/stores/demo-session-context';
import type {
  AccountingTemplate,
  DueRecord,
  ExpenseRecord,
  PaymentMethod,
  PaymentRecord,
  PayrollEntryRecord,
  PricingChangeLog,
  PricingRuleRecord,
  RefundRequestRecord,
  RefundStatus,
} from '@/types/finance';

let financeSeq = 600;
function nextFinanceId(prefix: string): string {
  financeSeq += 1;
  return `${prefix}-${financeSeq}`;
}

function getDemoDateLabel(): string {
  return new Intl.DateTimeFormat('fr-MA', {
    timeZone: 'Africa/Casablanca',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date());
}

function getDemoTimestampLabel(): string {
  const d = new Date();
  const dateStr = new Intl.DateTimeFormat('fr-MA', {
    timeZone: 'Africa/Casablanca',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
  const timeStr = new Intl.DateTimeFormat('fr-MA', {
    timeZone: 'Africa/Casablanca',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
  return `${dateStr} · ${timeStr}`;
}

export interface AddPaymentInput {
  studentId: string;
  studentName: string;
  groupId: string;
  groupName: string;
  periodLabel: string;
  amountMad: number;
  method: PaymentMethod;
  externalRef: string;
  linkedDueId?: string;
  notes: string;
  actor: string;
}

interface FinanceContextValue {
  payments: PaymentRecord[];
  dues: DueRecord[];
  pricingRules: PricingRuleRecord[];
  pricingLogs: PricingChangeLog[];
  refunds: RefundRequestRecord[];
  payroll: PayrollEntryRecord[];
  expenses: ExpenseRecord[];
  accountingTemplates: AccountingTemplate[];

  addPayment: (input: AddPaymentInput) => PaymentRecord;
  duplicateDraftPayment: (paymentId: string, actor: string) => PaymentRecord | null;
  updatePaymentNonAccounting: (
    paymentId: string,
    patch: { externalRef: string; notes: string; reconciled?: boolean },
    actor: string
  ) => void;
  reversePayment: (paymentId: string, reason: string, actor: string) => void;

  generateDuesSchedule: (params: {
    studentId: string;
    studentName: string;
    guardianName: string;
    guardianEligible: boolean;
    groupId: string;
    groupName: string;
    monthlyMad: number;
    monthsCount: number;
  }) => number;
  updateDue: (id: string, patch: Partial<DueRecord>) => void;

  addPricingRule: (
    rule: Omit<PricingRuleRecord, 'id' | 'centerId'>,
    actor: string,
    retroactive: boolean
  ) => void;
  togglePricingRule: (id: string, actor: string) => void;

  addRefund: (
    refund: Omit<
      RefundRequestRecord,
      'id' | 'centerId' | 'reference' | 'requestedAtLabel' | 'history'
    >
  ) => void;
  transitionRefund: (
    id: string,
    status: RefundStatus,
    actor: string,
    decisionNote?: string
  ) => void;

  updatePayrollEntry: (
    id: string,
    patch: Partial<PayrollEntryRecord>
  ) => void;
  lockPayrollPeriod: (periodLabel: string) => number;

  addExpense: (
    expense: Omit<ExpenseRecord, 'id' | 'centerId' | 'reference'>
  ) => void;
  updateExpense: (id: string, patch: Partial<ExpenseRecord>) => void;

  saveAccountingTemplate: (template: AccountingTemplate) => void;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { activeCenter } = useDemoSession();

  const [allPayments, setAllPayments] =
    useState<PaymentRecord[]>(INITIAL_PAYMENTS);
  const [allDues, setAllDues] = useState<DueRecord[]>(INITIAL_DUES);
  const [allPricingRules, setAllPricingRules] = useState<PricingRuleRecord[]>(
    INITIAL_PRICING_RULES
  );
  const [allPricingLogs, setAllPricingLogs] =
    useState<PricingChangeLog[]>(INITIAL_PRICING_LOGS);
  const [allRefunds, setAllRefunds] =
    useState<RefundRequestRecord[]>(INITIAL_REFUNDS);
  const [allPayroll, setAllPayroll] =
    useState<PayrollEntryRecord[]>(INITIAL_PAYROLL);
  const [allExpenses, setAllExpenses] =
    useState<ExpenseRecord[]>(INITIAL_EXPENSES);
  const [allTemplates, setAllTemplates] = useState<AccountingTemplate[]>(
    INITIAL_ACCOUNTING_TEMPLATES
  );

  const payments = useMemo(
    () => allPayments.filter((p) => p.centerId === activeCenter.id),
    [allPayments, activeCenter.id]
  );
  const dues = useMemo(
    () => allDues.filter((d) => d.centerId === activeCenter.id),
    [allDues, activeCenter.id]
  );
  const pricingRules = useMemo(
    () => allPricingRules.filter((r) => r.centerId === activeCenter.id),
    [allPricingRules, activeCenter.id]
  );
  const pricingLogs = useMemo(
    () => allPricingLogs.filter((l) => l.centerId === activeCenter.id),
    [allPricingLogs, activeCenter.id]
  );
  const refunds = useMemo(
    () => allRefunds.filter((r) => r.centerId === activeCenter.id),
    [allRefunds, activeCenter.id]
  );
  const payroll = useMemo(
    () => allPayroll.filter((p) => p.centerId === activeCenter.id),
    [allPayroll, activeCenter.id]
  );
  const expenses = useMemo(
    () => allExpenses.filter((e) => e.centerId === activeCenter.id),
    [allExpenses, activeCenter.id]
  );
  const accountingTemplates = useMemo(
    () => allTemplates.filter((t) => t.centerId === activeCenter.id),
    [allTemplates, activeCenter.id]
  );

  const addPayment = useCallback(
    (input: AddPaymentInput): PaymentRecord => {
      const id = nextFinanceId('pay');
      const seq = id.replace('pay-', '');
      const dateLabel = getDemoDateLabel();
      const ts = getDemoTimestampLabel();

      const linkedDue = input.linkedDueId
        ? allDues.find((d) => d.id === input.linkedDueId)
        : undefined;

      const isPartial =
        linkedDue !== undefined && input.amountMad < linkedDue.remainingMad;

      const created: PaymentRecord = {
        id,
        centerId: activeCenter.id,
        reference: `ENC-2026-0${seq}`,
        studentId: input.studentId,
        studentName: input.studentName,
        groupId: input.groupId,
        groupName: input.groupName,
        dateISO: '2026-11-26',
        dateLabel,
        periodLabel: input.periodLabel,
        amountMad: input.amountMad,
        allocatedMad: input.linkedDueId ? input.amountMad : input.amountMad,
        currency: 'MAD',
        method: input.method,
        externalRef: input.externalRef || `REF-${seq}`,
        status: isPartial ? 'partiel' : 'encaisse',
        receiptNumber: `REC-2026-0${seq}`,
        agentName: input.actor,
        linkedDueId: input.linkedDueId,
        reconciled: input.method === 'Espèces',
        notes: input.notes,
        auditTrail: [
          {
            id: nextFinanceId('pa'),
            dateLabel: ts,
            actor: input.actor,
            action: isPartial ? 'Paiement partiel saisi' : 'Encaissement saisi',
            detail: `${input.amountMad} MAD (${input.method})`,
          },
        ],
      };

      setAllPayments((prev) => [created, ...prev]);

      if (input.linkedDueId) {
        setAllDues((prev) =>
          prev.map((d) => {
            if (d.id !== input.linkedDueId) return d;
            const nextPaid = d.paidMad + input.amountMad;
            const nextRemaining = Math.max(0, d.amountMad - nextPaid);
            return {
              ...d,
              paidMad: nextPaid,
              remainingMad: nextRemaining,
              status: nextRemaining === 0 ? 'regle' : 'partiel',
            };
          })
        );
      }

      return created;
    },
    [activeCenter.id, allDues]
  );

  const duplicateDraftPayment = useCallback(
    (paymentId: string, actor: string): PaymentRecord | null => {
      const source = allPayments.find((p) => p.id === paymentId);
      if (!source) return null;
      const id = nextFinanceId('pay');
      const seq = id.replace('pay-', '');
      const draft: PaymentRecord = {
        ...source,
        id,
        reference: `ENC-BR-${seq}`,
        receiptNumber: `REC-BR-${seq}`,
        dateISO: '2026-11-26',
        dateLabel: getDemoDateLabel(),
        status: 'partiel',
        reconciled: false,
        agentName: actor,
        notes: `Dupliqué depuis ${source.reference} (brouillon démo).`,
        auditTrail: [
          {
            id: nextFinanceId('pa'),
            dateLabel: getDemoTimestampLabel(),
            actor,
            action: 'Reçu brouillon dupliqué',
            detail: `Copié depuis ${source.reference}`,
          },
        ],
      };
      setAllPayments((prev) => [draft, ...prev]);
      return draft;
    },
    [allPayments]
  );

  const updatePaymentNonAccounting = useCallback(
    (
      paymentId: string,
      patch: { externalRef: string; notes: string; reconciled?: boolean },
      actor: string
    ) => {
      const ts = getDemoTimestampLabel();
      setAllPayments((prev) =>
        prev.map((p) => {
          if (p.id !== paymentId) return p;
          return {
            ...p,
            externalRef: patch.externalRef,
            notes: patch.notes,
            reconciled:
              patch.reconciled !== undefined ? patch.reconciled : p.reconciled,
            auditTrail: [
              ...p.auditTrail,
              {
                id: nextFinanceId('pa'),
                dateLabel: ts,
                actor,
                action: 'Informations non comptables mises à jour',
                detail: `Réf ext: ${patch.externalRef || '—'}`,
              },
            ],
          };
        })
      );
    },
    []
  );

  const reversePayment = useCallback(
    (paymentId: string, reason: string, actor: string) => {
      const ts = getDemoTimestampLabel();
      const target = allPayments.find((p) => p.id === paymentId);
      if (!target || target.status === 'contrepasse') return;

      setAllPayments((prev) =>
        prev.map((p) => {
          if (p.id !== paymentId) return p;
          return {
            ...p,
            status: 'contrepasse',
            allocatedMad: 0,
            reversalReason: reason,
            receiptNumber: `${p.receiptNumber}-ANN`,
            auditTrail: [
              ...p.auditTrail,
              {
                id: nextFinanceId('pa'),
                dateLabel: ts,
                actor,
                action: 'Contrepassation / annulation tracée',
                detail: reason,
              },
            ],
          };
        })
      );

      if (target.linkedDueId) {
        setAllDues((prev) =>
          prev.map((d) => {
            if (d.id !== target.linkedDueId) return d;
            const nextPaid = Math.max(0, d.paidMad - target.amountMad);
            const nextRem = Math.max(0, d.amountMad - nextPaid);
            return {
              ...d,
              paidMad: nextPaid,
              remainingMad: nextRem,
              status: nextPaid === 0 ? 'en_retard' : 'partiel',
            };
          })
        );
      }
    },
    [allPayments]
  );

  const generateDuesSchedule = useCallback(
    (params: {
      studentId: string;
      studentName: string;
      guardianName: string;
      guardianEligible: boolean;
      groupId: string;
      groupName: string;
      monthlyMad: number;
      monthsCount: number;
    }): number => {
      const months = ['Décembre 2026', 'Janvier 2027', 'Février 2027', 'Mars 2027'];
      const isos = ['2026-12-05', '2027-01-05', '2027-02-05', '2027-03-05'];
      const labels = ['05 déc. 2026', '05 janv. 2027', '05 févr. 2027', '05 mars 2027'];
      const count = Math.min(4, Math.max(1, params.monthsCount));
      const generated: DueRecord[] = [];
      for (let i = 0; i < count; i += 1) {
        const id = nextFinanceId('due');
        generated.push({
          id,
          centerId: activeCenter.id,
          reference: `ECH-${id.replace('due-', '')}`,
          studentId: params.studentId,
          studentName: params.studentName,
          guardianName: params.guardianName,
          guardianEligible: params.guardianEligible,
          groupId: params.groupId,
          groupName: params.groupName,
          periodLabel: months[i],
          dueDateISO: isos[i],
          dueDateLabel: labels[i],
          amountMad: params.monthlyMad,
          discountMad: 0,
          paidMad: 0,
          remainingMad: params.monthlyMad,
          status: 'a_venir',
          disputePaused: false,
          remindersSentDemo: 0,
          notes: 'Généré depuis tarif de groupe (démo).',
        });
      }
      setAllDues((prev) => [...generated, ...prev]);
      return generated.length;
    },
    [activeCenter.id]
  );

  const updateDue = useCallback((id: string, patch: Partial<DueRecord>) => {
    setAllDues((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...patch } : d))
    );
  }, []);

  const addPricingRule = useCallback(
    (
      rule: Omit<PricingRuleRecord, 'id' | 'centerId'>,
      actor: string,
      retroactive: boolean
    ) => {
      const created: PricingRuleRecord = {
        ...rule,
        id: nextFinanceId('prc'),
        centerId: activeCenter.id,
      };
      setAllPricingRules((prev) => [created, ...prev]);
      setAllPricingLogs((prev) => [
        {
          id: nextFinanceId('plog'),
          centerId: activeCenter.id,
          dateLabel: getDemoDateLabel(),
          actor,
          ruleName: rule.name,
          summary: `Création règle (${rule.monthlyFeeMad} MAD/mois, frais ${rule.registrationFeeMad} MAD)`,
          retroactiveApplied: retroactive,
        },
        ...prev,
      ]);
    },
    [activeCenter.id]
  );

  const togglePricingRule = useCallback(
    (id: string, actor: string) => {
      const target = allPricingRules.find((r) => r.id === id);
      if (!target) return;
      setAllPricingRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r))
      );
      setAllPricingLogs((prev) => [
        {
          id: nextFinanceId('plog'),
          centerId: activeCenter.id,
          dateLabel: getDemoDateLabel(),
          actor,
          ruleName: target.name,
          summary: target.active ? 'Tarif désactivé' : 'Tarif activé',
          retroactiveApplied: false,
        },
        ...prev,
      ]);
    },
    [activeCenter.id, allPricingRules]
  );

  const addRefund = useCallback(
    (
      refund: Omit<
        RefundRequestRecord,
        'id' | 'centerId' | 'reference' | 'requestedAtLabel' | 'history'
      >
    ) => {
      const id = nextFinanceId('ref');
      const dateLabel = getDemoDateLabel();
      const created: RefundRequestRecord = {
        ...refund,
        id,
        centerId: activeCenter.id,
        reference: `RMB-2026-${id.replace('ref-', '')}`,
        requestedAtLabel: dateLabel,
        history: [`${dateLabel} · Demande créée par ${refund.requestedBy}`],
      };
      setAllRefunds((prev) => [created, ...prev]);
    },
    [activeCenter.id]
  );

  const transitionRefund = useCallback(
    (
      id: string,
      status: RefundStatus,
      actor: string,
      decisionNote?: string
    ) => {
      const dateLabel = getDemoDateLabel();
      const labelMap: Record<RefundStatus, string> = {
        brouillon: 'Remis en brouillon',
        a_approuver: 'Soumis pour approbation',
        approuve: 'Approuvé',
        refuse: 'Refusé',
        execute_simulation: 'Exécuté en simulation démo (aucun virement réel)',
      };
      setAllRefunds((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status,
                decisionNote: decisionNote ?? r.decisionNote,
                history: [
                  ...r.history,
                  `${dateLabel} · ${labelMap[status]} par ${actor}${decisionNote ? ` (${decisionNote})` : ''}`,
                ],
              }
            : r
        )
      );
    },
    []
  );

  const updatePayrollEntry = useCallback(
    (id: string, patch: Partial<PayrollEntryRecord>) => {
      setAllPayroll((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p;
          const nextAdj =
            patch.adjustmentsMad !== undefined
              ? patch.adjustmentsMad
              : p.adjustmentsMad;
          const nextBase =
            patch.baseAmountMad !== undefined
              ? patch.baseAmountMad
              : p.baseAmountMad;
          return {
            ...p,
            ...patch,
            netPayableMad: Math.max(0, nextBase + nextAdj),
          };
        })
      );
    },
    []
  );

  const lockPayrollPeriod = useCallback(
    (periodLabel: string): number => {
      let count = 0;
      setAllPayroll((prev) =>
        prev.map((p) => {
          if (p.centerId === activeCenter.id && p.periodLabel === periodLabel && !p.locked) {
            count += 1;
            return { ...p, locked: true, status: p.status === 'brouillon' ? 'valide' : p.status };
          }
          return p;
        })
      );
      return count;
    },
    [activeCenter.id]
  );

  const addExpense = useCallback(
    (expense: Omit<ExpenseRecord, 'id' | 'centerId' | 'reference'>) => {
      const id = nextFinanceId('exp');
      const created: ExpenseRecord = {
        ...expense,
        id,
        centerId: activeCenter.id,
        reference: `DEP-2026-${id.replace('exp-', '')}`,
      };
      setAllExpenses((prev) => [created, ...prev]);
    },
    [activeCenter.id]
  );

  const updateExpense = useCallback(
    (id: string, patch: Partial<ExpenseRecord>) => {
      setAllExpenses((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...patch } : e))
      );
    },
    []
  );

  const saveAccountingTemplate = useCallback((template: AccountingTemplate) => {
    setAllTemplates((prev) => {
      const exists = prev.some((t) => t.id === template.id);
      if (exists) {
        return prev.map((t) => (t.id === template.id ? template : t));
      }
      return [template, ...prev];
    });
  }, []);

  const value = useMemo<FinanceContextValue>(
    () => ({
      payments,
      dues,
      pricingRules,
      pricingLogs,
      refunds,
      payroll,
      expenses,
      accountingTemplates,
      addPayment,
      duplicateDraftPayment,
      updatePaymentNonAccounting,
      reversePayment,
      generateDuesSchedule,
      updateDue,
      addPricingRule,
      togglePricingRule,
      addRefund,
      transitionRefund,
      updatePayrollEntry,
      lockPayrollPeriod,
      addExpense,
      updateExpense,
      saveAccountingTemplate,
    }),
    [
      payments,
      dues,
      pricingRules,
      pricingLogs,
      refunds,
      payroll,
      expenses,
      accountingTemplates,
      addPayment,
      duplicateDraftPayment,
      updatePaymentNonAccounting,
      reversePayment,
      generateDuesSchedule,
      updateDue,
      addPricingRule,
      togglePricingRule,
      addRefund,
      transitionRefund,
      updatePayrollEntry,
      lockPayrollPeriod,
      addExpense,
      updateExpense,
      saveAccountingTemplate,
    ]
  );

  return (
    <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
  );
}

export function useFinanceStore() {
  const ctx = useContext(FinanceContext);
  if (!ctx) {
    throw new Error('useFinanceStore must be used inside FinanceProvider');
  }
  return ctx;
}
