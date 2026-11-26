'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  DEFAULT_PERMISSION_MATRIX,
  INITIAL_GUARDIANS,
  INITIAL_STAFF_MEMBERS,
  INITIAL_STUDENTS,
  INITIAL_TEACHERS,
} from '@/lib/mock-api/profiles-data';
import { useDemoSession } from '@/stores/demo-session-context';
import type {
  GuardianRecord,
  PermissionMatrixEntry,
  StaffMemberRecord,
  StudentRecord,
  StudentStatus,
  TeacherRecord,
} from '@/types/profiles';

interface ProfilesContextValue {
  students: StudentRecord[];
  guardians: GuardianRecord[];
  teachers: TeacherRecord[];
  staffMembers: StaffMemberRecord[];
  permissionMatrix: Record<StaffMemberRecord['role'], PermissionMatrixEntry[]>;

  addStudent: (student: StudentRecord) => void;
  updateStudent: (id: string, patch: Partial<StudentRecord>) => void;
  bulkUpdateStudentsStatus: (ids: string[], status: StudentStatus) => void;
  bulkAssignStudentsGroup: (ids: string[], groupName: string) => void;

  addGuardian: (guardian: GuardianRecord) => void;
  updateGuardian: (id: string, patch: Partial<GuardianRecord>) => void;
  linkStudentToGuardian: (guardianId: string, studentId: string) => void;
  unlinkStudentFromGuardian: (guardianId: string, studentId: string) => void;
  mergeGuardians: (keepId: string, removeId: string) => void;

  addTeacher: (teacher: TeacherRecord) => void;
  updateTeacher: (id: string, patch: Partial<TeacherRecord>) => void;

  addStaffMember: (member: StaffMemberRecord) => void;
  updateStaffMember: (id: string, patch: Partial<StaffMemberRecord>) => void;
  togglePermissionCell: (
    role: StaffMemberRecord['role'],
    moduleId: string,
    field: keyof Omit<PermissionMatrixEntry, 'moduleId' | 'moduleLabel'>
  ) => void;
}

const ProfilesContext = createContext<ProfilesContextValue | null>(null);

