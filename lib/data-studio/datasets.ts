import { z } from 'zod';
import { sanitizeCsvCell } from '@/lib/format/csv';
import type { AttendanceRecord } from '@/types/attendance';
import type {
  CellValidationError,
  ColumnFormat,
  DatasetKey,
  ExportTemplateConfig,
  StudioCellValue,
  StudioColumnDef,
  StudioRow,
} from '@/types/data-studio';
import type {
  DueRecord,
  ExpenseRecord,
  PaymentRecord,
  PayrollEntryRecord,
} from '@/types/finance';
import type {
  EnrollmentRecord,
  GroupRecord,
  ResourceMaterialRecord,
  SessionRecord,
} from '@/types/pedagogy';
import type {
  GuardianRecord,
  StudentRecord,
  TeacherRecord,
} from '@/types/profiles';

export interface DatasetMetadata {
  key: DatasetKey;
  label: string;
  description: string;
  canAddRow: boolean;
  canSyncBack: boolean;
  lockedNotice?: string;
  columns: StudioColumnDef[];
}

export const DATASET_METADATA: Record<DatasetKey, DatasetMetadata> = {
  students: {
    key: 'students',
    label: 'Élèves',
    description: 'Dossiers scolaires, niveaux, groupes, contacts et soldes MAD',
    canAddRow: true,
    canSyncBack: true,
    columns: [
      { key: 'code', label: 'Code élève', format: 'text', width: 120, visible: true, editable: false, lockedReason: 'Identifiant système généré', workflowHref: '/admin/students' },
      { key: 'firstName', label: 'Prénom', format: 'text', width: 130, visible: true, editable: true, required: true },
      { key: 'lastName', label: 'Nom', format: 'text', width: 140, visible: true, editable: true, required: true },
      { key: 'level', label: 'Niveau', format: 'select', width: 130, visible: true, editable: true, required: true, options: ['Tronc Commun', '1ère Bac', '2ème Bac', 'Sup MPSI'] },
      { key: 'groupNames', label: 'Groupes', format: 'relation', width: 190, visible: true, editable: true },
      { key: 'phone', label: 'Téléphone', format: 'phone', width: 145, visible: true, editable: true, sensitive: true },
      { key: 'siteName', label: 'Site', format: 'text', width: 140, visible: true, editable: true },
      { key: 'status', label: 'Statut', format: 'status', width: 110, visible: true, editable: true, options: ['actif', 'suspendu', 'archive'] },
      { key: 'balanceMad', label: 'Solde MAD', format: 'currency_mad', width: 120, visible: true, editable: false, lockedReason: 'Calculé depuis Encaissements/Échéances', workflowHref: '/admin/dues', sensitive: true },
      { key: 'discountPercent', label: 'Remise %', format: 'percent', width: 100, visible: true, editable: true },
      { key: 'enrolledAt', label: 'Date inscription', format: 'date', width: 130, visible: false, editable: true },
      { key: 'notes', label: 'Notes', format: 'text', width: 220, visible: false, editable: true },
    ],
  },
  guardians: {
    key: 'guardians',
    label: 'Responsables & Parents',
    description: 'Contacts familiaux, préférences de langue, WhatsApp et responsabilité financière',
    canAddRow: true,
    canSyncBack: true,
    columns: [
      { key: 'id', label: 'ID Fiche', format: 'text', width: 100, visible: true, editable: false, lockedReason: 'Clé technique', workflowHref: '/admin/guardians' },
      { key: 'firstName', label: 'Prénom', format: 'text', width: 130, visible: true, editable: true, required: true },
      { key: 'lastName', label: 'Nom', format: 'text', width: 140, visible: true, editable: true, required: true },
      { key: 'relation', label: 'Lien', format: 'select', width: 120, visible: true, editable: true, options: ['Mère', 'Père', 'Tuteur légal'] },
      { key: 'phone', label: 'Téléphone', format: 'phone', width: 145, visible: true, editable: true, required: true, sensitive: true },
      { key: 'email', label: 'Email', format: 'email', width: 190, visible: true, editable: true, sensitive: true },
      { key: 'preferredLang', label: 'Langue', format: 'select', width: 90, visible: true, editable: true, options: ['fr', 'ar'] },
      { key: 'isFinancialResponsible', label: 'Resp. financier', format: 'boolean', width: 120, visible: true, editable: true },
      { key: 'isRestricted', label: 'Contact restreint', format: 'boolean', width: 125, visible: true, editable: false, lockedReason: 'Nécessite motif obligatoire sur fiche parent', workflowHref: '/admin/guardians' },
    ],
  },
  teachers: {
    key: 'teachers',
    label: 'Professeurs',
    description: 'Équipe enseignante, matières, sites, taux indicatifs et statut',
    canAddRow: true,
    canSyncBack: true,
    columns: [
      { key: 'id', label: 'ID Prof', format: 'text', width: 100, visible: true, editable: false, lockedReason: 'Clé technique', workflowHref: '/admin/teachers' },
      { key: 'fullName', label: 'Nom complet', format: 'text', width: 180, visible: true, editable: true, required: true },
      { key: 'subjects', label: 'Matières', format: 'relation', width: 170, visible: true, editable: true },
      { key: 'phone', label: 'Téléphone', format: 'phone', width: 145, visible: true, editable: true, sensitive: true },
      { key: 'email', label: 'Email', format: 'email', width: 190, visible: true, editable: true, sensitive: true },
      { key: 'compType', label: 'Mode paie', format: 'select', width: 115, visible: true, editable: true, options: ['horaire', 'fixe', 'pourcentage'], sensitive: true },
      { key: 'rateValue', label: 'Taux indicatif', format: 'decimal', width: 120, visible: true, editable: true, sensitive: true },
      { key: 'estimatedPayMad', label: 'Paie est. MAD', format: 'currency_mad', width: 130, visible: true, editable: false, lockedReason: 'Calculé dans le module Paie', workflowHref: '/admin/payroll', sensitive: true },
      { key: 'status', label: 'Statut', format: 'status', width: 110, visible: true, editable: true, options: ['actif', 'conge', 'suspendu'] },
    ],
  },
  groups: {
    key: 'groups',
    label: 'Groupes',
    description: 'Classes, tarifs mensuels MAD, capacités et affectations',
    canAddRow: true,
    canSyncBack: true,
    columns: [
      { key: 'name', label: 'Nom groupe', format: 'text', width: 200, visible: true, editable: true, required: true },
      { key: 'subjectName', label: 'Matière', format: 'relation', width: 145, visible: true, editable: false, lockedReason: 'Entité Matière liée', workflowHref: '/admin/groups' },
      { key: 'level', label: 'Niveau', format: 'text', width: 120, visible: true, editable: true },
      { key: 'monthlyFeeMad', label: 'Tarif MAD/mois', format: 'currency_mad', width: 130, visible: true, editable: true, required: true },
      { key: 'capacity', label: 'Capacité', format: 'integer', width: 95, visible: true, editable: true, required: true },
      { key: 'enrolledCount', label: 'Inscrits', format: 'integer', width: 95, visible: true, editable: false, lockedReason: 'Compté via inscriptions actives', workflowHref: '/admin/enrollments' },
      { key: 'teacherName', label: 'Professeur', format: 'relation', width: 165, visible: true, editable: false, lockedReason: 'Géré dans /admin/groups', workflowHref: '/admin/groups' },
      { key: 'timeSlot', label: 'Créneau', format: 'text', width: 130, visible: true, editable: true },
      { key: 'status', label: 'Statut', format: 'status', width: 115, visible: true, editable: true, options: ['ouvert', 'complet', 'liste_attente', 'fermé'] },
    ],
  },
  enrollments: {
    key: 'enrollments',
    label: 'Inscriptions',
    description: 'Relations élève–groupe, remises, mensualités nettes et statuts',
    canAddRow: false,
    canSyncBack: true,
    columns: [
      { key: 'reference', label: 'Référence', format: 'text', width: 125, visible: true, editable: false, lockedReason: 'Référence d’inscription', workflowHref: '/admin/enrollments' },
      { key: 'studentName', label: 'Élève', format: 'relation', width: 160, visible: true, editable: false, lockedReason: 'Fiche élève liée', workflowHref: '/admin/students' },
      { key: 'groupName', label: 'Groupe', format: 'relation', width: 185, visible: true, editable: false, lockedReason: 'Transfert via /admin/enrollments', workflowHref: '/admin/enrollments' },
      { key: 'agreedFeeMad', label: 'Tarif brut MAD', format: 'currency_mad', width: 130, visible: true, editable: true },
      { key: 'discountPercent', label: 'Remise %', format: 'percent', width: 100, visible: true, editable: true },
      { key: 'netMonthlyMad', label: 'Net MAD', format: 'currency_mad', width: 120, visible: true, editable: false, lockedReason: 'Recalculé automatiquement', workflowHref: '/admin/enrollments' },
      { key: 'status', label: 'Statut', format: 'status', width: 120, visible: true, editable: false, lockedReason: 'Changement avec motif obligatoire', workflowHref: '/admin/enrollments' },
    ],
  },
  sessions: {
    key: 'sessions',
    label: 'Séances',
    description: 'Séances planifiées, horaires, salles et effectifs attendus',
    canAddRow: false,
    canSyncBack: true,
    columns: [
      { key: 'title', label: 'Séance', format: 'text', width: 200, visible: true, editable: true, required: true },
      { key: 'groupName', label: 'Groupe', format: 'relation', width: 170, visible: true, editable: false, lockedReason: 'Lié au groupe', workflowHref: '/admin/sessions' },
      { key: 'teacherName', label: 'Professeur', format: 'relation', width: 160, visible: true, editable: false, lockedReason: 'Arbitrage conflits requis', workflowHref: '/admin/calendar' },
      { key: 'roomName', label: 'Salle', format: 'relation', width: 130, visible: true, editable: false, lockedReason: 'Arbitrage salle requis', workflowHref: '/admin/calendar' },
      { key: 'dateISO', label: 'Date', format: 'date', width: 120, visible: true, editable: true, required: true },
      { key: 'startTime', label: 'Début', format: 'time', width: 90, visible: true, editable: true },
      { key: 'endTime', label: 'Fin', format: 'time', width: 90, visible: true, editable: true },
      { key: 'status', label: 'Statut', format: 'status', width: 115, visible: true, editable: true, options: ['planifiée', 'en_cours', 'terminée', 'annulée'] },
    ],
  },
  attendance: {
    key: 'attendance',
    label: 'Présences',
    description: 'Registre des appels et pointages (lecture / audit — corrections via motif officiel)',
    canAddRow: false,
    canSyncBack: false,
    lockedNotice: 'Les corrections de présence requièrent une justification obligatoire dans /admin/attendance.',
    columns: [
      { key: 'sessionTitle', label: 'Séance', format: 'relation', width: 185, visible: true, editable: false, lockedReason: 'Audit présence officiel', workflowHref: '/admin/attendance' },
      { key: 'studentName', label: 'Élève', format: 'relation', width: 160, visible: true, editable: false, lockedReason: 'Audit présence officiel', workflowHref: '/admin/attendance' },
      { key: 'groupName', label: 'Groupe', format: 'text', width: 160, visible: true, editable: false },
      { key: 'dateLabel', label: 'Date', format: 'text', width: 115, visible: true, editable: false },
      { key: 'status', label: 'Statut', format: 'status', width: 115, visible: true, editable: false, lockedReason: 'Utiliser /admin/attendance avec motif', workflowHref: '/admin/attendance' },
      { key: 'source', label: 'Source', format: 'text', width: 120, visible: true, editable: false },
      { key: 'checkInTime', label: 'Heure', format: 'time', width: 90, visible: true, editable: false },
    ],
  },
  payments: {
    key: 'payments',
    label: 'Paiements (notes non comptables)',
    description: 'Montants et statuts verrouillés ; seules les notes et références externes sont éditables',
    canAddRow: false,
    canSyncBack: true,
    lockedNotice: 'Les montants encaissés et statuts sont verrouillés : toute annulation doit passer par une contrepassation tracée dans /admin/payments.',
    columns: [
      { key: 'reference', label: 'Référence', format: 'text', width: 135, visible: true, editable: false, lockedReason: 'Écriture comptable verrouillée', workflowHref: '/admin/payments' },
      { key: 'studentName', label: 'Élève', format: 'relation', width: 155, visible: true, editable: false, sensitive: true },
      { key: 'dateISO', label: 'Date', format: 'date', width: 115, visible: true, editable: false, lockedReason: 'Date comptable figée', workflowHref: '/admin/payments' },
      { key: 'amountMad', label: 'Montant MAD', format: 'currency_mad', width: 125, visible: true, editable: false, lockedReason: 'Montant finalisé — utiliser contrepassation', workflowHref: '/admin/payments', sensitive: true },
      { key: 'method', label: 'Mode', format: 'text', width: 130, visible: true, editable: false },
      { key: 'status', label: 'Statut', format: 'status', width: 120, visible: true, editable: false, lockedReason: 'Utiliser contrepassation officielle', workflowHref: '/admin/payments' },
      { key: 'externalRef', label: 'Réf externe', format: 'text', width: 145, visible: true, editable: true },
      { key: 'reconciled', label: 'Rapproché', format: 'boolean', width: 105, visible: true, editable: false, lockedReason: 'Pointage dans /admin/payments', workflowHref: '/admin/payments' },
      { key: 'notes', label: 'Notes caisse', format: 'text', width: 220, visible: true, editable: true },
    ],
  },
  dues: {
    key: 'dues',
    label: 'Échéances',
    description: 'Suivi des échéances mensuelles, soldes et notes de relance',
    canAddRow: false,
    canSyncBack: true,
    columns: [
      { key: 'reference', label: 'Référence', format: 'text', width: 135, visible: true, editable: false, lockedReason: 'Clé échéance', workflowHref: '/admin/dues' },
      { key: 'studentName', label: 'Élève', format: 'relation', width: 155, visible: true, editable: false, sensitive: true },
      { key: 'periodLabel', label: 'Période', format: 'text', width: 130, visible: true, editable: false },
      { key: 'dueDateISO', label: 'Date échéance', format: 'date', width: 125, visible: true, editable: true },
      { key: 'amountMad', label: 'Total MAD', format: 'currency_mad', width: 115, visible: true, editable: false, lockedReason: 'Remise justifiée requise dans /admin/dues', workflowHref: '/admin/dues' },
      { key: 'remainingMad', label: 'Reste dû MAD', format: 'currency_mad', width: 125, visible: true, editable: false, lockedReason: 'Solde calculé', workflowHref: '/admin/dues', sensitive: true },
      { key: 'status', label: 'Statut', format: 'status', width: 115, visible: true, editable: false, workflowHref: '/admin/dues' },
      { key: 'notes', label: 'Notes suivi', format: 'text', width: 230, visible: true, editable: true },
    ],
  },
  expenses: {
    key: 'expenses',
    label: 'Dépenses',
    description: 'Charges fournisseurs, catégories et montants (hors archivées)',
    canAddRow: true,
    canSyncBack: true,
    columns: [
      { key: 'reference', label: 'Référence', format: 'text', width: 125, visible: true, editable: false, lockedReason: 'Référence dépense', workflowHref: '/admin/expenses' },
      { key: 'dateISO', label: 'Date', format: 'date', width: 120, visible: true, editable: true, required: true },
      { key: 'category', label: 'Catégorie', format: 'text', width: 190, visible: true, editable: true, required: true },
      { key: 'supplier', label: 'Fournisseur', format: 'text', width: 185, visible: true, editable: true, required: true },
      { key: 'amountMad', label: 'Montant MAD', format: 'currency_mad', width: 130, visible: true, editable: true, required: true, sensitive: true },
      { key: 'method', label: 'Mode', format: 'select', width: 135, visible: true, editable: true, options: ['Virement', 'Chèque', 'Espèces', 'TPE / Carte (démo)'] },
      { key: 'notes', label: 'Notes', format: 'text', width: 210, visible: true, editable: true },
    ],
  },
  payroll: {
    key: 'payroll',
    label: 'Paies professeurs (indicatives)',
    description: 'Fiches de rémunération indicatives ; les fiches clôturées sont strictement verrouillées',
    canAddRow: false,
    canSyncBack: false,
    lockedNotice: 'Paie indicative uniquement : modifiez les ajustements et clôtures directement dans /admin/payroll.',
    columns: [
      { key: 'periodLabel', label: 'Période', format: 'text', width: 130, visible: true, editable: false },
      { key: 'teacherName', label: 'Professeur', format: 'relation', width: 175, visible: true, editable: false, sensitive: true },
      { key: 'rateLabel', label: 'Formule', format: 'text', width: 185, visible: true, editable: false },
      { key: 'eligibleSessions', label: 'Séances', format: 'integer', width: 95, visible: true, editable: false },
      { key: 'baseAmountMad', label: 'Base MAD', format: 'currency_mad', width: 120, visible: true, editable: false },
      { key: 'adjustmentsMad', label: 'Ajust. MAD', format: 'currency_mad', width: 115, visible: true, editable: false, lockedReason: 'Géré dans /admin/payroll', workflowHref: '/admin/payroll' },
      { key: 'netPayableMad', label: 'Net ind. MAD', format: 'currency_mad', width: 130, visible: true, editable: false, sensitive: true },
      { key: 'locked', label: 'Clôturée', format: 'boolean', width: 95, visible: true, editable: false },
    ],
  },
  documents_meta: {
    key: 'documents_meta',
    label: 'Documents (métadonnées uniquement)',
    description: 'Index documentaire sans contenu binaire sensible',
    canAddRow: false,
    canSyncBack: false,
    columns: [
      { key: 'reference', label: 'Code pièce', format: 'text', width: 120, visible: true, editable: false },
      { key: 'title', label: 'Document', format: 'text', width: 220, visible: true, editable: false },
      { key: 'fileType', label: 'Format', format: 'text', width: 90, visible: true, editable: false },
      { key: 'groupName', label: 'Groupe lié', format: 'text', width: 180, visible: true, editable: false },
      { key: 'teacherName', label: 'Auteur / Prof', format: 'text', width: 155, visible: true, editable: false },
      { key: 'published', label: 'Publié', format: 'boolean', width: 95, visible: true, editable: false },
      { key: 'sizeKb', label: 'Taille (Ko)', format: 'integer', width: 105, visible: true, editable: false },
    ],
  },
  reports_summary: {
    key: 'reports_summary',
    label: 'Rapports synthétiques (démo)',
    description: 'Synthèse consolidée par domaine financier et pédagogique',
    canAddRow: false,
    canSyncBack: false,
    columns: [
      { key: 'metric', label: 'Indicateur', format: 'text', width: 230, visible: true, editable: false },
      { key: 'category', label: 'Domaine', format: 'text', width: 140, visible: true, editable: false },
      { key: 'valueMad', label: 'Valeur MAD', format: 'currency_mad', width: 140, visible: true, editable: false },
      { key: 'count', label: 'Volume', format: 'integer', width: 110, visible: true, editable: false },
      { key: 'note', label: 'Observation', format: 'text', width: 260, visible: true, editable: false },
    ],
  },
};

