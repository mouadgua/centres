export type StudentStatus = 'actif' | 'suspendu' | 'archive';

export interface StudentRecord {
  id: string;
  centerId: string;
  code: string;
  firstName: string;
  lastName: string;
  initials: string;
  level: string;
  groupNames: string[];
  guardianIds: string[];
  phone: string;
  siteName: string;
  status: StudentStatus;
  balanceMad: number;
  attendanceRatePercent: number;
  lastAttendanceLabel: string;
  enrolledAt: string;
  discountPercent: number;
  notes: string;
}

export interface GuardianConsentMatrix {
  whatsapp: boolean;
  email: boolean;
  sms: boolean;
  absence: boolean;
  late: boolean;
  payment: boolean;
  documents: boolean;
  announcements: boolean;
}

export interface GuardianConsentEvent {
  id: string;
  dateLabel: string;
  actor: string;
  detail: string;
}

export interface GuardianRecord {
  id: string;
  centerId: string;
  firstName: string;
  lastName: string;
  relation: 'Mère' | 'Père' | 'Tuteur légal';
  studentIds: string[];
  phone: string;
  whatsappPhone: string;
  email: string;
  preferredLang: 'fr' | 'ar';
  isPrimary: boolean;
  isFinancialResponsible: boolean;
  isEmergencyContact: boolean;
  isRestricted: boolean;
  restrictedReason?: string;
  quietHours: string;
  consents: GuardianConsentMatrix;
  internalNotes: string;
  consentHistory: GuardianConsentEvent[];
}

export interface TeacherRecord {
  id: string;
  centerId: string;
  fullName: string;
  initials: string;
  email: string;
  phone: string;
  subjects: string[];
  groups: string[];
  sites: string[];
  availabilitySummary: string;
  compType: 'horaire' | 'fixe' | 'pourcentage';
  rateValue: number;
  plannedSessionsMonth: number;
  completedSessionsMonth: number;
  estimatedPayMad: number;
  status: 'actif' | 'conge' | 'suspendu';
}

export interface StaffMemberRecord {
  id: string;
  centerId: string;
  fullName: string;
  email: string;
  role: 'director' | 'secretary' | 'accountant' | 'coordinator';
  roleLabel: string;
  sitesScope: string;
  mfaEnabled: boolean;
  status: 'actif' | 'suspendu';
  lastLogin: string;
}

export interface PermissionMatrixEntry {
  moduleId: string;
  moduleLabel: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  archive: boolean;
  exportData: boolean;
  validateFinance: boolean;
}
