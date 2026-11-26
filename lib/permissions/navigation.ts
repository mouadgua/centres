import type { ModuleKey, NavGroup, NavItem, RoleId } from '@/types/core';

export const ROLE_NAV_GROUPS: Record<RoleId, NavGroup[]> = {
  super_admin: [
    {
      id: 'super-overview',
      label: 'Plateforme',
      items: [
        { id: 's-dash', label: 'Vue globale', href: '/super/dashboard', iconName: 'LayoutDashboard', roles: ['super_admin'], implementedInLot: 1 },
        { id: 's-centers', label: 'Centres', href: '/super/centers', iconName: 'Building2', roles: ['super_admin'], implementedInLot: 3 },
        { id: 's-modules', label: 'Catalogue de modules', href: '/super/modules', iconName: 'Boxes', roles: ['super_admin'], implementedInLot: 3 },
        { id: 's-instances', label: 'Configurations d’instances', href: '/super/instances', iconName: 'SlidersHorizontal', roles: ['super_admin'], implementedInLot: 3 },
        { id: 's-onboard', label: 'Onboarding & invitations', href: '/super/onboarding', iconName: 'Compass', roles: ['super_admin'], implementedInLot: 3 },
      ],
    },
    {
      id: 'super-ops',
      label: 'Exploitation SaaS',
      items: [
        { id: 's-users', label: 'Utilisateurs SaaS', href: '/super/users', iconName: 'ShieldCheck', roles: ['super_admin'], implementedInLot: 3 },
        { id: 's-subs', label: 'Plans & abonnements', href: '/super/subscriptions', iconName: 'Layers', roles: ['super_admin'], implementedInLot: 3 },
        { id: 's-bill', label: 'Facturation SaaS', href: '/super/billing', iconName: 'CreditCard', roles: ['super_admin'], implementedInLot: 3 },
        { id: 's-ana', label: 'Analytique', href: '/super/analytics', iconName: 'BarChart3', roles: ['super_admin'], implementedInLot: 3 },
      ],
    },
    {
      id: 'super-quality',
      label: 'Support & Qualité',
      items: [
        { id: 's-feed', label: 'Feedback & enquêtes', href: '/super/feedback', iconName: 'MessageSquareHeart', roles: ['super_admin'], implementedInLot: 10 },
        { id: 's-sup', label: 'Tickets & assistance', href: '/super/support', iconName: 'LifeBuoy', roles: ['super_admin'], implementedInLot: 3 },
        { id: 's-inc', label: 'Incidents', href: '/super/incidents', iconName: 'AlertTriangle', roles: ['super_admin'], implementedInLot: 3 },
        { id: 's-aud', label: 'Audit & sécurité', href: '/super/audit', iconName: 'FileSearch', roles: ['super_admin'], implementedInLot: 3 },
        { id: 's-set', label: 'Paramètres plateforme', href: '/super/settings', iconName: 'Settings', roles: ['super_admin'], implementedInLot: 3 },
      ],
    },
  ],

  director: [
    {
      id: 'adm-general',
      label: 'Général',
      items: [
        { id: 'a-dash', label: "Vue d'ensemble", href: '/admin/dashboard', iconName: 'LayoutDashboard', roles: ['director', 'secretary', 'accountant'], implementedInLot: 1 },
        { id: 'a-notifs', label: 'Notifications', href: '/admin/notifications', iconName: 'Bell', requiredModule: 'notifications', roles: ['director', 'secretary', 'accountant'], implementedInLot: 2 },
        { id: 'a-uikit', label: 'Galerie UI Kit', href: '/admin/ui-kit', iconName: 'Layers', roles: ['director', 'secretary', 'accountant'], implementedInLot: 2 },
      ],
    },
    {
      id: 'adm-pedagogie',
      label: 'Pédagogie',
      items: [
        { id: 'a-students', label: 'Élèves', href: '/admin/students', iconName: 'GraduationCap', requiredModule: 'students', roles: ['director', 'secretary'], implementedInLot: 4 },
        { id: 'a-guardians', label: 'Parents & Responsables', href: '/admin/guardians', iconName: 'Users', requiredModule: 'guardians', roles: ['director', 'secretary'], implementedInLot: 4 },
        { id: 'a-teachers', label: 'Professeurs', href: '/admin/teachers', iconName: 'UserCheck', requiredModule: 'teachers', roles: ['director', 'secretary'], implementedInLot: 4 },
        { id: 'a-subjects', label: 'Matières', href: '/admin/subjects', iconName: 'BookOpen', requiredModule: 'subjects', roles: ['director', 'secretary'], implementedInLot: 5 },
        { id: 'a-groups', label: 'Groupes', href: '/admin/groups', iconName: 'Layers', requiredModule: 'groups', roles: ['director', 'secretary'], implementedInLot: 5 },
        { id: 'a-enrollments', label: 'Inscriptions', href: '/admin/enrollments', iconName: 'ClipboardList', requiredModule: 'enrollments', roles: ['director', 'secretary'], implementedInLot: 5 },
        { id: 'a-sessions', label: 'Séances', href: '/admin/sessions', iconName: 'Clock', requiredModule: 'sessions', roles: ['director', 'secretary'], implementedInLot: 5 },
        { id: 'a-calendar', label: 'Calendrier', href: '/admin/calendar', iconName: 'CalendarDays', requiredModule: 'calendar.internal', roles: ['director', 'secretary'], implementedInLot: 6 },
        { id: 'a-attendance', label: 'Présences', href: '/admin/attendance', iconName: 'QrCode', requiredModule: 'attendance.manual', roles: ['director', 'secretary'], implementedInLot: 7 },
        { id: 'a-resources', label: 'Supports de cours', href: '/admin/resources', iconName: 'FolderOpen', requiredModule: 'documents.teachers', roles: ['director', 'secretary'], implementedInLot: 5 },
      ],
    },
    {
      id: 'adm-finances',
      label: 'Finances',
      items: [
        { id: 'a-payments', label: 'Encaissements', href: '/admin/payments', iconName: 'Wallet', requiredModule: 'billing', roles: ['director', 'accountant', 'secretary'], implementedInLot: 8 },
        { id: 'a-dues', label: 'Échéances', href: '/admin/dues', iconName: 'CalendarClock', requiredModule: 'dues', roles: ['director', 'accountant'], implementedInLot: 8 },
        { id: 'a-overdue', label: 'Impayés', href: '/admin/overdue', iconName: 'AlertCircle', requiredModule: 'dues', roles: ['director', 'accountant'], implementedInLot: 8 },
        { id: 'a-pricing', label: 'Tarifs & remises', href: '/admin/pricing', iconName: 'Tag', requiredModule: 'billing', roles: ['director', 'accountant'], implementedInLot: 8 },
        { id: 'a-refunds', label: 'Remboursements', href: '/admin/refunds', iconName: 'RotateCcw', requiredModule: 'refunds', roles: ['director', 'accountant'], implementedInLot: 8 },
        { id: 'a-payroll', label: 'Rémunération profs', href: '/admin/payroll', iconName: 'Banknote', requiredModule: 'payroll', roles: ['director', 'accountant'], implementedInLot: 8 },
        { id: 'a-expenses', label: 'Dépenses', href: '/admin/expenses', iconName: 'Receipt', requiredModule: 'expenses', roles: ['director', 'accountant'], implementedInLot: 8 },
        { id: 'a-reports', label: 'Rapports', href: '/admin/reports', iconName: 'BarChart3', requiredModule: 'exports', roles: ['director', 'accountant'], implementedInLot: 8 },
        { id: 'a-accounting', label: 'Comptabilité', href: '/admin/accounting', iconName: 'FileSpreadsheet', requiredModule: 'accounting.exports', roles: ['director', 'accountant'], implementedInLot: 8 },
      ],
    },
    {
      id: 'adm-data',
      label: 'Données & outils',
      items: [
        { id: 'a-studio', label: 'Studio de données', href: '/admin/data-studio', iconName: 'Table2', requiredModule: 'dataStudio', roles: ['director', 'accountant', 'secretary'], implementedInLot: 9 },
        { id: 'a-imports', label: 'Importer / Exporter', href: '/admin/imports', iconName: 'ArrowUpDown', requiredModule: 'imports', roles: ['director', 'secretary'], implementedInLot: 9 },
      ],
    },
    {
      id: 'adm-comm',
      label: 'Communication & familles',
      items: [
        { id: 'a-comms', label: 'Centre de communication', href: '/admin/communications', iconName: 'Send', requiredModule: 'messaging.inapp', roles: ['director', 'secretary'], implementedInLot: 10 },
        { id: 'a-families', label: 'Contacts familles', href: '/admin/families', iconName: 'Contact', requiredModule: 'parent.consent', roles: ['director', 'secretary'], implementedInLot: 10 },
        { id: 'a-feedback', label: 'Feedback & enquêtes', href: '/admin/feedback', iconName: 'MessageSquareHeart', requiredModule: 'feedback', roles: ['director'], implementedInLot: 10 },
      ],
    },
    {
      id: 'adm-org',
      label: 'Organisation',
      items: [
        { id: 'a-users', label: 'Utilisateurs & accès', href: '/admin/users', iconName: 'Shield', requiredModule: 'staff', roles: ['director'], implementedInLot: 4 },
        { id: 'a-locations', label: 'Salles & sites', href: '/admin/locations', iconName: 'MapPin', requiredModule: 'locations', roles: ['director', 'secretary'], implementedInLot: 5 },
        { id: 'a-docs', label: 'Documents', href: '/admin/documents', iconName: 'Files', requiredModule: 'documents.students', roles: ['director', 'secretary'], implementedInLot: 10 },
        { id: 'a-audit', label: 'Audit', href: '/admin/audit', iconName: 'History', requiredModule: 'audit', roles: ['director'], implementedInLot: 10 },
        { id: 'a-settings', label: 'Paramètres du centre', href: '/admin/settings', iconName: 'Settings', roles: ['director'], implementedInLot: 10 },
      ],
    },
  ],

  secretary: [],
  accountant: [],

  teacher: [
    {
      id: 'tea-main',
      label: 'Espace Professeur',
      items: [
        { id: 't-today', label: "Aujourd'hui", href: '/teacher', iconName: 'Sun', roles: ['teacher'], implementedInLot: 1 },
        { id: 't-cal', label: 'Calendrier', href: '/teacher/calendar', iconName: 'CalendarDays', requiredModule: 'calendar.internal', roles: ['teacher'], implementedInLot: 11 },
        { id: 't-groups', label: 'Mes groupes', href: '/teacher/groups', iconName: 'Layers', requiredModule: 'groups', roles: ['teacher'], implementedInLot: 11 },
        { id: 't-sessions', label: 'Mes séances', href: '/teacher/sessions', iconName: 'Clock', requiredModule: 'sessions', roles: ['teacher'], implementedInLot: 11 },
        { id: 't-scan', label: 'Présences / Scanner QR', href: '/teacher/scan', iconName: 'QrCode', requiredModule: 'attendance.manual', roles: ['teacher'], implementedInLot: 7 },
        { id: 't-res', label: 'Supports', href: '/teacher/resources', iconName: 'FolderOpen', requiredModule: 'documents.teachers', roles: ['teacher'], implementedInLot: 11 },
        { id: 't-msg', label: 'Messages', href: '/teacher/messages', iconName: 'Send', requiredModule: 'messaging.inapp', roles: ['teacher'], implementedInLot: 11 },
        { id: 't-pay', label: 'Rémunération', href: '/teacher/payroll', iconName: 'Banknote', requiredModule: 'payroll', roles: ['teacher'], implementedInLot: 11 },
        { id: 't-prof', label: 'Profil & Disponibilités', href: '/teacher/profile', iconName: 'User', roles: ['teacher'], implementedInLot: 11 },
      ],
    },
  ],

  student: [
    {
      id: 'stu-main',
      label: 'Espace Étudiant',
      items: [
        { id: 'st-home', label: 'Accueil', href: '/student', iconName: 'Home', roles: ['student'], implementedInLot: 1 },
        { id: 'st-cal', label: 'Mon calendrier', href: '/student/calendar', iconName: 'CalendarDays', requiredModule: 'calendar.internal', roles: ['student'], implementedInLot: 11 },
        { id: 'st-groups', label: 'Mes groupes', href: '/student/groups', iconName: 'Layers', requiredModule: 'groups', roles: ['student'], implementedInLot: 11 },
        { id: 'st-att', label: 'Mes présences', href: '/student/attendance', iconName: 'CheckSquare', requiredModule: 'attendance.manual', roles: ['student'], implementedInLot: 11 },
        { id: 'st-qr', label: 'Mon QR étudiant', href: '/student/qr', iconName: 'QrCode', requiredModule: 'attendance.qr', roles: ['student'], implementedInLot: 7 },
        { id: 'st-pay', label: 'Mes paiements', href: '/student/payments', iconName: 'Receipt', requiredModule: 'receipts', roles: ['student'], implementedInLot: 11 },
        { id: 'st-notifs', label: 'Notifications', href: '/student/notifications', iconName: 'Bell', requiredModule: 'notifications', roles: ['student'], implementedInLot: 11 },
        { id: 'st-prof', label: 'Profil', href: '/student/profile', iconName: 'User', roles: ['student'], implementedInLot: 11 },
      ],
    },
  ],

  parent: [
    {
      id: 'par-main',
      label: 'Espace Parent',
      items: [
        { id: 'p-home', label: 'Suivi enfants', href: '/parent', iconName: 'Users', requiredModule: 'parent.portal', roles: ['parent'], implementedInLot: 1 },
        { id: 'p-cal', label: 'Planning', href: '/parent/calendar', iconName: 'CalendarDays', requiredModule: 'parent.portal', roles: ['parent'], implementedInLot: 11 },
        { id: 'p-att', label: 'Absences & Justificatifs', href: '/parent/attendance', iconName: 'CheckSquare', requiredModule: 'parent.portal', roles: ['parent'], implementedInLot: 11 },
        { id: 'p-pay', label: 'Relevé financier', href: '/parent/payments', iconName: 'Receipt', requiredModule: 'parent.portal', roles: ['parent'], implementedInLot: 11 },
        { id: 'p-msg', label: 'Messages & Rendez-vous', href: '/parent/messages', iconName: 'Send', requiredModule: 'parent.messaging', roles: ['parent'], implementedInLot: 11 },
        { id: 'p-docs', label: 'Documents & Reçus', href: '/parent/documents', iconName: 'Files', requiredModule: 'documents.parents', roles: ['parent'], implementedInLot: 11 },
        { id: 'p-cons', label: 'Consentements', href: '/parent/preferences', iconName: 'ShieldCheck', requiredModule: 'parent.consent', roles: ['parent'], implementedInLot: 11 },
      ],
    },
  ],
};

