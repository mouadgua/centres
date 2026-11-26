'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  INITIAL_CALENDAR_ADMIN_EVENTS,
  INITIAL_ENROLLMENTS,
  INITIAL_GROUPS,
  INITIAL_RESOURCES,
  INITIAL_ROOMS,
  INITIAL_SESSIONS,
  INITIAL_SITES,
  INITIAL_SUBJECTS,
} from '@/lib/mock-api/pedagogy-data';
import { useDemoSession } from '@/stores/demo-session-context';
import type {
  CalendarAdminEvent,
  EnrollmentRecord,
  GroupRecord,
  ResourceMaterialRecord,
  RoomRecord,
  SessionRecord,
  SiteDetailRecord,
  SubjectRecord,
} from '@/types/pedagogy';

interface PedagogyContextValue {
  subjects: SubjectRecord[];
  groups: GroupRecord[];
  enrollments: EnrollmentRecord[];
  sites: SiteDetailRecord[];
  rooms: RoomRecord[];
  sessions: SessionRecord[];
  resources: ResourceMaterialRecord[];
  adminEvents: CalendarAdminEvent[];

  addSubject: (subject: SubjectRecord) => void;
  updateSubject: (id: string, patch: Partial<SubjectRecord>) => void;

  addGroup: (group: GroupRecord) => void;
  updateGroup: (id: string, patch: Partial<GroupRecord>) => void;
  closeGroupAndReassign: (sourceGroupId: string, targetGroupId: string) => void;

  addEnrollment: (enrollment: EnrollmentRecord) => void;
  updateEnrollment: (id: string, patch: Partial<EnrollmentRecord>) => void;
  transferEnrollment: (enrollmentId: string, targetGroupId: string, targetGroupName: string) => void;

  addSite: (site: SiteDetailRecord) => void;
  updateSite: (id: string, patch: Partial<SiteDetailRecord>) => void;
  addRoom: (room: RoomRecord) => void;
  updateRoom: (id: string, patch: Partial<RoomRecord>) => void;

  addSession: (session: SessionRecord) => void;
  addSessionsBatch: (sessionsList: SessionRecord[]) => void;
  updateSession: (
    id: string,
    patch: Partial<SessionRecord>,
    scope?: 'single' | 'future'
  ) => void;
  deleteSession: (id: string) => void;

  addResource: (resource: ResourceMaterialRecord) => void;
  updateResource: (id: string, patch: Partial<ResourceMaterialRecord>) => void;
  deleteResource: (id: string) => void;

  addAdminEvent: (event: CalendarAdminEvent) => void;
  deleteAdminEvent: (id: string) => void;
}

const PedagogyContext = createContext<PedagogyContextValue | null>(null);