export function buildRowsFromCenterState(
  dataset: DatasetKey,
  sources: {
    students: StudentRecord[];
    guardians: GuardianRecord[];
    teachers: TeacherRecord[];
    groups: GroupRecord[];
    enrollments: EnrollmentRecord[];
    sessions: SessionRecord[];
    resources: ResourceMaterialRecord[];
    attendance: AttendanceRecord[];
    payments: PaymentRecord[];
    dues: DueRecord[];
    expenses: ExpenseRecord[];
    payroll: PayrollEntryRecord[];
  }
): StudioRow[] {
  switch (dataset) {
    case 'students':
      return sources.students.map((s) => ({
        id: s.id,
        code: s.code,
        firstName: s.firstName,
        lastName: s.lastName,
        level: s.level,
        groupNames: s.groupNames.join(', '),
        phone: s.phone,
        siteName: s.siteName,
        status: s.status,
        balanceMad: s.balanceMad,
        discountPercent: s.discountPercent,
        enrolledAt: s.enrolledAt,
        notes: s.notes,
      }));
    case 'guardians':
      return sources.guardians.map((g) => ({
        id: g.id,
        firstName: g.firstName,
        lastName: g.lastName,
        relation: g.relation,
        phone: g.phone,
        email: g.email,
        preferredLang: g.preferredLang,
        isFinancialResponsible: g.isFinancialResponsible,
        isRestricted: g.isRestricted,
      }));
    case 'teachers':
      return sources.teachers.map((t) => ({
        id: t.id,
        fullName: t.fullName,
        subjects: t.subjects.join(', '),
        phone: t.phone,
        email: t.email,
        compType: t.compType,
        rateValue: t.rateValue,
        estimatedPayMad: t.estimatedPayMad,
        status: t.status,
      }));
    case 'groups':
      return sources.groups.map((g) => ({
        id: g.id,
        name: g.name,
        subjectName: g.subjectName,
        level: g.level,
        monthlyFeeMad: g.monthlyFeeMad,
        capacity: g.capacity,
        enrolledCount: g.enrolledCount,
        teacherName: g.teacherName,
        timeSlot: g.timeSlot,
        status: g.status,
      }));
    case 'enrollments':
      return sources.enrollments.map((e) => ({
        id: e.id,
        reference: e.reference,
        studentName: e.studentName,
        groupName: e.groupName,
        agreedFeeMad: e.agreedFeeMad,
        discountPercent: e.discountPercent,
        netMonthlyMad: e.netMonthlyMad,
        status: e.status,
      }));
    case 'sessions':
      return sources.sessions.map((s) => ({
        id: s.id,
        title: s.title,
        groupName: s.groupName,
        teacherName: s.teacherName,
        roomName: s.roomName,
        dateISO: s.dateISO,
        startTime: s.startTime,
        endTime: s.endTime,
        status: s.status,
      }));
    case 'attendance':
      return sources.attendance.map((a) => ({
        id: a.id,
        _lockedRow: true,
        sessionTitle: a.sessionTitle,
        studentName: a.studentName,
        groupName: a.groupName,
        dateLabel: a.dateLabel,
        status: a.status,
        source: a.source,
        checkInTime: a.checkInTime ?? '',
      }));
    case 'payments':
      return sources.payments.map((p) => ({
        id: p.id,
        _lockedRow: p.status === 'contrepasse',
        reference: p.reference,
        studentName: p.studentName,
        dateISO: p.dateISO,
        amountMad: p.amountMad,
        method: p.method,
        status: p.status,
        externalRef: p.externalRef,
        reconciled: p.reconciled,
        notes: p.notes,
      }));
    case 'dues':
      return sources.dues.map((d) => ({
        id: d.id,
        reference: d.reference,
        studentName: d.studentName,
        periodLabel: d.periodLabel,
        dueDateISO: d.dueDateISO,
        amountMad: d.amountMad,
        remainingMad: d.remainingMad,
        status: d.status,
        notes: d.notes,
      }));
    case 'expenses':
      return sources.expenses.map((e) => ({
        id: e.id,
        _lockedRow: e.status === 'archivee',
        reference: e.reference,
        dateISO: e.dateISO,
        category: e.category,
        supplier: e.supplier,
        amountMad: e.amountMad,
        method: e.method,
        notes: e.notes,
      }));
    case 'payroll':
      return sources.payroll.map((p) => ({
        id: p.id,
        _lockedRow: true,
        periodLabel: p.periodLabel,
        teacherName: p.teacherName,
        rateLabel: p.rateLabel,
        eligibleSessions: p.eligibleSessions,
        baseAmountMad: p.baseAmountMad,
        adjustmentsMad: p.adjustmentsMad,
        netPayableMad: p.netPayableMad,
        locked: p.locked,
      }));
    case 'documents_meta':
      return sources.resources.map((r, i) => ({
        id: r.id,
        _lockedRow: true,
        reference: `DOC-${100 + i}`,
        title: r.title,
        fileType: r.fileType,
        groupName: r.groupName,
        teacherName: r.teacherName,
        published: r.published,
        sizeKb: r.sizeKb,
      }));
    case 'reports_summary': {
      const collected = sources.payments
        .filter((p) => p.status === 'encaisse' || p.status === 'partiel')
        .reduce((acc, p) => acc + p.amountMad, 0);
      const overdue = sources.dues.reduce((acc, d) => acc + d.remainingMad, 0);
      const expensesSum = sources.expenses
        .filter((e) => e.status !== 'archivee')
        .reduce((acc, e) => acc + e.amountMad, 0);
      const payrollSum = sources.payroll.reduce((acc, p) => acc + p.netPayableMad, 0);
      return [
        {
          id: 'rep-1',
          _lockedRow: true,
          metric: 'Encaissements actifs (Démo)',
          category: 'Finances',
          valueMad: collected,
          count: sources.payments.length,
          note: 'Hors contrepassations',
        },
        {
          id: 'rep-2',
          _lockedRow: true,
          metric: 'Impayés & restes à percevoir',
          category: 'Finances',
          valueMad: overdue,
          count: sources.dues.filter((d) => d.remainingMad > 0).length,
          note: 'Échéances ouvertes',
        },
        {
          id: 'rep-3',
          _lockedRow: true,
          metric: 'Charges & dépenses actives',
          category: 'Finances',
          valueMad: expensesSum,
          count: sources.expenses.length,
          note: 'Hors pièces archivées',
        },
        {
          id: 'rep-4',
          _lockedRow: true,
          metric: 'Paie professeurs indicative',
          category: 'RH / Paie',
          valueMad: payrollSum,
          count: sources.payroll.length,
          note: 'Simulation non contractuelle',
        },
      ];
    }
  }
}

