# AVANCEMENT — MarkazFlow (Prototype Frontend SaaS Soutien Scolaire)

## Tableau de progression par lot / module

| Lot | Périmètre | Statut | Notes |
|---|---|---|---|
| **Lot 1** | Design foundation, tokens, shell, thèmes, navigation démo & `ModuleGate` | **Terminé (validé)** | Socle validé par l'utilisateur |
| **Lot 2** | Navigation avancée & UI kit (DataTable, RHF+Zod, AlertDialog, Command `cmdk`) | **Terminé (corrigé)** | Correctif `DropdownMenuLabel` (`MenuGroupContext`) appliqué |
| **Lot 3** | Landing, onboarding adaptatif, auth démo & Super Admin (configurateur modules) | **Terminé (validé)** | Parcours public, onboarding et console Super Admin validés |
| **Lot 4** | Dashboard avancé & administration des profils (Élèves, Parents, Profs, Staff) | **Terminé (validé)** | Profils & dashboard validés par l'utilisateur |
| **Lot 5** | Pédagogie (Matières, Groupes, Inscriptions, Salles, Séances, Supports) | **Terminé (validé)** | Pédagogie validée par l'utilisateur |
| **Lot 6** | Calendrier interne (vues, répétitions, conflits, export ICS) | **Terminé (validé)** | Calendrier interne validé par l'utilisateur |
| **Lot 7** | Présences QR (admin, scan prof, QR étudiant, états fraude simulés) | **Terminé (validé)** | Build & lint validés (correctifs `GlobalBanner`/`EmptyState`/`SessionRecord`), validé par l'utilisateur |
| **Lot 8** | Finances (Encaissements, Échéances, Impayés, Tarifs, Paie, Rapports) | **Terminé (en attente validation)** | Prêt pour revue utilisateur avant Lot 9 |
| Lot 9 | Studio de données (Tableur, copier-coller, Import 7 étapes, Export templates) | À faire | — |
| Lot 10 | Communication famille, Documents, Feedback, Intégrations, Cartes, Branding | À faire | — |
| Lot 11 | Espaces Prof / Étudiant / Parent + Secrétaire / Comptable | À faire | — |
| Lot 12 | QA terrain frontend (E2E, budgets JS, accessibilité, 3 instances modulaires) | À faire | — |

## Checklist des pages Lot 1, Lot 2 & Lot 3

- [x] `/` — Landing SaaS complète, presets interactifs, 7 rôles, FAQ & CTA
- [x] `/features` — Catalogue filtrable des 57 modules
- [x] `/pricing` — Tarifs en MAD (Mensuel/Annuel) & matrice de comparaison
- [x] `/contact` — Demande de démo commerciale simulée (RHF + Zod)
- [x] `/legal/privacy` & `/legal/terms` — Mentions prototype & politique démo
- [x] `/sign-in`, `/forgot-password`, `/verify` — Auth démo & simulation essai expiré / centre suspendu
- [x] `/onboarding` — Assistant d'onboarding conditionnel en 17 étapes (`localStorage` + aperçu FR/AR RTL)
- [x] `/demo` — Console de bascule rôle, centre, thème et modules
- [x] `/admin/dashboard` — Vue d'ensemble Directeur / Secrétaire / Comptable
- [x] `/admin/notifications` — Centre de notifications interactif + préférences
- [x] `/admin/ui-kit` — Galerie interne des composants transversaux Lot 2
- [x] `/super/dashboard` — Vue globale Super Admin (agrégée sans PII élève)
- [x] `/super/modules` — Catalogue des 57 modules avec tiroir de détail
- [x] `/super/instances` & `/super/centers/[id]/configuration` — Configurateur de modules & dépendances
- [x] `/super/centers`, `/super/centers/new`, `/super/centers/[id]` — Gestion des centres (sans PII)
- [x] `/super/onboarding`, `/super/users`, `/super/subscriptions`, `/super/billing`, `/super/analytics`, `/super/support`, `/super/incidents`, `/super/audit`, `/super/settings`
- [x] `/teacher`, `/student`, `/parent`, `/[...slug]` — Espaces d'entrée & placeholders typés sous `ModuleGate`
- [x] `/admin/dashboard` (avancé) — KPI dynamiques, graphiques CSS légers, personnalisation de widgets, rappels & export JSON
- [x] `/admin/students`, `/admin/students/new`, `/admin/students/[id]` — Liste filtrable, création RHF+Zod & fiche élève 8 onglets
- [x] `/admin/guardians`, `/admin/guardians/[id]` — Détection de doublons, fusion, multi-enfants, consentements modulaires & contact restreint
- [x] `/admin/teachers`, `/admin/teachers/[id]` — Liste, création RHF+Zod, fiche 9 onglets & simulateur de paie indicatif
- [x] `/admin/users` — Équipe administrative, invitation, suspension avec motif & matrice de permissions interactive
- [x] `/admin/subjects` — Matières, couleurs, niveaux, professeurs par défaut, doublons & archivage
- [x] `/admin/groups` — Vues cartes/tableau, occupation, liste d'attente, conflits & suggestion de créneau libre
- [x] `/admin/enrollments` — Assistant d'inscription en 3 étapes, remises, transferts, motif & reçu démo
- [x] `/admin/locations` — Sites, salles, matériel, planning d'occupation & simulation géocodage
- [x] `/admin/sessions` — Tableau/timeline, arbitrage de conflits, récurrence (`cette séance` / `futures`) & liens appel/paie
- [x] `/admin/resources` — Dépôt temporaire `object URL`, aperçu, tags, visibilité & simulation quota
- [x] `/admin/calendar` — Calendrier interne 7 vues, drag & drop, répétitions, arbitrage de conflits, export/import `.ics` local & statut Apple/Google Calendar
- [x] `/admin/attendance`, `/teacher/scan`, `/student/qr` — Grille d'appel & corrections justifiées, scanner QR lazy-loadé + simulateur 7 cas fraude/erreur, carte QR étudiant démo
- [x] `/admin/payments`, `/admin/dues`, `/admin/overdue`, `/admin/pricing`, `/admin/refunds`, `/admin/payroll`, `/admin/expenses`, `/admin/reports`, `/admin/accounting` — Suite Finances complète (contrepassations, échéancier, relances simulées, paie indicative, dossier comptable)

