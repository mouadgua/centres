# MarkazFlow — Frontend Prototype (Mode Démo)

Application frontend SaaS multi-tenant white-label dédiée à la gestion des centres de soutien scolaire au Maroc (`fr-MA`, devise `MAD`, fuseau `Africa/Casablanca`).

> **Avertissement prototype :** Ce dépôt contient exclusivement le frontend en **Mode Démo** avec données 100 % fictives. Aucune API backend, base de données, authentification serveur, paiement en ligne, envoi SMS/WhatsApp/Email réel ou synchronisation OAuth n'est implémenté.

## Stack technique (auditée)

- **Framework :** Next.js `15.4.9` (App Router) & React `19.2.1`
- **Langage :** TypeScript `5.9.3` (`strict: true`)
- **Styles & Composants :** Tailwind CSS `4.1.11`, `shadcn/ui` (`base-nova` / `@base-ui/react`), `lucide-react`
- **Thème & Notifications :** `next-themes` (`Clair / Sombre / Système`), `sonner`
- **Polices :** `Plus Jakarta Sans` (titres), `DM Sans` (corps), `JetBrains Mono` (données tabulaires)

## Installation & scripts

```bash
npm install
npm run dev      # Serveur de développement (port 3000)
npm run lint     # Vérification ESLint
npm run build    # Build de production Next.js
```

## Architecture actuelle (Lots 1 à 8)

```text
app/
  layout.tsx                      # Polices, métadonnées, AppProviders
  globals.css                     # Tokens sémantiques light/dark, tabular-nums, reduce-motion
  page.tsx                        # Landing SaaS complète, presets, 7 rôles & FAQ
  demo/page.tsx                   # Console de bascule rôle, centre, thème et modules
  onboarding/page.tsx             # Wizard d'onboarding conditionnel en 17 étapes
  (marketing)/                    # /features, /pricing, /contact, /legal/{privacy,terms}
  (auth-demo)/                    # /sign-in, /forgot-password, /verify (simulation)
  (workspace)/
    layout.tsx                    # AppShell + ProfilesProvider + PedagogyProvider + AttendanceProvider + FinanceProvider
    admin/                        # /dashboard, /students/*, /guardians/*, /teachers/*, /users, /subjects, /groups, /enrollments, /locations, /sessions, /resources, /calendar, /attendance, /payments, /dues, /overdue, /pricing, /refunds, /payroll, /expenses, /reports, /accounting, /notifications, /ui-kit
    super/                        # /dashboard, /modules, /instances, /centers/*, /onboarding, /users, /subscriptions, /billing, /analytics, /support, /incidents, /audit, /settings
    teacher/, student/, parent/   # Espaces d'entrée par rôle (/teacher/scan, /student/qr)
    [...slug]/page.tsx            # Placeholders typés sous ModuleGate (Lots 9–11)
components/
  providers/app-providers.tsx
  marketing/                      # MarketingHeader, MarketingFooter
  shell/                          # AppShell, AppSidebar, AppHeader, CommandPalette (cmdk), NavIcon
  tables/                         # DataTable (TanStack v8)
  forms/                          # FormFieldWrapper, CurrencyInput, PhoneInputMA
  feedback/                       # ModuleGate, CapabilityGate, ConfirmDialog, States, UnsavedChangesGuard
  attendance/                     # QrCodeSvg, QrCameraScanner (lazy-loaded)
  ui/                             # Composants shadcn/ui
features/
  onboarding-wizard/              # OnboardingWizard + configuration conditionnelle 17 étapes
  super-admin/                    # InstanceConfigurator (57 modules, dépendances, diff, instantané)
  calendar/                       # CalendarBoard (7 vues, drag & drop, conflits, récurrence, ICS)
lib/
  mock-api/{demo-data,super-admin-data,profiles-data,pedagogy-data,attendance-data,finance-data}.ts
  permissions/navigation.ts       # Arborescence filtrée par rôle & modules
  format/{morocco,ics,csv}.ts     # Formatage MAD, RFC-5545 ICS & export CSV protégé
stores/
  demo-session-context.tsx        # État Mode Démo + persistance locale fictive
  profiles-context.tsx            # État en mémoire Élèves, Responsables, Professeurs, Staff & Permissions
  pedagogy-context.tsx            # État en mémoire Matières, Groupes, Inscriptions, Salles, Séances & Supports
  attendance-context.tsx          # État en mémoire Pointages, Journaux QR & Alertes d'absences
  finance-context.tsx             # État en mémoire Encaissements, Échéances, Tarifs, Remboursements, Paie & Dépenses
types/
  {core,profiles,pedagogy,attendance,finance}.ts # Contrats TypeScript principaux, profils, pédagogie, QR & finances
```

## Instances et profils fictifs disponibles

Trois configurations modulaires permettent de vérifier le filtrage dynamique :
1. **Al-Noor Soutien (Rabat — Essentiel)** : socle pédagogique, présences manuelles, encaissements de base.
2. **Académie Atlas (Casablanca — Plus)** : ajoute QR démo, contacts familles, relances, documents, marque blanche.
3. **Campus Horizon (Marrakech — Tout-en-un)** : active l'ensemble des 57 modules (dont Studio de données, paie professeurs et portail parent).
