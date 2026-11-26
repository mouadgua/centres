'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from 'react';
import {
  DEMO_CENTERS,
  DEMO_USERS,
  INITIAL_NOTIFICATIONS,
} from '@/lib/mock-api/demo-data';
import type {
  CenterInstance,
  DemoUser,
  ModuleKey,
  NotificationItem,
  PlanTier,
  RoleId,
} from '@/types/core';

interface CenterMetaOverride {
  status?: CenterInstance['status'];
  plan?: PlanTier;
  accentColor?: string;
}

interface DemoSessionState {
  activeRole: RoleId;
  activeCenterId: string;
  reducedMotion: boolean;
  sidebarCollapsed: boolean;
  sidebarHidden: boolean;
  notifications: NotificationItem[];
  centerOverrides: Record<string, ModuleKey[]>;
  centerMetaOverrides: Record<string, CenterMetaOverride>;
  customCenters: CenterInstance[];
}

const STORAGE_KEY = 'markazflow_demo_session_v1';

const DEFAULT_STATE: DemoSessionState = {
  activeRole: 'director',
  activeCenterId: 'center-complet',
  reducedMotion: false,
  sidebarCollapsed: false,
  sidebarHidden: false,
  notifications: INITIAL_NOTIFICATIONS,
  centerOverrides: {},
  centerMetaOverrides: {},
  customCenters: [],
};

let clientStateCache: DemoSessionState = DEFAULT_STATE;
let hasLoadedFromStorage = false;
const listeners = new Set<() => void>();

function loadInitialClientState(): DemoSessionState {
  if (hasLoadedFromStorage || typeof window === 'undefined') {
    return clientStateCache;
  }
  hasLoadedFromStorage = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<DemoSessionState>;
      const customCenters = Array.isArray(parsed.customCenters)
        ? parsed.customCenters
        : [];
      const allKnownIds = new Set([
        ...DEMO_CENTERS.map((c) => c.id),
        ...customCenters.map((c) => c.id),
      ]);
      clientStateCache = {
        ...DEFAULT_STATE,
        activeRole:
          parsed.activeRole && DEMO_USERS[parsed.activeRole]
            ? parsed.activeRole
            : DEFAULT_STATE.activeRole,
        activeCenterId:
          parsed.activeCenterId && allKnownIds.has(parsed.activeCenterId)
            ? parsed.activeCenterId
            : DEFAULT_STATE.activeCenterId,
        reducedMotion: Boolean(parsed.reducedMotion),
        sidebarCollapsed: Boolean(parsed.sidebarCollapsed),
        sidebarHidden: Boolean(parsed.sidebarHidden),
        centerOverrides: parsed.centerOverrides ?? {},
        centerMetaOverrides: parsed.centerMetaOverrides ?? {},
        customCenters,
      };
    }
  } catch {
    clientStateCache = DEFAULT_STATE;
  }
  return clientStateCache;
}

function updateClientState(updater: (prev: DemoSessionState) => DemoSessionState) {
  const next = updater(loadInitialClientState());
  clientStateCache = next;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage quota errors
    }
  }
  listeners.forEach((l) => l());
}

