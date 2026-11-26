'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { ArrowRight, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function MarketingHeader() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/95 backdrop-blur-xs">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-8 px-4 sm:px-6">
        <Link
          href="/"
          className="font-heading text-lg font-bold tracking-tight whitespace-nowrap shrink-0"
        >
          MarkazFlow
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          <Link
            href="/features"
            className="whitespace-nowrap shrink-0 transition-colors hover:text-foreground"
          >
            Fonctionnalités
          </Link>
          <Link
            href="/pricing"
            className="whitespace-nowrap shrink-0 transition-colors hover:text-foreground"
          >
            Tarifs
          </Link>
          <Link
            href="/onboarding"
            className="whitespace-nowrap shrink-0 transition-colors hover:text-foreground"
          >
            Onboarding
          </Link>
          <Link
            href="/demo"
            className="whitespace-nowrap shrink-0 transition-colors hover:text-foreground"
          >
            Démo
          </Link>
          <Link
            href="/sign-in"
            className="whitespace-nowrap shrink-0 transition-colors hover:text-foreground"
          >
            Connexion
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() =>
              setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
            }
            aria-label="Apparence"
          >
            <Sun className="size-4 dark:hidden" />
            <Moon className="hidden size-4 dark:block" />
          </Button>
          <Link
            href="/admin/dashboard"
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground whitespace-nowrap shrink-0 transition-colors hover:bg-primary/90"
          >
            Ouvrir la démo
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-card/40 py-10 text-xs text-muted-foreground">
      <div className="mx-auto flex max-w-6xl flex-col justify-between gap-6 px-4 sm:flex-row sm:items-center sm:px-6">
        <div className="space-y-1">
          <p className="font-heading text-sm font-semibold text-foreground">
            MarkazFlow
          </p>
          <p>
            Prototype Frontend Mode Démo · Maroc (MAD · Africa/Casablanca) ·
            Données 100 % fictives
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-5">
          <Link href="/features" className="hover:text-foreground">
            Fonctionnalités
          </Link>
          <Link href="/pricing" className="hover:text-foreground">
            Tarifs
          </Link>
          <Link href="/contact" className="hover:text-foreground">
            Contact
          </Link>
          <Link href="/legal/privacy" className="hover:text-foreground">
            Confidentialité
          </Link>
          <Link href="/legal/terms" className="hover:text-foreground">
            Conditions
          </Link>
        </div>
      </div>
    </footer>
  );
}