// Secretary and Accountant inherit filtered subsets of the Director navigation
ROLE_NAV_GROUPS.secretary = ROLE_NAV_GROUPS.director
  .map((group) => ({
    ...group,
    items: group.items.filter((item) => item.roles.includes('secretary')),
  }))
  .filter((group) => group.items.length > 0);

ROLE_NAV_GROUPS.accountant = ROLE_NAV_GROUPS.director
  .map((group) => ({
    ...group,
    items: group.items.filter((item) => item.roles.includes('accountant')),
  }))
  .filter((group) => group.items.length > 0);

export function getFilteredNavGroups(
  role: RoleId,
  enabledModules: ModuleKey[]
): NavGroup[] {
  const groups = ROLE_NAV_GROUPS[role] ?? [];
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          item.roles.includes(role) &&
          (!item.requiredModule || enabledModules.includes(item.requiredModule))
      ),
    }))
    .filter((group) => group.items.length > 0);
}

export function findNavItemByPath(pathname: string): NavItem | undefined {
  const allRoles: RoleId[] = [
    'super_admin',
    'director',
    'teacher',
    'student',
    'parent',
  ];
  for (const role of allRoles) {
    for (const group of ROLE_NAV_GROUPS[role]) {
      for (const item of group.items) {
        if (item.href === pathname) {
          return item;
        }
      }
    }
  }
  return undefined;
}

export function getBreadcrumbsForPath(pathname: string): { label: string; href: string }[] {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return [{ label: 'Accueil', href: '/' }];

  const matched = findNavItemByPath(pathname);
  const rootLabelMap: Record<string, string> = {
    admin: 'Administration',
    super: 'Super Admin',
    teacher: 'Professeur',
    student: 'Étudiant',
    parent: 'Parent',
    demo: 'Mode Démo',
  };

  const root = segments[0];
  const rootHref =
    root === 'admin'
      ? '/admin/dashboard'
      : root === 'super'
        ? '/super/dashboard'
        : `/${root}`;

  const crumbs: { label: string; href: string }[] = [
    { label: rootLabelMap[root] ?? root, href: rootHref },
  ];

  if (matched && matched.href !== rootHref) {
    crumbs.push({ label: matched.label, href: matched.href });
  } else if (segments.length > 1 && pathname !== rootHref) {
    const last = segments[segments.length - 1];
    crumbs.push({
      label: last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, ' '),
      href: pathname,
    });
  }

  return crumbs;
}