## Journal d'avancement (append-only)

## 2026-11-25 13:00 — Lot #01 — Design foundation & shell
- Objectif : Auditer le dépôt initial, initialiser `shadcn/ui`, poser la charte graphique, les tokens light/dark, les polices, le shell responsive (sidebar + header + thème + sélecteur démo), `ModuleGate` et les pages d'entrée par rôle.
- Pages/routes créées ou modifiées : `/`, `/demo`, `/admin/dashboard`, `/super/dashboard`, `/teacher`, `/student`, `/parent`, `/(workspace)/[...slug]`.
- Composants et bibliothèques utilisés : Next.js 15.4.9, React 19.2.1, Tailwind CSS 4.1.11, shadcn/ui (`base-nova` / `@base-ui/react`), `next-themes`, `sonner`, `lucide-react`. Composants créés : `AppProviders`, `AppShell`, `AppSidebar`, `AppHeader`, `NavIcon`, `ModuleGate`, `CapabilityGate`.
- Fichiers ajoutés/modifiés/supprimés : `metadata.json`, `components.json`, `app/globals.css`, `app/layout.tsx`, `app/page.tsx`, `app/demo/page.tsx`, `app/(workspace)/layout.tsx`, `app/(workspace)/admin/dashboard/page.tsx`, `app/(workspace)/super/dashboard/page.tsx`, `app/(workspace)/teacher/page.tsx`, `app/(workspace)/student/page.tsx`, `app/(workspace)/parent/page.tsx`, `app/(workspace)/[...slug]/page.tsx`, `types/core.ts`, `lib/format/morocco.ts`, `lib/mock-api/demo-data.ts`, `lib/permissions/navigation.ts`, `stores/demo-session-context.tsx`, `components/ui/*`, `AVANCEMENT.md`, `README_FRONTEND.md`.
- Interactions implémentées : Bascule Clair/Sombre/Système sans flash + toggle Réduire les animations ; réduction de sidebar en rail d'icônes, masquage/affichage complet, drawer mobile `Sheet` ; recherche rapide (`Cmd/Ctrl+K`) et aide (`?`) ; bascule des 7 profils démo et des 3 centres fictifs (`Essentiel`, `Plus`, `Tout-en-un`) ; activation/désactivation de modules en direct dans `/demo` ; notifications avec lecture/marquer tout lu ; filtre période et site sur `/admin/dashboard`.
- Données mock et scénarios : 3 centres fictifs marocains (`Al-Noor Soutien` Rabat, `Académie Atlas` Casablanca, `Campus Horizon` Marrakech), 7 profils démo, catalogue de 57 clés de modules, séances du jour et encaissements en MAD (`Africa/Casablanca`).
- États couverts (loading/empty/error/success/offline) : État actif/autorisé, état `Module non activé` (`ModuleGate`), état `Accès refusé pour ce profil` (`ModuleGate`), état vide notifications et séances filtrées, toasts de confirmation.
- Responsive / accessibilité / performance : Sidebar bascule en `Sheet` sur mobile, navigation basse <= 4 items pour Prof/Étudiant/Parent sur mobile, contrastes light/dark configurés, `tabular-nums` sur tous les chiffres, support `prefers-reduced-motion` et `.reduce-motion`, aucune bibliothèque lourde (tableur, carte, QR) chargée dans le Lot 1.
- Tests exécutés + résultats : `npm run build` (`compile_applet`) réussi ; `npm run lint` (`lint_applet` / `eslint .`) réussi avec 0 erreur et 0 avertissement.
- Erreurs rencontrées + corrections : 1) `DropdownMenuItem` (`@base-ui/react`) requiert `render` au lieu de `asChild` dans `/admin/dashboard` (corrigé). 2) `eslint-config-next` 16 signale `react-hooks/set-state-in-effect` sur `AppHeader`, `useIsMobile` et `DemoSessionProvider` (corrigé via `useSyncExternalStore`).
- Limites / non fonctionnel faute de backend : Aucune authentification réelle, aucune base de données, aucun envoi email/SMS/WhatsApp réel, aucune synchronisation Google/Apple Calendar réelle, aucun paiement ni vérification QR serveur ; la persistance locale (`localStorage`) ne stocke que les préférences démo fictives.
- Décisions et raisons : Conservation de la structure racine `/app`, `/components`, `/lib`, `/hooks` avec ajout de `/types` et `/stores` pour respecter `tsconfig.json` (`@/*`) sans casser l'existant ; choix de `Plus Jakarta Sans` + `DM Sans` + `JetBrains Mono` pour la hiérarchie éditoriale et les chiffres tabulaires.
- Prochain lot proposé : Lot 2 — Navigation avancée & UI kit (DataTable TanStack, formulaires React Hook Form + Zod, AlertDialog, bannières, skeletons, Command Palette `cmdk`, page `/admin/notifications` et galerie interne de composants).
- Validation utilisateur requise : Oui

## 2026-11-26 01:55 — Correctif serveur dev (Lot #01)
- Objectif : Résoudre le non-démarrage du serveur de développement (`sh: 1: next: not found`).
- Action : Réinstallation des dépendances via `install_applet_dependencies`, vérification du démarrage `next dev` (`Ready in 2.4s`) et redémarrage du serveur de développement (`restart_dev_server`).

