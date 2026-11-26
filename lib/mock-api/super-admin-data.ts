import type { ModuleKey, PlanTier } from '@/types/core';

export interface SaasStaffUser {
  id: string;
  fullName: string;
  email: string;
  role: 'Owner SaaS' | 'Ops Plateforme' | 'Support N2' | 'Facturation';
  mfaEnabled: boolean;
  lastActive: string;
  status: 'actif' | 'suspendu';
}

export interface SaasSubscriptionRow {
  id: string;
  centerId: string;
  centerName: string;
  plan: PlanTier;
  monthlyPriceMad: number;
  billingCycle: 'Mensuel' | 'Annuel';
  nextRenewal: string;
  status: 'actif' | 'essai' | 'impaye';
}

export interface SaasInvoiceRow {
  id: string;
  reference: string;
  centerName: string;
  period: string;
  amountMad: number;
  issuedAt: string;
  status: 'payee' | 'en_attente' | 'en_retard';
}

export interface SaasSupportTicket {
  id: string;
  code: string;
  centerName: string;
  subject: string;
  category: 'Configuration' | 'Facturation' | 'Module' | 'Signalement';
  priority: 'normale' | 'haute' | 'critique';
  status: 'ouvert' | 'en_cours' | 'resolu';
  updatedAt: string;
  messages: {
    id: string;
    author: string;
    role: 'centre' | 'support';
    body: string;
    time: string;
  }[];
}

export interface SaasIncident {
  id: string;
  title: string;
  scope: string;
  severity: 'mineur' | 'majeur';
  status: 'en_cours' | 'surveille' | 'resolu';
  startedAt: string;
  summary: string;
}

export interface SaasAuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  detail: string;
}

export interface CenterOnboardingProgress {
  id: string;
  centerName: string;
  directorEmail: string;
  plan: PlanTier;
  completedSteps: number;
  totalSteps: number;
  invitationStatus: 'acceptee' | 'en_attente' | 'expiree';
  lastUpdated: string;
}

export const PLAN_PRICING_MAD: Record<
  PlanTier,
  {
    monthlyMad: number;
    audience: string;
    studentsLimit: string;
    sitesLimit: string;
    description: string;
  }
> = {
  Essentiel: {
    monthlyMad: 490,
    audience: 'Pour centres en démarrage',
    studentsLimit: 'Jusqu’à 200 élèves',
    sitesLimit: '1 site',
    description:
      'Socle pédagogique, appel manuel, encaissements en MAD et calendrier interne.',
  },
  Plus: {
    monthlyMad: 990,
    audience: 'Pour centres en croissance',
    studentsLimit: 'Jusqu’à 600 élèves',
    sitesLimit: 'Jusqu’à 3 sites',
    description:
      'Ajoute le scan QR démo, les contacts familles, les relances, les documents et la marque blanche.',
  },
  'Tout-en-un': {
    monthlyMad: 1790,
    audience: 'Pour réseaux & grands campus',
    studentsLimit: 'Illimité (démo)',
    sitesLimit: 'Multi-sites illimités',
    description:
      'Inclut le Studio de données tableur, la paie professeurs, le portail parent et les automatisations.',
  },
  'Sur mesure': {
    monthlyMad: 2490,
    audience: 'Pour groupes multi-villes',
    studentsLimit: 'Sur contrat',
    sitesLimit: 'Multi-régions',
    description:
      'Activation granulaire par module, accompagnement dédié et exports comptables sur cahier des charges.',
  },
};

