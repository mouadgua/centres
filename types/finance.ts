export type PaymentMethod =
  | 'Espèces'
  | 'Virement'
  | 'Chèque'
  | 'TPE / Carte (démo)';

export type PaymentStatus = 'encaisse' | 'partiel' | 'annule' | 'contrepasse';

export interface PaymentAuditEntry {
  id: string;
  dateLabel: string;
  actor: string;
  action: string;
  detail: string;
}

export interface PaymentRecord {
  id: string;
  centerId: string;
  reference: string;
  studentId: string;
  studentName: string;
  groupId: string;
  groupName: string;
  dateISO: string;
  dateLabel: string;
  periodLabel: string;
  amountMad: number;
  allocatedMad: number;
  currency: 'MAD';
  method: PaymentMethod;
  externalRef: string;
  status: PaymentStatus;
  receiptNumber: string;
  agentName: string;
  linkedDueId?: string;
  reconciled: boolean;
  notes: string;
  reversalReason?: string;
  auditTrail: PaymentAuditEntry[];
}

export type DueStatus =
  | 'a_venir'
  | 'partiel'
  | 'en_retard'
  | 'regle'
  | 'litige';

export interface DueRecord {
  id: string;
  centerId: string;
  reference: string;
  studentId: string;
  studentName: string;
  guardianName: string;
  guardianEligible: boolean;
  groupId: string;
  groupName: string;
  periodLabel: string;
  dueDateISO: string;
  dueDateLabel: string;
  amountMad: number;
  discountMad: number;
  paidMad: number;
  remainingMad: number;
  status: DueStatus;
  disputePaused: boolean;
  remindersSentDemo: number;
  notes: string;
}

export interface PricingRuleRecord {
  id: string;
  centerId: string;
  name: string;
  targetType: 'matiere' | 'groupe' | 'niveau';
  targetLabel: string;
  registrationFeeMad: number;
  monthlyFeeMad: number;
  discountType: 'aucune' | 'pourcentage' | 'fixe';
  discountValue: number;
  priorityOrder: number;
  validityLabel: string;
  active: boolean;
}

export interface PricingChangeLog {
  id: string;
  centerId: string;
  dateLabel: string;
  actor: string;
  ruleName: string;
  summary: string;
  retroactiveApplied: boolean;
}

export type RefundStatus =
  | 'brouillon'
  | 'a_approuver'
  | 'approuve'
  | 'refuse'
  | 'execute_simulation';

export interface RefundRequestRecord {
  id: string;
  centerId: string;
  reference: string;
  beneficiaryName: string;
  studentId: string;
  studentName: string;
  linkedPaymentRef: string;
  amountMad: number;
  reason: string;
  attachmentName: string;
  status: RefundStatus;
  requestedBy: string;
  requestedAtLabel: string;
  decisionNote?: string;
  history: string[];
}

export type PayrollStatus =
  | 'brouillon'
  | 'calcule'
  | 'valide'
  | 'paye_fictivement';

export interface PayrollEntryRecord {
  id: string;
  centerId: string;
  periodLabel: string;
  teacherId: string;
  teacherName: string;
  method: 'horaire' | 'fixe' | 'pourcentage';
  rateLabel: string;
  rateNumeric: number;
  eligibleSessions: number;
  absentSessions: number;
  baseAmountMad: number;
  adjustmentsMad: number;
  adjustmentNote: string;
  netPayableMad: number;
  status: PayrollStatus;
  locked: boolean;
  postClosureCorrectionNote?: string;
}

export type ExpenseStatus = 'validee' | 'en_attente' | 'archivee';

export interface ExpenseRecord {
  id: string;
  centerId: string;
  reference: string;
  dateISO: string;
  dateLabel: string;
  category: string;
  supplier: string;
  amountMad: number;
  method: PaymentMethod;
  attachmentName: string;
  status: ExpenseStatus;
  notes: string;
  archiveReason?: string;
}

export interface AccountingTemplate {
  id: string;
  centerId: string;
  name: string;
  separator: ';' | ',';
  dateFormat: 'DD/MM/YYYY' | 'YYYY-MM-DD';
  decimalSeparator: ',' | '.';
  accountCodeSales: string;
  accountCodeCash: string;
  accountCodeBank: string;
  accountCodeExpenses: string;
  accountCodePayroll: string;
  columnNames: {
    date: string;
    journal: string;
    account: string;
    reference: string;
    label: string;
    debit: string;
    credit: string;
  };
}