## 2026-11-26 02:06 — Lot #02 — Navigation avancée & UI kit
- Objectif : Construire le kit d'interface réutilisable complet (`DataTable` TanStack, formulaires React Hook Form + Zod, `ConfirmDialog`, bannières, skeletons, états vide/erreur/offline, garde de modifications non enregistrées), la palette de commandes `cmdk`, le centre de notifications complet et la galerie UI Kit interne.
- Pages/routes créées ou modifiées : `/admin/notifications`, `/admin/ui-kit` (nouvelles), `AppHeader` (remplacement recherche simple par `CommandPalette`).
- Composants et bibliothèques utilisés : `@tanstack/react-table`, `react-hook-form`, `zod`, `cmdk`, shadcn `alert-dialog`, `checkbox`, `select`, `textarea`, `popover`. Composants créés : `DataTable`, `CommandPalette`, `ConfirmDialog`, `EmptyState`, `ErrorState`, `GlobalBanner`, `TableSkeleton`, `CardsSkeleton`, `useUnsavedChangesGuard`, `UnsavedChangesDialog`, `FormFieldWrapper`, `CurrencyInput`, `PhoneInputMA`.
- Fichiers ajoutés/modifiés/supprimés : `components/tables/data-table.tsx`, `components/shell/command-palette.tsx`, `components/feedback/confirm-dialog.tsx`, `components/feedback/states.tsx`, `components/feedback/unsaved-changes-guard.tsx`, `components/forms/form-field.tsx`, `components/ui/{alert-dialog,checkbox,select,textarea,popover}.tsx`, `components/shell/app-header.tsx`, `stores/demo-session-context.tsx`, `lib/permissions/navigation.ts`, `app/(workspace)/admin/notifications/page.tsx`, `app/(workspace)/admin/ui-kit/page.tsx`, `AVANCEMENT.md`.
- Interactions implémentées : Tri multi-colonnes, recherche live, filtres facettes, afficher/masquer colonnes, sélection multiple avec barre d'actions groupées et confirmation destructive typée (`ARCHIVER`) ; formulaire RHF+Zod avec erreurs par champ, toast avec `Annuler` et garde `UnsavedChangesDialog` ; `ConfirmDialog` avec motif obligatoire ; suppression de notification avec `Annuler` ; simulateur d'alertes ; palette `cmdk` (`⌘K`) filtrée par rôle et modules actifs.
- Données mock et scénarios : Jeu d'essai élèves/tarifs MAD dans la galerie UI Kit, notifications interactives persistées en mode démo, recherche `cmdk` sur séances du jour et encaissements autorisés.
- États couverts (loading/empty/error/success/offline) : `TableSkeleton`, `CardsSkeleton`, `EmptyState` (vide initial + aucun résultat), `ErrorState` (500 + offline avec réessayer), `GlobalBanner` (info, warning dismissible, destructive sticky), toasts succès/annuler.
- Responsive / accessibilité / performance : Cartes mobiles optionnelles dans `DataTable` (`renderMobileCard`), navigation clavier complète `cmdk` et `AlertDialog`, labels/erreurs `aria-invalid` et `role="alert"` sur les champs RHF.
- Tests exécutés + résultats : `npm run build` (`compile_applet`) réussi ; `npm run lint` (`lint_applet` / `eslint .`) réussi avec 0 erreur (2 avertissements React Compiler attendus sur `useReactTable` et `form.watch`).
- Erreurs rencontrées + corrections : 1) Import inutilisé `AlertTriangle` supprimé dans `app/(workspace)/admin/ui-kit/page.tsx`. 2) `@tanstack/react-table` v9.3.1 installé initialement n'exportait pas `useReactTable` ; rétrogradé vers `@tanstack/react-table@^8.21.2` stable.
- Limites / non fonctionnel faute de backend : Les validations, notifications et ajouts dans la galerie UI Kit restent en mémoire locale / démo ; aucune persistance serveur.
- Décisions et raisons : Utilisation de `DataTable` avec `renderMobileCard` pour éviter d'écraser les tableaux denses sur écran 360–390 px ; séparation stricte entre `ConfirmDialog` standard, saisie de confirmation (`requireTypedText`) et motif obligatoire (`requireReason`) pour les futures écritures financières et suppressions en masse.
- Prochain lot proposé : Lot 3 — Landing, onboarding adaptatif conditionnel, auth démo et Super Admin (catalogue de 57 modules, configurateur d'instances par centre, presets, matrice de permissions et simulation d'impact).
- Validation utilisateur requise : Oui

