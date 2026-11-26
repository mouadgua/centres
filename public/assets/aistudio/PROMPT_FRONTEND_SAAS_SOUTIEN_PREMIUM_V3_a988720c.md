# MASTER PROMPT FRONTEND — SaaS premium de gestion des centres de soutien scolaire

**Version :** 3.0 — 25 novembre 2026  
**Périmètre :** FRONTEND UNIQUEMENT (pas d'API réelle, pas de base de données, pas d'authentification serveur)  
**Marché de départ :** Maroc ; français par défaut, arabe/RTL prévu ; devise MAD ; fuseau `Africa/Casablanca`  
**Destination :** Cursor / Claude Code / Codex / agent frontend.  
**Référence métier :** cahier des charges « SaaS multi-tenant de gestion des centres de soutien scolaire », dont les modules sont repris ici et développés au niveau écran et interaction.  
**Instruction absolue :** implémenter par lots, montrer chaque lot et demander validation avant le suivant. Mettre à jour `AVANCEMENT.md` après **chaque** lot et chaque modification significative.

---

# 0. TON RÔLE ET TA MISSION

Tu es simultanément **Principal Product Designer, Staff Frontend Engineer, expert UX SaaS B2B, spécialiste accessibilité, expert data grids/tableurs et ingénieur QA frontend**.

Construis une **application frontend premium, moderne, sobre, professionnelle, intuitive et exhaustive**, pour un SaaS multi-tenant white-label de centres de soutien scolaire. Elle doit ressembler au niveau de qualité d'un excellent produit SaaS contemporain : mise en page épurée à la ChatGPT, sidebar discrète, hiérarchie visuelle puissante, interactions parfaitement cohérentes, peu de bordures, grands espaces, composants raffinés, tableaux denses mais lisibles, navigation rapide et micro-animations sobres.

**Ne construis pas un simple dashboard figé.** Crée des pages utilisables, des formulaires complets, des modales fonctionnelles, des filtres opérants sur les données de démonstration, des calendriers manipulables, des tableaux éditables, des aperçus avant export, des états de chargement, des états vides, des confirmations, des notifications, des contrôles de permission simulés et des flux de navigation cohérents.

## Nouvelle exigence structurante V3 : instance modulaire pilotée par Super Admin

Le SaaS doit être **modulaire par instance de centre** : le Super Admin SaaS active/désactive les capacités accordées à un centre (selon plan et autorisations), choisit ses modules, ses canaux de communication et ses paramètres initiaux. Le directeur peut ensuite configurer **uniquement** les capacités autorisées, gérer les sous-options, les modèles de messages et les utilisateurs délégués. Un module désactivé n'apparaît pas dans la sidebar, la palette de commandes, les boutons d'action, les raccourcis ou les formulaires. Une route directe affiche un écran explicatif avec demande d'activation, sans divulgation de données. Ce pilotage est simulé côté frontend, jamais présenté comme véritable contrôle d'accès.

## Contrat frontend uniquement

- Aucune API de production, aucun vrai token d'authentification, aucune base de données, aucun vrai paiement, aucun vrai envoi d'email, aucune connexion OAuth réelle sans backend.
- Créer une **couche de services mock typée** avec fixtures riches, promesses asynchrones simulées, délais et erreurs configurables ; pouvoir remplacer plus tard l'adaptateur mock par des appels réels sans réécrire les composants.
- Toute écriture de démonstration doit mettre à jour l'état local et les listes, totaux, détails et KPI concernés ; éviter les boutons factices.
- Optionnel : persistance locale pour les préférences et données **fictives uniquement**, avec reset de démonstration. Ne pas stocker de secrets ou données personnelles réelles dans `localStorage`.
- Étiqueter clairement **Mode Démo** et les intégrations non connectées ; ne jamais laisser croire qu'une action réelle a eu lieu.
- Pour Google Calendar et Apple Calendar, concevoir l'UX de connexion, synchronisation et gestion, mais afficher `Connexion à implémenter` en l'absence d'un backend/infrastructure adaptée.
- Prévoir une application mobile web / PWA responsive, pas de dépendance obligatoire à une application native.

---

# 1. STACK, BIBLIOTHÈQUES ET PRÉCAUTIONS

## Socle

- Next.js App Router, React, TypeScript `strict`, Tailwind CSS, **shadcn/ui** comme socle de tous les composants d'interface.
- **Radix UI** pour les primitives accessibles sous-jacentes ; **Lucide React** pour les icônes, style régulier cohérent.
- **Motion (`motion/react`)** pour quelques animations ciblées ; privilégier les transitions CSS pour hover, focus, couleurs et opacity.
- **React Bits** : composants sélectivement utilisés pour les zones marketing, empty states ou accents visuels ; **jamais** de fonds animés lourds sur les pages métier.
- **TanStack Table** pour filtres, tri, pagination, colonnes, sélection de lignes et tableaux administratifs.
- **TanStack Virtual** pour les très longues listes/tableaux ; **TanStack Query** uniquement pour abstraction de données asynchrones et migration future vers API.
- **React Hook Form + Zod** pour tous les formulaires ; valeurs initiales, validation instantanée sans agressivité et erreurs accessibles.
- **Recharts** pour indicateurs et séries simples. Envisager **FullCalendar** pour vues calendrier avancées **après vérification de la licence applicable aux fonctionnalités choisies** ; sinon bâtir avec primitives compatibles.
- **AG Grid Community** (ou autre tableur permissif après revue de licence) pour la **vue tableur avancée** ; toute fonctionnalité Enterprise non gratuite doit être signalée et remplacée par une implémentation autorisée si nécessaire. Ne pas promettre formules, pivot ou exports Enterprise si non disponibles.
- **SheetJS (`xlsx`) ou ExcelJS** pour import/export XLSX suivant les exigences et licences, **Papa Parse** pour CSV ; Web Workers pour imports et transformations lourdes.
- **date-fns** ou bibliothèque de dates cohérente avec `Africa/Casablanca`, **next-themes** pour clair/sombre/système, **Sonner** pour toasts, **cmdk** pour palette de commandes.
- **dnd-kit** pour drag-and-drop accessibles quand nécessaire.
- **html5-qrcode** ou bibliothèque de lecture QR maintenue pour le prototype de caméra, strictement côté client et uniquement sur déclenchement explicite.
- **MapLibre GL JS** ou **React Leaflet** pour cartes (sites des centres, adresses), avec fournisseur de tuiles configurable et clés non codées en dur. Chargement différé de la carte.
- **react-day-picker** pour sélection de dates et plages si adapté.
- Tester les versions et compatibilités réelles au moment de l'installation ; **ne pas installer automatiquement deux bibliothèques qui remplissent exactement le même rôle**.

## Conventions de création

- Composants réutilisables, petits, documentés ; pas de fichiers géants qui mélangent tableaux, formulaires, état et mock business logic.
- Icônes fines, taille cohérente ; pas d'émojis pour la navigation professionnelle.
- `loading.tsx` et `error.tsx` pour segments pertinents, Suspense et skeletons ciblés, pas de gros spinner qui bloque toute l'application.
- Lazy-load les bibliothèques lourdes : tableur, carte, lecteur QR, éditeur de rapports et calendrier avancé.
- Les effets React Bits doivent être désactivables via `prefers-reduced-motion`, ne pas dégrader les FPS ou le score d'accessibilité.

---

# 2. DIRECTION ARTISTIQUE — SAAS ULTRA MODERNE

## Référence visuelle

S'inspirer du **rythme et de l'ergonomie ChatGPT** (sidebar sobre à gauche, zone centrale aérée, actions contextuelles, vitesse perçue, interface sans bruit visuel), **sans copier les marques, logos ou écrans à l'identique**. La personnalité doit être propre au SaaS : premium éducatif et gestion d'entreprise.

### Layout desktop

- Navigation latérale persistante avec largeur confortable (environ 248–272 px), mode réduit en rail d'icônes (~68–76 px), possibilité de la masquer.
- Sidebar à surface légèrement distincte du contenu, **sans accumulation de contours** ; séparations douces, groupes de navigation lisibles.
- Header léger : breadcrumbs, recherche globale, sélecteur de centre si autorisé, changement de rôle pour démo, centre d'aide, notifications, menu profil, thème.
- Zone centrale `max-width` appropriée aux pages classiques ; pages **tableur, planning et analytics** peuvent être en pleine largeur.
- Marges généreuses, colonnes claires, cards à radius modéré (12–18 px), ombres presque imperceptibles, pas de bordure autour de chaque élément.
- Sous-titres discrets, densité d'information adaptable, titres de taille contenue (pas de typographie géante dans les écrans métier).
- Footer très discret, avec version, état du service simulé et liens d'aide.

### Mobile / tablette

- Sidebar devient un `Sheet` accessible avec overlay ; la barre supérieure reste minimale.
- Pour les espaces Professeur/Étudiant, possibilité d'une **bottom navigation** à 3–5 destinations essentielles ; jamais plus de 5 onglets.
- Actions principales visibles dans une barre collante lorsque pertinent, sans couvrir les champs ou le clavier virtuel.
- Tables denses deviennent cartes, colonnes essentielles ou vues scroll horizontal explicite ; ne pas simplement écraser une table desktop.
- Pour scan QR : bouton scanner très visible et zone caméra optimisée à une main, focus/torch si disponible.
- Responsive testé à 360, 390, 768, 1024, 1440 et 1920 px, ainsi qu'à 200 % de zoom.

## Design tokens obligatoires

Définir tokens pour : `background`, `foreground`, `card`, `popover`, `muted`, `accent`, `primary`, `secondary`, `destructive`, `success`, `warning`, `info`, `border`, `input`, `ring`, `chart-1..n`, `radius`, `shadow`, `space`, `sidebar-*`, `surface-raised`. Utiliser des variables CSS et des tokens sémantiques shadcn ; éviter les couleurs hardcodées dans les pages.

- **Light** : fonds blanc cassé / gris très clair, contenu profond anthracite, espaces blancs, couleurs d'état mesurées.
- **Dark** : gris graphite/charbon, jamais du noir intégral sur l'ensemble ; surfaces distinctes par légers écarts de luminosité et contrastes suffisants.
- **System** : suit le système d'exploitation.
- **White-label** : logo, nom, couleur d'accent, icône du centre, aperçu de thème et contrôles de contraste. Ne jamais laisser une couleur client dégrader lisibilité ou état danger.
- Police moderne lisible (ex. Geist ou Inter), chiffres tabulaires pour finance, navigation clavier irréprochable.

## Comportement exact du sélecteur de thème

- Un bouton icône `sun/moon` dans le header, libellé accessible **Apparence** ; clic ouvre un `DropdownMenu` avec `Clair`, `Sombre`, `Système`.
- L'option active a une coche ; le thème change **sans rechargement** ; respecter la préférence système ; persister le choix ; éviter flash de thème au chargement.
- Prévoir également le même choix dans `Profil > Préférences`, avec un aperçu comparatif.
- Le contraste des charts, tableaux, calendriers, loaders, modales, overlays, carte et couleurs personnalisées doit s'adapter.
- Ajouter l'option **Réduire les animations** distincte du thème.