export function PedagogyProvider({ children }: { children: React.ReactNode }) {
  const { activeCenter } = useDemoSession();

  const [allSubjects, setAllSubjects] = useState<SubjectRecord[]>(INITIAL_SUBJECTS);
  const [allGroups, setAllGroups] = useState<GroupRecord[]>(INITIAL_GROUPS);
  const [allEnrollments, setAllEnrollments] = useState<EnrollmentRecord[]>(INITIAL_ENROLLMENTS);
  const [allSites, setAllSites] = useState<SiteDetailRecord[]>(INITIAL_SITES);
  const [allRooms, setAllRooms] = useState<RoomRecord[]>(INITIAL_ROOMS);
  const [allSessions, setAllSessions] = useState<SessionRecord[]>(INITIAL_SESSIONS);
  const [allResources, setAllResources] = useState<ResourceMaterialRecord[]>(INITIAL_RESOURCES);
  const [allAdminEvents, setAllAdminEvents] = useState<CalendarAdminEvent[]>(
    INITIAL_CALENDAR_ADMIN_EVENTS
  );

  const subjects = useMemo(
    () => allSubjects.filter((s) => s.centerId === activeCenter.id),
    [allSubjects, activeCenter.id]
  );
  const groups = useMemo(
    () => allGroups.filter((g) => g.centerId === activeCenter.id),
    [allGroups, activeCenter.id]
  );
  const enrollments = useMemo(
    () => allEnrollments.filter((e) => e.centerId === activeCenter.id),
    [allEnrollments, activeCenter.id]
  );
  const sites = useMemo(
    () => allSites.filter((s) => s.centerId === activeCenter.id),
    [allSites, activeCenter.id]
  );
  const rooms = useMemo(
    () => allRooms.filter((r) => r.centerId === activeCenter.id),
    [allRooms, activeCenter.id]
  );
  const sessions = useMemo(
    () => allSessions.filter((s) => s.centerId === activeCenter.id),
    [allSessions, activeCenter.id]
  );
  const resources = useMemo(
    () => allResources.filter((r) => r.centerId === activeCenter.id),
    [allResources, activeCenter.id]
  );
  const adminEvents = useMemo(
    () => allAdminEvents.filter((e) => e.centerId === activeCenter.id),
    [allAdminEvents, activeCenter.id]
  );

  const addSubject = useCallback((subject: SubjectRecord) => {
    setAllSubjects((prev) => [subject, ...prev]);
  }, []);

  const updateSubject = useCallback((id: string, patch: Partial<SubjectRecord>) => {
    setAllSubjects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  }, []);

  const addGroup = useCallback((group: GroupRecord) => {
    setAllGroups((prev) => [group, ...prev]);
  }, []);

  const updateGroup = useCallback((id: string, patch: Partial<GroupRecord>) => {
    setAllGroups((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...patch } : g))
    );
  }, []);

  const closeGroupAndReassign = useCallback(
    (sourceGroupId: string, targetGroupId: string) => {
      const target = allGroups.find((g) => g.id === targetGroupId);
      const source = allGroups.find((g) => g.id === sourceGroupId);
      if (!source || !target) return;

      const movedCount = allEnrollments.filter(
        (e) => e.groupId === sourceGroupId && e.status === 'active'
      ).length;

      setAllGroups((prev) =>
        prev.map((g) => {
          if (g.id === sourceGroupId) {
            return { ...g, status: 'fermé', enrolledCount: 0 };
          }
          if (g.id === targetGroupId) {
            const nextCount = Math.min(g.capacity, g.enrolledCount + movedCount);
            return {
              ...g,
              enrolledCount: nextCount,
              status: nextCount >= g.capacity ? 'complet' : g.status,
            };
          }
          return g;
        })
      );

      setAllEnrollments((prev) =>
        prev.map((e) =>
          e.groupId === sourceGroupId && e.status === 'active'
            ? { ...e, groupId: target.id, groupName: target.name }
            : e
        )
      );
    },
    [allGroups, allEnrollments]
  );

  const addEnrollment = useCallback((enrollment: EnrollmentRecord) => {
    setAllEnrollments((prev) => [enrollment, ...prev]);
    if (enrollment.status === 'active') {
      setAllGroups((prev) =>
        prev.map((g) => {
          if (g.id !== enrollment.groupId) return g;
          const next = g.enrolledCount + 1;
          return {
            ...g,
            enrolledCount: next,
            status: next >= g.capacity ? 'complet' : g.status,
          };
        })
      );
    } else if (enrollment.status === 'liste_attente') {
      setAllGroups((prev) =>
        prev.map((g) =>
          g.id === enrollment.groupId &&
          !g.waitlistStudentIds.includes(enrollment.studentId)
            ? {
                ...g,
                waitlistStudentIds: [
                  ...g.waitlistStudentIds,
                  enrollment.studentId,
                ],
              }
            : g
        )
      );
    }
  }, []);

  const updateEnrollment = useCallback(
    (id: string, patch: Partial<EnrollmentRecord>) => {
      setAllEnrollments((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...patch } : e))
      );
    },
    []
  );

  const transferEnrollment = useCallback(
    (enrollmentId: string, targetGroupId: string, targetGroupName: string) => {
      const current = allEnrollments.find((e) => e.id === enrollmentId);
      if (!current) return;
      const oldGroupId = current.groupId;
      setAllEnrollments((prev) =>
        prev.map((e) =>
          e.id === enrollmentId
            ? { ...e, groupId: targetGroupId, groupName: targetGroupName }
            : e
        )
      );
      if (current.status === 'active') {
        setAllGroups((prev) =>
          prev.map((g) => {
            if (g.id === oldGroupId) {
              const dec = Math.max(0, g.enrolledCount - 1);
              return {
                ...g,
                enrolledCount: dec,
                status: g.status === 'complet' && dec < g.capacity ? 'ouvert' : g.status,
              };
            }
            if (g.id === targetGroupId) {
              const inc = g.enrolledCount + 1;
              return {
                ...g,
                enrolledCount: inc,
                status: inc >= g.capacity ? 'complet' : g.status,
              };
            }
            return g;
          })
        );
      }
    },
    [allEnrollments]
  );

  const addSite = useCallback((site: SiteDetailRecord) => {
    setAllSites((prev) => [site, ...prev]);
  }, []);

  const updateSite = useCallback(
    (id: string, patch: Partial<SiteDetailRecord>) => {
      setAllSites((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
      );
    },
    []
  );

  const addRoom = useCallback((room: RoomRecord) => {
    setAllRooms((prev) => [room, ...prev]);
  }, []);

  const updateRoom = useCallback((id: string, patch: Partial<RoomRecord>) => {
    setAllRooms((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
  }, []);

  const addSession = useCallback((session: SessionRecord) => {
    setAllSessions((prev) => [session, ...prev]);
  }, []);

  const addSessionsBatch = useCallback((sessionsList: SessionRecord[]) => {
    setAllSessions((prev) => [...sessionsList, ...prev]);
  }, []);

  const updateSession = useCallback(
    (
      id: string,
      patch: Partial<SessionRecord>,
      scope: 'single' | 'future' = 'single'
    ) => {
      setAllSessions((prev) => {
        const target = prev.find((s) => s.id === id);
        if (!target) return prev;
        if (scope === 'future' && target.recurrenceId) {
          return prev.map((s) =>
            s.recurrenceId === target.recurrenceId &&
            s.dateISO >= target.dateISO
              ? { ...s, ...patch }
              : s
          );
        }
        return prev.map((s) => (s.id === id ? { ...s, ...patch } : s));
      });
    },
    []
  );

  const deleteSession = useCallback((id: string) => {
    setAllSessions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const addResource = useCallback((resource: ResourceMaterialRecord) => {
    setAllResources((prev) => [resource, ...prev]);
  }, []);

  const updateResource = useCallback(
    (id: string, patch: Partial<ResourceMaterialRecord>) => {
      setAllResources((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
      );
    },
    []
  );

  const deleteResource = useCallback((id: string) => {
    setAllResources((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const addAdminEvent = useCallback((event: CalendarAdminEvent) => {
    setAllAdminEvents((prev) => [event, ...prev]);
  }, []);

  const deleteAdminEvent = useCallback((id: string) => {
    setAllAdminEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const value = useMemo<PedagogyContextValue>(
    () => ({
      subjects,
      groups,
      enrollments,
      sites,
      rooms,
      sessions,
      resources,
      adminEvents,
      addSubject,
      updateSubject,
      addGroup,
      updateGroup,
      closeGroupAndReassign,
      addEnrollment,
      updateEnrollment,
      transferEnrollment,
      addSite,
      updateSite,
      addRoom,
      updateRoom,
      addSession,
      addSessionsBatch,
      updateSession,
      deleteSession,
      addResource,
      updateResource,
      deleteResource,
      addAdminEvent,
      deleteAdminEvent,
    }),
    [
      subjects,
      groups,
      enrollments,
      sites,
      rooms,
      sessions,
      resources,
      adminEvents,
      addSubject,
      updateSubject,
      addGroup,
      updateGroup,
      closeGroupAndReassign,
      addEnrollment,
      updateEnrollment,
      transferEnrollment,
      addSite,
      updateSite,
      addRoom,
      updateRoom,
      addSession,
      addSessionsBatch,
      updateSession,
      deleteSession,
      addResource,
      updateResource,
      deleteResource,
      addAdminEvent,
      deleteAdminEvent,
    ]
  );

  return (
    <PedagogyContext.Provider value={value}>
      {children}
    </PedagogyContext.Provider>
  );
}

export function usePedagogyStore() {
  const ctx = useContext(PedagogyContext);
  if (!ctx) {
    throw new Error('usePedagogyStore must be used inside PedagogyProvider');
  }
  return ctx;
}