export const PRESET_MODULES: Record<Exclude<PlanTier, 'Sur mesure'>, ModuleKey[]> = {
  Essentiel: [
    'students',
    'guardians',
    'teachers',
    'staff',
    'subjects',
    'groups',
    'enrollments',
    'sessions',
    'locations',
    'attendance.manual',
    'messaging.inapp',
    'billing',
    'dues',
    'receipts',
    'exports',
    'calendar.internal',
    'supportTickets',
    'notifications',
  ],
  Plus: [
    'students',
    'guardians',
    'teachers',
    'staff',
    'subjects',
    'groups',
    'enrollments',
    'sessions',
    'locations',
    'attendance.manual',
    'attendance.qr',
    'attendance.alerts',
    'attendance.analytics',
    'attendance.justifications',
    'parent.messaging',
    'parent.consent',
    'messaging.inapp',
    'messaging.email',
    'messaging.whatsapp',
    'messaging.templates',
    'billing',
    'dues',
    'payment.reminders',
    'receipts',
    'refunds',
    'expenses',
    'documents.students',
    'documents.teachers',
    'documents.requests',
    'imports',
    'exports',
    'calendar.internal',
    'calendar.ics',
    'feedback',
    'supportTickets',
    'whiteLabel',
    'notifications',
  ],
  'Tout-en-un': [
    'students',
    'guardians',
    'teachers',
    'staff',
    'subjects',
    'groups',
    'enrollments',
    'sessions',
    'locations',
    'attendance.manual',
    'attendance.qr',
    'attendance.alerts',
    'attendance.analytics',
    'attendance.justifications',
    'parent.portal',
    'parent.messaging',
    'parent.appointments',
    'parent.consent',
    'parent.feedback',
    'messaging.inapp',
    'messaging.email',
    'messaging.sms',
    'messaging.whatsapp',
    'messaging.templates',
    'messaging.campaigns',
    'messaging.automations',
    'billing',
    'dues',
    'payment.reminders',
    'receipts',
    'refunds',
    'expenses',
    'payroll',
    'accounting.exports',
    'documents.students',
    'documents.teachers',
    'documents.parents',
    'documents.templates',
    'documents.requests',
    'documents.expiryAlerts',
    'dataStudio',
    'imports',
    'exports',
    'customReports',
    'audit',
    'calendar.internal',
    'calendar.google',
    'calendar.ics',
    'calendar.appointments',
    'feedback',
    'surveys',
    'supportTickets',
    'analytics.feedback',
    'whiteLabel',
    'customDomainPreview',
    'notifications',
    'maps',
  ],
};

export const INITIAL_SAAS_STAFF: SaasStaffUser[] = [
  {
    id: 'stf-1',
    fullName: 'Mehdi Benjelloun',
    email: 'plateforme@markazflow.demo',
    role: 'Owner SaaS',
    mfaEnabled: true,
    lastActive: "Aujourd'hui, 11:20",
    status: 'actif',
  },
  {
    id: 'stf-2',
    fullName: 'Nawal Tazi',
    email: 'ops@markazflow.demo',
    role: 'Ops Plateforme',
    mfaEnabled: true,
    lastActive: "Aujourd'hui, 09:45",
    status: 'actif',
  },
  {
    id: 'stf-3',
    fullName: 'Sami El Fassi',
    email: 'support@markazflow.demo',
    role: 'Support N2',
    mfaEnabled: false,
    lastActive: 'Hier, 18:10',
    status: 'actif',
  },
];

export const INITIAL_SAAS_SUBSCRIPTIONS: SaasSubscriptionRow[] = [
  {
    id: 'sub-1',
    centerId: 'center-essentiel',
    centerName: 'Al-Noor Soutien',
    plan: 'Essentiel',
    monthlyPriceMad: 490,
    billingCycle: 'Mensuel',
    nextRenewal: '01 déc. 2026',
    status: 'actif',
  },
  {
    id: 'sub-2',
    centerId: 'center-plus',
    centerName: 'Académie Atlas',
    plan: 'Plus',
    monthlyPriceMad: 990,
    billingCycle: 'Mensuel',
    nextRenewal: '05 déc. 2026',
    status: 'actif',
  },
  {
    id: 'sub-3',
    centerId: 'center-complet',
    centerName: 'Campus Horizon',
    plan: 'Tout-en-un',
    monthlyPriceMad: 1790,
    billingCycle: 'Annuel',
    nextRenewal: '15 janv. 2027',
    status: 'actif',
  },
];

export const INITIAL_SAAS_INVOICES: SaasInvoiceRow[] = [
  {
    id: 'inv-1',
    reference: 'MF-2026-1101',
    centerName: 'Al-Noor Soutien',
    period: 'Novembre 2026',
    amountMad: 490,
    issuedAt: '01 nov. 2026',
    status: 'payee',
  },
  {
    id: 'inv-2',
    reference: 'MF-2026-1102',
    centerName: 'Académie Atlas',
    period: 'Novembre 2026',
    amountMad: 990,
    issuedAt: '05 nov. 2026',
    status: 'payee',
  },
  {
    id: 'inv-3',
    reference: 'MF-2026-1103',
    centerName: 'Campus Horizon',
    period: 'Novembre 2026',
    amountMad: 1790,
    issuedAt: '15 nov. 2026',
    status: 'en_attente',
  },
];

