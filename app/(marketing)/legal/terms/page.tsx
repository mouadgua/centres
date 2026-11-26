import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Info } from 'lucide-react';
import { MarketingHeader, MarketingFooter } from '@/components/marketing/marketing-shell';

export default function TermsLegalPage() {
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
            Conditions d&apos;utilisation — Maquette Démo
          </h1>
          <p className="text-sm text-muted-foreground">
            Conditions indicatives pour l&apos;évaluation du prototype MarkazFlow
          </p>
        </header>

        <div className="flex items-start gap-3 rounded-xl border border-info/40 bg-info/10 p-4 text-sm">
          <Info className="mt-0.5 size-5 shrink-0 text-info" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Cette interface est une maquette interactive de démonstration. Les
            tarifs en MAD, factures SaaS, reçus d&apos;encaissement, paies
            professeurs et exports comptables présentés ne constituent ni une
            offre contractuelle définitive ni des documents comptables ou
            fiscaux conformes sans validation serveur et cabinet comptable.
          </p>
        </div>

        <section className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            1. Objet du prototype
          </h2>
          <p>
            Le prototype permet aux équipes dirigeantes et partenaires
            techniques d&apos;évaluer l&apos;ergonomie des parcours multi-rôles,
            la modularité pilotée par le Super Admin et l&apos;adaptation au
            contexte des centres de soutien scolaire au Maroc.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            2. Limites techniques actuelles
          </h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              Authentification, MFA et contrôle d&apos;accès sont simulés côté
              navigateur pour faciliter la démonstration des 7 profils.
            </li>
            <li>
              Les connecteurs Google Calendar, Apple iCloud/CalDAV, paiement en
              ligne et SMS/WhatsApp nécessitent un backend dédié non inclus ici.
            </li>
            <li>
              Les cartes QR et feuilles d&apos;appel QR fonctionnent avec des
              jetons fictifs sans signature cryptographique serveur.
            </li>
          </ul>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