## 2026-11-26 02:10 — Correctif runtime Base UI (Lot #02)
- Objectif : Résoudre l'erreur runtime `Base UI: MenuGroupContext is missing` déclenchée par `DropdownMenuLabel` dans `AppHeader` et `DataTable`.
- Fichier modifié : `components/ui/dropdown-menu.tsx` (remplacement de `MenuPrimitive.GroupLabel` par un `<div>` stylé afin d'éviter la dépendance stricte à `<Menu.Group>`).

## 2026-11-26 02:25 — Lot #03 — Landing, onboarding adaptatif, auth démo & Super Admin
- Objectif : Construire les pages publiques SaaS, le parcours d'authentification démo, le wizard d'onboarding adaptatif en 17 étapes piloté par les modules actifs, et la console complète Super Admin (catalogue 57 modules, configurateur d'instances avec gestion explicite des dépendances, centres, abonnements, facturation MAD, support, incidents et audit).
- Pages/routes créées ou modifiées : `/`, `/features`, `/pricing`, `/contact`, `/legal/privacy`, `/legal/terms`, `/sign-in`, `/forgot-password`, `/verify`, `/onboarding`, `/super/modules`, `/super/instances`, `/super/centers`, `/super/centers/new`, `/super/centers/[id]`, `/super/centers/[id]/configuration`, `/super/onboarding`, `/super/users`, `/super/subscriptions`, `/super/billing`, `/super/analytics`, `/super/support`, `/super/incidents`, `/super/audit`, `/super/settings`, `/super/dashboard`.
- Composants et bibliothèques utilisés : `react-hook-form`, `zod`, `@tanstack/react-table`, `lucide-react`, `sonner`, `ConfirmDialog`, `UnsavedChangesDialog`, `ModuleGate`. Composants créés : `MarketingHeader`, `MarketingFooter`, `OnboardingWizard`, `InstanceConfigurator`.
- Fichiers ajoutés/modifiés/supprimés : `lib/mock-api/super-admin-data.ts`, `components/marketing/marketing-shell.tsx`, `stores/demo-session-context.tsx`, `features/onboarding-wizard/{onboarding-config,onboarding-wizard}.tsx`, `features/super-admin/instance-configurator.tsx`, `app/page.tsx`, `app/(marketing)/*`, `app/(auth-demo)/*`, `app/onboarding/page.tsx`, `app/(workspace)/super/*`, `AVANCEMENT.md`.
- Interactions implémentées : Calcul en direct des étapes actives d'onboarding selon l'instance (11–17 étapes), sauvegarde de brouillon `localStorage` sans détruire les étapes devenues inactives, aperçu FR/AR RTL + clair/sombre, erreur simulée sous-domaine `pris`, import CSV démo, configurateur Super Admin avec dialogue de confirmation de chaîne de dépendances (aucune activation silencieuse), aperçu en temps réel du menu Directeur résultant, restauration du dernier instantané, création/suspension de centre démo, fil de tickets support et simulation essai expiré / centre suspendu.
- Données mock et scénarios : 3 centres fictifs + création dynamique de nouveaux centres en mémoire locale, tarifs MAD indicatifs, staff SaaS fictif, abonnements, factures, tickets support, incidents et logs d'audit.
- États couverts (loading/empty/error/success/offline) : Simulation réseau offline dans l'onboarding, conflit sous-domaine 409, centre introuvable 404, suspension centre avec motif obligatoire, accès refusé `ModuleGate` si un rôle autre que `super_admin` ouvre `/super/*`.
- Responsive / accessibilité / performance : Sommaire d'onboarding en drawer `Sheet` sur mobile et barre latérale repliable sur bureau ; aucune PII élève dans les écrans Super Admin ; pas de dépendance tableur ou carte importée dans la landing ou l'onboarding.
- Tests exécutés + résultats : `npm run build` (`compile_applet`) et `npm run lint` (`lint_applet`) exécutés à la fin du lot.
- Erreurs rencontrées + corrections : Prise en compte du comportement `@base-ui/react` (`render` prop, `SelectLabel` réservé aux `SelectGroup`).
- Limites / non fonctionnel faute de backend : Aucune authentification réelle, aucun envoi d'invitation ou email, aucune facturation Stripe/CMI réelle ; les configurations sont conservées dans `localStorage`.
- Décisions et raisons : Extraction de `InstanceConfigurator` et `onboarding-config.ts` pour garantir que la même logique de capacités régit à la fois la prévisualisation Super Admin et le wizard d'onboarding du Directeur.
- Prochain lot proposé : Lot 4 — Dashboard avancé et administration des profils (Élèves, Parents & Responsables multi-contacts/consentements, Professeurs, Staff & matrice de permissions).
- Validation utilisateur requise : Oui

## 2026-11-26 02:40 — Lot #04 — Dashboard avancé & administration des profils (+ correctif cache dark mode Base UI)
- Objectif : Enrichir `/admin/dashboard` avec KPI réactifs et personnalisation de widgets, construire les parcours complets d'administration des Élèves, Parents/Responsables, Professeurs et Staff (matrice de permissions), et assainir définitivement le cache `.next` suite à l'erreur `Base UI: MenuGroupContext is missing` lors de l'ouverture du menu Apparence / thème sombre.
- Pages/routes créées ou modifiées : `/admin/dashboard`, `/admin/students`, `/admin/students/new`, `/admin/students/[id]`, `/admin/guardians`, `/admin/guardians/[id]`, `/admin/teachers`, `/admin/teachers/[id]`, `/admin/users`, `app/(workspace)/layout.tsx`.
- Composants et bibliothèques utilisés : `@tanstack/react-table`, `react-hook-form`, `zod`, `lucide-react`, `sonner`, `DataTable`, `ConfirmDialog`, `UnsavedChangesDialog`, `ModuleGate`, `CapabilityGate`, `FormFieldWrapper`, `PhoneInputMA`, `Sheet`, `Tabs`, `Switch`. Store créé : `ProfilesProvider` (`useProfilesStore`).
- Fichiers ajoutés/modifiés/supprimés : `types/profiles.ts`, `lib/mock-api/profiles-data.ts`, `stores/profiles-context.tsx`, `app/(workspace)/layout.tsx`, `app/(workspace)/admin/dashboard/page.tsx`, `app/(workspace)/admin/students/{page,new/page,[id]/page}.tsx`, `app/(workspace)/admin/guardians/{page,[id]/page}.tsx`, `app/(workspace)/admin/teachers/{page,[id]/page}.tsx`, `app/(workspace)/admin/users/page.tsx`, `AVANCEMENT.md`, `README_FRONTEND.md`.
- Interactions implémentées :
  - `/admin/dashboard` : KPI liés en direct à `useProfilesStore` et filtrés par période/site, lien direct vers impayés (`/admin/students?filter=overdue`), tiroir `Personnaliser` pour masquer/afficher les blocs, graphiques barres CSS (`Données démo`), export synthèse JSON.
  - Élèves : recherche, filtres niveau/impayés, affectation de groupe en masse, archivage sécurisé (`ARCHIVER`), création RHF+Zod avec garde de modifications non enregistrées et liaison responsable, fiche 8 onglets (aperçu, responsables, groupes, présences, finances, documents, notes, historique) + transfert de groupe et QR démo.
  - Responsables : détection automatique des doublons par numéro, fusion confirmée avec transfert des élèves rattachés, actions directes `tel:` / `mailto:` / `wa.me`, prévisualisation de message (`Prévisualisé (démo)`), gestion fine des consentements par canal/catégorie sous `ModuleGate`, heures calmes et bascule « contact interdit / retiré » avec motif obligatoire.
  - Professeurs : création RHF+Zod, rémunération conditionnée aux rôles `director`/`accountant` et au module `payroll`, fiche 9 onglets et calculateur de paie indicatif interactif en MAD (mention non contractuelle).
  - Staff & Rôles : ajout de membre démo, suspension/réactivation avec motif obligatoire, matrice de permissions interactive avec confirmation et avertissement RBAC serveur.
- Données mock et scénarios : Jeux de données marocains référentiels pour les 3 centres (`Al-Noor Soutien`, `Académie Atlas`, `Campus Horizon`), incluant un doublon volontaire de téléphone responsable (`gua-1` & `gua-4`) pour tester la détection et la fusion.
- États couverts (loading/empty/error/success/offline) : `ErrorState` 404 sur ID élève/responsable/professeur inconnu, accès refusé `ModuleGate` par rôle/module, états vides filtrés, confirmations destructives avec saisie ou motif obligatoire, toasts de confirmation.
- Responsive / accessibilité / performance : Cartes mobiles dans `DataTable`, tableaux responsives avec défilement horizontal si nécessaire, `tabular-nums` sur tous les montants MAD et compteurs, contrastes clair/sombre respectés, zéro librairie chart lourde ajoutée.
- Tests exécutés + résultats : `npm run build` (`compile_applet`) et `npm run lint` (`lint_applet`) passés après correction du helper `createConsentHistoryEntry`, purge du cache `.next` (`rm -rf .next`) et redémarrage du serveur de développement (`restart_dev_server`) pour éliminer les chunks Webpack obsolètes qui contenaient encore `MenuPrimitive.GroupLabel`.
- Erreurs rencontrées + corrections : 1) `eslint` `react-hooks/purity` sur `Date.now()` dans `app/(workspace)/admin/guardians/[id]/page.tsx` résolu par extraction de `createConsentHistoryEntry` hors composant. 2) Chunks `.next` obsolètes provoquant encore `Base UI: MenuGroupContext is missing` dans le navigateur lors du clic sur le thème sombre : purge complète de `.next` avant redémarrage du serveur.
- Limites / non fonctionnel faute de backend : Toutes les créations, fusions, consentements, calculs de paie et modifications de matrice restent en mémoire locale/démo ; aucun envoi SMS/WhatsApp/Email réel, aucune paie légale ni contrôle d'accès serveur effectif.
- Décisions et raisons : Centralisation des profils dans `ProfilesProvider` scopé par `activeCenter.id` afin que la bascule de centre dans `/demo` ou le header recharge immédiatement un jeu de données cohérent sans collision entre établissements.
- Prochain lot proposé : Lot 5 — Pédagogie (Matières, Groupes, Inscriptions, Salles, Séances, Supports).
- Validation utilisateur requise : Oui

