export type SubjectStatus = 'active' | 'archivée';

export interface SubjectRecord {
  id: string;
  centerId: string;
  code: string;
  name: string;
  color: string;
  description: string;
  levels: string[];
  defaultTeacherIds: string[];
  status: SubjectStatus;
}

export type GroupStatus = 'ouvert' | 'complet' | 'liste_attente' | 'fermé';

export interface GroupRecord {
  id: string;
  centerId: string;
  name: string;
  subjectId: string;
  subjectName: string;
  level: string;
  monthlyFeeMad: number;
  capacity: number;
  enrolledCount: number;
  waitlistStudentIds: string[];
  teacherId: string;
  teacherName: string;
  siteId: string;
  siteName: string;
  roomId: string;
  roomName: string;
  days: string[];
  timeSlot: string;
  periodLabel: string;
  status: GroupStatus;
}

export type EnrollmentStatus = 'active' | 'suspendue' | 'liste_attente' | 'annulée';

export interface EnrollmentRecord {
  id: string;
  centerId: string;
  reference: string;
  studentId: string;
  studentName: string;
  groupId: string;
  groupName: string;
  periodLabel: string;
  status: EnrollmentStatus;
  agreedFeeMad: number;
  discountPercent: number;
  netMonthlyMad: number;
  installmentsCount: number;
  source: 'Accueil' | 'En ligne (démo)' | 'Réinscription' | 'Recommandation';
  createdAtLabel: string;
  reason?: string;
}

export interface SiteDetailRecord {
  id: string;
  centerId: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  openingHours: string;
  lat: number;
  lng: number;
  geocodeStatus: 'ok' | 'erreur_simulee';
}

export interface RoomRecord {
  id: string;
  centerId: string;
  siteId: string;
  siteName: string;
  name: string;
  floor: string;
  capacity: number;
  equipment: string[];
  status: 'disponible' | 'maintenance';
}

export type SessionStatus = 'planifiée' | 'en_cours' | 'terminée' | 'annulée';

export interface SessionRecord {
  id: string;
  centerId: string;
  title: string;
  subjectId: string;
  subjectName: string;
  groupId: string;
  groupName: string;
  teacherId: string;
  teacherName: string;
  siteId: string;
  siteName: string;
  roomId: string;
  roomName: string;
  dateISO: string;
  dateLabel: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  capacity: number;
  expectedStudents: number;
  presentStudents: number;
  status: SessionStatus;
  recurrenceId?: string;
  resourceIds: string[];
  notes: string;
}

export type ResourceVisibility = 'eleves_groupe' | 'professeurs' | 'parents_eleves';

export interface ResourceMaterialRecord {
  id: string;
  centerId: string;
  title: string;
  fileName: string;
  fileType: 'PDF' | 'DOCX' | 'PPTX' | 'IMAGE' | 'LIEN';
  sizeKb: number;
  subjectId: string;
  subjectName: string;
  groupId: string;
  groupName: string;
  teacherName: string;
  folder: string;
  tags: string[];
  visibility: ResourceVisibility;
  published: boolean;
  updatedAtLabel: string;
  objectUrl?: string;
}

export type CalendarAdminEventType = 'administratif' | 'ferie' | 'absence_prof';

export interface CalendarAdminEvent {
  id: string;
  centerId: string;
  title: string;
  eventType: CalendarAdminEventType;
  siteName: string;
  dateISO: string;
  startTime: string;
  endTime: string;
  notes: string;
}

