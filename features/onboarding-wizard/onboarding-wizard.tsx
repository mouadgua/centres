'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Eye,
  FileSpreadsheet,
  Globe,
  Info,
  Laptop,
  Layers,
  MapPin,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  SkipForward,
  Smartphone,
  Trash2,
  WifiOff,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { ConfirmDialog } from '@/components/feedback/confirm-dialog';
import { GlobalBanner } from '@/components/feedback/states';
import { UnsavedChangesDialog } from '@/components/feedback/unsaved-changes-guard';
import { FormFieldWrapper, PhoneInputMA } from '@/components/forms/form-field';
import { ALL_MODULES } from '@/lib/mock-api/demo-data';
import { getFilteredNavGroups } from '@/lib/permissions/navigation';
import { useDemoSession } from '@/stores/demo-session-context';
import {
  ALL_ONBOARDING_STEPS,
  getActiveOnboardingSteps,
} from './onboarding-config';

const DRAFT_STORAGE_KEY = 'markazflow_onboarding_draft_v1';

interface SiteDraft {
  id: string;
  name: string;
  city: string;
  roomsCount: number;
}

interface OnboardingDraft {
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerLang: 'fr' | 'ar';
  ownerConsent: boolean;

  commercialName: string;
  legalName: string;
  iceOptional: string;
  city: string;
  address: string;
  hoursLabel: string;

  subdomain: string;
  previewLang: 'fr' | 'ar';
  previewTheme: 'light' | 'dark';
  accentColor: string;

  sites: SiteDraft[];

  levels: string[];
  subjects: string[];
  defaultDurationMin: string;

  inviteList: { email: string; role: string }[];

  dedupPolicy: 'phone_email' | 'manual';
  guardianPriority: 'primary_first' | 'finance_separate';

  billingCycle: 'mensuel' | 'trimestriel' | 'seance';
  paymentMethods: string[];
  discountAllowed: boolean;

  qrEnabledMode: 'manual_only' | 'qr_plus_manual';
  absenceAlertDelayMin: string;
  allowTeacherCorrection: boolean;

  quietHoursStart: string;
  quietHoursEnd: string;
  commsPreviewLang: 'fr' | 'ar';

  requiredDocs: string[];
  docRenewalDays: string;

  calendarMode: 'internal' | 'internal_ics' | 'google_preview';
  conflictBlock: boolean;

  anonymizeCenterFeedback: boolean;
  surveyTriggers: string[];

  importStrategy: 'create' | 'update' | 'skip_duplicates';
  importRunDone: boolean;

  skippedStepIds: string[];
  completedStepIds: string[];
  launched: boolean;
}

const DEFAULT_DRAFT: OnboardingDraft = {
  ownerFirstName: 'Saloua',
  ownerLastName: 'El Kabbaj',
  ownerEmail: 'direction@centre-demo.ma',
  ownerPhone: '6 12 34 56 78',
  ownerLang: 'fr',
  ownerConsent: true,

  commercialName: 'Institut Al-Mawahib Soutien',
  legalName: 'Al-Mawahib Éducation SARL (fictif)',
  iceOptional: '',
  city: 'Casablanca',
  address: '48 Boulevard Anfa, Quartier Gautier',
  hoursLabel: 'Lun–Sam · 08:30–21:00',

  subdomain: 'almawahib',
  previewLang: 'fr',
  previewTheme: 'light',
  accentColor: '#0f766e',

  sites: [
    { id: 's-1', name: 'Site Principal Gautier', city: 'Casablanca', roomsCount: 8 },
    { id: 's-2', name: 'Annexe Maârif', city: 'Casablanca', roomsCount: 4 },
  ],

  levels: ['Collège', 'Tronc Commun', '1ère Bac', '2ème Bac'],
  subjects: ['Mathématiques', 'Physique-Chimie', 'SVT', 'Français', 'Anglais'],
  defaultDurationMin: '120',

  inviteList: [
    { email: 'accueil@centre-demo.ma', role: 'Secrétaire' },
    { email: 'finance@centre-demo.ma', role: 'Comptable' },
  ],

  dedupPolicy: 'phone_email',
  guardianPriority: 'finance_separate',

  billingCycle: 'mensuel',
  paymentMethods: ['Espèces', 'Virement', 'Chèque'],
  discountAllowed: true,

  qrEnabledMode: 'qr_plus_manual',
  absenceAlertDelayMin: '20',
  allowTeacherCorrection: false,

  quietHoursStart: '21:00',
  quietHoursEnd: '08:00',
  commsPreviewLang: 'fr',

  requiredDocs: ["Fiche d'inscription signée", 'Règlement intérieur'],
  docRenewalDays: '365',

  calendarMode: 'internal_ics',
  conflictBlock: true,

  anonymizeCenterFeedback: true,
  surveyTriggers: ['Fin de trimestre', 'Après onboarding'],

  importStrategy: 'skip_duplicates',
  importRunDone: false,

  skippedStepIds: [],
  completedStepIds: [],
  launched: false,
};

function loadSavedDraft(): OnboardingDraft {
  if (typeof window === 'undefined') return DEFAULT_DRAFT;
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return DEFAULT_DRAFT;
    return { ...DEFAULT_DRAFT, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_DRAFT;
  }
}

const SAMPLE_CSV_PREVIEW = [
  { row: 2, student: 'Yassine Tazi', guardian: 'Fatima Zohra Tazi', phone: '+212 6 11 22 33 44', status: 'valide', note: 'Prêt' },
  { row: 3, student: 'Salma Berrada', guardian: 'Rachid Berrada', phone: '+212 6 55 44 33 22', status: 'avertissement', note: 'Groupe manquant (assignation par défaut)' },
  { row: 4, student: 'Kenza Idrissi', guardian: '', phone: '060000', status: 'rejet', note: 'Téléphone invalide & responsable absent' },
];