## 2026-11-26 02:55 — Lot #05 — Pédagogie (Matières, Groupes, Inscriptions, Salles, Séances, Supports)
- Objectif : Construire l'ensemble du périmètre opérationnel Pédagogie sous `ModuleGate` avec un store partagé `PedagogyProvider` scopé par centre actif.
- Pages/routes créées ou modifiées : `/admin/subjects`, `/admin/groups`, `/admin/enrollments`, `/admin/locations`, `/admin/sessions`, `/admin/resources`, `app/(workspace)/layout.tsx`.
- Composants et bibliothèques utilisés : `@tanstack/react-table`, `lucide-react`, `sonner`, `DataTable`, `ConfirmDialog`, `ModuleGate`, `FormFieldWrapper`, `CurrencyInput`, `PhoneInputMA`, `Sheet`, `Dialog`, `Select`, `Checkbox`. Store créé : `PedagogyProvider` (`usePedagogyStore`).
- Fichiers ajoutés/modifiés/supprimés : `types/pedagogy.ts`, `lib/mock-api/pedagogy-data.ts`, `stores/pedagogy-context.tsx`, `app/(workspace)/layout.tsx`, `app/(workspace)/admin/{subjects,groups,enrollments,locations,sessions,resources}/page.tsx`, `AVANCEMENT.md`, `README_FRONTEND.md`.
- Interactions implémentées :
  - `/admin/subjects` : création/édition matière (code, couleur, niveaux, professeurs), groupes liés, détection de doublons, archivage avec `ConfirmDialog` d'impact.
  - `/admin/groups` : bascule Cartes/Tableau, jauges d'occupation, détection de conflits salle/professeur en direct, bouton « Trouver un créneau libre », tiroir roster + liste d'attente + association/transfert élève + impression liste, duplication et fermeture avec réaffectation.
  - `/admin/enrollments` : filtres statut/groupe, assistant d'inscription multi-étapes (3 étapes) avec remise et calcul mensualité nette MAD, renouvellement, transfert, suspension/annulation avec motif obligatoire et aperçu/impression reçu démo.
  - `/admin/locations` : gestion des sites et salles avec capacité/équipements, vue d'occupation des séances par salle, aperçu de localisation multi-sites avec simulation d'erreur de géocodage.
  - `/admin/sessions` : vues Tableau et Timeline, création/duplication/reprogrammation/annulation, détection de chevauchements professeur/salle/élèves inscrits et modal d'arbitrage, portée de modification récurrente (`cette séance` vs `toutes les séances futures`), liens vers `/admin/attendance` et `/admin/payroll`.
  - `/admin/resources` : filtrage matière/groupe, dépôt local temporaire (`URL.createObjectURL`), simulation dépassement de quota, aperçu, téléchargement démo, renommage/tags, publication/dépublication et suppression confirmée.