## Animations : règles de performance

- Hover et focus CSS 120–180 ms ; ouverture de menu 140–200 ms ; entrée de panneau 180–240 ms ; transitions de page discrètes 120–200 ms.
- Animer `transform` et `opacity`, éviter d'animer les grosses ombres, filtres, dimensions de tableaux et blur permanent.
- Réduire/retirer la plupart des animations sur mobile faible puissance et avec `prefers-reduced-motion`.
- **Aucune animation décorative infinie** dans les interfaces de travail ; skeletons animés subtils, sans shimmer agressif.
- Sur action réussie : micro-transition + toast, pas de confettis en gestion comptable.
- Ne jamais bloquer la saisie, les scrolls, l'ouverture de caméra ou l'édition des cellules pour attendre une animation.

---

# 3. COMPOSANTS TRANSVERSAUX — DESIGN CONTRACT

Pour **chaque action interactive**, préciser dans le code et dans la documentation : déclencheur, composant, validation, permissions, état loading, succès, erreur, annulation, mobile et accessibilité.

| Besoin | Composant UI recommandé | Comportement requis |
|---|---|---|
| Action principale | `Button` shadcn, icône optionnelle | `loading`, disabled, retour visuel, focus visible |
| Action secondaire | `Button variant=outline/ghost` | Jamais plus visuelle que le primaire |
| Action destructive | `AlertDialog` + bouton destructive | Confirmer contexte, impact et parfois nom à ressaisir |
| Formulaire simple | `Dialog` + RHF/Zod | Auto-focus logique, erreurs et annuler |
| Formulaire complexe | Page dédiée ou `Sheet` large | Étapes, sauvegarde brouillon, résumés |
| Édition rapide | `Popover`, `Combobox`, `Sheet` | Valider et refléter immédiatement l'état |
| Notification | `Sonner` toast + bannière in-page | Succès/erreur, lien d'action, undo si possible |
| Alerte globale | `Alert` / bannière sticky | Message lisible, fermeture si non critique |
| Recherche | `CommandDialog`, `Input`, `Combobox` | Raccourci Cmd/Ctrl+K, navigation clavier |
| Confirmation non destructive | `Dialog` | Résumé et confirmation explicite |
| Liste denses | `DataTable` TanStack | Tri, recherche, filtres, sélection, export |
| Grande liste | `VirtualizedTable` | Virtualisation, compteur, pagination/scroll |
| Grille type Excel | `SpreadsheetWorkbench` | Cellules, plage, copier/coller, undo/redo |
| Calendrier | `Calendar`, `CalendarBoard` | Date, semaine, mois, drag & drop contrôlé |
| Statistiques | `MetricCard`, `Recharts` | Delta, période, définition du KPI, état vide |
| Chargement | `Skeleton`, `Spinner` discret | Skeleton contextualisé et temps d'attente simulé |
| Navigation | Sidebar + `Breadcrumb` + Tabs | Route active, permissions, responsive |
| Aide | `Tooltip`, `HoverCard`, `HelpDrawer` | Explications métier, raccourcis, exemples |
| Upload | `Dropzone` + progress | Types, limites, validation, preview, erreur |
| Cartes | map lazy + liste accessible | Recherche lieu, marqueurs, détails, fallback |
| Scan QR | caméra + cadre de détection | permission, scan, vibration si supportée, validation |
| Export | `ExportWizard` + `Progress` | Colonnes, format, preview, téléchargement |
| Filtre avancé | `FilterBuilder` | Conditions AND/OR, sauvegarde vues |
| État vide | `EmptyState` | Description + CTA direct pertinent |
| Indisponibilité | `ErrorState`, retry | Message non technique, action de reprise |

## Standards d'interaction universels

- **Toast** court après sauvegarde : « Élève mis à jour », avec `Annuler` si réversible.
- **Bannière** persistante pour erreur de synchronisation, intégration déconnectée, changement de plan, factures en retard, données incomplètes ou essai expirant.
- **Confirmation** obligatoire pour suppression, désactivation, transfert d'élève, changement massif de groupe, annulation de paiement, suppression d'une séance déjà pointée, export sensible, changement de permissions et déconnexion d'une intégration.
- Les actions sensibles doivent afficher les **conséquences** et les éléments concernés ; confirmations par saisie du nom pour les suppressions en masse.
- Indiquer les actions impossible / non autorisées par un message explicatif ; ne jamais simuler une élévation de permissions.
- Navigation avec garde de **modifications non enregistrées**, dialogue « Quitter sans enregistrer ? ».
- Undo/redo disponible pour opérations tableur et modifications bulk réversibles.
- Chaque vue doit couvrir : `initial`, `loading`, `success`, `error`, `empty`, `no-results`, `forbidden`, `offline`, `partial-data`, `stale-data` si applicable.
- Afficher dates/heures en fuseau du centre et montants en MAD avec regroupement lisible.
- Ne pas exposer données sensibles dans les toasts, URL ou logs console.

---

# 4. NAVIGATION COMPLÈTE ET SITEMAP PAR RÔLE

Utiliser routes explicites, groupes de routes si utile, layouts par rôle et sidebar filtrée par permissions. Les routes non autorisées présentent une page **Accès refusé** avec chemin de retour ; ne pas confondre masquage UI et sécurité backend future.

## 4.1 Public SaaS — `domaine.com`

- `/` : landing page (hero, produit, bénéfices, modules, vues produit, témoignages fictifs **identifiés comme démo**, tarifs exemples, FAQ, contact, CTA).
- `/features` : fonctionnalités détaillées par rôle et module.
- `/pricing` : plans, tableau comparatif, FAQ de facturation.
- `/demo` : visite interactive, bascule de profils, données 100 % fictives.
- `/onboarding` : **assistant complet et conditionnel** (directeur, centre, sous-domaine, sites, population, matières, groupes, tarifs, moyens de paiement, contacts parents, consentements, communication, calendrier, branding, import, invitations, récapitulatif, succès) ; étapes visibles selon les modules activés et possibilité de sauvegarder un brouillon fictif.
- `/sign-in`, `/forgot-password`, `/verify`, `/legal/privacy`, `/legal/terms`, `/contact` : formulaires UX et états mock.
- Écran de suspension/essai terminé ; 404 propre.

## 4.2 Super Admin SaaS — `admin.domaine.com`

Sidebar : **Vue globale**, **Centres**, **Catalogue de modules**, **Configurations d’instances**, **Onboarding & invitations**, **Utilisateurs SaaS**, **Plans & abonnements**, **Facturation SaaS**, **Analytique**, **Feedback & enquêtes**, **Tickets & assistance**, **Incidents**, **Audit & sécurité**, **Paramètres plateforme**.

- `/super/dashboard` : KPI centres actifs, en essai, suspendus, MRR estimé, croissance, tickets, alertes ; graphiques et filtres de période.
- `/super/centers` : table/segments par statut/plan, recherche, carte optionnelle des centres.
- `/super/centers/new` : créer un centre en démo.
- `/super/centers/[id]` : profil du centre, identité, métriques, utilisateurs agrégés, abonnement, état, audit ; actions activer, suspendre, réactiver, changer plan, reconfigurer thème, contacter responsable, exporter récapitulatif ; confirmations fortes.
- `/super/users` : collaborateurs SaaS, rôles, invitations, révocation de sessions simulée, état MFA illustratif.
- `/super/subscriptions` et `/super/billing` : abonnements, factures plateforme, échéances, remboursements démonstration, exports.
- `/super/analytics` : acquisition, activité, rétention, usage par modules, filtres.
- `/super/support` : tickets, priorités, assignation, états, fil conversationnel mock.
- `/super/incidents` : statuts, bannières maintenance, communication.
- `/super/audit` : historique des opérations sensibles, recherches et filtres.
- `/super/settings` : domaines, branding SaaS, modèles de notifications, préférences globales.
- `/super/modules` : catalogue des modules (éducation, présences, QR, parents, communication multicanale, documents, finance, Excel, calendrier, intégrations, feedback, automatisations). Fiches avec description, dépendances, coûts indicatifs, risques/confidentialité, prérequis, statut disponible/expérimental, aperçu de l'UX et écrans affectés.
- `/super/instances` et `/super/centers/[id]/configuration` : constructeur **par instance** avec switches, listes de capacités, matrice par plan/centre/rôle, prévisualisation de la sidebar et de l'onboarding, presets `Essentiel`, `Pédagogie`, `Finance`, `Tout-en-un`, `Sur mesure`. Confirmations en cas de désactivation (impact sur vues et accès), résumé des dépendances, simulation de déploiement, historique/configuration rollback démo.
- `/super/onboarding` : templates d'onboarding par plan, étapes personnalisables, champs requis/optionnels, progression des centres, invitations en attente, rejets simulés, relances simulées.
- `/super/feedback` : tableau de retours multi-centres **agrégés** ; tickets, suggestions, satisfaction, tags, priorités, tendances ; éviter d'afficher par défaut le contenu sensible des élèves/parents.

**Séparation impérative :** un Super Admin ne doit pas afficher de façon désinvolte les données individuelles d'élèves. Tout parcours exceptionnel de support / impersonation doit être **désactivé** en mode démo tant que des garanties backend n'existent pas.

## 4.3 Admin de centre / Directeur — `centre.domaine.com/admin`

Sidebar structurée, avec icônes et groupes pliables :

1. **Général** : Vue d'ensemble, Activité récente, Notifications.
2. **Pédagogie** : Élèves, Parents/Responsables, Professeurs, Matières, Groupes, Inscriptions, Séances, Calendrier, Présences, Supports de cours.
3. **Finances** : Encaissements, Échéances, Impayés, Tarifs & remises, Remboursements, Rémunération professeurs, Dépenses, Rapports, Comptabilité.
4. **Données & outils** : Tableur, Importer, Exporter, Modèles, Rapports personnalisés, Historique imports.
5. **Communication & familles** : Centre de communication, Parents & contacts, Campagnes, Automatisations, Modèles, Notifications, Historique des envois, Feedback & enquêtes.
6. **Organisation** : Utilisateurs & accès, Salles & sites, Carte des sites, Documents, Intégrations calendrier, Modules activés, Paramètres du centre, Branding & apparence, Audit.

### Dashboard `/admin/dashboard`

- En-tête : nom du centre, période, choix de site, bouton `Action rapide` et bouton `Personnaliser le dashboard`.
- KPI : inscrits actifs, nouveaux inscrits, séances du jour, présents, absences, revenus encaissés, montants à recevoir, impayés, paie professeurs prévisionnelle.
- Graphiques : encaissements par mois, présences par semaine, inscriptions par groupe, évolution revenus, répartition des impayés.
- Widgets : prochaines séances, professeurs absents, anomalies QR, échéances, derniers encaissements, messages, rappels administratifs.
- Choix widgets, réorganisation, filtres temporels, actualiser, export PNG/PDF si implémenté et clairement marqué comme démo.
- Clic sur un KPI ouvre une vue filtrée correspondant au chiffre.