const emailSchema = z.string().email();

export function validateStudioCell(
  col: StudioColumnDef,
  value: StudioCellValue
): string | null {
  const str = String(value ?? '').trim();

  if (col.required && str.length === 0) {
    return `${col.label} obligatoire`;
  }
  if (!str) return null;

  switch (col.format) {
    case 'integer': {
      const num = Number(str);
      if (!Number.isInteger(num) || num < 0) {
        return 'Entier >= 0 requis';
      }
      return null;
    }
    case 'decimal':
    case 'currency_mad': {
      const num = Number(str.replace(',', '.'));
      if (Number.isNaN(num) || num < 0) {
        return 'Nombre >= 0 requis';
      }
      return null;
    }
    case 'percent': {
      const num = Number(str.replace(',', '.'));
      if (Number.isNaN(num) || num < 0 || num > 100) {
        return 'Pourcentage entre 0 et 100';
      }
      return null;
    }
    case 'email': {
      if (!emailSchema.safeParse(str).success) {
        return 'Email invalide';
      }
      return null;
    }
    case 'phone': {
      const digits = str.replace(/[\s.-]/g, '');
      if (!/^(\+212|0)[5-7]\d{8}$/.test(digits)) {
        return 'Format Maroc attendu (06/07/+212...)';
      }
      return null;
    }
    case 'date': {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        return 'Format AAAA-MM-JJ requis';
      }
      return null;
    }
    case 'time': {
      if (!/^\d{2}:\d{2}$/.test(str)) {
        return 'Format HH:MM requis';
      }
      return null;
    }
    case 'select':
    case 'status': {
      if (col.options && col.options.length > 0 && !col.options.includes(str)) {
        return `Valeurs : ${col.options.join(', ')}`;
      }
      return null;
    }
    default:
      return null;
  }
}