- Données mock et scénarios : Jeu de données pédagogiques complet et référentiellement relié aux élèves/professeurs/sites des 3 centres fictifs (`Campus Horizon`, `Académie Atlas`, `Al-Noor Soutien`).
- États couverts (loading/empty/error/success/offline) : États vides filtrés avec action directe, simulation erreur géocodage et quota dépassé, confirmations destructives avec impact/motif, accès restreints `ModuleGate`.
- Responsive / accessibilité / performance : Cartes mobiles sur `DataTable`, dialogues défilables sur petits écrans, chiffres et montants MAD en `tabular-nums`, zéro bibliothèque lourde de calendrier ou carte externe chargée dans ce lot.
- Tests exécutés + résultats : `npm run build` (`compile_applet`) et `npm run lint` (`lint_applet`) exécutés et validés à la fin du lot.
- Erreurs rencontrées + corrections : Respect strict des règles `react-hooks/purity` (générateurs d'IDs séquentiels hors composants) et `@base-ui/react`.
- Limites / non fonctionnel faute de backend : Les créations, réaffectations, reçus d'inscription, dépôts `object URL` et arbitrages restent volatils en mémoire locale sans stockage serveur ni génération PDF serveur.
- Décisions et raisons : Centralisation des entités pédagogiques dans `PedagogyProvider` afin que les modifications de matières, salles, groupes et inscriptions se répercutent instantanément sur l'ensemble des écrans du Lot 5 (et préparent les Lots 6 à 8).
- Prochain lot proposé : Lot 6 — Calendrier interne (vues jour/semaine/mois/agenda/par salle/par prof, répétitions, conflits, export ICS).
- Validation utilisateur requise : Oui

## 2026-11-26 03:45 — Lot #06 — Calendrier interne
- Objectif : Construire le calendrier interne complet sous `ModuleGate` (`calendar.internal`) connecté en temps réel à `PedagogyProvider` (séances, salles, matières, professeurs, événements administratifs, jours fériés et absences profs).
- Pages/routes créées ou modifiées : `/admin/calendar`.
- Composants et bibliothèques utilisés : `lucide-react`, `sonner`, `ModuleGate`, `Sheet`, `Dialog`, `Select`, `Switch`, `Checkbox`, `Input`, `Textarea`, `Button`. Composants & utilitaires créés : `CalendarBoard`, `calendar-utils.ts`, `ics.ts`.
- Fichiers ajoutés/modifiés/supprimés : `lib/format/ics.ts`, `types/pedagogy.ts`, `lib/mock-api/pedagogy-data.ts`, `stores/pedagogy-context.tsx`, `features/calendar/calendar-utils.ts`, `features/calendar/calendar-board.tsx`, `app/(workspace)/admin/calendar/page.tsx`, `AVANCEMENT.md`, `README_FRONTEND.md`.
- Interactions implémentées :
  - Barre d'outils complète : bouton `Aujourd'hui` (`2026-11-26`), navigation `<`/`>`, sélecteur de 7 vues (`Jour`, `3 jours`, `Semaine`, `Mois`, `Agenda`, `Par salle`, `Par prof`), recherche texte et filtres site / professeur / salle, bascules de calques (`Séances`, `Admin / fériés / absences`).
  - Grilles horaires interactives (`08:00`–`20:00`) : clic sur créneau vide pour créer, glisser-déposer HTML5 bureau sur une autre journée/heure/salle/prof avec détection automatique de conflits.
  - Arbitrage de conflits (`Salle occupée`, `Professeur déjà engagé`, `Jour férié / centre fermé`) avec 4 actions (`Décaler +1h30`, `Changer de salle`, `Maintenir quand même (démo)`, `Annuler`).
  - Répétitions hebdomadaires (création d'une série sur N semaines) et modification/duplication `+7j` ciblant `cette occurrence` ou `toutes les occurrences futures`.
  - Tiroir latéral de détail d'événement avec lien direct vers `/admin/attendance`, duplication `+7j` et suppression.
  - Export `.ics` local RFC-5545 (`Africa/Casablanca`) et import `.ics` local avec aperçu des lignes et détection de doublons.
  - Modal statut synchronisations Apple Calendar (ICS privé backend) & Google Calendar (OAuth déconnecté en Mode Démo, aucun secret côté client).
- Données mock et scénarios : Séances hebdomadaires `2026-11-23` au `2026-11-28` (`ses-305`..`ses-308`) plus événements administratifs, jours fériés et absences professeurs (`cal-adm-1`..`5`) sur les centres démo.
- États couverts (loading/empty/error/success/offline) : Accès refusé/module désactivé `ModuleGate`, état vide filtré dans la vue Agenda, avertissement de conflit avant confirmation, alerte import `.ics` sans événement ou avec doublons, bannières statut Apple/Google non connectés.
- Responsive / accessibilité / performance : Cartes contrastées en clair et sombre, horaires et compteurs en `tabular-nums`, barres de filtres adaptatives sur mobile et vues Jour/Agenda dédiées aux écrans étroits, zéro librairie calendrier lourde externe.
- Tests exécutés + résultats : `npm run build` (`compile_applet`) et `npm run lint` (`lint_applet`) exécutés à la fin du lot.
- Erreurs rencontrées + corrections : Respect de `react-hooks/purity` (générateurs d'identifiants séquentiels hors composants) et des contrats `@base-ui/react`.
- Limites / non fonctionnel faute de backend : Aucune synchronisation Google Calendar OAuth, aucun flux CalDAV, aucune génération serveur d'URL ICS signée ni persistance distante ; toutes les éditions et imports restent en mémoire locale.
- Décisions et raisons : Implémentation d'un moteur de calendrier maison léger adossé à `PedagogyProvider` afin que les séances créées/déplacées dans `/admin/sessions` ou `/admin/calendar` soient immédiatement partagées sans charger de dépendance tierce lourde.
- Prochain lot proposé : Lot 7 — Présences QR (`/admin/attendance`, `/teacher/scan`, `/student/qr`, fraude/états simulés, justificatifs).
- Validation utilisateur requise : Oui

## 2026-11-26 03:55 — Lot #07 — Présences QR
- Objectif : Construire les parcours complets de gestion des présences manuelles et QR simulées sous `ModuleGate` avec état partagé `AttendanceProvider` entre administration, professeur et étudiant.
- Pages/routes créées ou modifiées : `/admin/attendance`, `/teacher/scan`, `/student/qr`, `app/(workspace)/layout.tsx`.
- Composants et bibliothèques utilisés : `next/dynamic`, `@tanstack/react-table`, `lucide-react`, `sonner`, `DataTable`, `ConfirmDialog`, `ModuleGate`, `GlobalBanner`, `EmptyState`, `Sheet`, `Dialog`, `Tabs`, `Select`, `Switch`. Composants créés : `QrCodeSvg`, `QrCameraScanner`. Store créé : `AttendanceProvider` (`useAttendanceStore`).
- Fichiers ajoutés/modifiés/supprimés : `types/attendance.ts`, `lib/mock-api/attendance-data.ts`, `stores/attendance-context.tsx`, `components/attendance/{qr-code-svg,qr-camera-scanner}.tsx`, `app/(workspace)/layout.tsx`, `app/(workspace)/admin/attendance/page.tsx`, `app/(workspace)/teacher/scan/page.tsx`, `app/(workspace)/student/qr/page.tsx`, `AVANCEMENT.md`, `README_FRONTEND.md`.
- Interactions implémentées :
  - `/admin/attendance` : KPI dynamiques, filtres période/séance/statut, sélection multiple avec actions en masse sous `ConfirmDialog` (motif obligatoire), correction individuelle avec justification et nom de pièce démo, tiroir `Détail QR` distinguant `Scan simulé` vs `Validation serveur requise`, onglet `Journaux & anomalies QR`, onglet `Statistiques & Heatmap`, onglet `Alertes absences répétées` avec prévisualisation famille démo (sans envoi réel), export CSV UTF-8 protégé contre injection de formules (`=`, `+`, `-`, `@`) et aperçu d'impression feuille d'appel.
  - `/teacher/scan` : sélection de séance avec compteurs en direct (`Attendus`, `Présents`, `En retard`, `Absents/attente`), chargement différé (`next/dynamic`) de `QrCameraScanner` avec permission explicite, pause/reprise, switch caméra avant/arrière, torche si supportée et nettoyage complet des flux à la fermeture ; saisie de code de secours, simulateur des 7 cas (`présent`, `déjà enregistré` orange sans double comptage, `mauvaise séance`, `élève non inscrit`, `QR expiré`, `hors créneau`, `erreur réseau`), bip sonore/vibration optionnels, appel manuel tactile avec motif obligatoire sur modification, et modal de clôture d'appel.
  - `/student/qr` : carte numérique étudiant haute lisibilité (QR SVG déterministe sur fond blanc), rotation de jeton démo (`Régénérer jeton démo`), simulation d'expiration (`Simuler QR expiré`), copie rapide du code élève et avertissement explicite sur l'absence de signature serveur.
- Données mock et scénarios : Pointages, journaux QR (dont doublon, non inscrit, jeton expiré) et alertes d'absences répétées cohérents sur les 3 centres (`Campus Horizon`, `Académie Atlas`, `Al-Noor Soutien` sans module QR).
- États couverts (loading/empty/error/success/offline) : Module désactivé (`Al-Noor` sans QR), caméra refusée/indisponible avec fallback saisie manuelle, doublon QR bloqué sans double comptage, erreur réseau simulée, états vides filtrés, confirmations avec motif obligatoire.
- Responsive / accessibilité / performance : Scanner caméra chargé uniquement sur `/teacher/scan` via `next/dynamic({ ssr: false })`, aucune fuite de flux vidéo (`MediaStream.stop()` à l'unmount), cartes mobiles sur `DataTable`, boutons tactiles sur l'appel mobile, `tabular-nums` sur tous les horaires et compteurs.
- Tests exécutés + résultats : `npm run build` (`compile_applet`) et `npm run lint` (`lint_applet`) exécutés à la fin du lot.
- Erreurs rencontrées + corrections : Respect strict des règles `react-hooks/purity` et nettoyage `MediaStream`.
- Limites / non fonctionnel faute de backend : Aucune signature cryptographique de QR, aucune vérification serveur d'horodatage/géolocalisation, aucune persistance distante ni envoi réel d'alerte parentale SMS/WhatsApp/Email.
- Décisions et raisons : Génération SVG QR déterministe légère sans dépendance npm tierce lourde et chargement différé du composant caméra WebRTC afin de préserver les budgets JS des autres routes.
- Prochain lot proposé : Lot 8 — Finances (`/admin/payments`, `/admin/dues`, `/admin/overdue`, `/admin/pricing`, `/admin/refunds`, `/admin/payroll`, `/admin/expenses`, `/admin/reports`, `/admin/accounting`).
- Validation utilisateur requise : Oui

## 2026-11-26 04:18 — Lot #08 — Finances & Comptabilité
- Objectif : Construire l'ensemble du périmètre financier et comptable en MAD (`fr-MA`) sous `ModuleGate` adossé à `FinanceProvider` (`useFinanceStore`).
- Pages/routes créées ou modifiées : `/admin/payments`, `/admin/dues`, `/admin/overdue`, `/admin/pricing`, `/admin/refunds`, `/admin/payroll`, `/admin/expenses`, `/admin/reports`, `/admin/accounting`, `app/(workspace)/layout.tsx`.
- Composants et bibliothèques utilisés : `@tanstack/react-table`, `lucide-react`, `sonner`, `DataTable`, `ConfirmDialog`, `ModuleGate`, `GlobalBanner`, `EmptyState`, `CurrencyInput`, `FormFieldWrapper`, `Sheet`, `Dialog`, `Select`, `Switch`, `Checkbox`. Utilitaires créés : `lib/format/csv.ts`. Store créé : `FinanceProvider` (`useFinanceStore`).
- Fichiers ajoutés/modifiés/supprimés : `types/finance.ts`, `lib/mock-api/finance-data.ts`, `lib/format/csv.ts`, `stores/finance-context.tsx`, `app/(workspace)/layout.tsx`, `app/(workspace)/admin/{payments,dues,overdue,pricing,refunds,payroll,expenses,reports,accounting}/page.tsx`, `AVANCEMENT.md`, `README_FRONTEND.md`.
- Interactions implémentées :
  - `/admin/payments` : encaissements complets/partiels avec affectation à une échéance, correction d'infos non comptables, rapprochement simulé, duplication de reçu brouillon, reçu imprimable démo (non fiscal), contrepassation/annulation avec motif obligatoire sans jamais supprimer l'historique, journal d'audit détaillé, export CSV sécurisé.
  - `/admin/dues` & `/admin/overdue` : vues Tableau et Échéancier calendrier, génération d'échéancier depuis tarif, encaissement direct, report d'échéance avec avertissement, remise justifiée (`ConfirmDialog`), mise en pause litige, prévisualisation de relances respectueuses (sans envoi réel).
  - `/admin/pricing` : règles tarifaires MAD avec ordre de priorité, historique, simulateur d'aperçu facture avant application et confirmation si application rétroactive.
  - `/admin/refunds` : workflow complet (`brouillon` → `à approuver` → `approuvé`/`refusé` → `exécuté en simulation démo`) avec motif obligatoire et journal.
  - `/admin/payroll` : filtres par période, assistant de calcul détaillé (horaire/fixe/%), ajustements, verrouillage de période, correction après clôture tracée et statut explicite « Payé fictivement (démo) ».
  - `/admin/expenses` : dépenses par catégorie (avec ajout de catégorie personnalisée), pièce locale démo, édition, archivage justifié et export CSV.
  - `/admin/reports` & `/admin/accounting` : cash-flow indicatif, répartition par mode, comparaison N / N-1 (`Données démo`), vues mémorisées, et mode « Dossier pour le comptable » avec mapping personnalisable de colonnes/comptes, séparateur, formats date/décimales, aperçu et avertissement légal CGNC/cabinet.
- Données mock et scénarios : Jeu de données financières relié aux élèves, responsables, groupes et professeurs des 3 centres (`Campus Horizon`, `Académie Atlas`, `Al-Noor Soutien`).
- États couverts (loading/empty/error/success/offline) : Accès restreint `ModuleGate` par rôle/module (ex. `refunds`, `payroll`, `accounting.exports`), états vides avec CTA, bannières non-conformité légale/simulation, confirmations destructives et contrepassations avec motif obligatoire.
- Responsive / accessibilité / performance : Cartes mobiles sur `DataTable`, tableaux comptables défilables avec en-tête sticky, montants MAD en `tabular-nums`, neutralisation d'injection CSV (`=`, `+`, `-`, `@`), aucune dépendance lourde de génération PDF ou XLSX chargée.
- Tests exécutés + résultats : `npx next typegen && npx tsc --noEmit` (0 erreur), `npx eslint .` (0 erreur, 5 avertissements préexistants `react-hooks/incompatible-library`), et vérification HTTP `200` sur le serveur `next dev` (`localhost:3000`) pour `/`, `/demo`, `/admin/dashboard` et les 9 routes Lot 8. Note : `compile_applet` (`next build`) a saturé la mémoire du conteneur (4 Go sans swap avec `next dev` actif).
- Erreurs rencontrées + corrections : Déplacement de `formatDateCell`/`formatAmountCell` dans `useMemo` et homogénéisation des dates avoirs/paie dans `app/(workspace)/admin/accounting/page.tsx` ; serveur `next dev` vérifié actif sur le port 3000.
- Limites / non fonctionnel faute de backend : Aucun encaissement carte/TPE réel, aucun virement bancaire ou paie légale/CNSS, aucun envoi réel de relance parentale et aucune conformité fiscale CGNC garantie sans validation par un cabinet comptable.
- Décisions et raisons : Partage centralisé des écritures entre encaissements, échéances, remboursements, dépenses et comptabilité dans `FinanceProvider` afin que tout paiement ou contrepassation se reflète immédiatement dans les soldes, rapports et écritures comptables.
- Prochain lot proposé : Lot 9 — Studio de données (`/admin/data-studio`, `/admin/imports` : tableur avancé, copier-coller, import 7 étapes, export templates).
- Validation utilisateur requise : Oui
