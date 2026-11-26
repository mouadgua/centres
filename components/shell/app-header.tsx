'use client';

import React, { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  Bell,
  Building2,
  Check,
  ChevronDown,
  HelpCircle,
  Menu,
  Monitor,
  Moon,
  PanelLeft,
  RotateCcw,
  Search,
  Sparkles,
  Sun,
  UserCog,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DEMO_USERS } from '@/lib/mock-api/demo-data';
import { getBreadcrumbsForPath } from '@/lib/permissions/navigation';
import { useDemoSession } from '@/stores/demo-session-context';
import { CommandPalette } from '@/components/shell/command-palette';
import type { RoleId } from '@/types/core';

interface AppHeaderProps {
  onOpenMobileNav: () => void;
  sidebarHidden: boolean;
  onToggleSidebarHidden: () => void;
}

const emptySubscribe = () => () => {};

export function AppHeader({
  onOpenMobileNav,
  sidebarHidden,
  onToggleSidebarHidden,
}: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme = 'system', setTheme, resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const {
    activeRole,
    activeUser,
    activeCenter,
    centers,
    reducedMotion,
    notifications,
    unreadCount,
    switchRole,
    switchCenter,
    setReducedMotion,
    markAllNotificationsRead,
    markNotificationRead,
    resetDemo,
  } = useDemoSession();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (
        e.key === '?' &&
        !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName ?? '')
      ) {
        e.preventDefault();
        setHelpOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const breadcrumbs = useMemo(
    () => getBreadcrumbsForPath(pathname),
    [pathname]
  );

  const handleRoleSwitch = (nextRole: RoleId) => {
    switchRole(nextRole);
    const targetUser = DEMO_USERS[nextRole];
    toast.success(`Profil démo activé : ${targetUser.roleLabel}`, {
      description: `Navigation et permissions simulées mises à jour.`,
    });
    router.push(targetUser.defaultRoute);
  };

  const handleCenterSwitch = (centerId: string) => {
    switchCenter(centerId);
    const target = centers.find((c) => c.id === centerId);
    if (target) {
      toast.success(`Instance active : ${target.name}`, {
        description: `Plan ${target.plan} · ${target.enabledModules.length} modules actifs.`,
      });
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-background/95 px-3 backdrop-blur-xs sm:px-5">
        {/* Left: mobile menu, optional restore sidebar, breadcrumbs */}
        <div className="flex min-w-0 items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onOpenMobileNav}
            aria-label="Ouvrir le menu de navigation"
            className="md:hidden"
          >
            <Menu className="size-4" />
          </Button>

          {sidebarHidden && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onToggleSidebarHidden}
              aria-label="Afficher la barre latérale"
              className="hidden md:inline-flex"
            >
              <PanelLeft className="size-4" />
            </Button>
          )}

          <nav
            aria-label="Fil d'Ariane"
            className="flex min-w-0 items-center gap-1.5 text-sm"
          >
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={crumb.href}>
                  {idx > 0 && (
                    <span
                      aria-hidden="true"
                      className="text-muted-foreground/60"
                    >
                      /
                    </span>
                  )}
                  {isLast ? (
                    <span className="truncate font-medium text-foreground">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="hidden truncate text-muted-foreground transition-colors hover:text-foreground sm:inline"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        </div>

        {/* Right: search, center switch, demo role switch, help, notifications, theme, avatar */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {/* Global search trigger */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSearchOpen(true)}
            aria-label="Recherche globale (Ctrl+K)"
            className="hidden h-8 w-44 justify-between border-border/80 bg-muted/40 px-2.5 text-xs font-normal text-muted-foreground hover:bg-muted lg:inline-flex xl:w-56"
          >
            <span className="flex items-center gap-2 truncate">
              <Search className="size-3.5 shrink-0" />
              <span className="truncate">Rechercher...</span>
            </span>
            <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              ⌘K
            </kbd>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setSearchOpen(true)}
            aria-label="Rechercher"
            className="lg:hidden"
          >
            <Search className="size-4" />
          </Button>

          {/* Center selector (only if role can switch centers) */}
          {activeUser.canSwitchCenter && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="hidden h-8 max-w-[175px] gap-1.5 px-2.5 text-xs sm:inline-flex"
                  />
                }
              >
                <Building2 className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{activeCenter.name}</span>
                <ChevronDown className="size-3 shrink-0 opacity-60" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Instance de centre (Démo)</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  value={activeCenter.id}
                  onValueChange={handleCenterSwitch}
                >
                  {centers.map((c) => (
                    <DropdownMenuRadioItem key={c.id} value={c.id}>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium">{c.name}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {c.city} · Plan {c.plan}
                        </p>
                      </div>
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Demo Role Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-8 gap-1.5 px-2.5 text-xs"
                />
              }
            >
              <UserCog className="size-3.5 shrink-0 text-primary" />
              <span className="hidden max-w-[125px] truncate md:inline">
                {activeUser.roleLabel}
              </span>
              <span className="md:hidden">Rôle</span>
              <ChevronDown className="size-3 shrink-0 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>
                Basculer de profil (Mode Démo)
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={activeRole}
                onValueChange={(val) => handleRoleSwitch(val as RoleId)}
              >
                {Object.values(DEMO_USERS).map((user) => (
                  <DropdownMenuRadioItem key={user.id} value={user.role}>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium">
                        {user.roleLabel}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {user.fullName}
                      </p>
                    </div>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Help button */}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setHelpOpen(true)}
            aria-label="Aide et raccourcis clavier"
            className="hidden sm:inline-flex"
          >
            <HelpCircle className="size-4" />
          </Button>

          {/* Notifications dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Notifications (${unreadCount} non lues)`}
                  className="relative"
                />
              }
            >
              <Bell className="size-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex size-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-semibold text-primary-foreground tabular-nums">
                  {unreadCount}
                </span>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="flex items-center justify-between px-2 py-1.5">
                <span className="text-xs font-semibold">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllNotificationsRead}
                    className="text-[11px] font-medium text-primary hover:underline"
                  >
                    Tout marquer comme lu
                  </button>
                )}
              </div>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                  Aucune notification pour ce centre.
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto">
                  {notifications.map((notif) => (
                    <DropdownMenuItem
                      key={notif.id}
                      onClick={() => {
                        markNotificationRead(notif.id);
                        router.push(notif.href);
                      }}
                      className="flex flex-col items-start gap-1 py-2"
                    >
                      <div className="flex w-full items-center justify-between gap-2">
                        <span
                          className={cn(
                            'truncate text-xs',
                            !notif.read ? 'font-semibold' : 'font-medium'
                          )}
                        >
                          {notif.title}
                        </span>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {notif.timeLabel}
                        </span>
                      </div>
                      <p className="line-clamp-2 text-[11px] text-muted-foreground">
                        {notif.description}
                      </p>
                    </DropdownMenuItem>
                  ))}
                </div>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push('/admin/notifications')}
                className="justify-center text-xs font-medium text-primary"
              >
                Voir toutes les notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Dropdown (Apparence) — exact behavior requested in Section 2 */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Apparence"
                />
              }
            >
              {mounted && resolvedTheme === 'dark' ? (
                <Moon className="size-4" />
              ) : (
                <Sun className="size-4" />
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Apparence</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => setTheme('light')}
                  className="justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Sun className="size-4" />
                    Clair
                  </span>
                  {mounted && theme === 'light' && (
                    <Check className="size-4 text-primary" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTheme('dark')}
                  className="justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Moon className="size-4" />
                    Sombre
                  </span>
                  {mounted && theme === 'dark' && (
                    <Check className="size-4 text-primary" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTheme('system')}
                  className="justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Monitor className="size-4" />
                    Système
                  </span>
                  {mounted && theme === 'system' && (
                    <Check className="size-4 text-primary" />
                  )}
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={reducedMotion}
                onCheckedChange={(checked) => setReducedMotion(Boolean(checked))}
              >
                Réduire les animations
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile Avatar Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Menu du profil"
                  className="rounded-full"
                />
              }
            >
              <Avatar className="size-7">
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {activeUser.initials}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <div className="px-2 py-2">
                <p className="truncate text-sm font-medium">
                  {activeUser.fullName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {activeUser.roleLabel} · {activeUser.email}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/demo')}>
                <Sparkles className="size-4" />
                Espace Mode Démo & Rôles
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setHelpOpen(true)}>
                <HelpCircle className="size-4" />
                Aide & raccourcis
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  onToggleSidebarHidden()
                }
              >
                <PanelLeft className="size-4" />
                {sidebarHidden
                  ? 'Afficher la barre latérale'
                  : 'Masquer la barre latérale'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  resetDemo();
                  toast.success('Données de démonstration réinitialisées');
                }}
              >
                <RotateCcw className="size-4" />
                Réinitialiser la démo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Keyboard Shortcuts & Help Dialog */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Aide & Raccourcis</DialogTitle>
            <DialogDescription>
              MarkazFlow — Prototype frontend Mode Démo (aucun backend connecté).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Navigation rapide</span>
              <kbd className="rounded border border-border bg-muted px-2 py-0.5 font-mono text-xs">
                ⌘K / Ctrl+K
              </kbd>
            </div>
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Afficher cette aide</span>
              <kbd className="rounded border border-border bg-muted px-2 py-0.5 font-mono text-xs">
                ?
              </kbd>
            </div>
            <div className="flex items-center justify-between pb-1">
              <span className="text-muted-foreground">Fermer un panneau</span>
              <kbd className="rounded border border-border bg-muted px-2 py-0.5 font-mono text-xs">
                Esc
              </kbd>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