export function validateStudioDataset(
  columns: StudioColumnDef[],
  rows: StudioRow[]
): CellValidationError[] {
  const errors: CellValidationError[] = [];
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    for (const col of columns) {
      if (!col.editable && !col.required) continue;
      const err = validateStudioCell(col, row[col.key]);
      if (err) {
        errors.push({
          rowId: row.id,
          rowIndex: i + 1,
          colKey: col.key,
          colLabel: col.label,
          message: err,
        });
      }
    }
  }
  return errors;
}

export function normalizeMoroccoPhone(raw: string): string {
  const cleaned = raw.replace(/[\s.-]/g, '').trim();
  if (/^0[5-7]\d{8}$/.test(cleaned)) {
    return `+212 ${cleaned.slice(1, 2)}${cleaned.slice(2, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  if (/^\+212[5-7]\d{8}$/.test(cleaned)) {
    return `+212 ${cleaned.slice(4, 5)}${cleaned.slice(5, 7)}-${cleaned.slice(7, 10)}-${cleaned.slice(10)}`;
  }
  if (/^212[5-7]\d{8}$/.test(cleaned)) {
    return `+212 ${cleaned.slice(3, 4)}${cleaned.slice(4, 6)}-${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
  }
  return raw.trim();
}

export function normalizeDateISO(raw: string): string {
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const slashMatch = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(trimmed);
  if (slashMatch) {
    const [, d, m, y] = slashMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return trimmed;
}

export function generateStressRows(
  baseRows: StudioRow[],
  targetCount: 100 | 1000 | 10000
): StudioRow[] {
  if (baseRows.length === 0) return [];
  const out: StudioRow[] = [];
  for (let i = 0; i < targetCount; i += 1) {
    const tpl = baseRows[i % baseRows.length];
    out.push({
      ...tpl,
      id: `${tpl.id}-bench-${i + 1}`,
      ...(tpl.code ? { code: `${tpl.code}-${String(i + 1).padStart(4, '0')}` } : {}),
      ...(tpl.reference
        ? { reference: `${tpl.reference}-${String(i + 1).padStart(4, '0')}` }
        : {}),
      ...(tpl.lastName ? { lastName: `${tpl.lastName} #${i + 1}` } : {}),
    });
  }
  return out;
}

export function computeColumnAggregate(
  rows: StudioRow[],
  colKey: string
): { count: number; numericCount: number; sum: number; avg: number; min: number; max: number } {
  let numericCount = 0;
  let sum = 0;
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  for (const row of rows) {
    const val = row[colKey];
    if (val === undefined || val === '' || typeof val === 'boolean') continue;
    const num = typeof val === 'number' ? val : Number(String(val).replace(',', '.'));
    if (!Number.isNaN(num)) {
      numericCount += 1;
      sum += num;
      if (num < min) min = num;
      if (num > max) max = num;
    }
  }

  return {
    count: rows.length,
    numericCount,
    sum: Math.round(sum * 100) / 100,
    avg: numericCount > 0 ? Math.round((sum / numericCount) * 100) / 100 : 0,
    min: numericCount > 0 ? min : 0,
    max: numericCount > 0 ? max : 0,
  };
}

export function downloadSpreadsheetXml(
  fileName: string,
  sheetName: string,
  headers: string[],
  rows: Array<Array<StudioCellValue>>
) {
  const escXml = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const safeSheet = escXml(sheetName.slice(0, 31) || 'Donnees');
  const headerXml = headers
    .map((h) => `<Cell><Data ss:Type="String">${escXml(h)}</Data></Cell>`)
    .join('');

  const bodyXml = rows
    .map((line) => {
      const cells = line
        .map((cell) => {
          if (typeof cell === 'number' && !Number.isNaN(cell)) {
            return `<Cell><Data ss:Type="Number">${cell}</Data></Cell>`;
          }
          const raw = String(cell ?? '');
          const clean =
            raw.trimStart().match(/^[=+\-@]/) ? `'${raw}` : raw;
          return `<Cell><Data ss:Type="String">${escXml(clean)}</Data></Cell>`;
        })
        .join('');
      return `<Row>${cells}</Row>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="${safeSheet}">
  <Table>
   <Row>${headerXml}</Row>
   ${bodyXml}
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], {
    type: 'application/vnd.ms-excel;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName.endsWith('.xls') ? fileName : `${fileName}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

export function formatExportCellValue(
  value: StudioCellValue,
  format: ColumnFormat,
  dateFormat: 'DD/MM/YYYY' | 'YYYY-MM-DD',
  decimalSeparator: ',' | '.'
): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';

  if (format === 'date' && typeof value === 'string' && dateFormat === 'DD/MM/YYYY') {
    const [y, m, d] = value.split('-');
    if (y && m && d) return `${d}/${m}/${y}`;
  }

  if (
    (format === 'currency_mad' || format === 'decimal' || format === 'percent') &&
    typeof value === 'number'
  ) {
    const fixed = value.toFixed(2);
    return decimalSeparator === ',' ? fixed.replace('.', ',') : fixed;
  }

  return String(value);
}

export function downloadExportCsvWithOptions(
  fileName: string,
  headers: string[],
  rows: Array<Array<string>>,
  separator: ';' | ','
) {
  const csv = [headers, ...rows]
    .map((line) => line.map(sanitizeCsvCell).join(separator))
    .join('\n');
  const blob = new Blob(['\ufeff' + csv], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export const PREDEFINED_EXPORT_TEMPLATES: Omit<ExportTemplateConfig, 'centerId'>[] = [
  {
    id: 'tpl-students-group',
    name: 'Liste élèves par groupe',
    dataset: 'students',
    predefined: true,
    separator: ';',
    dateFormat: 'DD/MM/YYYY',
    decimalSeparator: ',',
    includeTotals: false,
    columns: [
      { sourceKey: 'code', exportHeader: 'CodeEleve' },
      { sourceKey: 'firstName', exportHeader: 'Prenom' },
      { sourceKey: 'lastName', exportHeader: 'Nom' },
      { sourceKey: 'level', exportHeader: 'Niveau' },
      { sourceKey: 'groupNames', exportHeader: 'Groupes' },
      { sourceKey: 'status', exportHeader: 'Statut' },
    ],
  },
  {
    id: 'tpl-attendance-sheet',
    name: 'Feuilles d’appel & présences mensuelles',
    dataset: 'attendance',
    predefined: true,
    separator: ';',
    dateFormat: 'DD/MM/YYYY',
    decimalSeparator: ',',
    includeTotals: false,
    columns: [
      { sourceKey: 'dateLabel', exportHeader: 'Date' },
      { sourceKey: 'sessionTitle', exportHeader: 'Seance' },
      { sourceKey: 'groupName', exportHeader: 'Groupe' },
      { sourceKey: 'studentName', exportHeader: 'Eleve' },
      { sourceKey: 'status', exportHeader: 'StatutPresence' },
      { sourceKey: 'checkInTime', exportHeader: 'HeurePointage' },
    ],
  },
  {
    id: 'tpl-guardians-contacts',
    name: 'Contacts responsables (colonnes autorisées)',
    dataset: 'guardians',
    predefined: true,
    separator: ';',
    dateFormat: 'DD/MM/YYYY',
    decimalSeparator: ',',
    includeTotals: false,
    columns: [
      { sourceKey: 'firstName', exportHeader: 'Prenom' },
      { sourceKey: 'lastName', exportHeader: 'Nom' },
      { sourceKey: 'relation', exportHeader: 'Relation' },
      { sourceKey: 'phone', exportHeader: 'Telephone' },
      { sourceKey: 'preferredLang', exportHeader: 'Langue' },
      { sourceKey: 'isFinancialResponsible', exportHeader: 'ResponsableFinancier' },
    ],
  },
  {
    id: 'tpl-payments-ledger',
    name: 'Encaissements & rapprochement',
    dataset: 'payments',
    predefined: true,
    separator: ';',
    dateFormat: 'DD/MM/YYYY',
    decimalSeparator: ',',
    includeTotals: true,
    columns: [
      { sourceKey: 'reference', exportHeader: 'Reference' },
      { sourceKey: 'dateISO', exportHeader: 'Date' },
      { sourceKey: 'studentName', exportHeader: 'Eleve' },
      { sourceKey: 'amountMad', exportHeader: 'MontantMAD' },
      { sourceKey: 'method', exportHeader: 'ModeReglement' },
      { sourceKey: 'externalRef', exportHeader: 'RefExterne' },
      { sourceKey: 'reconciled', exportHeader: 'Rapproche' },
    ],
  },
  {
    id: 'tpl-dues-overdue',
    name: 'Échéances & impayés',
    dataset: 'dues',
    predefined: true,
    separator: ';',
    dateFormat: 'DD/MM/YYYY',
    decimalSeparator: ',',
    includeTotals: true,
    columns: [
      { sourceKey: 'reference', exportHeader: 'EcheanceRef' },
      { sourceKey: 'studentName', exportHeader: 'Eleve' },
      { sourceKey: 'periodLabel', exportHeader: 'Periode' },
      { sourceKey: 'dueDateISO', exportHeader: 'DateEcheance' },
      { sourceKey: 'amountMad', exportHeader: 'MontantInitialMAD' },
      { sourceKey: 'remainingMad', exportHeader: 'ResteDuMAD' },
      { sourceKey: 'status', exportHeader: 'Statut' },
    ],
  },
  {
    id: 'tpl-payroll-indicative',
    name: 'Rémunération professeurs (indicative)',
    dataset: 'payroll',
    predefined: true,
    separator: ';',
    dateFormat: 'DD/MM/YYYY',
    decimalSeparator: ',',
    includeTotals: true,
    columns: [
      { sourceKey: 'periodLabel', exportHeader: 'Periode' },
      { sourceKey: 'teacherName', exportHeader: 'Professeur' },
      { sourceKey: 'rateLabel', exportHeader: 'Formule' },
      { sourceKey: 'eligibleSessions', exportHeader: 'SeancesEligibles' },
      { sourceKey: 'netPayableMad', exportHeader: 'NetIndicatifMAD' },
    ],
  },
  {
    id: 'tpl-expenses-journal',
    name: 'Dépenses & charges mensuelles',
    dataset: 'expenses',
    predefined: true,
    separator: ';',
    dateFormat: 'DD/MM/YYYY',
    decimalSeparator: ',',
    includeTotals: true,
    columns: [
      { sourceKey: 'reference', exportHeader: 'Piece' },
      { sourceKey: 'dateISO', exportHeader: 'Date' },
      { sourceKey: 'category', exportHeader: 'Categorie' },
      { sourceKey: 'supplier', exportHeader: 'Fournisseur' },
      { sourceKey: 'amountMad', exportHeader: 'MontantMAD' },
      { sourceKey: 'method', exportHeader: 'Mode' },
    ],
  },
];