function subscribeStore(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getClientSnapshot(): DemoSessionState {
  return loadInitialClientState();
}

function getServerSnapshot(): DemoSessionState {
  return DEFAULT_STATE;
}

interface DemoSessionContextValue {
  activeRole: RoleId;
  activeUser: DemoUser;
  activeCenter: CenterInstance;
  centers: CenterInstance[];
  reducedMotion: boolean;
  sidebarCollapsed: boolean;
  sidebarHidden: boolean;
  notifications: NotificationItem[];
  unreadCount: number;
  switchRole: (role: RoleId) => void;
  switchCenter: (centerId: string) => void;
  setReducedMotion: (value: boolean) => void;
  setSidebarCollapsed: (value: boolean) => void;
  setSidebarHidden: (value: boolean) => void;
  markAllNotificationsRead: () => void;
  markNotificationRead: (id: string) => void;
  toggleNotificationRead: (id: string) => void;
  deleteNotification: (id: string) => void;
  addNotification: (item: NotificationItem) => void;
  restoreNotifications: (items: NotificationItem[]) => void;
  toggleCenterModule: (centerId: string, moduleKey: ModuleKey) => void;
  setCenterModules: (
    centerId: string,
    modules: ModuleKey[],
    plan?: PlanTier
  ) => void;
  updateCenterMeta: (centerId: string, patch: CenterMetaOverride) => void;
  createDemoCenter: (center: CenterInstance) => void;
  resetDemo: () => void;
  hasModule: (moduleKey?: ModuleKey) => boolean;
}

const DemoSessionContext = createContext<DemoSessionContextValue | null>(null);

export function DemoSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const state = useSyncExternalStore(
    subscribeStore,
    getClientSnapshot,
    getServerSnapshot
  );

  useEffect(() => {
    const root = document.documentElement;
    if (state.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  }, [state.reducedMotion]);

  const centers = useMemo(() => {
    return [...DEMO_CENTERS, ...state.customCenters].map((center) => {
      const moduleOverride = state.centerOverrides[center.id];
      const metaOverride = state.centerMetaOverrides[center.id];
      return {
        ...center,
        status: metaOverride?.status ?? center.status,
        plan: metaOverride?.plan ?? center.plan,
        branding: metaOverride?.accentColor
          ? { ...center.branding, accentColor: metaOverride.accentColor }
          : center.branding,
        enabledModules: moduleOverride ?? center.enabledModules,
      };
    });
  }, [state.customCenters, state.centerOverrides, state.centerMetaOverrides]);

  const activeCenter = useMemo(() => {
    return (
      centers.find((c) => c.id === state.activeCenterId) ?? centers[0]
    );
  }, [centers, state.activeCenterId]);

  const activeUser = DEMO_USERS[state.activeRole];

  const switchRole = useCallback((role: RoleId) => {
    updateClientState((prev) => ({ ...prev, activeRole: role }));
  }, []);

  const switchCenter = useCallback((centerId: string) => {
    updateClientState((prev) => ({ ...prev, activeCenterId: centerId }));
  }, []);

  const setReducedMotion = useCallback((value: boolean) => {
    updateClientState((prev) => ({ ...prev, reducedMotion: value }));
  }, []);

  const setSidebarCollapsed = useCallback((value: boolean) => {
    updateClientState((prev) => ({ ...prev, sidebarCollapsed: value }));
  }, []);

  const setSidebarHidden = useCallback((value: boolean) => {
    updateClientState((prev) => ({ ...prev, sidebarHidden: value }));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    updateClientState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    updateClientState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  }, []);

  const toggleNotificationRead = useCallback((id: string) => {
    updateClientState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.id === id ? { ...n, read: !n.read } : n
      ),
    }));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    updateClientState((prev) => ({
      ...prev,
      notifications: prev.notifications.filter((n) => n.id !== id),
    }));
  }, []);

  const addNotification = useCallback((item: NotificationItem) => {
    updateClientState((prev) => ({
      ...prev,
      notifications: [item, ...prev.notifications],
    }));
  }, []);

  const restoreNotifications = useCallback((items: NotificationItem[]) => {
    updateClientState((prev) => ({
      ...prev,
      notifications: items,
    }));
  }, []);

  const toggleCenterModule = useCallback(
    (centerId: string, moduleKey: ModuleKey) => {
      updateClientState((prev) => {
        const fallbackCenter = [...DEMO_CENTERS, ...prev.customCenters].find(
          (c) => c.id === centerId
        );
        const base =
          prev.centerOverrides[centerId] ??
          fallbackCenter?.enabledModules ??
          [];
        const exists = base.includes(moduleKey);
        const next = exists
          ? base.filter((k) => k !== moduleKey)
          : [...base, moduleKey];
        return {
          ...prev,
          centerOverrides: {
            ...prev.centerOverrides,
            [centerId]: next,
          },
        };
      });
    },
    []
  );

  const setCenterModules = useCallback(
    (centerId: string, modules: ModuleKey[], plan?: PlanTier) => {
      updateClientState((prev) => ({
        ...prev,
        centerOverrides: {
          ...prev.centerOverrides,
          [centerId]: Array.from(new Set(modules)),
        },
        centerMetaOverrides: plan
          ? {
              ...prev.centerMetaOverrides,
              [centerId]: {
                ...prev.centerMetaOverrides[centerId],
                plan,
              },
            }
          : prev.centerMetaOverrides,
      }));
    },
    []
  );

  const updateCenterMeta = useCallback(
    (centerId: string, patch: CenterMetaOverride) => {
      updateClientState((prev) => ({
        ...prev,
        centerMetaOverrides: {
          ...prev.centerMetaOverrides,
          [centerId]: {
            ...prev.centerMetaOverrides[centerId],
            ...patch,
          },
        },
      }));
    },
    []
  );

  const createDemoCenter = useCallback((center: CenterInstance) => {
    updateClientState((prev) => ({
      ...prev,
      customCenters: [...prev.customCenters, center],
    }));
  }, []);

  const resetDemo = useCallback(() => {
    clientStateCache = DEFAULT_STATE;
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore
      }
    }
    listeners.forEach((l) => l());
  }, []);

  const hasModule = useCallback(
    (moduleKey?: ModuleKey) => {
      if (!moduleKey) return true;
      return activeCenter.enabledModules.includes(moduleKey);
    },
    [activeCenter.enabledModules]
  );

  const visibleNotifications = useMemo(
    () =>
      state.notifications.filter(
        (n) =>
          !n.requiredModule ||
          activeCenter.enabledModules.includes(n.requiredModule)
      ),
    [state.notifications, activeCenter.enabledModules]
  );

  const unreadCount = useMemo(
    () => visibleNotifications.filter((n) => !n.read).length,
    [visibleNotifications]
  );

  const value = useMemo<DemoSessionContextValue>(
    () => ({
      activeRole: state.activeRole,
      activeUser,
      activeCenter,
      centers,
      reducedMotion: state.reducedMotion,
      sidebarCollapsed: state.sidebarCollapsed,
      sidebarHidden: state.sidebarHidden,
      notifications: visibleNotifications,
      unreadCount,
      switchRole,
      switchCenter,
      setReducedMotion,
      setSidebarCollapsed,
      setSidebarHidden,
      markAllNotificationsRead,
      markNotificationRead,
      toggleNotificationRead,
      deleteNotification,
      addNotification,
      restoreNotifications,
      toggleCenterModule,
      setCenterModules,
      updateCenterMeta,
      createDemoCenter,
      resetDemo,
      hasModule,
    }),
    [
      state.activeRole,
      activeUser,
      activeCenter,
      centers,
      state.reducedMotion,
      state.sidebarCollapsed,
      state.sidebarHidden,
      visibleNotifications,
      unreadCount,
      switchRole,
      switchCenter,
      setReducedMotion,
      setSidebarCollapsed,
      setSidebarHidden,
      markAllNotificationsRead,
      markNotificationRead,
      toggleNotificationRead,
      deleteNotification,
      addNotification,
      restoreNotifications,
      toggleCenterModule,
      setCenterModules,
      updateCenterMeta,
      createDemoCenter,
      resetDemo,
      hasModule,
    ]
  );

  return (
    <DemoSessionContext.Provider value={value}>
      {children}
    </DemoSessionContext.Provider>
  );
}

export function useDemoSession() {
  const ctx = useContext(DemoSessionContext);
  if (!ctx) {
    throw new Error('useDemoSession must be used inside DemoSessionProvider');
  }
  return ctx;
}

export function useCenterCapabilities() {
  const { activeCenter, activeRole, hasModule, toggleCenterModule } =
    useDemoSession();
  return {
    center: activeCenter,
    role: activeRole,
    enabledModules: activeCenter.enabledModules,
    hasModule,
    toggleCenterModule,
  };
}
