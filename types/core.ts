export type RoleId =
  | 'super_admin'
  | 'director'
  | 'secretary'
  | 'accountant'
  | 'teacher'
  | 'student'
  | 'parent';

export type PlanTier = 'Essentiel' | 'Plus' | 'Tout-en-un' | 'Sur mesure';

export type ModuleKey =
  // Base
  | 'students'
  | 'guardians'
  | 'teachers'
  | 'staff'
  | 'subjects'
  | 'groups'
  | 'enrollments'
  | 'sessions'
  | 'locations'
  // Présences
  | 'attendance.manual'
  | 'attendance.qr'
  | 'attendance.alerts'
  | 'attendance.analytics'
  | 'attendance.justifications'
  // Parents
  | 'parent.portal'
  | 'parent.messaging'
  | 'parent.appointments'
  | 'parent.consent'
  | 'parent.feedback'
  // Communication
  | 'messaging.inapp'
  | 'messaging.email'
  | 'messaging.sms'
  | 'messaging.whatsapp'
  | 'messaging.templates'
  | 'messaging.campaigns'
  | 'messaging.automations'
  // Finance
  | 'billing'
  | 'dues'
  | 'payment.reminders'
  | 'receipts'
  | 'refunds'
  | 'expenses'
  | 'payroll'
  | 'accounting.exports'
  // Documents
  | 'documents.students'
  | 'documents.teachers'
  | 'documents.parents'
  | 'documents.templates'
  | 'documents.requests'
  | 'documents.expiryAlerts'
  // Données
  | 'dataStudio'
  | 'imports'
  | 'exports'
  | 'customReports'
  | 'audit'
  // Calendrier
  | 'calendar.internal'
  | 'calendar.google'
  | 'calendar.ics'
  | 'calendar.appointments'
  // Qualité
  | 'feedback'
  | 'surveys'
  | 'supportTickets'
  | 'analytics.feedback'
  // Marque
  | 'whiteLabel'
  | 'customDomainPreview'
  | 'notifications'
  | 'maps';

export type ModuleGroup =
  | 'Base'
  | 'Présences'
  | 'Parents'
  | 'Communication'
  | 'Finance'
  | 'Documents'
  | 'Données'
  | 'Calendrier'
  | 'Qualité'
  | 'Marque';

export interface ModuleDefinition {
  key: ModuleKey;
  name: string;
  description: string;
  group: ModuleGroup;
  defaultEnabled: boolean;
  planRequirement: PlanTier;
  dependencies: ModuleKey[];
  rolesAllowed: RoleId[];
  uiRoutes: string[];
  status: 'disponible' | 'bêta' | 'planifié';
}

export interface CenterLocation {
  id: string;
  name: string;
  city: string;
  address: string;
  roomsCount: number;
}

export interface CenterBranding {
  displayName: string;
  shortCode: string;
  subdomain: string;
  accentColor: string;
}

export interface CenterMetrics {
  activeStudents: number;
  newEnrollmentsMonth: number;
  todaySessionsCount: number;
  attendanceRatePercent: number;
  absencesToday: number;
  collectedRevenueMad: number;
  pendingReceivablesMad: number;
  overdueAmountMad: number;
  estimatedPayrollMad: number;
}

export interface DemoSessionSlot {
  id: string;
  title: string;
  subject: string;
  groupName: string;
  teacherName: string;
  roomName: string;
  siteName: string;
  startTime: string;
  endTime: string;
  expectedStudents: number;
  presentStudents: number;
  status: 'planifiée' | 'en_cours' | 'terminée';
}

export interface DemoPaymentRecord {
  id: string;
  reference: string;
  studentName: string;
  groupName: string;
  amountMad: number;
  method: 'Espèces' | 'Virement' | 'Chèque' | 'Carte (guichet)';
  dateLabel: string;
  status: 'encaissé' | 'partiel';
}

export interface CenterInstance {
  id: string;
  name: string;
  city: string;
  plan: PlanTier;
  status: 'actif' | 'essai' | 'suspendu';
  timezone: 'Africa/Casablanca';
  currency: 'MAD';
  localeDefault: 'fr' | 'ar';
  branding: CenterBranding;
  locations: CenterLocation[];
  enabledModules: ModuleKey[];
  metrics: CenterMetrics;
  todaySessions: DemoSessionSlot[];
  recentPayments: DemoPaymentRecord[];
}

export interface DemoUser {
  id: string;
  role: RoleId;
  roleLabel: string;
  fullName: string;
  email: string;
  initials: string;
  description: string;
  defaultRoute: string;
  canSwitchCenter: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  timeLabel: string;
  read: boolean;
  href: string;
  requiredModule?: ModuleKey;
}

export interface NavItem {
  id: string;
  label: string;
  href: string;
  iconName: string;
  requiredModule?: ModuleKey;
  roles: RoleId[];
  implementedInLot?: number;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}