### Élèves `/admin/students`

Table : photo/avatar, ID, nom, prénom, niveau, groupe(s), parent, téléphone, statut, solde, dernière présence, date d'inscription.

**Actions liste :** rechercher, filtrer par niveau/groupe/statut/site/impayé, trier, pagination, afficher/masquer colonnes, sauvegarder vue, sélection multi-lignes, assigner groupe, changer statut, envoyer annonce mock, exporter, archiver, ouvrir fiche.

**Création** (`/admin/students/new`) : identité, contacts, informations responsables, niveau, adresse facultative, groupes, réduction, dates, identifiants de connexion fictifs, consentements et pièces ; validation par section, brouillon, prévisualisation, création.

**Fiche** (`/admin/students/[id]`) : header identité + statut + actions ; onglets `Résumé`, `Inscriptions`, `Calendrier`, `Présences`, `Finances`, `Documents`, `Communications`, `Historique`.

**Actions fiche :** éditer, ajouter un groupe, transférer un groupe avec vérification capacité, retirer d'un groupe, suspendre, réactiver, archiver, supprimer avec confirmation, générer reçu, enregistrer paiement, exporter fiche, voir QR étudiant de démonstration, réinitialiser accès (simulation), associer responsable, télécharger documents de démonstration.

### Parents / Responsables `/admin/guardians`

Table de responsables, enfants liés, numéro de contact, email, WhatsApp opt-in, langue préférée, contact prioritaire, consents et notifications. Créer, lier/délier un élève avec confirmation, corriger coordonnées, consulter historique chronologique, activer/désactiver canaux par catégorie (absence, retard, paiement, annonces, urgence, documents), exporter contacts dans limites autorisées.

**Actions directes :** appeler via lien `tel:`, composer un email via `mailto:`, ouvrir une conversation WhatsApp par URL de composition explicite, copier coordonnées, préparer un message dans l'éditeur SaaS (en démo **pas d'envoi réel**), notifier une absence/paiement via prévisualisation, vérifier doublons de contacts, fusionner deux fiches fictives avec confirmation, définir contacts d'urgence, contact à privilégier, contacts interdits/retirés selon justificatifs de responsabilité et politique du centre.

**Fiche parent** `/admin/guardians/[id]` : identité et consentements, enfants liés, canaux, préférences horaires, historique conversationnel, notifications de paiements, absences, justificatifs, documents partagés, demandes de rendez-vous, tickets, feedback, notes internes à accès restreint, journal des changements. Prévoir interface `/parent` si module activé.

### Professeurs `/admin/teachers`

Table : identité, matière, groupes, sites, disponibilités, taux horaires/fixes/% simulés, séances planifiées/effectuées, rémunération estimée, statut.

- Créer/inviter professeur ; éditer informations ; affecter aux groupes, matières, salles ; régler disponibilités, absences, congés, remplacement.
- Onglets fiche `Résumé`, `Planning`, `Groupes`, `Séances réalisées`, `Présences`, `Rémunération`, `Documents`, `Accès`, `Historique`.
- Action calcul de paie : ouvrir drawer détaillant période, formule, séances prises en compte, ajustements, validation, export fiche de paie **indicative** ; pas de promesse de conformité paie.
- Désactiver, archiver, réassigner les séances avec assistant de résolution des conflits.

### Administration interne / staff `/admin/users`

- Types : directeur, secrétaire, comptable/gestionnaire financier, coordinateur pédagogique, professeur, étudiant, responsable familial si activé.
- Matrice d'autorisations : voir/créer/modifier/archiver/exporter/valider/payer par module et portée centre/site/groupe.
- Créer/inviter, modifier rôle, activer/désactiver, révoquer accès simulé, aperçu des permissions, historique d'accès fictif, état MFA, groupes de permissions, paramètres d'export sensible.
- Confirmation forte pour changement de privilèges et suppression d'accès ; message « effet côté serveur à implémenter » dans la démo.

### Matières `/admin/subjects`

Créer, renommer, code, couleur, description, niveaux couverts ; assigner professeur ; voir groupes liés ; archiver après avertissement d'impact ; gérer doublons.

### Groupes `/admin/groups`

Créer/éditer : nom, matière, niveau, tarif, capacité, professeur(s), site/salle, jours, créneaux, période, état.

- Vue cards + table ; taux d'occupation ; roster étudiant ; liste d'attente ; associer élèves ; transfert ; duplication ; fermeture de groupe et réaffectation ; calendrier ; impression liste.
- Alertes d'occupation et conflits de salle/professeur ; action « trouver un créneau » avec candidats simulés.

### Inscriptions `/admin/enrollments`

Table relation élève–groupe, période, statut, montant convenu, remise, échéances, source d'inscription ; filtres et assistant d'inscription en plusieurs étapes ; renouveler, transférer, suspendre, annuler avec raisons ; documents et reçu d'inscription.

### Séances `/admin/sessions`

Table et timeline ; créer/dupliquer/reprogrammer/annuler ; heures, durée, groupe, enseignant, salle, capacité, supports, statut, notes.

- Conflits : chevauchement professeur/salle/étudiants ; modal d'arbitrage ; récapitulatif avant modification récurrente `cette séance` / `toutes les séances futures`.
- Lier une séance à une feuille de présence et au calcul de rémunération.

### Présences `/admin/attendance`

Vue jour/semaine/séance, taux global et par groupe ; grille d'appel ; statut `Présent`, `Absent`, `En retard`, `Excusé`, `Non pointé`, avec heure et source de pointage.

- Filtrer, corriger un pointage (justification obligatoire), sélectionner plusieurs, marquer absent, justifier, consulter anomalies, exporter CSV/XLSX/PDF, imprimer feuille.
- Ouvrir détail QR : étudiant, séance, professeur, heure, doublon, statut de vérification, justification. Distinguer `scan simulé` et `scan validé serveur` (non disponible en frontend-only).
- Tableau statistiques comparatives, heatmap simple, alertes répétition d'absences.

### Supports de cours `/admin/resources`

Liste par matière, groupe, enseignant ; déposer fichiers démo (object URL temporaire), preview, télécharger démo, renommer, tagger, classer, dépublier, supprimer avec confirmation ; états quota/erreur et informations de visibilité.

### Finances : encaissements `/admin/payments`

- Table paiement : référence, élève, groupe, date, période, montant, devise, méthode, référence externe, statut, reçu, agent de saisie.
- Actions : ajouter paiement, saisir paiement partiel, affecter à échéance, corriger informations non comptables, afficher reçu, télécharger PDF de démonstration, dupliquer un reçu brouillon, annuler/contrepasser avec motif et avertissement, rapprochement simulé, exporter.
- Ne **jamais effacer silencieusement** l'historique financier ; montrer annulation/contre-écriture dans l'UX.
- Drawer détail : montant initial, affectations, solde restant, journal d'opérations et lien élève.

### Échéances `/admin/dues` et Impayés `/admin/overdue`

- Vue échéancier calendrier / tableau, filtres période/groupe/montant, échéance à venir, retard, paiements partiels.
- Actions générer échéancier à partir du tarif, déplacer date (avec avertissement), accorder remise, ajuster après justification, enregistrer paiement, imprimer relevé, export filtré.
- Relances par modèles email/notification : prévisualisation et **simulation**, jamais un faux envoi réel.

### Tarifs, remises `/admin/pricing`

Catalogues par matière/groupe/niveau, frais inscription, mensualité, remises fixes/% et validité ; règles de priorité explicitées, aperçu facture avant application ; historique des changements ; confirmation d'application rétroactive.

### Remboursements `/admin/refunds`

Demandes, états brouillon/à approuver/approuvé/refusé/exécuté en simulation, pièces, motif, bénéficiaire, somme ; confirmations et journal.

### Rémunération `/admin/payroll`

Périodes, liste professeurs, méthode horaire/fixe/pourcentage, séances éligibles, absences, ajustements, état calcul / validé / payé fictivement.

- Assistant calcul détaillé et explications ; edit adjustments ; confirmation de verrouillage période ; exports CSV/XLSX/PDF ; traitement clair d'une correction après clôture ; interdiction d'afficher une paie fictive comme virement effectué.

### Dépenses `/admin/expenses`

Catégories, montant, date, fournisseur, pièce, mode, statut ; ajouter/éditer/archiver avec motif ; catégories personnalisées ; pièces jointes locales démo ; export.

### Rapports & comptabilité `/admin/reports`, `/admin/accounting`

- Rapports encaissements, impayés, paiements par moyen, inscriptions, fréquentation, paie, charges, cash-flow indicatif, synthèse par site.
- Filtres puissants : période, professeur, groupe, site, niveau, statut, catégorie ; compare période N/N-1 ; aperçu ; sauvegarde rapport.
- Mode **« Dossier pour le comptable »** : choisir période, documents (ventes/encaissements, reçus, avoirs/annulations, dépenses, rémunérations), colonnes, regroupements, pièces ; prévisualiser ; télécharger dossier ZIP démo si construit correctement.
- Exports `CSV UTF-8`, `XLSX`, `PDF` pour états lisibles, et format personnalisé **configurable**. Ajouter réglages `séparateur`, `encodage`, `format date`, `décimales`, `noms des colonnes`, `plan de comptes/mapping facultatif` ; mémoriser modèles.
- Ne **pas prétendre** que les exports respectent automatiquement un format fiscal légal marocain ou celui d'un cabinet ; exiger validation du modèle avec le comptable.

### Messages et annonces `/admin/communications`

Créer annonce, cibler groupe/professeur/parents/étudiants, choisir canal `In-app | Email | SMS | WhatsApp | appel manuel`, langue et variables, consentement/éligibilité, aperçu, programmer fictivement, bibliothèque de modèles, brouillons, historique simulé, échec de livraison simulé et retry affiché. **Les canaux externes restent des simulations ou des liens de composition clairement identifiés sans intégration serveur**.

Ajouter sous-pages `Boîte de réception`, `Conversations`, `Campagnes`, `Rappels automatiques`, `Modèles`, `Contacts & consentements`, `Historique & délivrabilité démo`. Pour chaque message : statut `brouillon/planifié/simulé/erreur`, canal, destinataires, typologie, date, aperçu, motif d'échec. Les appels téléphoniques sont des actions manuelles ; journal d'appel saisi par un agent, jamais écoute/enregistrement automatique.

### Notifications `/admin/notifications`

Centre de notifications avec lu/non lu, type, priorité, regroupement, marquer tout comme lu, ouvrir objet source, filtres, paramètres de préférences. Inclure types : `paiement reçu`, `échéance proche`, `impayé`, `absence`, `retard`, `absence répétée`, `QR refusé`, `document demandé/reçu/expirant`, `séance déplacée`, `annulation`, `invitation`, `réponse parent`, `feedback`, `incident`. Les bannières critiques ont action explicite et ne disparaissent pas automatiquement.

### Salles & sites `/admin/locations`

