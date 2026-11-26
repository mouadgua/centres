'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { getFilteredNavGroups } from '@/lib/permissions/navigation';
import { useDemoSession } from '@/stores/demo-session-context';
import { AppHeader } from '@/components/shell/app-header';
import { AppSidebar } from '@/components/shell/app-sidebar';
import { NavIcon } from '@/components/shell/nav-icon';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const {
    activeRole,
    activeCenter,
    sidebarCollapsed,
    sidebarHidden,
    setSidebarCollapsed,
    setSidebarHidden,
  } = useDemoSession();

  const isFullWidthRoute =
    pathname.startsWith('/admin/data-studio') ||
    pathname.startsWith('/admin/calendar');

  const showMobileBottomNav =
    activeRole === 'teacher' ||
    activeRole === 'student' ||
    activeRole === 'parent';

  const mobileBottomItems = getFilteredNavGroups(
    activeRole,
    activeCenter.enabledModules
  )
    .flatMap((g) => g.items)
    .slice(0, 4);

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {/* Desktop persistent sidebar */}
      {!sidebarHidden && (
        <div className="hidden md:sticky md:top-0 md:flex md:h-screen md:shrink-0">
          <AppSidebar
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>
      )}

      {/* Mobile drawer sidebar */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-[280px] p-0" showCloseButton={false}>
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation MarkazFlow</SheetTitle>
            <SheetDescription>Menu de navigation principal</SheetDescription>
          </SheetHeader>
          <AppSidebar
            collapsed={false}
            isMobile
            onToggleCollapse={() => setMobileNavOpen(false)}
            onNavigate={() => setMobileNavOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main content column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          onOpenMobileNav={() => setMobileNavOpen(true)}
          sidebarHidden={sidebarHidden}
          onToggleSidebarHidden={() => setSidebarHidden(!sidebarHidden)}
        />

        {/* Subtle non-intrusive Mode Démo strip */}
        <div className="border-b border-border/60 bg-muted/35 px-4 py-1.5 text-xs text-muted-foreground sm:px-6">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <Info className="size-3.5 shrink-0 text-info" />
              <span>
                <strong className="font-medium text-foreground">Mode Démo</strong> — Données
                100 % fictives · Fuseau Africa/Casablanca · Devise MAD · Aucun backend connecté.
              </span>
            </span>
            <Link
              href="/demo"
              className="font-medium text-primary hover:underline"
            >
              Configurer profil / centre
            </Link>
          </div>
        </div>

        <main
          className={cn(
            'flex-1 px-4 py-6 sm:px-6 lg:px-8',
            showMobileBottomNav && 'pb-20 md:pb-6'
          )}
        >
          <div
            className={cn(
              'mx-auto w-full',
              isFullWidthRoute ? 'max-w-none' : 'max-w-6xl'
            )}
          >
            {children}
          </div>
        </main>

        <footer className="border-t border-border/60 px-4 py-3 text-xs text-muted-foreground sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
            <span>MarkazFlow · Prototype Frontend Lot 1</span>
            <span>{activeCenter.branding.subdomain} · Africa/Casablanca</span>
          </div>
        </footer>
      </div>

      {/* Mobile bottom navigation strictly for Teacher / Student / Parent (max 4 tabs) */}
      {showMobileBottomNav && mobileBottomItems.length > 0 && (
        <nav
          aria-label="Navigation rapide mobile"
          className="fixed inset-x-0 bottom-0 z-30 flex h-14 items-center justify-around border-t border-border bg-background/95 px-2 backdrop-blur-xs md:hidden"
        >
          {mobileBottomItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  'flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-1 text-[11px] font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <NavIcon name={item.iconName} className="size-4" />
                <span className="max-w-[72px] truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
