export type AttendanceStatus =
  | 'present'
  | 'absent'
  | 'retard'
  | 'excuse'
  | 'non_pointe';

export type AttendanceSource =
  | 'qr_simule'
  | 'appel_manuel'
  | 'saisie_admin'
  | 'non_pointe';

export type QrValidationOutcome =
  | 'present'
  | 'deja_enregistre'
  | 'mauvaise_seance'
  | 'eleve_non_inscrit'
  | 'qr_expire'
  | 'hors_creneau'
  | 'erreur_reseau';

export interface AttendanceRecord {
  id: string;
  centerId: string;
  sessionId: string;
  sessionTitle: string;
  dateISO: string;
  dateLabel: string;
  timeSlot: string;
  groupId: string;
  groupName: string;
  siteName: string;
  roomName: string;
  teacherId: string;
  teacherName: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  studentInitials: string;
  status: AttendanceStatus;
  checkInTime: string;
  source: AttendanceSource;
  verificationMode: 'scan_simule' | 'manuel' | 'non_verifie_serveur';
  note: string;
  justificationReason?: string;
  justificationDocName?: string;
  updatedBy: string;
  updatedAtLabel: string;
}

export interface QrScanLogEntry {
  id: string;
  centerId: string;
  sessionId: string;
  sessionTitle: string;
  teacherName: string;
  studentId?: string;
  studentCode: string;
  studentName: string;
  scannedAtLabel: string;
  outcome: QrValidationOutcome;
  message: string;
  duplicateDetected: boolean;
  verificationLabel: string;
  deviceLabel: string;
  handledBy: string;
}

export interface AbsenceAlertRecord {
  id: string;
  centerId: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  groupName: string;
  consecutiveAbsences: number;
  totalMonthAbsences: number;
  lastSessionDate: string;
  guardianName: string;
  guardianEligible: boolean;
  status: 'a_traiter' | 'parent_prevenu_demo' | 'justifie';
}

export interface QrScanSimulationResult {
  outcome: QrValidationOutcome;
  title: string;
  message: string;
  studentName: string;
  studentCode: string;
  recordId?: string;
  logEntry: QrScanLogEntry;
}