Liste et carte des sites, adresse, téléphone, capacité, salles, affectations, heures et géolocalisation optionnelle ; gestion de salles et matériel, vue planning d'occupation ; carte seulement si nécessaire ; erreurs de géocodage représentées explicitement.

### Audit `/admin/audit`

Liste horodatée fictive par auteur, action, entité, ancienne/nouvelle valeur non sensible, motif, filtres, export contrôlé ; bannière `Données de démonstration — journal non probant sans backend`.

### Paramètres `/admin/settings`

Onglets : `Profil centre`, `Branding`, `Sites & salles`, `Périodes scolaires`, `Préférences régionales`, `Facturation & reçus`, `Numérotation`, `Notifications`, `Contacts familles`, `Modèles & automatisations`, `Documents`, `Feedback`, `Modules activés (lecture seule si fixé par Super Admin)`, `Intégrations`, `Confidentialité`, `Utilisateurs & accès`, `Historique`.

- Logo upload mock, recadrage si implémenté, aperçu live en clair/sombre, couleurs, typographie autorisée, favicon, nom sous-domaine affiché sans simuler modification DNS.
- Formats nombres/dates, MAD, langue FR/AR, RTL de démonstration ; test des layouts longs.
- Paramètres reçus : préfixe, mentions, pied de page, informations du centre ; aperçu PDF démonstration.

## 4.4 Comptable / Gestionnaire financier (rôle délégué)

Vue réduite de l'admin, selon permissions : tableau de bord financier, encaissements, impayés, rapprochement, dépenses, rémunération, rapports, exports, dossiers comptables ; **aucun accès** par défaut aux notes pédagogiques ou aux changements de rôles. Prévoir panneau « permissions accordées » et interdiction explicite des modules hors périmètre.

## 4.5 Secrétaire / Coordinateur

- Dashboard tâches du jour, inscriptions, accueil, planning, gestion élèves, groupe, relances non financières si habilité, feuille de présence, documents, annonces.
- Vue de gestion limitée selon permissions ; actions finance/paie réservées ; messages explicites d'accès refusé.

## 4.6 Professeur — `/teacher`

Sidebar : **Aujourd'hui**, **Calendrier**, **Mes groupes**, **Mes séances**, **Présences / Scanner QR**, **Supports**, **Messages**, **Rémunération** (si permission), **Profil / Disponibilités**.

### Aujourd'hui

- Hero « Bonjour, … », prochain cours, compteur de séances, liste journée ; CTA `Démarrer la séance` et `Scanner les présences`.
- État aucune séance ; rappel conflit, salle, groupe ; aperçu des élèves attendus.

### Calendrier & séances

- Jour/semaine/mois, filtres groupes/sites ; détail session et liste d'élèves ; noter séance, signaler incident, demande de remplacement ou d'absence, supports du cours ; **pas de modification arbitraire des séances** hors permission.

### Scanner QR `/teacher/scan`

1. Choisir séance en cours (séance préremplie si une seule).
2. Afficher liste attendue et compteur présent/absent/en retard.
3. Bouton `Activer la caméra` → écran permission navigateur avec explication de confidentialité.
4. Cadre scanner optimisé mobile ; bouton pause, reprise, changer caméra, torch si disponible ; fallback saisie identifiant étudiant.
5. Scan détecté → état de validation **simulé** avec nom/initiales étudiant, résultat (`présent`, `déjà enregistré`, `mauvaise séance`, `élève non inscrit`, `QR expiré`, `scan hors créneau`, `erreur réseau`) et code couleur + texte.
6. Toast discret, feedback sonore/haptique **optionnel**, mise à jour de la liste et du compteur.
7. Mode pointage manuel individuel / liste, motif obligatoire pour correction ; fermeture de l'appel avec écran de synthèse et confirmation.
8. Bannières explicatives : « Les vérifications anti-fraude et la persistance nécessitent le serveur » ; ne **jamais** présenter un simple QR statique comme sûr contre copie.

### Groupes, supports, messages, rémunération

- Groupe : roster, emploi du temps, statistiques présence, supports ; fiche élève limitée selon autorisations.
- Supports : déposer et gérer fichiers de démo, lier à séance/groupe.
- Messages : annonces vers groupe/administration en mode simulation.
- Rémunération : visualiser détail de séances comptées, période, méthodes et écarts ; signaler anomalie, exporter état personnel.
- Profil : coordonnées, matière, disponibilités, préférences de notification, thème.

## 4.7 Étudiant — `/student`

Navigation simple : **Accueil**, **Mon calendrier**, **Mes groupes**, **Mes cours**, **Mes présences**, **Mes paiements**, **Notifications**, **Profil**.

- Accueil : prochain cours, groupe, salle, enseignant, annonces, documents récents, statut paiement.
- Calendrier : cours filtrés, export iCal si disponible, détail de séance.
- Groupes et supports : liste matières, ressources et téléchargements simulés.
- Présences : timeline présence/absence/retard avec justification à demander selon règle du centre ; KPI personnel.
- **Mon QR** : carte étudiant (QR de démo) avec nom, photo/initiales, centre, identifiant et statut ; expliquer que le QR de production devra être signé, éphémère et validé côté serveur.
- Paiements : échéancier, paiements historiques, reçus de démo, solde et contact administration ; pas de faux paiement en ligne.
- Notifications : lu/non lu, détails et préférences.
- Profil : données personnelles autorisées, langue, thème, accessibilité.

## 4.8 Parent / Responsable (si activé) — `/parent`

- Sélecteur enfant ; vue planning, absences, relevé financier, notifications, justificatifs, documents et reçus téléchargeables en démo, préférences de contact et consentements, boîte de messages, déclarations d’absence, accusés de lecture, demandes de rendez-vous, réclamation et enquête de satisfaction. Possibilité d’envoyer une demande de correction ou un message simulé.
- Pas d'accès aux données d'autres enfants ; permissions illustrées.

---

# 5. MODULE STAR : LE « MANIPULATEUR EXCEL » / DATA WORKBENCH

Le tableur est une **fonctionnalité produit centrale**, pas un simple bouton « Exporter vers Excel ». Construire `/admin/data-studio` avec expérience de gestion moderne accessible aux gestionnaires non techniques. Nom d'interface possible : **Studio de données**.

## 5.1 Structure écran

- Barre supérieure : titre du dataset, état `Brouillon / Modifications non sauvegardées`, nombre de lignes, sélection de vue, historique, bouton Importer, bouton Exporter.
- Barre secondaire « tableur » : recherche, filtres, tri, grouper, choisir colonnes, calculer, mise en forme simple, validation, annuler/rétablir.
- Grille quasi pleine largeur, ligne d'en-têtes sticky, première colonne fixable, scrollbar horizontale accessible ; panneau latéral « Détails ligne » et « Propriétés de colonne ».
- Bibliothèque de datasets : Élèves, Professeurs, Responsables, Groupes, Inscriptions, Séances, Présences, Paiements, Échéances, Dépenses, Paies, Documents (uniquement métadonnées), Rapports.
- Vues sauvegardées personnelles / partagées en simulation ; possibilité de restaurer la vue par défaut.

## 5.2 Interactions tableur obligatoires

- Double-clic pour éditer cellule autorisée ; Enter pour valider, Escape pour annuler, Tab suivant ; sélection au clavier.
- Copier/coller cellules simples, blocs rectangulaires et valeurs multi-cellules depuis un tableur externe ; prévisualiser et valider le mapping avant gros collage.
- Sélection de lignes / plages ; édition par lot, remplacement, remplissage vers le bas, suppression de valeurs si autorisé.
- Ajouter ligne via assistant valide, dupliquer ligne avec champs uniques remis à vide, archiver/supprimer selon type d'entité.
- Redimensionner/réordonner/masquer/épingler colonnes, choisir densité, tri multiple, filtre par texte/nombre/date/statut/groupe, filtres `ET/OU`.
- Formats colonnes : texte, entier, décimal, devise MAD, pourcentage, date, heure, téléphone, email, statut, liste déroulante, booléen, relation.
- Règles de validation Zod typées ; erreurs **par cellule** et panneau résumé, indicateur de ligne modifiée.
- Calculs légers dérivés (somme, moyenne, compte, min/max, total sélection) ; **ne pas annoncer un moteur complet de formules Excel** sans l'implémenter réellement. Prévoir interface de formule avancée dans une phase distincte et marquer si indisponible.
- Fonctions données : rechercher/remplacer, trim, case, supprimer doublons avec critères et aperçu, détecter valeurs vides, normaliser dates/téléphones, mapper catégories/groupes ; contrôle avant application.
- Figer en-têtes, afficher 25/50/100 lignes ou virtualiser ; sauvegarde de vue, reset filtres.
- Undo/redo des opérations non encore persistées, historique des changements locaux, retour arrière des opérations massives simulées.
- Export **seulement visible/autorisées**, ou toutes lignes de la vue avec compteur clair ; choisir `sélection`, `résultats filtrés`, `dataset entier`.
- État `Cellule bloquée` pour ID, montant finalisé, écriture close, info issue d'une autre entité ; lien vers workflow officiel plutôt que modification directe.

## 5.3 Import : assistant en 7 étapes

1. Choisir dataset de destination ou nouveau brouillon.
2. Déposer fichier `.csv`, `.xlsx` ou `.xls` si bibliothèque sélectionnée le permet ; limites de taille et traitement local.
3. Détecter séparateur/encodage CSV, feuille Excel, ligne d'en-tête ; montrer échantillon.
4. Mapper colonnes du fichier vers champs métier ; alias français/arabe/anglais ; champs obligatoires visibles.
5. Appliquer transformations : dates, MAD, noms, numéros téléphone, trim, doublons, valeurs manquantes, IDs de correspondance.
6. Prévisualiser **lignes valides / avertissements / rejets**, télécharger rapport d'erreurs, choisir `Créer`, `Mettre à jour`, `Ignorer doublons` (mode démo).
7. Confirmation avec nombres exacts ; progression, résultat et undo si possible ; journal d'import démo.

**Attention :** ne jamais lancer une importation réelle vers un serveur. Simuler le commit en mémoire/mock et marquer clairement son caractère provisoire.

## 5.4 Export : assistant professionnel

- Formats : CSV UTF-8, XLSX, PDF (rapport plutôt que tableur modifiable), JSON si utile pour intégrations futures, modèle vierge Excel, ZIP de plusieurs exports quand adapté.
- Choisir dataset, plage date, filtres, colonnes, ordre, regroupement, agrégats, feuille(s) et noms, entêtes personnalisés, séparateur, décimales, dates, devise, langue.
- **Templates prédéfinis** : liste élèves par groupe, feuilles d'appel, contacts responsables, présences par mois, encaissements, impayés, rémunération professeurs, dépenses, rapprochement, dossier comptable mensuel.
- **Template personnalisé** : ajouter/retirer/renommer colonne, ordonner, formatter, créer mapping vers colonne attendue par un comptable ; enregistrer sous un nom.
- Aperçu 10–50 lignes avec alertes `Champ absent`, `Données masquées`, `Colonnes sensibles` ; décompte des lignes ; sortie de fichier côté navigateur si techniquement possible.
- Protection : confirmer exports massifs de contacts, données personnelles et finance ; modal avertissant l'utilisateur des données sensibles. Le frontend mock **ne constitue pas** une mesure de sécurité : contrôle serveur futur obligatoire.
- Historique exports fictif : date, auteur, template, filtres, format, statut. Exporter un reçu ou rapport imprimable à partir d'un template propre.
- Indiquer clairement que l'export au format d'un **logiciel comptable spécifique** doit être défini par un mapping validé avec le cabinet ; ne pas inventer de format légal.

