'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  FileSpreadsheet,
  QrCode,
  ShieldCheck,
  UserCog,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  MarketingFooter,
  MarketingHeader,
} from '@/components/marketing/marketing-shell';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DEMO_USERS } from '@/lib/mock-api/demo-data';
import { formatMAD, formatNumberFR } from '@/lib/format/morocco';
import { useDemoSession } from '@/stores/demo-session-context';
import type { RoleId } from '@/types/core';

const TESTIMONIALS_DEMO = [
  {
    quote:
      'La séparation par modules nous a permis de démarrer avec les encaissements en MAD et l’appel manuel, puis d’activer le QR et les relances parents au second trimestre.',
    author: 'Nadia Bennis (Profil démo fictif)',
    role: 'Directrice pédagogique · Centre Casablanca',
    outcome: 'Suivi impayés centralisé sur un seul écran',
  },
  {
    quote:
      'Le Studio de données remplace nos dizaines de fichiers Excel dispersés tout en gardant un historique clair des modifications.',
    author: 'Youssef El Amrani (Profil démo fictif)',
    role: 'Responsable administratif · Rabat',
    outcome: 'Préparation du dossier comptable mensuel en un flux',
  },
];

const FAQ_ITEMS = [
  {
    q: 'Ce prototype exécute-t-il de vrais paiements ou envois SMS/WhatsApp ?',
    a: 'Non. Ce dépôt est un prototype frontend en Mode Démo. Aucun paiement réel, aucune base de données et aucun envoi email/SMS/WhatsApp réel ne sont effectués.',
  },
  {
    q: 'Comment fonctionne l’instance modulaire pilotée par le Super Admin ?',
    a: 'Dans /super/instances, l’éditeur active ou désactive chaque capacité pour un centre. La sidebar, la palette ⌘K, les actions rapides et l’assistant d’onboarding s’adaptent immédiatement.',
  },
  {
    q: 'Le fuseau horaire et la devise sont-ils adaptés au Maroc ?',
    a: 'Oui, toutes les démonstrations utilisent le dirham marocain (MAD), la locale fr-MA (avec prévision RTL arabe dans l’onboarding) et le fuseau Africa/Casablanca.',
  },
];