export const INITIAL_SUPPORT_TICKETS: SaasSupportTicket[] = [
  {
    id: 'tkt-1',
    code: 'SUP-408',
    centerName: 'Académie Atlas',
    subject: 'Activation du module Studio de données pour notre comptable',
    category: 'Module',
    priority: 'haute',
    status: 'en_cours',
    updatedAt: 'Il y a 2 h',
    messages: [
      {
        id: 'm1',
        author: 'Direction Académie Atlas',
        role: 'centre',
        body: 'Bonjour, nous souhaitons évaluer le Studio de données et les exports comptables sur notre instance.',
        time: '09:15',
      },
      {
        id: 'm2',
        author: 'Sami El Fassi (Support)',
        role: 'support',
        body: 'Demande prise en compte en démonstration. La bascule vers le plan Tout-en-un active ces deux capacités.',
        time: '10:05',
      },
    ],
  },
  {
    id: 'tkt-2',
    code: 'SUP-407',
    centerName: 'Al-Noor Soutien',
    subject: 'Question sur la connexion Google Calendar',
    category: 'Configuration',
    priority: 'normale',
    status: 'ouvert',
    updatedAt: 'Hier',
    messages: [
      {
        id: 'm3',
        author: 'Direction Al-Noor Soutien',
        role: 'centre',
        body: 'Le bouton Connecter Google Calendar est grisé dans notre prototype.',
        time: 'Hier, 16:40',
      },
    ],
  },
];

export const INITIAL_INCIDENTS: SaasIncident[] = [
  {
    id: 'inc-1',
    title: 'Connecteur OAuth Google Calendar non déployé (prototype frontend)',
    scope: 'Intégrations Calendrier',
    severity: 'mineur',
    status: 'surveille',
    startedAt: '25 nov. 2026',
    summary:
      'En mode frontend uniquement, les flux OAuth externes et envois SMS/WhatsApp restent désactivés par conception.',
  },
];

export const INITIAL_AUDIT_LOGS: SaasAuditEntry[] = [
  {
    id: 'aud-1',
    timestamp: '2026-11-26 10:15',
    actor: 'Mehdi Benjelloun',
    action: 'Configuration instance',
    target: 'Campus Horizon',
    detail: 'Preset Tout-en-un appliqué (57 modules actifs)',
  },
  {
    id: 'aud-2',
    timestamp: '2026-11-25 17:40',
    actor: 'Nawal Tazi',
    action: 'Activation centre',
    target: 'Académie Atlas',
    detail: 'Passage en statut Actif · Plan Plus',
  },
  {
    id: 'aud-3',
    timestamp: '2026-11-25 14:05',
    actor: 'Mehdi Benjelloun',
    action: 'Invitation onboarding',
    target: 'Al-Noor Soutien',
    detail: 'Lien d’onboarding démo généré pour direction@alnoor.demo',
  },
];

export const INITIAL_ONBOARDING_PROGRESS: CenterOnboardingProgress[] = [
  {
    id: 'onb-1',
    centerName: 'Al-Noor Soutien',
    directorEmail: 'direction@alnoor.demo',
    plan: 'Essentiel',
    completedSteps: 11,
    totalSteps: 11,
    invitationStatus: 'acceptee',
    lastUpdated: '24 nov. 2026',
  },
  {
    id: 'onb-2',
    centerName: 'Académie Atlas',
    directorEmail: 'direction@atlas.demo',
    plan: 'Plus',
    completedSteps: 13,
    totalSteps: 15,
    invitationStatus: 'acceptee',
    lastUpdated: "Aujourd'hui, 08:30",
  },
  {
    id: 'onb-3',
    centerName: 'Institut Ibn Khaldoun (Brouillon)',
    directorEmail: 'contact@ibnkhaldoun.demo',
    plan: 'Tout-en-un',
    completedSteps: 4,
    totalSteps: 17,
    invitationStatus: 'en_attente',
    lastUpdated: 'Hier, 19:10',
  },
];