## 5.5 Performance du tableur

- Parsing en Web Worker pour fichiers lourds ; limite explicite et échantillonnage ; affichage virtuel et rendu incrémental.
- Pas de re-render de 10 000 cellules à chaque frappe ; état d'édition local par cellule, mémorisation appropriée.
- Tests de fluidité avec 100, 1 000, 10 000 lignes démo ; navigation clavier, calculs simples, import/export et retour d'erreur.
- Un dataset ne doit jamais importer toute la bibliothèque tableur sur la page d'accueil.

---

# 6. CALENDRIER INTERNE ET INTÉGRATIONS GOOGLE / APPLE

## 6.1 Calendrier interne complet `/admin/calendar`

- Vues jour, 3 jours, semaine, mois, agenda/list ; raccourci Aujourd'hui, navigation mois/semaine ; fuseau du centre affiché.
- Choix des calendriers affichés : centre/site, salle, professeur, groupe, matière, séances personnelles, événements administratifs, absences, jours fermés.
- Codes couleur et légende accessibles, filtres multisélection, recherche par titre/personne/salle.
- Clic créneau vide = dialog créer événement ; clic événement = popover résumé + drawer détail ; drag-drop/re-dimensionnement (desktop) et formulaires équivalents mobile.
- Champs événement : titre, type, groupe, enseignant, salle, site, date, début/fin, répétition, exceptions, notes, visibilité, statut, rappel.
- Détecter collisions salle/professeur/groupe et afficher modal `Conflit détecté` avec options : modifier horaire, changer salle, annuler.
- Répétitions : chaque semaine, jours spécifiques, fin par date/nombre ; exceptions ponctuelles, jours fériés configurés ; prompt `cette occurrence` / `cette série` / `occurrences futures`.
- Import ICS en lecture locale et export ICS si implémentés ; aperçu avant import, gestion des doublons.
- Empty states propres ; skeleton grille plutôt qu'un spinner géant.

## 6.2 Google Calendar

- Écran `Paramètres > Intégrations > Google Calendar` : card provider, statut `Non connecté`, description des permissions futures, bouton `Connecter` **désactivé ou en simulation explicite tant que l'OAuth backend n'existe pas**.
- Maquette du flux OAuth : explication et consentement, choix calendrier source/cible, synchroniser événements du centre vers Google, importer de Google, direction bi/unidirectionnelle.
- Préférences : calendrier par rôle/professeur, plage de synchronisation, conflits, fuseau, rappels, fréquence, paramètres confidentialité, résolution doublons.
- Visualiser : aperçu des événements à créer/modifier/supprimer, état de connexion, dernière synchro fictive, échec, retry et déconnexion avec confirmation.
- Exposer les limitations de l'intégration sans serveur et sans consentement OAuth réel.

## 6.3 Apple Calendar

- **Ne pas prétendre fournir un bouton OAuth Apple Calendar standard équivalent à Google.** Proposer :
  1. **S'abonner au calendrier (flux ICS)** : UI de génération/copie du lien ; signaler qu'un flux privé signé et révocable doit être généré par un backend, **pas de secret dans le frontend** ; parcours d'aide Mac/iPhone.
  2. **Exporter `.ics`** : télécharger événements sélectionnés et les ouvrir/importer dans Apple Calendar.
  3. **Import local `.ics`** : prévisualiser et importer des événements de façon mock.
- Une synchronisation bidirectionnelle avec iCloud/CalDAV est un **projet distinct** nécessitant étude technique, consentement, backend et gestion des identifiants ; afficher comme « Non disponible dans le prototype ».
- UI des événements exportés et risques de doublons, distinction abonnement vs import ponctuel.

## 6.4 Calendrier par rôle

- Directeur : tous calendriers autorisés, gestion conflits.
- Secrétaire/coordinateur : affectations selon permissions.
- Professeur : planning personnel et groupes, signaler absence / demande de changement.
- Étudiant/parent : calendrier lecture seule du groupe/enfant, export ICS.

---

# 7. BARRES D'ACTION, BANNIÈRES, CONFIRMATIONS, LOADER ET ÉTATS

## Inventaire obligatoire de feedback UX

| Événement | Affichage | Actions |
|---|---|---|
| Création réussie | Toast success + ligne ajoutée + focus | Ouvrir fiche, annuler si permis |
| Sauvegarde en cours | Spinner **dans le bouton**, disable ciblé | Pas de doublon, garder données visibles |
| Suppression sensible | `AlertDialog` détaillé | Annuler / confirmer + saisie nom si bulk |
| Paiement annulé | Warning + motif obligatoire | Revoir détails, confirmer |
| Échec réseau simulé | Banner contextualisée + toast erreur | Réessayer / conserver brouillon |
| Intégration déconnectée | Banner non bloquante | Voir réglages |
| Données filtrées vides | Empty state + icon et texte | Effacer filtres |
| Première utilisation | Empty state pédagogique | CTA créer/importer |
| Import incohérent | Panneau d'erreurs par lignes | Corriger mapping / télécharger erreurs |
| QR déjà vu | Indication orange, pas de double compte | Voir pointage existant |
| Scan non autorisé | Feedback explicite neutre | Passer à appel manuel si permis |
| Collision calendrier | Dialog avec créneaux conflictuels | Modifier / annuler |
| Expiration session simulée | Dialog + bannière | Revenir à connexion démo |
| Opération bulk | Barre flottante avec sélection | Appliquer / exporter / annuler |
| Sauvegarde partielle | Bannière et éléments précis | Revoir erreurs |
| Action irréversible | Dialogue impact + choix conscient | Saisir confirmation |

## Loading strategy

- Écrans : skeleton calqué sur la structure finale (cartes, rows, grilles).
- Tables : skeleton de 6–10 lignes ; sur filtre, garder tableau présent et montrer indicateur de chargement discret.
- Graphiques : skeleton du graphe ; ne pas afficher des chiffres factices sans badge `Données démo`.
- Scanner : étapes permission, activation, scan, validation, succès/erreur.
- Export/import : progression explicite, annulation si possible, récapitulatif.
- Délai supérieur à 2 s (simulation) : microcopie sur la tâche en cours et option `Réessayer` si erreur.
- Mettre les erreurs au niveau du champ, puis résumé général si nécessaire.

---

# 8. DESIGN DÉTAILLÉ DES PAGES TRANSVERSALES

## Connexion et navigation du prototype

- Écran connexion premium, pas de vrai login ; choix `Explorer comme : Super Admin / Directeur / Secrétaire / Comptable / Professeur / Étudiant / Parent`.
- Identités fictives réalistes, environ 3 centres imaginaires, plusieurs rôles, données non personnelles ; bouton `Reset demo`.
- Switch de rôle visible **uniquement en Mode Démo** ; sidebar, routes, formulaires et droits changent selon rôle.
- App switcher et sélecteur centre **uniquement pour les rôles autorisés**.
- Recherche globale : groupes, professeurs, élèves, séances, paiements (résultats filtrés selon rôle), raccourcis.
- Profil avatar : Mon compte, Préférences, Apparence, Aide, Se déconnecter de la démo.
- Notification bell avec compteur, popover et lien « Voir toutes ».
- Raccourcis : Cmd/Ctrl+K recherche, `/` si compatible, `Esc` fermer overlay, `?` aide ; menu raccourcis.
- Onboarding produit par rôle : tour non intrusif, dismiss, reprise.

## Structure type page liste

1. Breadcrumb / titre / description en une ligne.
2. Actions primaires à droite (Ajouter, Importer, Exporter).
3. KPI ou tabs optionnels.
4. Barre outils recherche, filtres, vues, colonnes.
5. Table / cartes et toolbar bulk.
6. Pagination, compteur visible, indication de filtres.
7. Dialog détail, sheet édition, empty/error/loading states.

## Structure type fiche

1. Breadcrumb avec retour liste.
2. Avatar/icône + titre + statut ; primary action à droite.
3. Résumé quick facts.
4. Tabs pertinents, pas plus de 7 à 9 visibles sans overflow.
5. Timeline activité (mock), documents, liens vers entités.
6. Menu `...` avec actions secondaires/dangereuses, séparées.

## Structure type assistant de création

- Progress stepper clair ; champs groupés par tâche ; sauvegarde brouillon ; valeurs par défaut raisonnables ; contrôle revenir ; étape de révision ; succès + lien fiche créée.
- Si une donnée métier dépend d'une autre, utiliser select dépendant : centre → site → groupe → professeur → séance.

---

# 9. ARCHITECTURE FRONTEND, DONNÉES MOCK ET ANTI-GOULOTS

## Arborescence recommandée (adapter sans perdre la séparation)

```text
src/
  app/
    (marketing)/...
    (auth-demo)/...
    (super-admin)/...
    (center-admin)/...
    (teacher)/...
    (student)/...
    (parent)/...
    globals.css
  components/
    ui/                 # shadcn uniquement, variantes documentées
    shell/              # Sidebar, Header, Breadcrumbs, MobileNav
    feedback/           # Toast, Alerts, ConfirmDialog, EmptyState
    forms/              # FormField, DateRange, CurrencyField, Upload
    tables/             # DataTable, ColumnPicker, BulkActions
    spreadsheet/        # Grid, ImportWizard, ExportWizard, Mapping
    calendar/           # CalendarBoard, EventDrawer, Conflicts
    attendance/         # QRScanner, Roster, AttendanceBadges
    finance/            # PaymentDrawer, ReceiptPreview
    charts/
    maps/
  features/
    capabilities/ onboarding-wizard/ parent-contacts/ campaigns/
    automation-rules/ documents/ feedback/ surveys/ support-tickets/
    students/ teachers/ guardians/ staff/ subjects/ groups/
    enrollments/ sessions/ attendance/ resources/
    payments/ dues/ refunds/ payroll/ expenses/ accounting/
    communication/ reporting/ data-studio/ integrations/
    locations/ branding/ onboarding/ super-admin/
  lib/
    mock-api/          # contrats, fixtures, requêtes simulées
    permissions/       # rôles et capacités UI
    format/            # dates, monnaie, CSV, ICS
    exports/           # builders et schémas
    validation/        # Zod par domaine
    calendar/
    utils/
  hooks/
  stores/               # état UI minimal et isolé
  types/
  styles/
  tests/
  stories/              # si Storybook choisi
public/
AVANCEMENT.md
README_FRONTEND.md
```

## Contrats de données et comportements

