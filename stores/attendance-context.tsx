'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import {
  INITIAL_ABSENCE_ALERTS,
  INITIAL_ATTENDANCE_RECORDS,
  INITIAL_QR_SCAN_LOGS,
} from '@/lib/mock-api/attendance-data';
import { INITIAL_SESSIONS } from '@/lib/mock-api/pedagogy-data';
import { INITIAL_STUDENTS } from '@/lib/mock-api/profiles-data';
import { useDemoSession } from '@/stores/demo-session-context';
import type {
  AbsenceAlertRecord,
  AttendanceRecord,
  AttendanceSource,
  AttendanceStatus,
  QrScanLogEntry,
  QrScanSimulationResult,
  QrValidationOutcome,
} from '@/types/attendance';

let attendanceSeq = 500;
function nextAttendanceId(prefix: string): string {
  attendanceSeq += 1;
  return `${prefix}-${attendanceSeq}`;
}

function getDemoTimeLabel(): string {
  return new Intl.DateTimeFormat('fr-MA', {
    timeZone: 'Africa/Casablanca',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());
}

interface UpdateAttendancePayload {
  status: AttendanceStatus;
  note?: string;
  justificationReason?: string;
  justificationDocName?: string;
  source?: AttendanceSource;
  actor: string;
}

interface SimulateQrScanPayload {
  sessionId: string;
  scannedInput: string;
  forceScenario?: QrValidationOutcome;
  actor: string;
  deviceLabel?: string;
}

interface AttendanceContextValue {
  records: AttendanceRecord[];
  qrLogs: QrScanLogEntry[];
  absenceAlerts: AbsenceAlertRecord[];
  updateAttendanceStatus: (id: string, payload: UpdateAttendancePayload) => void;
  bulkMarkAttendance: (
    ids: string[],
    status: AttendanceStatus,
    justificationReason: string | undefined,
    actor: string
  ) => void;
  simulateQrScan: (payload: SimulateQrScanPayload) => QrScanSimulationResult;
  closeSessionRollCall: (sessionId: string, actor: string) => number;
  updateAlertStatus: (
    alertId: string,
    status: AbsenceAlertRecord['status']
  ) => void;
}

const AttendanceContext = createContext<AttendanceContextValue | null>(null);

export function AttendanceProvider({ children }: { children: React.ReactNode }) {
  const { activeCenter } = useDemoSession();

  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>(
    INITIAL_ATTENDANCE_RECORDS
  );
  const [allQrLogs, setAllQrLogs] = useState<QrScanLogEntry[]>(
    INITIAL_QR_SCAN_LOGS
  );
  const [allAlerts, setAllAlerts] = useState<AbsenceAlertRecord[]>(
    INITIAL_ABSENCE_ALERTS
  );

  const records = useMemo(
    () => allRecords.filter((r) => r.centerId === activeCenter.id),
    [allRecords, activeCenter.id]
  );

  const qrLogs = useMemo(
    () => allQrLogs.filter((l) => l.centerId === activeCenter.id),
    [allQrLogs, activeCenter.id]
  );

  const absenceAlerts = useMemo(
    () => allAlerts.filter((a) => a.centerId === activeCenter.id),
    [allAlerts, activeCenter.id]
  );

  const updateAttendanceStatus = useCallback(
    (id: string, payload: UpdateAttendancePayload) => {
      const nowTime = getDemoTimeLabel();
      setAllRecords((prev) =>
        prev.map((rec) => {
          if (rec.id !== id) return rec;
          const nextCheckIn =
            payload.status === 'present' || payload.status === 'retard'
              ? rec.checkInTime === '—'
                ? nowTime
                : rec.checkInTime
              : '—';
          return {
            ...rec,
            status: payload.status,
            checkInTime: nextCheckIn,
            source: payload.source ?? 'saisie_admin',
            verificationMode:
              payload.source === 'qr_simule' ? 'scan_simule' : 'manuel',
            note: payload.note !== undefined ? payload.note : rec.note,
            justificationReason:
              payload.justificationReason ?? rec.justificationReason,
            justificationDocName:
              payload.justificationDocName ?? rec.justificationDocName,
            updatedBy: payload.actor,
            updatedAtLabel: `Aujourd'hui, ${nowTime}`,
          };
        })
      );
    },
    []
  );

  const bulkMarkAttendance = useCallback(
    (
      ids: string[],
      status: AttendanceStatus,
      justificationReason: string | undefined,
      actor: string
    ) => {
      const nowTime = getDemoTimeLabel();
      const targetSet = new Set(ids);
      setAllRecords((prev) =>
        prev.map((rec) => {
          if (!targetSet.has(rec.id)) return rec;
          return {
            ...rec,
            status,
            checkInTime:
              status === 'present' || status === 'retard'
                ? rec.checkInTime === '—'
                  ? nowTime
                  : rec.checkInTime
                : '—',
            source: 'saisie_admin',
            verificationMode: 'manuel',
            justificationReason:
              justificationReason ?? rec.justificationReason,
            updatedBy: actor,
            updatedAtLabel: `Aujourd'hui, ${nowTime}`,
          };
        })
      );
    },
    []
  );

  const simulateQrScan = useCallback(
    (payload: SimulateQrScanPayload): QrScanSimulationResult => {
      const nowTime = getDemoTimeLabel();
      const centerSessions = INITIAL_SESSIONS.filter(
        (s) => s.centerId === activeCenter.id
      );
      const session =
        centerSessions.find((s) => s.id === payload.sessionId) ??
        centerSessions[0];
      const sessionTitle = session?.title ?? 'Séance en cours';

      const normalizedCode = payload.scannedInput.trim().toUpperCase();
      const centerStudents = INITIAL_STUDENTS.filter(
        (st) => st.centerId === activeCenter.id
      );

      const matchedStudent = centerStudents.find(
        (st) =>
          normalizedCode.includes(st.code.toUpperCase()) ||
          normalizedCode.includes(st.id.toUpperCase()) ||
          `${st.firstName} ${st.lastName}`
            .toUpperCase()
            .includes(normalizedCode)
      );

      const sessionRecords = allRecords.filter(
        (r) => r.centerId === activeCenter.id && r.sessionId === payload.sessionId
      );

      let outcome: QrValidationOutcome = payload.forceScenario ?? 'present';
      let targetRecord = matchedStudent
        ? sessionRecords.find((r) => r.studentId === matchedStudent.id)
        : sessionRecords.find((r) => r.status === 'non_pointe') ??
          sessionRecords[0];

      if (!payload.forceScenario) {
        if (normalizedCode.includes('EXPIRED')) {
          outcome = 'qr_expire';
        } else if (normalizedCode.includes('OUT')) {
          outcome = 'hors_creneau';
        } else if (normalizedCode.includes('NET')) {
          outcome = 'erreur_reseau';
        } else if (!matchedStudent) {
          outcome = 'eleve_non_inscrit';
        } else if (!targetRecord) {
          outcome = 'mauvaise_seance';
        } else if (
          targetRecord.status === 'present' ||
          targetRecord.status === 'retard'
        ) {
          outcome = 'deja_enregistre';
        } else {
          outcome = 'present';
        }
      } else {
        if (outcome === 'present') {
          targetRecord =
            sessionRecords.find((r) => r.status === 'non_pointe') ??
            sessionRecords[0];
        } else if (outcome === 'deja_enregistre') {
          targetRecord =
            sessionRecords.find(
              (r) => r.status === 'present' || r.status === 'retard'
            ) ?? sessionRecords[0];
        }
      }

      const studentName =
        outcome === 'eleve_non_inscrit' && !matchedStudent
          ? normalizedCode || 'Code inconnu'
          : (matchedStudent
              ? `${matchedStudent.firstName} ${matchedStudent.lastName}`
              : targetRecord?.studentName) ?? 'Élève démo';

      const studentCode =
        matchedStudent?.code ??
        targetRecord?.studentCode ??
        (normalizedCode || 'QR-INCONNU');

      let title = 'Pointage enregistré (démo)';
      let message = `${studentName} marqué(e) présent(e) à ${nowTime} en simulation locale.`;

      if (outcome === 'deja_enregistre') {
        title = 'QR déjà scanné';
        message = `${studentName} déjà pointé(e) (${targetRecord?.checkInTime ?? nowTime}). Aucun double comptage appliqué.`;
      } else if (outcome === 'mauvaise_seance') {
        title = 'Mauvaise séance';
        message = `${studentName} n'est pas attendu(e) sur ce créneau (${session?.groupName ?? 'groupe'}).`;
      } else if (outcome === 'eleve_non_inscrit') {
        title = 'Élève non inscrit';
        message = `Identifiant ${studentCode} introuvable dans la liste active du centre.`;
      } else if (outcome === 'qr_expire') {
        title = 'QR expiré';
        message = `Jeton expiré (> 120 s simulées). Demandez un rafraîchissement de carte ou passez à l'appel manuel.`;
      } else if (outcome === 'hors_creneau') {
        title = 'Scan hors créneau';
        message = `Tolérance horaire dépassée pour cette séance (${session?.startTime ?? '—'}). Correction manuelle requise.`;
      } else if (outcome === 'erreur_reseau') {
        title = 'Erreur réseau simulée';
        message = `Validation serveur impossible (hors ligne démo). Basculez vers l'appel manuel temporaire.`;
      }

      if (outcome === 'present' && targetRecord) {
        const recordIdToUpdate = targetRecord.id;
        setAllRecords((prev) =>
          prev.map((rec) =>
            rec.id === recordIdToUpdate
              ? {
                  ...rec,
                  status: 'present',
                  checkInTime: nowTime,
                  source: 'qr_simule',
                  verificationMode: 'scan_simule',
                  note: 'Validé par scanner QR (simulation locale).',
                  updatedBy: payload.actor,
                  updatedAtLabel: `Aujourd'hui, ${nowTime}`,
                }
              : rec
          )
        );
      }

      const logEntry: QrScanLogEntry = {
        id: nextAttendanceId('qr-log'),
        centerId: activeCenter.id,
        sessionId: payload.sessionId,
        sessionTitle,
        teacherName: session?.teacherName ?? payload.actor,
        studentId: matchedStudent?.id ?? targetRecord?.studentId,
        studentCode,
        studentName,
        scannedAtLabel: `Aujourd'hui, ${nowTime}`,
        outcome,
        message,
        duplicateDetected: outcome === 'deja_enregistre',
        verificationLabel:
          outcome === 'present'
            ? 'Scan simulé (validation serveur requise en prod)'
            : 'Rejet / anomalie simulé côté UI',
        deviceLabel: payload.deviceLabel ?? 'Scanner Web Démo',
        handledBy: payload.actor,
      };

      setAllQrLogs((prev) => [logEntry, ...prev]);

      return {
        outcome,
        title,
        message,
        studentName,
        studentCode,
        recordId: targetRecord?.id,
        logEntry,
      };
    },
    [activeCenter.id, allRecords]
  );

  const closeSessionRollCall = useCallback(
    (sessionId: string, actor: string) => {
      const nowTime = getDemoTimeLabel();
      let converted = 0;
      setAllRecords((prev) =>
        prev.map((rec) => {
          if (
            rec.centerId === activeCenter.id &&
            rec.sessionId === sessionId &&
            rec.status === 'non_pointe'
          ) {
            converted += 1;
            return {
              ...rec,
              status: 'absent',
              source: 'appel_manuel',
              verificationMode: 'manuel',
              note: "Marqué absent automatiquement à la clôture de l'appel.",
              updatedBy: actor,
              updatedAtLabel: `Aujourd'hui, ${nowTime}`,
            };
          }
          return rec;
        })
      );
      return converted;
    },
    [activeCenter.id]
  );

  const updateAlertStatus = useCallback(
    (alertId: string, status: AbsenceAlertRecord['status']) => {
      setAllAlerts((prev) =>
        prev.map((al) => (al.id === alertId ? { ...al, status } : al))
      );
    },
    []
  );

  const value = useMemo<AttendanceContextValue>(
    () => ({
      records,
      qrLogs,
      absenceAlerts,
      updateAttendanceStatus,
      bulkMarkAttendance,
      simulateQrScan,
      closeSessionRollCall,
      updateAlertStatus,
    }),
    [
      records,
      qrLogs,
      absenceAlerts,
      updateAttendanceStatus,
      bulkMarkAttendance,
      simulateQrScan,
      closeSessionRollCall,
      updateAlertStatus,
    ]
  );

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendanceStore() {
  const ctx = useContext(AttendanceContext);
  if (!ctx) {
    throw new Error(
      'useAttendanceStore must be used inside AttendanceProvider'
    );
  }
  return ctx;
}