export default function HomePage() {
  const router = useRouter();
  const { activeCenter, centers, switchCenter, switchRole } = useDemoSession();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const openAsRole = (role: RoleId) => {
    switchRole(role);
    const target = DEMO_USERS[role];
    toast.success(`Ouverture en mode ${target.roleLabel}`);
    router.push(target.defaultRoute);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />

      <main className="mx-auto max-w-6xl space-y-20 px-4 py-12 sm:px-6 sm:py-16">
        {/* Hero */}
        <section className="grid items-center gap-10 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
            <p className="text-xs font-medium text-muted-foreground">
              SaaS multi-tenant white-label · Maroc (MAD · Africa/Casablanca) ·
              Prototype Mode Démo
            </p>
            <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-5xl">
              Pilotez votre centre de soutien scolaire, module par module.
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Inscriptions, présences QR, finances en MAD, rémunération des
              professeurs, studio tableur et communication familles dans une
              interface claire activée selon le plan de chaque centre.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button
                type="button"
                size="lg"
                onClick={() => openAsRole('director')}
              >
                Explorer en Directeur
                <ArrowRight className="size-4" />
              </Button>
              <Link
                href="/onboarding"
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Tester l&apos;onboarding adaptatif
              </Link>
              <Link
                href="/demo"
                className="inline-flex h-10 items-center px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Console démo
              </Link>
            </div>
          </div>

          {/* Interactive Mechanism-to-Outcome Preview Card */}
          <Card className="border-border bg-card shadow-none lg:col-span-5">
            <CardHeader className="border-b border-border pb-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Aperçu instance active</span>
                <span className="font-medium text-foreground">
                  Plan {activeCenter.plan}
                </span>
              </div>
              <CardTitle className="text-base">{activeCenter.name}</CardTitle>
              <CardDescription className="text-xs">
                {activeCenter.city} · {activeCenter.enabledModules.length}{' '}
                modules autorisés
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-muted-foreground">Élèves actifs</p>
                  <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
                    {formatNumberFR(activeCenter.metrics.activeStudents)}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-muted-foreground">Encaissé (mois)</p>
                  <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
                    {formatMAD(activeCenter.metrics.collectedRevenueMad)}
                  </p>
                </div>
              </div>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">
                  Navigation filtrée en direct :
                </p>
                <p>
                  Basculez entre Essentiel, Plus et Tout-en-un ci-dessous pour
                  constater l&apos;adaptation immédiate des menus, KPI et étapes
                  d&apos;onboarding.
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/super/instances"
                  onClick={() => switchRole('super_admin')}
                  className="inline-flex h-8 flex-1 items-center justify-center rounded-lg border border-border text-xs font-medium transition-colors hover:bg-muted"
                >
                  Configurateur Super Admin
                </Link>
                <Link
                  href="/admin/dashboard"
                  onClick={() => switchRole('director')}
                  className="inline-flex h-8 flex-1 items-center justify-center rounded-lg bg-primary text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Ouvrir le dashboard
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Core Product Pillars */}
        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
              Une architecture complète pensée pour les centres marocains
            </h2>
            <p className="text-sm text-muted-foreground">
              Chaque domaine métier fonctionne de façon autonome ou reliée selon
              la configuration définie par le Super Admin.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: QrCode,
                title: 'Pédagogie & Présences QR',
                desc: 'Groupes, capacités, feuilles d’appel manuelles et prototype de scan QR côté professeur et élève.',
              },
              {
                icon: Wallet,
                title: 'Finances MAD & Paie',
                desc: 'Encaissements partiels, échéanciers, relances simulées, contre-écritures et rémunération professeurs.',
              },
              {
                icon: FileSpreadsheet,
                title: 'Studio de données',
                desc: 'Tableur éditable, copier-coller, import CSV/XLSX en 7 étapes et dossier comptable configurable.',
              },
              {
                icon: CalendarDays,
                title: 'Planning & Familles',
                desc: 'Calendrier interne anti-conflits, export ICS, contacts multiples et consentements parentaux.',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="border-border shadow-none">
                  <CardHeader className="space-y-2">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-primary">
                      <Icon className="size-4" />
                    </div>
                    <CardTitle className="text-base">{item.title}</CardTitle>
                    <CardDescription className="text-xs leading-relaxed">
                      {item.desc}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>

        {/* 3 modular center instances */}
        <section id="instances" className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-1">
              <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
                Trois instances modulaires prêtes pour la démo
              </h2>
              <p className="text-sm text-muted-foreground">
                Sélectionnez un centre pour adapter dynamiquement les menus, KPI
                et parcours.
              </p>
            </div>
            <span className="text-xs text-muted-foreground">
              Instance active :{' '}
              <strong className="font-medium text-foreground">
                {activeCenter.name}
              </strong>
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {centers.map((center) => {
              const isSelected = center.id === activeCenter.id;
              return (
                <Card
                  key={center.id}
                  className={
                    isSelected
                      ? 'border-primary/60 bg-card shadow-none'
                      : 'border-border bg-card shadow-none'
                  }
                >
                  <CardHeader className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span>
                        {center.city} · Plan {center.plan}
                      </span>
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 font-medium text-primary">
                          <Check className="size-3.5" />
                          Actif
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-base">{center.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {center.branding.subdomain}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs">
                      <div>
                        <p className="text-muted-foreground">Élèves actifs</p>
                        <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums">
                          {formatNumberFR(center.metrics.activeStudents)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Modules actifs</p>
                        <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums">
                          {center.enabledModules.length}
                        </p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        switchCenter(center.id);
                        toast.success(`Instance sélectionnée : ${center.name}`);
                      }}
                    >
                      <Building2 className="size-3.5" />
                      {isSelected
                        ? 'Instance sélectionnée'
                        : 'Activer cette instance'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* 7 Demo Roles */}
        <section id="roles" className="space-y-6">
          <div className="space-y-1">
            <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
              Explorer selon les 7 profils du SaaS
            </h2>
            <p className="text-sm text-muted-foreground">
              Chaque rôle accède uniquement à son périmètre UX simulé.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.values(DEMO_USERS).map((user) => (
              <Card
                key={user.id}
                className="flex flex-col justify-between border-border shadow-none"
              >
                <CardHeader className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>{user.fullName}</span>
                    <UserCog className="size-3.5" />
                  </div>
                  <CardTitle className="text-base">{user.roleLabel}</CardTitle>
                  <CardDescription className="text-xs leading-relaxed">
                    {user.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full justify-between"
                    onClick={() => openAsRole(user.role)}
                  >
                    <span>Ouvrir l&apos;espace</span>
                    <ArrowRight className="size-3.5" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Demo Testimonials explicitly labeled */}
        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
              Exemples d&apos;usages (témoignages fictifs de démonstration)
            </h2>
            <p className="text-xs text-muted-foreground">
              Ces retours illustratifs sont fictifs et destinés uniquement à la
              présentation du prototype.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {TESTIMONIALS_DEMO.map((t) => (
              <Card key={t.author} className="border-border shadow-none">
                <CardContent className="space-y-3 pt-6">
                  <p className="text-sm leading-relaxed text-foreground">
                    « {t.quote} »
                  </p>
                  <div className="border-t border-border pt-3 text-xs">
                    <p className="font-medium text-foreground">{t.author}</p>
                    <p className="text-muted-foreground">
                      {t.role} · {t.outcome}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="space-y-4">
          <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
            Questions fréquentes
          </h2>
          <div className="divide-y divide-border rounded-xl border border-border bg-card">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={item.q} className="p-4">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between gap-4 text-left text-sm font-medium"
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      className={`size-4 shrink-0 text-muted-foreground transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {item.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="flex flex-col items-start justify-between gap-4 rounded-xl border border-border bg-muted/30 p-6 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
              <ShieldCheck className="size-4 text-primary" />
              Prêt à configurer un centre de démonstration ?
            </h2>
            <p className="text-xs text-muted-foreground">
              Lancez l&apos;assistant d&apos;onboarding adaptatif ou ouvrez le
              configurateur Super Admin.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/onboarding"
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Démarrer l&apos;onboarding
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex h-9 items-center rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
            >
              Voir les plans
            </Link>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