- Créer `ModuleDefinition`, `InstanceCapabilities`, `OnboardingDraft`, `ContactPreference`, `MessageTemplate`, `CommunicationEvent`, `AutomationRule`, `DocumentRecord`, `DocumentRequest`, `FeedbackItem`, `Survey`, `SupportTicket`, `Role`, `Permission`, `Center`, `User`, `Student`, `Teacher`, `Guardian`, `Subject`, `Group`, `Enrollment`, `Session`, `Attendance`, `Payment`, `Due`, `Refund`, `Payroll`, `Expense`, `Resource`, `Notification`, `Location`, `CalendarConnection`, `AuditEvent` sous formes TypeScript.
- Isoler `MockRepository<T>` / `ApiAdapter<T>` ; un jour `realApiAdapter` remplacera le mock sans modifier les pages.
- Contrats de réponse `data`, `pagination`, `meta`, `error` ; une stratégie d'erreur partagée.
- Fixtures cohérentes référentiellement : paiements liés à vrais élèves fictifs ; séances liées à groupes et professeurs ; KPI calculés depuis les données, non chiffres statiques contradictoires.
- Supporter latences simulées (rapide/moyen/lent), mode offline, 403, 404, 409 conflit, 422 validation, 500.
- **Tout bouton visible doit produire un résultat de démonstration vérifiable** ou afficher un état clair `Non disponible dans la démo`, jamais de faux succès.
- TanStack Query : clés structurées incluant centre, rôle, filtre, page ; invalidations ciblées après mutation ; préchargement limité ; éviter cache global qui mélange les centres.
- Mémoriser les filtres via URL lorsque pertinent ; éviter états imprévisibles ; pagination côté services mock.
- Préférer Server Components pour structure statique, Client Components **uniquement là où il faut de l'interactivité** ; ne pas mettre toute l'app en client.
- Virtuallisation, lazy loading, code splitting ; aucune carte, scanner ou grille Excel sur le bundle de landing/login.

---

# 10. CHECKLIST QUALITÉ, ACCESSIBILITÉ ET SÉCURITÉ CÔTÉ UI

**Important : aucune sécurité frontend n'est suffisante à elle seule** ; permissions et restrictions simulées servent au prototype, une validation côté serveur sera obligatoire à l'intégration.

- [ ] Navigation clavier de bout en bout, focus visible, Esc ferme les overlays, retour focus sur déclencheur.
- [ ] Labels/ARIA corrects, noms accessibles sur boutons icônes, erreurs liées aux champs.
- [ ] Contrastes WCAG AA, y compris dark/light, couleurs du centre, badges, graphiques.
- [ ] Réduction d'animation respectée ; pas de motion obligatoire pour comprendre l'état.
- [ ] Touch targets utilisables, sidebar mobile, scan mobile testé, pas d'overflow masquant des actions.
- [ ] Confirmation pour suppression, annulation financière, modification de permissions, exports sensibles et bulk edits.
- [ ] Pas de données personnelles réelles dans les fixtures, captures, logs, URL ou `localStorage`.
- [ ] Aucune fausse autorisation : les contrôles permissions UX ne sont jamais décrits comme protection backend.
- [ ] Aucun secret/OAuth token réel stocké côté client ; clés maps publiques seulement si fournisseur l'autorise.
- [ ] Fichiers importés analysés localement, tailles limitées, pas d'exécution de macros ; gérer CSV injection à l'export (`=`, `+`, `-`, `@`) via politique d'échappement documentée.
- [ ] Toute donnée importée affichée comme texte, pas d'injection HTML ; `dangerouslySetInnerHTML` absent sauf justification contrôlée.
- [ ] Erreurs asynchrones testables, annulation, retry, skeletons et no-results.
- [ ] Performance contrôlée sur mobile milieu de gamme, interface à 60 FPS quand possible, **budgets route documentés**, pas de librairie lourde chargée sur chaque route.
- [ ] Modules configurés par Super Admin reflétés partout (sidebar, routes, actions, onboarding, préférences), sans élévation de droits.
- [ ] Consentements et responsables éligibles correctement représentés avant tout contact parent ; aucun faux statut d’envoi réel.
- [ ] Documents sensibles masqués selon rôle simulé ; pas de stockage persistant de documents réels en démo.
- [ ] Feedback produit SaaS séparé du feedback centre ; enquête anonyme sans identifiant persistant.
- [ ] Tests unitaires des composants critiques et transformations d'import/export ; tests E2E desktop et mobile des flux complets.
- [ ] Captures ou Storybook pour light/dark, mobile/desktop, empty/loading/error.
- [ ] Frontend clairement marqué **prototype** tant que backend, sécurité serveur et intégrations n'existent pas.

## Scénarios E2E minimum

1. Basculer Clair → Sombre → Système ; recharger ; thème conservé, sans flash.
2. Sidebar ouverte/réduite/masquée ; mobile drawer, clavier et focus.
3. Passer démo Directeur → Professeur → Étudiant, menus changent, routes interdites gérées.
4. Ajouter un élève, associer parent, groupe et frais, voir effets partout.
5. Créer un groupe, planifier séance, détecter collision, corriger.
6. Scanner QR simulé, gérer doublon/QR expiré/non inscrit, modifier présence avec motif.
7. Enregistrer paiement partiel, afficher nouveau solde, annuler par workflow et voir historique.
8. Calculer paie prof de démo et vérifier données source / écarts.
9. Importer CSV avec erreurs, mapper, corriger et afficher lignes acceptées.
10. Copier-coller dans tableur, filtrer, bulk edit, undo, sauvegarder vue, exporter XLSX/CSV et vérifier contenu.
11. Générer dossier comptable démo avec mapping et aperçus.
12. Calendrier créer/éditer/répéter/déplacer, avertissement conflit, export ICS.
13. Écran Google déconnecté : ne pas effectuer de connexion réelle ; écran Apple : abonnement ICS expliqué.
14. Simuler timeout/offline/403/500, vérifier feedback et retour.
15. Tester 360 px + dark mode + 200 % zoom et navigation entièrement clavier.

---

# 10A. CONFIGURATEUR SUPER ADMIN — MODULES, INSTANCES ET DÉPENDANCES

**Principe produit :** super admin de plateforme = décide **quelles fonctionnalités sont disponibles pour un centre** ; directeur du centre = configure leur usage et attribue les accès autorisés ; staff/prof/élève/parent = utilise seulement les vues qui lui sont accordées. Les préférences UI de modules ne constituent jamais une autorisation serveur réelle.

## Catalogue central de modules (feature flags typés)

Chaque module comporte `key`, `name`, `description`, `group`, `defaultEnabled`, `planRequirement`, `dependencies[]`, `incompatibilities[]`, `rolesAllowed[]`, `availableActions[]`, `configSchema`, `uiRoutes[]`, `status` et `icon`. Définir au moins ces clés :

| Domaine | Modules à paramétrer indépendamment ou par sous-capacité |
|---|---|
| Base | `students`, `guardians`, `teachers`, `staff`, `subjects`, `groups`, `enrollments`, `sessions`, `locations` |
| Présences | `attendance.manual`, `attendance.qr`, `attendance.alerts`, `attendance.analytics`, `attendance.justifications` |
| Parents | `parent.portal`, `parent.messaging`, `parent.appointments`, `parent.consent`, `parent.feedback` |
| Communication | `messaging.inapp`, `messaging.email`, `messaging.sms`, `messaging.whatsapp`, `messaging.templates`, `messaging.campaigns`, `messaging.automations` |
| Finance | `billing`, `dues`, `payment.reminders`, `receipts`, `refunds`, `expenses`, `payroll`, `accounting.exports` |
| Documents | `documents.students`, `documents.teachers`, `documents.parents`, `documents.templates`, `documents.requests`, `documents.expiryAlerts` |
| Données | `dataStudio`, `imports`, `exports`, `customReports`, `audit` |
| Calendrier | `calendar.internal`, `calendar.google`, `calendar.ics`, `calendar.appointments` |
| Qualité | `feedback`, `surveys`, `supportTickets`, `analytics.feedback` |
| Marque | `whiteLabel`, `customDomainPreview`, `notifications`, `maps` |

**UX administrateur plateforme :** affichage en liste/grille avec recherche, filtres par dépendances et plan, badges `Inclus / Non autorisé / Bêta / Nécessite configuration`, détail en `Sheet`, activation via `Switch` assorti d'une description courte, activations en masse, comparaison des presets, aperçu de l'effet sur sidebar et onboarding, résumé des changements non enregistrés, bouton `Appliquer la configuration`, dialogue d'impact, bannière succès/échec. Les changements de module à impact comportent simulation de migration des données **sans supprimer de données** et nécessitent confirmation.

**Comportement UI :** `useCenterCapabilities(centerId)` dérive menus, CTA, routes, assistants, templates, notifications, colonnes et parcours selon capacités et rôle. Fournir `ModuleGate` et `CapabilityGate` réutilisables, états `désactivé par l'éditeur`, `non inclus dans le plan`, `en configuration`, `connexion externe requise`, `temporairement indisponible`. Le module de contacts parent peut exister sans portail parent ; les alertes d'absence nécessitent les présences et un contact éligible ; rappels paiements nécessitent échéances et contact éligible ; QR dépend de séances et élèves. Aucune activation silencieuse de dépendance : proposer la chaîne et demander confirmation.

**Tester au minimum trois centres fictifs :** `Centre Essentiel` (aucune messagerie externe, présences manuelles), `Centre Plus` (parents, rappels, QR), `Centre Complet` (tous modules disponibles). Naviguer entre eux en mode démo pour vérifier zéro fuite de navigation ou de préférences.

# 10B. ONBOARDING COMPLET, PERSONNALISABLE ET RÉCUPÉRABLE

Construire deux parcours distincts : **inscription SaaS publique** et **assistant de mise en service d'un centre** après activation. Super Admin peut déclencher, préconfigurer, relancer ou reconfigurer l'onboarding de chaque instance. Le directeur confirme les informations de sa propre instance.

## Étapes conditionnelles détaillées