export function OnboardingWizard() {
  const router = useRouter();
  const {
    centers,
    activeCenter,
    switchCenter,
    switchRole,
    hasModule,
  } = useDemoSession();

  const [draft, setDraft] = useState<OnboardingDraft>(() => loadSavedDraft());
  const [currentStepId, setCurrentStepId] = useState<string>('welcome');
  const [isDirty, setIsDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [simNetworkError, setSimNetworkError] = useState(false);
  const [confirmExitOpen, setConfirmExitOpen] = useState(false);
  const [confirmLaunchOpen, setConfirmLaunchOpen] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteRooms, setNewSiteRooms] = useState('4');
  const [newInviteEmail, setNewInviteEmail] = useState('');
  const [newInviteRole, setNewInviteRole] = useState('Professeur');
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({
    c1: true,
    c2: false,
    c3: false,
    c4: false,
  });

  const activeSteps = useMemo(
    () => getActiveOnboardingSteps(activeCenter.enabledModules),
    [activeCenter.enabledModules]
  );

  const inactiveSteps = useMemo(
    () =>
      ALL_ONBOARDING_STEPS.filter(
        (s) => !activeSteps.some((a) => a.id === s.id)
      ),
    [activeSteps]
  );

  // If the current step becomes inactive because Super Admin turned off a module, snap safely to welcome or next active
  const resolvedStepIndex = useMemo(() => {
    const idx = activeSteps.findIndex((s) => s.id === currentStepId);
    return idx >= 0 ? idx : 0;
  }, [activeSteps, currentStepId]);

  const currentStep = activeSteps[resolvedStepIndex] ?? activeSteps[0];
  const progressPercent = Math.round(
    ((resolvedStepIndex + 1) / Math.max(1, activeSteps.length)) * 100
  );

  const updateDraft = <K extends keyof OnboardingDraft>(
    key: K,
    value: OnboardingDraft[K]
  ) => {
    setIsDirty(true);
    setErrors((prev) => {
      if (!prev[key as string]) return prev;
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const persistDraft = (showToast = true) => {
    if (simNetworkError) {
      toast.error('Échec réseau simulé — brouillon conservé en mémoire locale', {
        description:
          'Désactivez la simulation hors-ligne ou réessayez pour sauvegarder.',
      });
      return false;
    }
    try {
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      setIsDirty(false);
      if (showToast) {
        toast.success('Brouillon enregistré localement (Mode Démo)', {
          description:
            'Vos saisies des étapes actives et inactives sont préservées.',
        });
      }
      return true;
    } catch {
      return false;
    }
  };

  const validateCurrentStep = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (currentStep.id === 'primary-owner') {
      if (draft.ownerFirstName.trim().length < 2) {
        nextErrors.ownerFirstName = 'Prénom requis (min. 2 caractères).';
      }
      if (draft.ownerLastName.trim().length < 2) {
        nextErrors.ownerLastName = 'Nom requis (min. 2 caractères).';
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.ownerEmail.trim())) {
        nextErrors.ownerEmail = 'Email invalide.';
      }
      if (draft.ownerPhone.trim().length < 8) {
        nextErrors.ownerPhone = 'Numéro marocain incomplet.';
      }
      if (!draft.ownerConsent) {
        nextErrors.ownerConsent =
          'Veuillez confirmer la prise de connaissance du Mode Démo.';
      }
    } else if (currentStep.id === 'identity') {
      if (draft.commercialName.trim().length < 3) {
        nextErrors.commercialName = 'Nom commercial requis.';
      }
      if (draft.city.trim().length < 2) {
        nextErrors.city = 'Ville requise.';
      }
    } else if (currentStep.id === 'theme-locale') {
      const sub = draft.subdomain.trim().toLowerCase();
      if (!/^[a-z0-9-]{3,30}$/.test(sub)) {
        nextErrors.subdomain =
          'Sous-domaine invalide (lettres minuscules, chiffres et tirets uniquement).';
      } else if (sub === 'pris' || sub === 'taken' || sub === 'horizon') {
        nextErrors.subdomain =
          'Sous-domaine déjà pris dans le catalogue démo (simulation conflit 409).';
      }
    } else if (currentStep.id === 'locations') {
      if (draft.sites.length === 0) {
        nextErrors.sites = 'Ajoutez au moins un site d’enseignement.';
      }
    }

    setErrors(nextErrors);
    const firstKey = Object.keys(nextErrors)[0];
    if (firstKey) {
      const el = document.getElementById(`onb-${firstKey}`);
      el?.focus();
      toast.error('Vérifiez les champs en erreur avant de continuer');
      return false;
    }
    return true;
  };

  const goToStep = (stepId: string) => {
    setErrors({});
    setCurrentStepId(stepId);
  };

  const handleNext = () => {
    if (simNetworkError) {
      toast.error('Impossible de valider l’étape (erreur réseau simulée)');
      return;
    }
    if (!validateCurrentStep()) return;

    const updatedCompleted = Array.from(
      new Set([...draft.completedStepIds, currentStep.id])
    );
    const nextDraft = { ...draft, completedStepIds: updatedCompleted };
    setDraft(nextDraft);
    try {
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(nextDraft));
    } catch {
      // ignore
    }

    if (currentStep.id === 'summary') {
      setConfirmLaunchOpen(true);
      return;
    }

    const nextStep = activeSteps[resolvedStepIndex + 1];
    if (nextStep) {
      setCurrentStepId(nextStep.id);
    }
  };

  const handleSkip = () => {
    if (!currentStep.optional) return;
    const updatedSkipped = Array.from(
      new Set([...draft.skippedStepIds, currentStep.id])
    );
    updateDraft('skippedStepIds', updatedSkipped);
    const nextStep = activeSteps[resolvedStepIndex + 1];
    if (nextStep) {
      toast.info(`Étape « ${currentStep.shortLabel} » ignorée pour le moment`);
      setCurrentStepId(nextStep.id);
    }
  };

  const handlePrev = () => {
    setErrors({});
    const prevStep = activeSteps[resolvedStepIndex - 1];
    if (prevStep) {
      setCurrentStepId(prevStep.id);
    }
  };

  const directorPreviewGroups = useMemo(
    () => getFilteredNavGroups('director', activeCenter.enabledModules),
    [activeCenter.enabledModules]
  );

  const handleLaunchConfirm = () => {
    setDraft((prev) => ({
      ...prev,
      launched: true,
      completedStepIds: Array.from(
        new Set([...prev.completedStepIds, 'summary'])
      ),
    }));
    setConfirmLaunchOpen(false);
    setIsDirty(false);
    toast.success('Mise en service simulée terminée', {
      description: `Instance « ${draft.commercialName} » prête en Mode Démo.`,
    });
    setCurrentStepId('post-launch');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-xs">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="font-heading text-base font-bold tracking-tight whitespace-nowrap"
            >
              MarkazFlow
            </Link>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              · Onboarding adaptatif ({activeCenter.name} · Plan{' '}
              {activeCenter.plan})
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile stepper drawer */}
            <Sheet>
              <SheetTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs lg:hidden"
                  />
                }
              >
                <Layers className="size-3.5" />
                Étape {resolvedStepIndex + 1}/{activeSteps.length}
              </SheetTrigger>
              <SheetContent side="left" className="w-80 overflow-y-auto p-4">
                <SheetHeader className="pb-3 text-left">
                  <SheetTitle className="text-sm">
                    Parcours conditionnel
                  </SheetTitle>
                  <SheetDescription className="text-xs">
                    {activeSteps.length} étapes actives sur 17 selon les
                    modules de {activeCenter.name}.
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-1">
                  {activeSteps.map((step, idx) => {
                    const isCurrent = step.id === currentStep.id;
                    const isDone = draft.completedStepIds.includes(step.id);
                    return (
                      <button
                        key={step.id}
                        type="button"
                        onClick={() => goToStep(step.id)}
                        className={cn(
                          'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs transition-colors',
                          isCurrent
                            ? 'bg-primary text-primary-foreground font-medium'
                            : 'hover:bg-muted text-foreground'
                        )}
                      >
                        <span className="font-mono text-[11px] tabular-nums opacity-75">
                          {idx + 1}.
                        </span>
                        <span className="flex-1 truncate">{step.shortLabel}</span>
                        {isDone && !isCurrent && (
                          <Check className="size-3.5 text-success" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen((v) => !v)}
              className="hidden text-xs lg:inline-flex"
            >
              {sidebarOpen ? 'Masquer sommaire' : 'Afficher sommaire'}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => persistDraft(true)}
              className="gap-1.5 text-xs"
            >
              <Save className="size-3.5" />
              <span className="hidden sm:inline">Enregistrer le brouillon</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                if (isDirty) {
                  setConfirmExitOpen(true);
                } else {
                  router.push('/admin/dashboard');
                }
              }}
              className="gap-1 text-xs"
            >
              <X className="size-3.5" />
              Quitter
            </Button>
          </div>
        </div>

        {/* Thin Progress Bar */}
        <div className="h-1 w-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-200"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">
        {/* Compactable Step Sidebar (Desktop) */}
        {sidebarOpen && (
          <aside className="hidden w-72 shrink-0 space-y-4 lg:block">
            <Card className="border-border shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                  Progression ({progressPercent} %)
                </CardTitle>
                <CardDescription className="text-xs">
                  {activeSteps.length} étapes actives sur 17 ·{' '}
                  {inactiveSteps.length} masquées par vos modules
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                {activeSteps.map((step, idx) => {
                  const isCurrent = step.id === currentStep.id;
                  const isDone = draft.completedStepIds.includes(step.id);
                  const isSkipped = draft.skippedStepIds.includes(step.id);
                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => goToStep(step.id)}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs transition-colors',
                        isCurrent
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'hover:bg-muted text-foreground'
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-5 shrink-0 items-center justify-center rounded-md font-mono text-[11px] tabular-nums',
                          isCurrent
                            ? 'bg-primary-foreground/20 text-primary-foreground'
                            : isDone
                              ? 'bg-success/15 text-success'
                              : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {isDone && !isCurrent ? (
                          <Check className="size-3" />
                        ) : (
                          idx + 1
                        )}
                      </span>
                      <span className="flex-1 truncate">{step.shortLabel}</span>
                      {step.optional && !isCurrent && (
                        <span className="text-[10px] text-muted-foreground">
                          {isSkipped ? 'Ignoré' : 'Option'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            {inactiveSteps.length > 0 && (
              <div className="rounded-xl border border-border bg-muted/30 p-3.5 text-xs text-muted-foreground space-y-1.5">
                <p className="font-medium text-foreground">
                  Étapes masquées ({inactiveSteps.length})
                </p>
                <p>
                  Désactivées sur le plan <strong>{activeCenter.plan}</strong>{' '}
                  (brouillons préservés si réactivation) :
                </p>
                <ul className="list-disc space-y-0.5 pl-4 text-[11px]">
                  {inactiveSteps.map((s) => (
                    <li key={s.id}>{s.shortLabel}</li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        )}

        {/* Main Step Surface */}
        <main className="min-w-0 flex-1 space-y-5">
          {simNetworkError && (
            <GlobalBanner
              tone="destructive"
              title="Mode erreur réseau simulée actif"
              description="Les sauvegardes et passages à l'étape suivante affichent l'erreur attendue tout en conservant vos saisies dans le formulaire."
              actionLabel="Rétablir la connexion simulée"
              onAction={() => setSimNetworkError(false)}
            />
          )}

          {draft.launched && (
            <GlobalBanner
              tone="info"
              title="Centre en cours de configuration (Mode Démo)"
              description="Vous pouvez rouvrir n'importe quelle étape de reprise sans perte de données."
            />
          )}

          <Card className="border-border shadow-none">
            <CardHeader className="border-b border-border pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                  Étape {resolvedStepIndex + 1} sur {activeSteps.length}
                  {currentStep.optional ? ' · Facultative' : ' · Requise'}
                </span>
                <button
                  type="button"
                  onClick={() => setSimNetworkError((v) => !v)}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <WifiOff className="size-3.5" />
                  {simNetworkError
                    ? 'Couper simulation offline'
                    : 'Simuler erreur réseau'}
                </button>
              </div>
              <CardTitle className="font-heading text-xl">
                {currentStep.title}
              </CardTitle>
              <CardDescription>{currentStep.description}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
              {/* Error summary if any */}
              {Object.keys(errors).length > 0 && (
                <div
                  role="alert"
                  className="rounded-xl border border-destructive/40 bg-destructive/10 p-3.5 text-xs text-foreground"
                >
                  <p className="font-semibold">
                    Champs bloquants à corriger ({Object.keys(errors).length})
                  </p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-4 text-muted-foreground">
                    {Object.values(errors).map((msg, i) => (
                      <li key={i}>{msg}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* STEP 1: WELCOME & INSTANCE SWITCHER */}
              {currentStep.id === 'welcome' && (
                <div className="space-y-5">
                  <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
                    <p className="font-medium text-foreground">
                      Testez l&apos;adaptabilité instantanée de l&apos;assistant
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Sélectionnez une instance ci-dessous : le nombre
                      d&apos;étapes passe automatiquement de 11–17 selon les
                      modules activés par le Super Admin, sans effacer votre
                      brouillon.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {centers.map((center) => {
                      const selected = center.id === activeCenter.id;
                      const stepsCount = getActiveOnboardingSteps(
                        center.enabledModules
                      ).length;
                      return (
                        <button
                          key={center.id}
                          type="button"
                          onClick={() => {
                            switchCenter(center.id);
                            toast.info(
                              `Instance basculée : ${center.name} (${stepsCount} étapes actives)`
                            );
                          }}
                          className={cn(
                            'flex flex-col items-start gap-1.5 rounded-xl border p-4 text-left transition-colors',
                            selected
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:bg-muted/50'
                          )}
                        >
                          <div className="flex w-full items-center justify-between">
                            <span className="flex items-center gap-1.5 text-sm font-semibold">
                              <Building2 className="size-4 text-primary" />
                              {center.name}
                            </span>
                            {selected && (
                              <CheckCircle2 className="size-4 text-primary" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Plan {center.plan} · {center.enabledModules.length}{' '}
                            modules
                          </p>
                          <p className="font-mono text-xs font-medium text-foreground tabular-nums">
                            {stepsCount} / 17 étapes actives
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 2: PRIMARY OWNER */}
              {currentStep.id === 'primary-owner' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormFieldWrapper
                    id="onb-ownerFirstName"
                    label="Prénom du responsable"
                    required
                    error={errors.ownerFirstName}
                  >
                    <Input
                      id="onb-ownerFirstName"
                      value={draft.ownerFirstName}
                      onChange={(e) =>
                        updateDraft('ownerFirstName', e.target.value)
                      }
                    />
                  </FormFieldWrapper>
                  <FormFieldWrapper
                    id="onb-ownerLastName"
                    label="Nom du responsable"
                    required
                    error={errors.ownerLastName}
                  >
                    <Input
                      id="onb-ownerLastName"
                      value={draft.ownerLastName}
                      onChange={(e) =>
                        updateDraft('ownerLastName', e.target.value)
                      }
                    />
                  </FormFieldWrapper>
                  <FormFieldWrapper
                    id="onb-ownerEmail"
                    label="Email de contact démo"
                    required
                    error={errors.ownerEmail}
                  >
                    <Input
                      id="onb-ownerEmail"
                      type="email"
                      value={draft.ownerEmail}
                      onChange={(e) => updateDraft('ownerEmail', e.target.value)}
                    />
                  </FormFieldWrapper>
                  <FormFieldWrapper
                    id="onb-ownerPhone"
                    label="Téléphone mobile"
                    required
                    error={errors.ownerPhone}
                  >
                    <PhoneInputMA
                      id="onb-ownerPhone"
                      value={draft.ownerPhone}
                      onChange={(e) => updateDraft('ownerPhone', e.target.value)}
                    />
                  </FormFieldWrapper>
                  <div className="sm:col-span-2 flex items-start gap-2.5 rounded-xl border border-border bg-muted/30 p-3.5">
                    <Checkbox
                      id="onb-ownerConsent"
                      checked={draft.ownerConsent}
                      onCheckedChange={(v) =>
                        updateDraft('ownerConsent', Boolean(v))
                      }
                    />
                    <div className="space-y-1 text-xs">
                      <Label htmlFor="onb-ownerConsent" className="font-medium">
                        Je comprends que cette configuration est une simulation
                        Mode Démo sans envoi d&apos;invitation réelle.
                      </Label>
                      {errors.ownerConsent && (
                        <p className="text-destructive">{errors.ownerConsent}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: LEGAL & PRACTICAL IDENTITY */}
              {currentStep.id === 'identity' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormFieldWrapper
                    id="onb-commercialName"
                    label="Nom commercial du centre"
                    required
                    error={errors.commercialName}
                  >
                    <Input
                      id="onb-commercialName"
                      value={draft.commercialName}
                      onChange={(e) =>
                        updateDraft('commercialName', e.target.value)
                      }
                    />
                  </FormFieldWrapper>
                  <FormFieldWrapper
                    id="onb-legalName"
                    label="Raison sociale (facultative)"
                  >
                    <Input
                      id="onb-legalName"
                      value={draft.legalName}
                      onChange={(e) => updateDraft('legalName', e.target.value)}
                    />
                  </FormFieldWrapper>
                  <FormFieldWrapper
                    id="onb-iceOptional"
                    label="ICE / Identifiant fiscal (optionnel, validation ultérieure)"
                  >
                    <Input
                      id="onb-iceOptional"
                      placeholder="Ex. 001234567000089 (fictif)"
                      value={draft.iceOptional}
                      onChange={(e) =>
                        updateDraft('iceOptional', e.target.value)
                      }
                    />
                  </FormFieldWrapper>
                  <FormFieldWrapper
                    id="onb-city"
                    label="Ville"
                    required
                    error={errors.city}
                  >
                    <Input
                      id="onb-city"
                      value={draft.city}
                      onChange={(e) => updateDraft('city', e.target.value)}
                    />
                  </FormFieldWrapper>
                  <FormFieldWrapper
                    id="onb-address"
                    label="Adresse principale"
                    className="sm:col-span-2"
                  >
                    <Input
                      id="onb-address"
                      value={draft.address}
                      onChange={(e) => updateDraft('address', e.target.value)}
                    />
                  </FormFieldWrapper>
                  <FormFieldWrapper
                    id="onb-hoursLabel"
                    label="Plages horaires d'accueil"
                    className="sm:col-span-2"
                  >
                    <Input
                      id="onb-hoursLabel"
                      value={draft.hoursLabel}
                      onChange={(e) => updateDraft('hoursLabel', e.target.value)}
                    />
                  </FormFieldWrapper>
                </div>
              )}

              {/* STEP 4: SUBDOMAIN, THEME & FR/AR RTL PREVIEW */}
              {currentStep.id === 'theme-locale' && (
                <div className="grid gap-6 lg:grid-cols-12">
                  <div className="space-y-4 lg:col-span-6">
                    <FormFieldWrapper
                      id="onb-subdomain"
                      label="Sous-domaine souhaité"
                      required
                      hint="Tapez « pris » pour simuler un conflit"
                      error={errors.subdomain}
                    >
                      <div className="flex items-center gap-2">
                        <Input
                          id="onb-subdomain"
                          value={draft.subdomain}
                          onChange={(e) =>
                            updateDraft(
                              'subdomain',
                              e.target.value.toLowerCase()
                            )
                          }
                          className="font-mono"
                        />
                        <span className="shrink-0 font-mono text-xs text-muted-foreground">
                          .markazflow.demo
                        </span>
                      </div>
                    </FormFieldWrapper>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <FormFieldWrapper id="onb-lang" label="Langue d'aperçu">
                        <Select
                          value={draft.previewLang}
                          onValueChange={(val) =>
                            updateDraft('previewLang', val as 'fr' | 'ar')
                          }
                        >
                          <SelectTrigger id="onb-lang" className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fr">Français (LTR)</SelectItem>
                            <SelectItem value="ar">العربية (RTL)</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormFieldWrapper>

                      <FormFieldWrapper id="onb-theme" label="Thème aperçu">
                        <Select
                          value={draft.previewTheme}
                          onValueChange={(val) =>
                            updateDraft('previewTheme', val as 'light' | 'dark')
                          }
                        >
                          <SelectTrigger id="onb-theme" className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">Clair</SelectItem>
                            <SelectItem value="dark">Sombre</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormFieldWrapper>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">
                        Couleur d&apos;accent de marque blanche
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { hex: '#0f766e', name: 'Émeraude' },
                          { hex: '#1e3a5f', name: 'Bleu Nuit' },
                          { hex: '#3730a3', name: 'Indigo' },
                          { hex: '#b45309', name: 'Ambre' },
                        ].map((c) => (
                          <button
                            key={c.hex}
                            type="button"
                            onClick={() => updateDraft('accentColor', c.hex)}
                            className={cn(
                              'inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs',
                              draft.accentColor === c.hex
                                ? 'border-foreground bg-muted font-medium'
                                : 'border-border'
                            )}
                          >
                            <span
                              className="size-3 rounded-full"
                              style={{ backgroundColor: c.hex }}
                            />
                            {c.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Live Mobile + Desktop Preview */}
                  <div className="space-y-3 lg:col-span-6">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5 font-medium text-foreground">
                        <Globe className="size-3.5" />
                        Aperçu en direct ({draft.previewLang.toUpperCase()} ·{' '}
                        {draft.previewLang === 'ar' ? 'RTL' : 'LTR'})
                      </span>
                      <span className="flex items-center gap-2">
                        <Laptop className="size-3.5" />
                        <Smartphone className="size-3.5" />
                      </span>
                    </div>

                    <div
                      dir={draft.previewLang === 'ar' ? 'rtl' : 'ltr'}
                      className={cn(
                        'rounded-xl border p-4 transition-colors',
                        draft.previewTheme === 'dark'
                          ? 'border-zinc-800 bg-zinc-950 text-zinc-100'
                          : 'border-zinc-200 bg-white text-zinc-900'
                      )}
                    >
                      <div className="flex items-center justify-between border-b border-current/10 pb-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="flex size-7 items-center justify-center rounded-lg text-xs font-bold text-white"
                            style={{ backgroundColor: draft.accentColor }}
                          >
                            {draft.commercialName.slice(0, 2).toUpperCase()}
                          </span>
                          <div>
                            <p className="text-xs font-semibold">
                              {draft.previewLang === 'ar'
                                ? 'مركز المواهب للدعم المدرسي'
                                : draft.commercialName}
                            </p>
                            <p className="font-mono text-[10px] opacity-65">
                              {draft.subdomain}.markazflow.demo
                            </p>
                          </div>
                        </div>
                        <span
                          className="rounded-md px-2 py-0.5 text-[10px] font-medium text-white"
                          style={{ backgroundColor: draft.accentColor }}
                        >
                          {draft.previewLang === 'ar' ? 'بوابة المركز' : 'Portail'}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-lg border border-current/10 p-2.5">
                          <p className="text-[10px] opacity-65">
                            {draft.previewLang === 'ar'
                              ? 'حصص اليوم'
                              : 'Séances du jour'}
                          </p>
                          <p className="mt-1 font-mono text-sm font-semibold tabular-nums">
                            12
                          </p>
                        </div>
                        <div className="rounded-lg border border-current/10 p-2.5">
                          <p className="text-[10px] opacity-65">
                            {draft.previewLang === 'ar'
                              ? 'نسبة الحضور'
                              : 'Taux présence'}
                          </p>
                          <p className="mt-1 font-mono text-sm font-semibold tabular-nums">
                            94,2 %
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: LOCATIONS & ROOMS */}
              {currentStep.id === 'locations' && (
                <div className="space-y-4">
                  <div className="divide-y divide-border rounded-xl border border-border">
                    {draft.sites.map((site) => (
                      <div
                        key={site.id}
                        className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                      >
                        <div className="flex items-center gap-2.5">
                          <MapPin className="size-4 text-primary" />
                          <div>
                            <p className="font-medium">{site.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {site.city} · {site.roomsCount} salles ·
                              Africa/Casablanca
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`Supprimer ${site.name}`}
                          onClick={() =>
                            updateDraft(
                              'sites',
                              draft.sites.filter((s) => s.id !== site.id)
                            )
                          }
                        >
                          <Trash2 className="size-3.5 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-end gap-3 rounded-xl border border-dashed border-border p-3.5">
                    <FormFieldWrapper
                      id="new-site-name"
                      label="Ajouter un site ou bâtiment"
                      className="flex-1 min-w-48"
                    >
                      <Input
                        id="new-site-name"
                        placeholder="Ex. Pôle Californie"
                        value={newSiteName}
                        onChange={(e) => setNewSiteName(e.target.value)}
                      />
                    </FormFieldWrapper>
                    <FormFieldWrapper
                      id="new-site-rooms"
                      label="Salles"
                      className="w-24"
                    >
                      <Input
                        id="new-site-rooms"
                        type="number"
                        min={1}
                        max={40}
                        value={newSiteRooms}
                        onChange={(e) => setNewSiteRooms(e.target.value)}
                      />
                    </FormFieldWrapper>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (newSiteName.trim().length < 2) return;
                        updateDraft('sites', [
                          ...draft.sites,
                          {
                            id: `s-${Date.now()}`,
                            name: newSiteName.trim(),
                            city: draft.city || 'Casablanca',
                            roomsCount: Math.max(1, Number(newSiteRooms) || 1),
                          },
                        ]);
                        setNewSiteName('');
                      }}
                      className="gap-1.5"
                    >
                      <Plus className="size-3.5" />
                      Ajouter site
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 6: PEDAGOGICAL ORGANIZATION */}
              {currentStep.id === 'pedagogy' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">
                      Niveaux enseignés
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'Primaire',
                        'Collège',
                        'Tronc Commun',
                        '1ère Bac',
                        '2ème Bac',
                        'Prépa / Sup',
                      ].map((lvl) => {
                        const active = draft.levels.includes(lvl);
                        return (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() =>
                              updateDraft(
                                'levels',
                                active
                                  ? draft.levels.filter((x) => x !== lvl)
                                  : [...draft.levels, lvl]
                              )
                            }
                            className={cn(
                              'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                              active
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border text-muted-foreground hover:text-foreground'
                            )}
                          >
                            {lvl}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium">
                      Matières actives
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'Mathématiques',
                        'Physique-Chimie',
                        'SVT',
                        'Français',
                        'Anglais',
                        'Économie & Gestion',
                        'Philosophie',
                      ].map((sub) => {
                        const active = draft.subjects.includes(sub);
                        return (
                          <button
                            key={sub}
                            type="button"
                            onClick={() =>
                              updateDraft(
                                'subjects',
                                active
                                  ? draft.subjects.filter((x) => x !== sub)
                                  : [...draft.subjects, sub]
                              )
                            }
                            className={cn(
                              'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                              active
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border text-muted-foreground hover:text-foreground'
                            )}
                          >
                            {sub}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <FormFieldWrapper
                    id="onb-duration"
                    label="Durée par défaut d'une séance (minutes)"
                    className="max-w-xs"
                  >
                    <Select
                      value={draft.defaultDurationMin}
                      onValueChange={(val) =>
                        updateDraft('defaultDurationMin', val ?? '120')
                      }
                    >
                      <SelectTrigger id="onb-duration" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="60">60 min (1 h)</SelectItem>
                        <SelectItem value="90">90 min (1 h 30)</SelectItem>
                        <SelectItem value="120">120 min (2 h)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormFieldWrapper>
                </div>
              )}

              {/* STEP 7: TEAM */}
              {currentStep.id === 'team' && (
                <div className="space-y-4">
                  <div className="flex items-start gap-2.5 rounded-xl border border-info/40 bg-info/10 p-3.5 text-xs text-muted-foreground">
                    <Info className="mt-0.5 size-4 shrink-0 text-info" />
                    <p>
                      Les invitations ajoutées ici génèrent uniquement une liste
                      de préparation démo — aucun email d&apos;invitation réel
                      n&apos;est envoyé.
                    </p>
                  </div>

                  <div className="divide-y divide-border rounded-xl border border-border">
                    {draft.inviteList.map((inv, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs"
                      >
                        <div>
                          <p className="font-medium text-foreground">
                            {inv.email}
                          </p>
                          <p className="text-muted-foreground">
                            Rôle : {inv.role} · Statut : Brouillon démo
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() =>
                            updateDraft(
                              'inviteList',
                              draft.inviteList.filter((_, i) => i !== idx)
                            )
                          }
                        >
                          <Trash2 className="size-3.5 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-end gap-2">
                    <FormFieldWrapper
                      id="inv-email"
                      label="Email collaborateur"
                      className="flex-1 min-w-48"
                    >
                      <Input
                        id="inv-email"
                        type="email"
                        placeholder="prof@centre-demo.ma"
                        value={newInviteEmail}
                        onChange={(e) => setNewInviteEmail(e.target.value)}
                      />
                    </FormFieldWrapper>
                    <FormFieldWrapper
                      id="inv-role"
                      label="Rôle"
                      className="w-40"
                    >
                      <Select
                        value={newInviteRole}
                        onValueChange={(val) =>
                          setNewInviteRole(val ?? 'Professeur')
                        }
                      >
                        <SelectTrigger id="inv-role" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Secrétaire">Secrétaire</SelectItem>
                          <SelectItem value="Comptable">Comptable</SelectItem>
                          <SelectItem value="Professeur">Professeur</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormFieldWrapper>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (!newInviteEmail.includes('@')) return;
                        updateDraft('inviteList', [
                          ...draft.inviteList,
                          { email: newInviteEmail.trim(), role: newInviteRole },
                        ]);
                        setNewInviteEmail('');
                      }}
                    >
                      Ajouter à la liste
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 8: STUDENTS & GUARDIANS */}
              {currentStep.id === 'students-guardians' && (
                <div className="space-y-4 text-sm">
                  <FormFieldWrapper
                    id="onb-dedup"
                    label="Dédoublonnage des dossiers familles"
                  >
                    <Select
                      value={draft.dedupPolicy}
                      onValueChange={(val) =>
                        updateDraft(
                          'dedupPolicy',
                          val as 'phone_email' | 'manual'
                        )
                      }
                    >
                      <SelectTrigger id="onb-dedup" className="w-full max-w-md">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="phone_email">
                          Détection automatique par mobile (+212) ou email
                        </SelectItem>
                        <SelectItem value="manual">
                          Validation manuelle à l&apos;accueil
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormFieldWrapper>

                  <FormFieldWrapper
                    id="onb-guardian-priority"
                    label="Séparation contact financier / contact absence"
                  >
                    <Select
                      value={draft.guardianPriority}
                      onValueChange={(val) =>
                        updateDraft(
                          'guardianPriority',
                          val as 'primary_first' | 'finance_separate'
                        )
                      }
                    >
                      <SelectTrigger
                        id="onb-guardian-priority"
                        className="w-full max-w-md"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="finance_separate">
                          Autoriser un responsable financier distinct du contact
                          absence
                        </SelectItem>
                        <SelectItem value="primary_first">
                          Un seul responsable principal par défaut
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormFieldWrapper>
                </div>
              )}

              {/* STEP 9: FINANCE (CONDITIONAL: billing) */}
              {currentStep.id === 'finance' && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-border bg-muted/30 p-3.5 text-xs text-muted-foreground">
                    Devise verrouillée sur <strong>MAD (Dirham marocain)</strong>{' '}
                    · Les reçus et exports générés restent indicatifs (Mode Démo).
                  </div>

                  <FormFieldWrapper
                    id="onb-billing-cycle"
                    label="Périodicité d'échéance principale"
                    className="max-w-sm"
                  >
                    <Select
                      value={draft.billingCycle}
                      onValueChange={(val) =>
                        updateDraft(
                          'billingCycle',
                          val as 'mensuel' | 'trimestriel' | 'seance'
                        )
                      }
                    >
                      <SelectTrigger id="onb-billing-cycle" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mensuel">Mensuelle (1er–5 du mois)</SelectItem>
                        <SelectItem value="trimestriel">Trimestrielle</SelectItem>
                        <SelectItem value="seance">À la séance / carnet</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormFieldWrapper>

                  <div className="flex items-center justify-between rounded-xl border border-border p-3.5">
                    <div>
                      <p className="text-sm font-medium">
                        Autoriser les remises fratrie / bourses
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Configurable dans Tarifs &amp; remises (Lot 8)
                      </p>
                    </div>
                    <Switch
                      checked={draft.discountAllowed}
                      onCheckedChange={(v) => updateDraft('discountAllowed', v)}
                    />
                  </div>
                </div>
              )}

              {/* STEP 10: ATTENDANCE & QR */}
              {currentStep.id === 'attendance' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-xl border border-border p-3.5">
                    <div>
                      <p className="text-sm font-medium">
                        Mode de pointage disponible
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {hasModule('attendance.qr')
                          ? 'Module Scanner QR activé pour cette instance (simulation sans validation serveur).'
                          : 'Appel manuel uniquement (Scanner QR non inclus dans cette instance).'}
                      </p>
                    </div>
                    <span className="font-mono text-xs font-medium text-primary">
                      {hasModule('attendance.qr') ? 'Manuel + QR' : 'Manuel seul'}
                    </span>
                  </div>

                  <FormFieldWrapper
                    id="onb-abs-delay"
                    label="Délai avant signalement d'absence (minutes)"
                    className="max-w-xs"
                  >
                    <Input
                      id="onb-abs-delay"
                      type="number"
                      min={5}
                      max={60}
                      value={draft.absenceAlertDelayMin}
                      onChange={(e) =>
                        updateDraft('absenceAlertDelayMin', e.target.value)
                      }
                    />
                  </FormFieldWrapper>

                  <div className="flex items-center justify-between rounded-xl border border-border p-3.5">
                    <div>
                      <p className="text-sm font-medium">
                        Autoriser correction professeur après clôture
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Exigera un motif obligatoire dans le journal d&apos;appel
                      </p>
                    </div>
                    <Switch
                      checked={draft.allowTeacherCorrection}
                      onCheckedChange={(v) =>
                        updateDraft('allowTeacherCorrection', v)
                      }
                    />
                  </div>
                </div>
              )}

              {/* STEP 11: PARENT COMMUNICATION */}
              {currentStep.id === 'parent-comms' && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-border bg-muted/30 p-3.5 text-xs space-y-1">
                    <p className="font-medium text-foreground">
                      Canaux actifs dans cette instance :
                    </p>
                    <p className="text-muted-foreground">
                      In-App : {hasModule('messaging.inapp') ? 'Oui' : 'Non'} ·
                      Email : {hasModule('messaging.email') ? 'Oui' : 'Non'} ·
                      WhatsApp :{' '}
                      {hasModule('messaging.whatsapp') ? 'Oui' : 'Non'} · SMS :{' '}
                      {hasModule('messaging.sms') ? 'Oui' : 'Non'}
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormFieldWrapper
                      id="onb-quiet-start"
                      label="Début heures calmes (pas de relance)"
                    >
                      <Input
                        id="onb-quiet-start"
                        type="time"
                        value={draft.quietHoursStart}
                        onChange={(e) =>
                          updateDraft('quietHoursStart', e.target.value)
                        }
                      />
                    </FormFieldWrapper>
                    <FormFieldWrapper
                      id="onb-quiet-end"
                      label="Fin heures calmes"
                    >
                      <Input
                        id="onb-quiet-end"
                        type="time"
                        value={draft.quietHoursEnd}
                        onChange={(e) =>
                          updateDraft('quietHoursEnd', e.target.value)
                        }
                      />
                    </FormFieldWrapper>
                  </div>

                  <div className="rounded-xl border border-border p-4 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">
                        Aperçu modèle absence (Prévisualisation démo)
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateDraft(
                            'commsPreviewLang',
                            draft.commsPreviewLang === 'fr' ? 'ar' : 'fr'
                          )
                        }
                        className="text-primary hover:underline"
                      >
                        Basculer FR / AR
                      </button>
                    </div>
                    <p
                      dir={draft.commsPreviewLang === 'ar' ? 'rtl' : 'ltr'}
                      className="rounded-lg bg-muted/50 p-3 text-muted-foreground"
                    >
                      {draft.commsPreviewLang === 'ar'
                        ? 'السلام عليكم، نخبركم بتغيب التلميذ(ة) ياسين عن حصة الرياضيات اليوم على الساعة 16:30. (معاينة تجريبية)'
                        : `Bonjour Fatima Zohra, nous vous informons que Yassine était absent à la séance de Mathématiques à 16:30 au centre ${draft.commercialName}. (Aperçu démo — aucun envoi réel)`}
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 12: DOCUMENTS */}
              {currentStep.id === 'documents' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">
                      Pièces requises par défaut à l&apos;inscription
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "Fiche d'inscription signée",
                        'Règlement intérieur',
                        'Autorisation parentale',
                        'Attestation scolaire',
                        'Contrat professeur',
                      ].map((doc) => {
                        const active = draft.requiredDocs.includes(doc);
                        return (
                          <button
                            key={doc}
                            type="button"
                            onClick={() =>
                              updateDraft(
                                'requiredDocs',
                                active
                                  ? draft.requiredDocs.filter((d) => d !== doc)
                                  : [...draft.requiredDocs, doc]
                              )
                            }
                            className={cn(
                              'rounded-lg border px-3 py-1.5 text-xs',
                              active
                                ? 'border-primary bg-primary/10 text-primary font-medium'
                                : 'border-border text-muted-foreground'
                            )}
                          >
                            {doc}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <FormFieldWrapper
                    id="onb-doc-renew"
                    label="Durée de validité indicative (jours)"
                    className="max-w-xs"
                  >
                    <Input
                      id="onb-doc-renew"
                      type="number"
                      value={draft.docRenewalDays}
                      onChange={(e) =>
                        updateDraft('docRenewalDays', e.target.value)
                      }
                    />
                  </FormFieldWrapper>
                </div>
              )}

              {/* STEP 13: CALENDAR */}
              {currentStep.id === 'calendar' && (
                <div className="space-y-4">
                  <FormFieldWrapper
                    id="onb-cal-mode"
                    label="Mode de calendrier souhaité"
                  >
                    <Select
                      value={draft.calendarMode}
                      onValueChange={(val) =>
                        updateDraft(
                          'calendarMode',
                          val as 'internal' | 'internal_ics' | 'google_preview'
                        )
                      }
                    >
                      <SelectTrigger id="onb-cal-mode" className="w-full max-w-md">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="internal">
                          Calendrier interne uniquement
                        </SelectItem>
                        <SelectItem value="internal_ics">
                          Interne + Export .ics Apple Calendar
                        </SelectItem>
                        <SelectItem value="google_preview">
                          Interne + Maquette Google Calendar (OAuth non connecté)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormFieldWrapper>
                  <div className="flex items-center justify-between rounded-xl border border-border p-3.5">
                    <div>
                      <p className="text-sm font-medium">
                        Détection de collision salle / professeur / groupe
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Affiche le dialogue de résolution de conflit avant
                        validation
                      </p>
                    </div>
                    <Switch
                      checked={draft.conflictBlock}
                      onCheckedChange={(v) => updateDraft('conflictBlock', v)}
                    />
                  </div>
                </div>
              )}

              {/* STEP 14: FEEDBACK & SUPPORT */}
              {currentStep.id === 'feedback-support' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-xl border border-border p-3.5">
                    <div>
                      <p className="text-sm font-medium">
                        Anonymiser par défaut les enquêtes de satisfaction centre
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Séparation stricte entre avis centre et tickets produit
                        SaaS
                      </p>
                    </div>
                    <Switch
                      checked={draft.anonymizeCenterFeedback}
                      onCheckedChange={(v) =>
                        updateDraft('anonymizeCenterFeedback', v)
                      }
                    />
                  </div>
                </div>
              )}

              {/* STEP 15: INITIAL IMPORT PREVIEW */}
              {currentStep.id === 'initial-import' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-muted/30 p-4">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="size-6 text-primary" />
                      <div>
                        <p className="text-sm font-medium">
                          eleves_rentree_demo.csv (échantillon local fictif)
                        </p>
                        <p className="text-xs text-muted-foreground">
                          2 valides · 1 avertissement · 1 rejet — aucun envoi
                          serveur
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        updateDraft('importRunDone', true);
                        toast.success(
                          'Import simulé appliqué en mémoire (Mode Démo)'
                        );
                      }}
                    >
                      {draft.importRunDone
                        ? 'Import simulé effectué'
                        : 'Tester import simulé'}
                    </Button>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-border bg-muted/40 text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2">Ligne</th>
                          <th className="px-3 py-2">Élève</th>
                          <th className="px-3 py-2">Responsable</th>
                          <th className="px-3 py-2">Téléphone</th>
                          <th className="px-3 py-2">Statut</th>
                          <th className="px-3 py-2">Diagnostic</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {SAMPLE_CSV_PREVIEW.map((r) => (
                          <tr key={r.row}>
                            <td className="px-3 py-2 font-mono tabular-nums">
                              #{r.row}
                            </td>
                            <td className="px-3 py-2 font-medium">{r.student}</td>
                            <td className="px-3 py-2">
                              {r.guardian || '—'}
                            </td>
                            <td className="px-3 py-2 font-mono">{r.phone}</td>
                            <td className="px-3 py-2 font-medium">
                              {r.status === 'valide' ? (
                                <span className="text-success">Valide</span>
                              ) : r.status === 'avertissement' ? (
                                <span className="text-warning">
                                  Avertissement
                                </span>
                              ) : (
                                <span className="text-destructive">Rejet</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">
                              {r.note}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* STEP 16: SUMMARY & SIDEBAR PREVIEW */}
              {currentStep.id === 'summary' && (
                <div className="grid gap-6 lg:grid-cols-12">
                  <div className="space-y-4 lg:col-span-7">
                    <div className="rounded-xl border border-border p-4 space-y-2 text-sm">
                      <p className="font-semibold">
                        Résumé de l&apos;instance « {draft.commercialName} »
                      </p>
                      <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                        <p>
                          Plan :{' '}
                          <span className="font-medium text-foreground">
                            {activeCenter.plan}
                          </span>
                        </p>
                        <p>
                          Sous-domaine :{' '}
                          <span className="font-mono text-foreground">
                            {draft.subdomain}.markazflow.demo
                          </span>
                        </p>
                        <p>
                          Sites configurés :{' '}
                          <span className="font-medium text-foreground">
                            {draft.sites.length}
                          </span>
                        </p>
                        <p>
                          Modules actifs :{' '}
                          <span className="font-mono font-medium text-foreground">
                            {activeCenter.enabledModules.length} /{' '}
                            {ALL_MODULES.length}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border p-4 space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Contrôle des étapes conditionnelles
                      </p>
                      <div className="grid gap-1.5 sm:grid-cols-2 text-xs">
                        {activeSteps
                          .filter((s) => s.id !== 'summary' && s.id !== 'post-launch')
                          .map((s) => {
                            const done = draft.completedStepIds.includes(s.id);
                            const skipped = draft.skippedStepIds.includes(s.id);
                            return (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => goToStep(s.id)}
                                className="flex items-center justify-between rounded-lg border border-border px-2.5 py-1.5 text-left hover:bg-muted"
                              >
                                <span className="truncate">{s.shortLabel}</span>
                                <span
                                  className={cn(
                                    'text-[11px] font-medium',
                                    done
                                      ? 'text-success'
                                      : skipped
                                        ? 'text-warning'
                                        : 'text-muted-foreground'
                                  )}
                                >
                                  {done
                                    ? 'Configurée'
                                    : skipped
                                      ? 'Ignorée'
                                      : 'À revoir'}
                                </span>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  </div>

                  {/* Resulting Director Sidebar Preview */}
                  <div className="lg:col-span-5">
                    <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        <Eye className="size-4 text-primary" />
                        Aperçu du menu Directeur généré
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Dérivé dynamiquement de{' '}
                        <code className="font-mono">
                          {activeCenter.enabledModules.length}
                        </code>{' '}
                        modules autorisés.
                      </p>
                      <div className="max-h-72 space-y-3 overflow-y-auto pr-1 text-xs">
                        {directorPreviewGroups.map((g) => (
                          <div key={g.id} className="space-y-1">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                              {g.label}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {g.items.map((item) => (
                                <span
                                  key={item.id}
                                  className="rounded-md border border-border bg-background px-2 py-0.5 text-[11px]"
                                >
                                  {item.label}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 17: POST-LAUNCH GUIDED CHECKLIST */}
              {currentStep.id === 'post-launch' && (
                <div className="space-y-5">
                  <div className="flex items-start gap-3 rounded-xl border border-success/40 bg-success/10 p-4">
                    <ShieldCheck className="mt-0.5 size-5 shrink-0 text-success" />
                    <div className="space-y-1 text-sm">
                      <p className="font-semibold text-foreground">
                        Instance prête en Mode Démo
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Vous pouvez maintenant ouvrir le tableau de bord
                        Directeur, ajuster vos modules depuis le Super Admin ou
                        relancer n&apos;importe quelle étape.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Checklist de première connexion (modifiable)
                    </p>
                    {[
                      {
                        id: 'c1',
                        label: 'Identité du centre & sous-domaine enregistrés',
                      },
                      {
                        id: 'c2',
                        label: 'Créer le premier groupe de soutien (Lot 5)',
                      },
                      {
                        id: 'c3',
                        label: 'Associer les premiers élèves & responsables (Lot 4)',
                      },
                      {
                        id: 'c4',
                        label: 'Vérifier les permissions des comptes secrétariat / comptable',
                      },
                    ].map((task) => (
                      <label
                        key={task.id}
                        className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3 text-sm hover:bg-muted/40"
                      >
                        <Checkbox
                          checked={Boolean(checklistState[task.id])}
                          onCheckedChange={(v) =>
                            setChecklistState((prev) => ({
                              ...prev,
                              [task.id]: Boolean(v),
                            }))
                          }
                        />
                        <span
                          className={cn(
                            checklistState[task.id] &&
                              'line-through text-muted-foreground'
                          )}
                        >
                          {task.label}
                        </span>
                      </label>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="button"
                      onClick={() => {
                        switchRole('director');
                        router.push('/admin/dashboard');
                      }}
                      className="gap-2"
                    >
                      Ouvrir le tableau de bord Directeur
                      <ArrowRight className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        switchRole('super_admin');
                        router.push('/super/instances');
                      }}
                      className="gap-2"
                    >
                      <RefreshCw className="size-4" />
                      Modifier les modules en Super Admin
                    </Button>
                  </div>
                </div>
              )}

              {/* Footer Navigation Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrev}
                  disabled={resolvedStepIndex === 0}
                  className="gap-1.5"
                >
                  <ArrowLeft className="size-4" />
                  Précédent
                </Button>

                <div className="flex flex-wrap items-center gap-2">
                  {currentStep.optional && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleSkip}
                      className="gap-1.5 text-muted-foreground"
                    >
                      <SkipForward className="size-4" />
                      Ignorer
                    </Button>
                  )}

                  {currentStep.id !== 'post-launch' && (
                    <Button
                      type="button"
                      onClick={handleNext}
                      className="gap-1.5"
                    >
                      {currentStep.id === 'summary'
                        ? 'Valider la mise en service'
                        : 'Continuer'}
                      <ArrowRight className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            <p>
              Assistant adaptatif Mode Démo : aucune donnée réelle n&apos;est
              envoyée vers un serveur et aucune invitation email/SMS n&apos;est
              expédiée.
            </p>
          </div>
        </main>
      </div>

      <UnsavedChangesDialog
        open={confirmExitOpen}
        onOpenChange={setConfirmExitOpen}
        onDiscard={() => {
          setConfirmExitOpen(false);
          router.push('/admin/dashboard');
        }}
      />

      <ConfirmDialog
        open={confirmLaunchOpen}
        onOpenChange={setConfirmLaunchOpen}
        title="Valider la mise en service de démonstration ?"
        description={`Votre centre « ${draft.commercialName} » sera initialisé localement avec les ${activeCenter.enabledModules.length} modules actifs du plan ${activeCenter.plan}.`}
        consequences={[
          'Enregistrement du brouillon complet dans le navigateur',
          'Activation de la checklist post-onboarding (Étape 17)',
          'Aucun envoi réel d’email ou facturation SaaS',
        ]}
        confirmLabel="Valider et lancer"
        onConfirm={handleLaunchConfirm}
      />
    </div>
  );
}
