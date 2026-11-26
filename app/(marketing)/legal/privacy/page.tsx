import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { MarketingHeader, MarketingFooter } from '@/components/marketing/marketing-shell';

export default function PrivacyLegalPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />
      <main className="mx-auto max-w-3xl space-y-8 px-4 py-12 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Retour à l&apos;accueil
        </Link>

        <header className="space-y-2 border-b border-border pb-6">
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            Confidentialité &amp; Données — Mode Prototype
          </h1>
          <p className="text-sm text-muted-foreground">
            Dernière mise à jour de démonstration : Novembre 2026 · Périmètre
            Maroc
          </p>
        </header>

        <div className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-warning" />
          <div className="space-y-1">
            <p className="font-medium text-foreground">
              Application frontend de démonstration uniquement
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              MarkazFlow fonctionne ici sans serveur ni base de données. Aucune
              donnée personnelle réelle d&apos;élève, de parent ou de
              professeur ne doit être saisie dans cette maquette. Les fiches
              préchargées sont 100 % fictives.
            </p>
          </div>
        </div>

        <section className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            1. Stockage local temporaire
          </h2>
          <p>
            Les préférences de démonstration (rôle sélectionné, centre actif,
            modules activés par le Super Admin et brouillons d&apos;onboarding)
            sont enregistrées localement dans le{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
              localStorage
            </code>{' '}
            de votre navigateur afin de préserver la continuité entre les écrans.
            Vous pouvez réinitialiser ces données à tout moment depuis le menu
            Mode Démo.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            2. Séparation des rôles &amp; confidentialité produit
          </h2>
          <p>
            Dans l&apos;architecture cible, l&apos;administration SaaS (Super
            Admin) accède uniquement aux compteurs agrégés de facturation et
            d&apos;adoption des modules — jamais aux dossiers individuels
            d&apos;élèves ni aux pièces justificatives d&apos;un centre.
            L&apos;isolation réelle devra être garantie côté serveur et base de
            données (RBAC + cloisonnement multi-tenant) avant toute mise en
            production, en conformité avec la loi marocaine 09-08 relative à la
            protection des données à caractère personnel.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            3. Canaux externes &amp; consentements
          </h2>
          <p>
            Aucun message Email, SMS ou WhatsApp n&apos;est réellement transmis
            depuis ce prototype. Les statuts d&apos;envoi et journaux de
            consentement parental sont simulés pour valider l&apos;ergonomie des
            parcours avant intégration backend.
          </p>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