1. **Bienvenue / progression** : objectif, durée non chiffrée arbitrairement, progression, sauvegarde démo, reprise, assistance, guide contextuel.
2. **Responsable principal** : prénom/nom, email, téléphone, fonction, langue, invitation démo, vérification de consentement et notice confidentialité.
3. **Identité juridique et pratique du centre** : nom commercial, raison sociale facultative, ICE/IF/autres identifiants *si pertinents et validés ultérieurement*, adresse, ville, pays, contacts, plages horaires, logos, couverture géographique.
4. **Sous-domaine, thème et langues** : disponibilité simulée, design clair/sombre, contraste, FR/AR RTL, aperçu en direct sur téléphone et bureau.
5. **Sites et salles** : un ou plusieurs établissements, salles, capacités, jours ouvrés, fuseau horaire, localisation facultative sur carte.
6. **Organisation pédagogique** : niveaux, filières, matières, groupes, capacités, créneaux, périodes scolaires, règles de séances.
7. **Équipe** : directeur, secrétaires, comptables, professeurs, coordinateurs, rôles et invitations simulées, aperçu permissions, import optionnel.
8. **Élèves et responsables** : création manuelle ou import CSV/XLSX fictif, appariement enfant-parent, dédoublonnage, contact prioritaire, préférences linguistiques.
9. **Tarifs et finance** : devises, périodicités, échéances, modèles de reçu, remises, modes de règlement, règles de rémunération, colonnes d'export comptable. Si module financier désactivé, ne pas afficher cette étape.
10. **Présences et QR** : séance type, scan du professeur, gestion absence/retard, délai d'alerte, personnes pouvant corriger, confirmation de confidentialité.
11. **Communication parentale** : canaux autorisés, préférences par type d'événement, horaires silencieux, consentements, modèles FR/AR, aperçu absence/paiement/document. Si module désactivé, masquer étape.
12. **Documents** : catégories, pièces requises par profil, échéances de renouvellement, accès, modèles, aperçu des demandes.
13. **Calendrier et intégrations** : mode interne seul / Google / ICS Apple, préférences de synchronisation, conflits, état déconnecté annoncé.
14. **Feedback & service** : canaux de support, enquêtes de satisfaction et déclencheurs, destinataires internes, anonymat paramétrable selon type de questionnaire.
15. **Import initial / vérification** : assistant de mapping, import de démonstration, erreurs par ligne, dédoublonnage, prévisualisation, annuler/restaurer brouillon.
16. **Récapitulatif** : liste de contrôle des modules autorisés/configurés/non configurés, prévisualisation sidebar par rôle, permissions, cas à corriger, validation avec confirmation.
17. **Première connexion guidée** : checklist post-onboarding, tutoriels fermables, données démo séparées, bannière `Centre en cours de configuration`, accès aux paramètres.

## Design et interactions d'onboarding

- Wizard plein écran ou zone principale aérée, sidebar de progression compactable ; `Stepper`, `Progress`, `Card`, `Tabs`, `Form`, `Combobox`, `Input`, `PhoneInput` construit, `DatePicker`, `FileUpload`, `Calendar`, `Alert`, `Skeleton`, `Dialog`, `Tooltip`, `Sheet` ; aucun formulaire interminable sur mobile.
- Contrôles `Précédent`, `Continuer`, `Enregistrer le brouillon`, `Ignorer` **uniquement pour optionnel**, `Aperçu`, `Tester le modèle`, `Quitter` avec confirmation.
- Validation locale Zod, erreurs groupées par section, retour focus au premier champ erroné, récapitulatif des champs bloquants, progression stable à changement de module.
- Après sélection des modules Super Admin, reconfigurer dynamiquement les étapes sans détruire le brouillon des étapes devenues inactives ; signaler ce qui n'est plus accessible.
- Simuler erreurs réseau, invitation expirée, sous-domaine pris, import invalide, upload refusé, configuration incomplète, retour après interruption ; ne jamais prétendre avoir réellement invité/contacté quelqu'un.
- Fournir un **assistant de reprise / modification** après lancement avec aperçu des impacts avant changement.

# 10C. CENTRE DE COMMUNICATION PARENTS — CONTACT, ABSENCES, PAIEMENTS, DOCUMENTS

Créer un module transversal `/admin/families` et `/admin/communications` avec **centre de communication unifié** : un opérateur doit pouvoir contacter les responsables depuis une fiche enfant, une absence, un impayé, un document manquant, un groupe, un tableau de contacts et une campagne. Les liens `tel:`/`mailto:` et URL WhatsApp de composition préremplie ne prouvent pas qu'un message a été envoyé ; jamais `envoyé` sans résultat d'un canal réel. Les actions simulées apparaissent `Prévisualisé (démo)` ou `Envoi simulé`.

## Fiches contacts et préférences

- Données : identité, lien avec enfant, relation/autorité vérifiée par le centre, priorité de contact, téléphones, email, WhatsApp, langue, contact d'urgence, canaux consentis, plages et jours à éviter, opposition aux communications non essentielles, historique de consentements fictif.
- Plusieurs responsables par élève ; plusieurs enfants par responsable ; un responsable financier peut différer du contact absence et de l'urgence. Ne jamais présumer que tous les parents ont tous les droits sur toutes les données : représenter visuellement les règles et autorisations.
- Actions : ajouter/modifier/fusionner fiches, changer contact principal, associer/dissocier enfant avec confirmation, signaler numéro invalide, copier, appeler, composer email/WhatsApp, afficher conversation, ouvrir consentements, demander une pièce, envoyer un rappel fictif, exporter uniquement les colonnes permises.
- UI : `ContactCard`, `ChannelBadge`, `ConsentStatus`, `RecipientPicker`, `ChannelTabs`, `MessageComposer`, `MessagePreview`, `Timeline`, `DeliveryStatusBadge`, `ActivityLog`, `ConfirmDialog`.

## Déclencheurs de communication (tous pilotables par module)

| Événement | Déclencheurs et actions UI | Destinataires et contrôle |
|---|---|---|
| Absence à une séance | Notification absence confirmée, appel manuel, message prérempli, demande de justification, accusé de réception | Responsable autorisé ; éviter envoi tant que l'appel de présence n'est pas clôturé ou confirmé |
| Retard / départ anticipé | Alerte facultative, seuil configurable, correction, historique | Responsable choisi ; limiter répétitions |
| Absences répétées | Règle de seuil, aperçu des occurrences, proposition de rendez-vous, campagne ciblée | Responsable + coordinateur, selon consentements |
| Paiement reçu | Reçu, détail période, confirmation de paiement en démo | Responsable financier, jamais autre contact sans autorisation |
| Échéance imminente | Rappel J-x configurable, aperçu somme et référence, action `Contacter` | Responsable financier ; respect plages horaires |
| Retard de paiement | Relances progressives, pause des relances en litige, marquer traité, notes internes | Responsable financier ; pas de ton humiliant ni exposition aux groupes |
| Pièce manquante/expirante | Demande de document, modèle, échéance, rappel, upload fictif | Responsable habilité / professeur concerné |
| Changement de séance | Prévenir les affectés, aperçu différences, bouton `Notifier` fictif | Enseignant, élèves/parents concernés |
| Situation urgente | Bannière priorité, numéros d'urgence, appel manuel, journal d'incident | Contact d'urgence ; ne jamais simuler appel ou message d'urgence réussi |
| Feedback | Demande d'avis après interaction / fin de trimestre, sondage anonyme si activé | Parents, élèves éligibles, enseignants selon règles |

## Campagnes, modèles et automatisations

- `CampaignBuilder` : nom, objectif, audience (filtres group/site/niveau/statut/événement), estimation du nombre de contacts **éligibles**, canaux disponibles dans l'instance, exclusion désabonnés, anti-doublon, horaires, brouillon, test prévisualisé, confirmation de lancement en démo.
- `TemplateEditor` avec variables `{{parent_first_name}}`, `{{student_first_name}}`, `{{session_date}}`, `{{due_date}}`, `{{amount_due}}`, `{{document_name}}` ; validations de variables manquantes, aperçu FR/AR et en contexte mobile, texte alternatif si variable absente ; conserver des modèles sobres et respectueux.
- `AutomationRuleBuilder` : événement → conditions → audience → canal → délai → heures calmes → limite de fréquence → revue → activation démo. Gérer `pause`, `reprendre`, `dupliquer`, `éditer`, `tester avec données fictives`, `désactiver`, `historique`. Afficher dépendances de capacités et consentements.
- Inbox : recherche, filtres, tags, affectation staff, conversation reliée à élève/parent, réponses modèles, état non lu, épingler, archiver, attribuer, escalader, réouvrir ; toutes les actions opérantes en mock.
- Accusé de lecture et délivrabilité **uniquement simulés** dans le prototype ; les canaux réels demanderont intégration officielle, consentements et politiques du fournisseur.

# 10D. GESTION DOCUMENTAIRE COMPLÈTE (UI)

Pages : `/admin/documents`, `/admin/documents/requests`, `/admin/documents/templates`, `/admin/documents/expiring`, `/admin/documents/[id]`, zones `Documents` sur fiches élève/parent/professeur, espace parent et prof. Montrer des catégories configurables : fiche d'inscription, pièces d'identité si légalement justifiées, autorisations parentales, règlement intérieur, attestation d'inscription, reçu, contrat professeur, justificatif d'absence, support de cours, autre.

- **Liste/docothèque** : filtres par type, propriétaire, centre/site, statut, date d'expiration, confidentialité, version, document manquant ; grille/liste, recherche, bulk action avec confirmation.
- **Actions** : déposer (fichier fictif pour démo), glisser-déposer, aperçu PDF/image local si sûr, renommer, catégoriser, associer, demander, remplacer une version, visualiser historique, télécharger démo, exporter métadonnées, archiver/restaurer, demander suppression, définir échéance, accuser réception, refuser avec motif.
- **Demande de pièce** : choisir destinataire, type, motif, date limite, modèle notification, canal autorisé, aperçu, suivi `demandé/reçu/en revue/accepté/refusé/expiré`, relance simulée.
- **Confidentialité** : avertissement pour pièce sensible, accès restreint par rôle, pas d'upload réel sur serveur ni de stockage durable de vrais documents personnels en démo ; ne pas afficher un document personnel d'un enfant à un autre profil.
- **Composants** : `DocumentList`, `Dropzone`, `DocumentPreviewDrawer`, `DocumentStatusBadge`, `RequestWizard`, `ExpiryTimeline`, `VersionHistory`, `AttachmentPicker`, `SensitiveFileWarning`, `BulkActionBar` ; preview et traitement différés, limites taille/type et fallback explicite.

# 10E. SYSTÈME DE FEEDBACK, ENQUÊTES ET SUPPORT

Prévoir **deux systèmes séparés mais reliés** : (A) feedback **sur le produit SaaS** adressé au Super Admin, (B) feedback **sur le centre** adressé à son administration. Ne jamais partager automatiquement les réponses d'un centre avec un autre. L'utilisateur doit comprendre à qui il écrit et qui peut lire le retour.

