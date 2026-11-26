import type { ModuleKey } from '@/types/core';

export interface OnboardingStepDef {
  id: string;
  stepNumber: number;
  title: string;
  shortLabel: string;
  description: string;
  optional: boolean;
  requiredAnyModules?: ModuleKey[];
}

export const ALL_ONBOARDING_STEPS: OnboardingStepDef[] = [
  {
    id: 'welcome',
    stepNumber: 1,
    title: 'Bienvenue & choix d’instance',
    shortLabel: 'Bienvenue',
    description:
      'Vérifiez le périmètre modulaire activé pour votre centre et reprenez votre brouillon à tout moment.',
    optional: false,
  },
  {
    id: 'primary-owner',
    stepNumber: 2,
    title: 'Responsable principal',
    shortLabel: 'Responsable',
    description:
      'Coordonnées du directeur ou promoteur référent et notice de confidentialité du prototype.',
    optional: false,
  },
  {
    id: 'identity',
    stepNumber: 3,
    title: 'Identité juridique et pratique',
    shortLabel: 'Identité centre',
    description:
      'Nom commercial, identifiants facultatifs (ICE/IF), ville, adresse et horaires d’accueil.',
    optional: false,
  },
  {
    id: 'theme-locale',
    stepNumber: 4,
    title: 'Sous-domaine, thème et langues',
    shortLabel: 'Sous-domaine & RTL',
    description:
      'Aperçu en direct bureau et mobile en français / arabe RTL et mode clair / sombre.',
    optional: false,
  },
  {
    id: 'locations',
    stepNumber: 5,
    title: 'Sites et salles',
    shortLabel: 'Sites & salles',
    description:
      'Déclarez vos sites d’enseignement, capacités de salles et fuseau horaire (Africa/Casablanca).',
    optional: false,
    requiredAnyModules: ['locations'],
  },
  {
    id: 'pedagogy',
    stepNumber: 6,
    title: 'Organisation pédagogique',
    shortLabel: 'Pédagogie',
    description:
      'Niveaux scolaires, matières principales, créneaux types et règles de séances.',
    optional: false,
    requiredAnyModules: ['subjects', 'groups'],
  },
  {
    id: 'team',
    stepNumber: 7,
    title: 'Équipe & accès initiaux',
    shortLabel: 'Équipe',
    description:
      'Préparez les rôles secrétariat, comptabilité et professeurs (invitations simulées sans envoi réel).',
    optional: true,
    requiredAnyModules: ['staff', 'teachers'],
  },
  {
    id: 'students-guardians',
    stepNumber: 8,
    title: 'Élèves et responsables',
    shortLabel: 'Élèves & parents',
    description:
      'Stratégie d’appariement élève–parent, dédoublonnage et contact prioritaire.',
    optional: true,
    requiredAnyModules: ['students', 'guardians'],
  },
  {
    id: 'finance',
    stepNumber: 9,
    title: 'Tarifs et finance (MAD)',
    shortLabel: 'Finance MAD',
    description:
      'Devise MAD, périodicité d’échéances, modes d’encaissement et règles de reçu.',
    optional: false,
    requiredAnyModules: ['billing'],
  },
  {
    id: 'attendance',
    stepNumber: 10,
    title: 'Présences et pointage QR',
    shortLabel: 'Présences & QR',
    description:
      'Appel manuel, scan QR professeur (si activé) et seuils d’alerte absence/retard.',
    optional: false,
    requiredAnyModules: ['attendance.manual', 'attendance.qr'],
  },
  {
    id: 'parent-comms',
    stepNumber: 11,
    title: 'Communication parentale',
    shortLabel: 'Comm. parents',
    description:
      'Canaux autorisés dans votre instance, plages calmes et modèles FR/AR (envoi simulé).',
    optional: true,
    requiredAnyModules: ['messaging.inapp', 'parent.messaging', 'parent.consent'],
  },
  {
    id: 'documents',
    stepNumber: 12,
    title: 'Documents et pièces requises',
    shortLabel: 'Documents',
    description:
      'Catégories de pièces, échéances de renouvellement et accès restreints par rôle.',
    optional: true,
    requiredAnyModules: ['documents.students', 'documents.teachers'],
  },
  {
    id: 'calendar',
    stepNumber: 13,
    title: 'Calendrier et intégrations',
    shortLabel: 'Calendrier',
    description:
      'Agenda interne, détection des collisions et statut des passerelles Google / ICS Apple.',
    optional: true,
    requiredAnyModules: ['calendar.internal'],
  },
  {
    id: 'feedback-support',
    stepNumber: 14,
    title: 'Feedback & service qualité',
    shortLabel: 'Feedback & support',
    description:
      'Canaux d’assistance, déclencheurs d’enquête et règles d’anonymat configurables.',
    optional: true,
    requiredAnyModules: ['feedback', 'supportTickets'],
  },
  {
    id: 'initial-import',
    stepNumber: 15,
    title: 'Import initial / vérification',
    shortLabel: 'Import CSV démo',
    description:
      'Assistant local de mapping CSV fictif avec détection d’erreurs par ligne et prévisualisation.',
    optional: true,
    requiredAnyModules: ['imports'],
  },
  {
    id: 'summary',
    stepNumber: 16,
    title: 'Récapitulatif & permissions',
    shortLabel: 'Récapitulatif',
    description:
      'Contrôle des modules actifs, aperçu du menu Directeur et validation finale de la mise en service.',
    optional: false,
  },
  {
    id: 'post-launch',
    stepNumber: 17,
    title: 'Première connexion guidée',
    shortLabel: 'Lancement',
    description:
      'Checklist post-onboarding, bannière de suivi et accès direct à l’espace de travail.',
    optional: false,
  },
];

export function isStepActiveForModules(
  step: OnboardingStepDef,
  enabledModules: ModuleKey[]
): boolean {
  if (!step.requiredAnyModules || step.requiredAnyModules.length === 0) {
    return true;
  }
  return step.requiredAnyModules.some((m) => enabledModules.includes(m));
}

export function getActiveOnboardingSteps(
  enabledModules: ModuleKey[]
): OnboardingStepDef[] {
  return ALL_ONBOARDING_STEPS.filter((step) =>
    isStepActiveForModules(step, enabledModules)
  );
}