export function ProfilesProvider({ children }: { children: React.ReactNode }) {
  const { activeCenter } = useDemoSession();
  const [allStudents, setAllStudents] = useState<StudentRecord[]>(INITIAL_STUDENTS);
  const [allGuardians, setAllGuardians] = useState<GuardianRecord[]>(INITIAL_GUARDIANS);
  const [allTeachers, setAllTeachers] = useState<TeacherRecord[]>(INITIAL_TEACHERS);
  const [allStaff, setAllStaff] = useState<StaffMemberRecord[]>(INITIAL_STAFF_MEMBERS);
  const [permissionMatrix, setPermissionMatrix] = useState(
    DEFAULT_PERMISSION_MATRIX
  );

  // Scope visible lists cleanly to active center (custom centers fallback to empty or created records)
  const students = useMemo(
    () => allStudents.filter((s) => s.centerId === activeCenter.id),
    [allStudents, activeCenter.id]
  );
  const guardians = useMemo(
    () => allGuardians.filter((g) => g.centerId === activeCenter.id),
    [allGuardians, activeCenter.id]
  );
  const teachers = useMemo(
    () => allTeachers.filter((t) => t.centerId === activeCenter.id),
    [allTeachers, activeCenter.id]
  );
  const staffMembers = useMemo(
    () =>
      allStaff.filter(
        (m) =>
          m.centerId === activeCenter.id ||
          (activeCenter.id !== 'center-complet' && m.role === 'director')
      ),
    [allStaff, activeCenter.id]
  );

  const addStudent = useCallback((student: StudentRecord) => {
    setAllStudents((prev) => [student, ...prev]);
    if (student.guardianIds.length > 0) {
      setAllGuardians((prev) =>
        prev.map((g) =>
          student.guardianIds.includes(g.id) &&
          !g.studentIds.includes(student.id)
            ? { ...g, studentIds: [...g.studentIds, student.id] }
            : g
        )
      );
    }
  }, []);

  const updateStudent = useCallback(
    (id: string, patch: Partial<StudentRecord>) => {
      setAllStudents((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
      );
    },
    []
  );

  const bulkUpdateStudentsStatus = useCallback(
    (ids: string[], status: StudentStatus) => {
      const setIds = new Set(ids);
      setAllStudents((prev) =>
        prev.map((s) => (setIds.has(s.id) ? { ...s, status } : s))
      );
    },
    []
  );

  const bulkAssignStudentsGroup = useCallback(
    (ids: string[], groupName: string) => {
      const setIds = new Set(ids);
      setAllStudents((prev) =>
        prev.map((s) =>
          setIds.has(s.id) && !s.groupNames.includes(groupName)
            ? { ...s, groupNames: [...s.groupNames, groupName] }
            : s
        )
      );
    },
    []
  );

  const addGuardian = useCallback((guardian: GuardianRecord) => {
    setAllGuardians((prev) => [guardian, ...prev]);
  }, []);

  const updateGuardian = useCallback(
    (id: string, patch: Partial<GuardianRecord>) => {
      setAllGuardians((prev) =>
        prev.map((g) => (g.id === id ? { ...g, ...patch } : g))
      );
    },
    []
  );

  const linkStudentToGuardian = useCallback(
    (guardianId: string, studentId: string) => {
      setAllGuardians((prev) =>
        prev.map((g) =>
          g.id === guardianId && !g.studentIds.includes(studentId)
            ? { ...g, studentIds: [...g.studentIds, studentId] }
            : g
        )
      );
      setAllStudents((prev) =>
        prev.map((s) =>
          s.id === studentId && !s.guardianIds.includes(guardianId)
            ? { ...s, guardianIds: [...s.guardianIds, guardianId] }
            : s
        )
      );
    },
    []
  );

  const unlinkStudentFromGuardian = useCallback(
    (guardianId: string, studentId: string) => {
      setAllGuardians((prev) =>
        prev.map((g) =>
          g.id === guardianId
            ? { ...g, studentIds: g.studentIds.filter((id) => id !== studentId) }
            : g
        )
      );
      setAllStudents((prev) =>
        prev.map((s) =>
          s.id === studentId
            ? {
                ...s,
                guardianIds: s.guardianIds.filter((id) => id !== guardianId),
              }
            : s
        )
      );
    },
    []
  );

  const mergeGuardians = useCallback((keepId: string, removeId: string) => {
    setAllGuardians((prev) => {
      const keep = prev.find((g) => g.id === keepId);
      const rem = prev.find((g) => g.id === removeId);
      if (!keep || !rem) return prev;
      const mergedStudents = Array.from(
        new Set([...keep.studentIds, ...rem.studentIds])
      );
      return prev
        .filter((g) => g.id !== removeId)
        .map((g) =>
          g.id === keepId
            ? {
                ...g,
                studentIds: mergedStudents,
                consentHistory: [
                  {
                    id: `ch-${Date.now()}`,
                    dateLabel: "Aujourd'hui",
                    actor: 'Administration (démo)',
                    detail: `Fusionné avec la fiche ${rem.firstName} ${rem.lastName}`,
                  },
                  ...g.consentHistory,
                ],
              }
            : g
        );
    });
    setAllStudents((prev) =>
      prev.map((s) => ({
        ...s,
        guardianIds: s.guardianIds.includes(removeId)
          ? Array.from(
              new Set([
                ...s.guardianIds.filter((id) => id !== removeId),
                keepId,
              ])
            )
          : s.guardianIds,
      }))
    );
  }, []);

  const addTeacher = useCallback((teacher: TeacherRecord) => {
    setAllTeachers((prev) => [teacher, ...prev]);
  }, []);

  const updateTeacher = useCallback(
    (id: string, patch: Partial<TeacherRecord>) => {
      setAllTeachers((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...patch } : t))
      );
    },
    []
  );

  const addStaffMember = useCallback((member: StaffMemberRecord) => {
    setAllStaff((prev) => [member, ...prev]);
  }, []);

  const updateStaffMember = useCallback(
    (id: string, patch: Partial<StaffMemberRecord>) => {
      setAllStaff((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...patch } : m))
      );
    },
    []
  );

  const togglePermissionCell = useCallback(
    (
      role: StaffMemberRecord['role'],
      moduleId: string,
      field: keyof Omit<PermissionMatrixEntry, 'moduleId' | 'moduleLabel'>
    ) => {
      setPermissionMatrix((prev) => ({
        ...prev,
        [role]: prev[role].map((row) =>
          row.moduleId === moduleId ? { ...row, [field]: !row[field] } : row
        ),
      }));
    },
    []
  );

  const value = useMemo<ProfilesContextValue>(
    () => ({
      students,
      guardians,
      teachers,
      staffMembers,
      permissionMatrix,
      addStudent,
      updateStudent,
      bulkUpdateStudentsStatus,
      bulkAssignStudentsGroup,
      addGuardian,
      updateGuardian,
      linkStudentToGuardian,
      unlinkStudentFromGuardian,
      mergeGuardians,
      addTeacher,
      updateTeacher,
      addStaffMember,
      updateStaffMember,
      togglePermissionCell,
    }),
    [
      students,
      guardians,
      teachers,
      staffMembers,
      permissionMatrix,
      addStudent,
      updateStudent,
      bulkUpdateStudentsStatus,
      bulkAssignStudentsGroup,
      addGuardian,
      updateGuardian,
      linkStudentToGuardian,
      unlinkStudentFromGuardian,
      mergeGuardians,
      addTeacher,
      updateTeacher,
      addStaffMember,
      updateStaffMember,
      togglePermissionCell,
    ]
  );

  return (
    <ProfilesContext.Provider value={value}>
      {children}
    </ProfilesContext.Provider>
  );
}

export function useProfilesStore() {
  const ctx = useContext(ProfilesContext);
  if (!ctx) {
    throw new Error('useProfilesStore must be used inside ProfilesProvider');
  }
  return ctx;
}
