import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { GlobalBanner } from '@/components/feedback/states';

export default function AuthDemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/60">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="font-heading text-base font-bold tracking-tight"
          >
            MarkazFlow
          </Link>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Authentification simulée · Mode Démo</span>
            <Link
              href="/"
              className="inline-flex items-center gap-1 font-medium text-foreground hover:text-primary"
            >
              <ArrowLeft className="size-3.5" />
              Accueil
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        <GlobalBanner
          tone="info"
          title="Espace de connexion de démonstration (aucune authentification réelle)"
          description="Aucun mot de passe n'est transmis ni vérifié sur un serveur. Utilisez le formulaire simulé ou sélectionnez directement un profil fictif pour tester les droits UX."
        />
        {children}
      </main>
    </div>
  );
}