- **Widget contextuel** : bouton discret `Donner un avis` dans menu Aide ; choix `Signaler un bug`, `Proposer une amélioration`, `Question`, `Évaluer l'expérience`, `Réclamation` ; formulaire en `Sheet`/`Dialog`, sévérité, description, pièce jointe fictive, capture avec prévisualisation et masquage manuel des données sensibles ; ne pas collecter automatiquement un écran contenant des données élèves.
- **Centre de feedback** `/admin/feedback` et `/super/feedback` : colonnes type, statut, date, module, impact, tags, auteur anonymisé si enquête anonyme, réponse, affectation, priorités ; Kanban optionnel *chargé à la demande*, table légère par défaut, détail avec fil de discussion mock et actions classer, assigner, répondre, clôturer, rouvrir, fusionner doublons, exporter.
- **Enquêtes** : créateur `FormBuilder` avec choix unique/multiple, texte court/long, note 1–5, échelle, NPS si souhaité, champs obligatoires, logique conditionnelle simple, audience, dates, anonymat, prévisualisation par rôle, traduction FR/AR, duplication, pause, clôture ; afficher réponses synthétiques et export CSV/XLSX fictif.
- **Déclenchements UX** : après onboarding, après support, fin de trimestre, après réception de documents, enquête périodique (uniquement si module activé) ; pas de popup intempestive, fréquence plafonnée et bouton `Ne plus demander`.
- **Support** : tickets avec catégorie, statut, priorité, historique, pièces fictives, messages internes vs réponses visibles, rappel, évaluation de résolution ; FAQ/recherche d'aide contextuelle et mini-guides.
- **Respect confidentialité** : les retours anonymes sont effectivement non associés à une identité dans le mock ; pas de promesse d'anonymat si une donnée identifiante est jointe. Distinguer saisie locale, simulation et transmission réelle.
- **Composants** : `FeedbackTrigger`, `FeedbackSheet`, `SurveyRenderer`, `SurveyBuilder`, `RatingInput`, `TicketTimeline`, `FeedbackTable`, `FeedbackFilters`, `SentimentSummary` sans inférences médicales/psychologiques, `Toast`, `EmptyState`, `SuccessBanner`.

# 10F. PERFORMANCE FRONTEND : BUDGET, GESTION DE CHARGE ET VALIDATION

Objectif : **interface riche sans transformer le navigateur en application lourde**, notamment sur smartphones moyens et réseaux lents. Optimiser **par route** et par **interaction**, pas seulement le poids de la page d'accueil. Les budgets sont des **cibles initiales à mesurer et ajuster**, jamais des résultats annoncés.

## Budgets et principes

- Cible indicative : maintenir le **JS de démarrage additionnel** des routes courantes aussi réduit que possible ; viser **< 200 Ko compressés de JS spécifique au parcours courant** hors frameworks/bundles partagés si réaliste après mesure, et documenter toute dérogation. Ne pas présenter cette borne comme métrique garantie.
- Cibles terrain : LCP <= 2,5 s, INP <= 200 ms, CLS <= 0,1 sur appareil/réseau de test défini ; utiliser Lighthouse et mesure en navigateur sur *build production* et préciser limites des données synthétiques.
- Animations : CSS `transform/opacity` en priorité, 150–250 ms en général, pas de scroll listeners continus, pas de layout thrashing, `prefers-reduced-motion`, pas d'effet décoratif coûteux sur tableaux et formulaires.
- **Route-level code splitting** : charger `AG Grid`, tableur, FullCalendar, Maps, scanner QR, graphiques complexes, génération PDF/ZIP, parseurs XLSX seulement sur l'écran qui en a besoin. Mettre `dynamic()` / import à la demande, fallback skeleton, `ssr:false` uniquement quand nécessaire.
- **RSC-first** : composants serveurs pour coquille statique et contenu non interactif ; islands client étroites ; bannir `"use client"` au niveau d'un layout global sans justification.
- **Data access en mock** : pagination et filtrage côté repository, virtualisation au-delà d'un seuil de lignes mesuré, pas de 10 000 entrées dans le DOM, revalidation ciblée, préfetch prudent, déduplication des requêtes et annulation via AbortController quand applicable.
- **Exports/imports** : parse CSV/XLSX en Web Worker avec progression, cancel, preview bornée, traitement par lots, limites taille/lignes, conservation de l'UI fluide ; génération PDF/ZIP à la demande ; pas d'énormes payloads sérialisés dans les props de pages.
- **Onboarding** : charger uniquement l'étape active, précharger au maximum l'étape suivante si connexion stable, valider par section, sauvegardes débouncées pour données mock, ne pas rerender tout le wizard à chaque frappe.
- **Notifications/messages** : listes paginées, compteurs agrégés, polling simulé uniquement lorsque vue active si nécessaire, pas de timers permanents pour chaque notification.
- **Images & fonts** : next/image si approprié, dimensions explicites, SVG légers, police sous-ensembles, éviter plusieurs polices de poids similaires, pas d'autoplay vidéo sur dashboards.
- **State management** : ne pas mettre tables, fichiers, brouillons et UI transitoire dans un store global unique ; hooks ciblés, stores par feature, sélecteurs de state, context minimal, cache par centre et capacité ; nettoyage des listeners et ressources caméra sur unmount.
- **A11y/performance** : pas de animations répétées de skeleton sur pages entières ; support clavier; focus visible ; préférer graphes statiques ou table de données lorsque l'appareil est contraint.

## Outils et scénarios de validation

- `next build` + analyse des bundles, Lighthouse (mobile/desktop), React Profiler, Web Vitals et suivi console ; documenter chiffres **réels**, appareils et conditions.
- Tester **360 px**, téléphone milieu de gamme simulé, CPU ralenti, réseau lent, 100, 1 000 et 10 000 lignes fictives dans les listes/tableur, 5 000 messages mock, 500 documents fictifs, grands calendriers et switching d'instance.
- Démontrer que le chargement initial du dashboard n'importe pas la grille Excel, les SDK Maps ni le scanner QR. Écrire des tests pour vérifier absence de gros imports au démarrage et absence de handlers caméra après fermeture.
- Tester le parcours `création centre → onboarding → ajout élève/parent → absence → notification mock → paiement → reçu/documents → feedback`, avec rechargement et changement de thème, sans figeage ni perte d'état attendue.
- En cas de dépassement budget : mesurer, profiler, corriger la cause (imports, props, re-renders, données trop volumineuses), consigner dans `AVANCEMENT.md` et retester avant d'annoncer la fonctionnalité terminée.

---

# 11. AVANCEMENT.md — JOURNAL OBLIGATOIRE DU DÉVELOPPEMENT

Créer à la racine `AVANCEMENT.md` **dès la première intervention** ; mise à jour à chaque création de module, modification, correction, test, décision ou dépendance. Journal append-only pour les lots finis : ne pas effacer les échecs.

Format d'entrée obligatoire :

```md
## YYYY-MM-DD HH:mm — Lot #NN — Nom du travail
- Objectif :
- Pages/routes créées ou modifiées :
- Composants et bibliothèques utilisés :
- Fichiers ajoutés/modifiés/supprimés :
- Interactions implémentées :
- Données mock et scénarios :
- États couverts (loading/empty/error/success/offline) :
- Responsive / accessibilité / performance :
- Tests exécutés + résultats :
- Erreurs rencontrées + corrections :
- Limites / non fonctionnel faute de backend :
- Décisions et raisons :
- Prochain lot proposé :
- Validation utilisateur requise : Oui/Non
```

Maintenir aussi en haut : tableau de progression par rôle/module, statut `À faire | En cours | Terminé | Bloqué`, checklist de pages, liens vers captures/tests et dette technique. Créer `README_FRONTEND.md` avec installation, scripts, comptes fictifs, données, conventions design, navigation et limites.

---

# 12. PLAN INCRÉMENTAL DE LIVRAISON ET VALIDATION

**Règle : ne pas générer toutes les pages d'un coup. Chaque lot doit être testable, navigable et visuellement cohérent. Ne pas passer au lot suivant sans accord de l'utilisateur.**

1. **Lot 1 — Design foundation & shell :** audit du projet existant (ne rien écraser), tokens, fonts, styles, setup shadcn/themes, composants de base, shell ChatGPT-like, sidebar responsive, topbar, menu profil, dark/light/system, page demo role switch, placeholders de routes typés, création `AVANCEMENT.md` et `README_FRONTEND.md`.
2. **Lot 2 — Navigation et UI kit :** DataTable, formulaires, toasts, bannière, alert dialogs, loaders, skeletons, empty/error/offline, confirmations, notifications, command palette, Storybook ou galerie interne.
3. **Lot 3 — Landing, onboarding adaptatif, auth démo et Super Admin :** catalogue de modules, configuration par instance, presets, aperçu de permissions et wizard intégral conditionnel ; interactions mock et états.
4. **Lot 4 — Dashboard et administration des profils :** dashboard, élèves, parents (contacts multiples/consentements), professeurs, staff et permissions.
5. **Lot 5 — Pédagogie :** matières, groupes, inscriptions, salles, séances, supports.
6. **Lot 6 — Calendrier interne :** vue agenda/jour/semaine/mois, répétitions, conflits, interface mobile et export ICS.
7. **Lot 7 — Présences QR :** vue admin, scan prof, QR étudiant, états fraude simulés, statistiques.
8. **Lot 8 — Finances :** encaissements, échéances, impayés, tarifs, remboursements, rémunérations, dépenses, reçus et rapports.
9. **Lot 9 — Studio de données :** tableur complet, copier-coller, édition, validations, import wizard, mapping, export wizard, templates comptables, historique.
10. **Lot 10 — Communication famille, documents, feedback, intégrations, reporting et branding :** contacts parentaux, notifications absences/paiements/documents, modèles, campagnes et automatisations mock, docothèque, feedback produit/centre, UX Google/Apple, cartes, paramètres et apparence.
11. **Lot 11 — Espaces prof/étudiant/parent + rôles secrétaire/comptable :** tous les parcours complets avec accès adaptés.
12. **Lot 12 — QA terrain frontend :** tests E2E, accessibilité, **budgets JS par route et fluidité sur téléphone**, trois configurations de modules par instance, performances tableur/documentation, revue de toutes les routes/actions, corrections et checklist de démo.

## Definition of Done de chaque page

La page n'est **pas terminée** si l'un de ces éléments manque : design light/dark, responsive, navigation réelle, droits UI simulés, fonction CTA principale, actions secondaires, feedback de succès, confirmation dangereuse, loading/skeleton, empty/no-results, erreur, validations, tests de base, données liées à d'autres pages, traçabilité dans `AVANCEMENT.md`.

## Réponse obligatoire à la fin de chaque lot

1. Résumer les écrans visibles et comment les ouvrir.
2. Lister les interactions utilisables et les limites de la démo.
3. Indiquer fichiers et bibliothèques installées.
4. Donner résultats des tests réellement exécutés (ne jamais inventer un test).
5. Décrire comment vérifier visuellement la version desktop/mobile et clair/sombre.
6. Indiquer ce qui a été ajouté à `AVANCEMENT.md`.
7. Demander la validation pour le **lot suivant**.

---

# 13. PREMIÈRE INSTRUCTION À EXÉCUTER MAINTENANT

**Commence exclusivement par le LOT 1.**

Avant de coder : inspecte le dépôt et identifie la version de Next.js, React, Tailwind, shadcn et les composants existants. Préserve tout travail existant ; explique les incompatibilités ou migrations nécessaires. Propose une mini-charte UI et l'arborescence frontend adaptée. Puis implémente réellement le shell premium (sidebar, header, thème, navigation démo, page dashboard de présentation et composants de base) et crée `AVANCEMENT.md` + `README_FRONTEND.md`.

**N'implémente pas le backend. N'annonce aucune intégration OAuth, aucun paiement, aucune vérification QR sécurisée ou export légalement conforme comme fonctionnel tant que ce n'est pas réellement le cas.**

Ne passe pas au LOT 2 avant validation explicite.
