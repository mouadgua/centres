'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getFilteredNavGroups } from '@/lib/permissions/navigation';
import { useDemoSession } from '@/stores/demo-session-context';
import { NavIcon } from '@/components/shell/nav-icon';

interface AppSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate?: () => void;
  isMobile?: boolean;
}

export function AppSidebar({
  collapsed,
  onToggleCollapse,
  onNavigate,
  isMobile = false,
}: AppSidebarProps) {
  const pathname = usePathname();
  const { activeRole, activeCenter, activeUser } = useDemoSession();
  const navGroups = getFilteredNavGroups(
    activeRole,
    activeCenter.enabledModules
  );

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  return (
    <aside
      aria-label="Navigation principale"
      className={cn(
        'flex h-full flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out',
        !isMobile && 'border-r border-sidebar-border',
        collapsed && !isMobile ? 'w-[70px]' : 'w-[260px]'
      )}
    >
      {/* Top workspace brand lockup */}
      <div
        className={cn(
          'flex h-14 shrink-0 items-center border-b border-sidebar-border px-3',
          collapsed && !isMobile ? 'justify-center' : 'justify-between'
        )}
      >
        {(!collapsed || isMobile) && (
          <Link
            href={activeUser.defaultRoute}
            onClick={onNavigate}
            className="flex min-w-0 items-center gap-2.5 rounded-md px-1 py-1 text-left focus-visible:outline-2 focus-visible:outline-ring"
          >
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground">
              {activeRole === 'super_admin'
                ? 'MF'
                : activeCenter.branding.shortCode}
            </div>
            <div className="min-w-0">
              <p className="truncate font-heading text-sm font-semibold tracking-tight text-sidebar-foreground">
                {activeRole === 'super_admin'
                  ? 'MarkazFlow SaaS'
                  : activeCenter.name}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {activeRole === 'super_admin'
                  ? 'Console Plateforme'
                  : `${activeCenter.city} · ${activeCenter.plan}`}
              </p>
            </div>
          </Link>
        )}

        {!isMobile && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={onToggleCollapse}
                  aria-label={
                    collapsed ? 'Déplier la barre latérale' : 'Réduire la barre latérale'
                  }
                  className="text-muted-foreground hover:text-sidebar-foreground"
                />
              }
            >
              {collapsed ? (
                <PanelLeftOpen className="size-4" />
              ) : (
                <PanelLeftClose className="size-4" />
              )}
            </TooltipTrigger>
            <TooltipContent side="right">
              {collapsed ? 'Déplier le menu' : 'Réduire en rail'}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Scrollable navigation groups */}
      <ScrollArea className="flex-1 px-2.5 py-3">
        <nav className="space-y-4">
          {navGroups.map((group) => {
            const isGroupCollapsed = collapsedGroups[group.id] ?? false;

            return (
              <div key={group.id} className="space-y-1">
                {!collapsed || isMobile ? (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    aria-expanded={!isGroupCollapsed}
                    className="flex w-full items-center justify-between rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-sidebar-foreground focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <span className="truncate">{group.label}</span>
                    {isGroupCollapsed ? (
                      <ChevronRight className="size-3.5 shrink-0 opacity-60" />
                    ) : (
                      <ChevronDown className="size-3.5 shrink-0 opacity-60" />
                    )}
                  </button>
                ) : (
                  <div className="mx-auto my-2 h-px w-6 bg-sidebar-border" />
                )}

                {(!isGroupCollapsed || (collapsed && !isMobile)) && (
                  <ul className="space-y-0.5">
                    {group.items.map((item) => {
                      const isActive =
                        pathname === item.href ||
                        (item.href !== '/admin/dashboard' &&
                          item.href !== '/super/dashboard' &&
                          item.href !== '/teacher' &&
                          item.href !== '/student' &&
                          item.href !== '/parent' &&
                          pathname.startsWith(`${item.href}/`));

                      const linkEl = (
                        <Link
                          href={item.href}
                          onClick={onNavigate}
                          aria-current={isActive ? 'page' : undefined}
                          className={cn(
                            'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-ring',
                            collapsed && !isMobile && 'justify-center px-0',
                            isActive
                              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                              : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
                          )}
                        >
                          <NavIcon
                            name={item.iconName}
                            className={cn(
                              'size-4 shrink-0',
                              isActive
                                ? 'text-sidebar-primary'
                                : 'text-muted-foreground'
                            )}
                          />
                          {(!collapsed || isMobile) && (
                            <span className="truncate">{item.label}</span>
                          )}
                        </Link>
                      );

                      if (collapsed && !isMobile) {
                        return (
                          <li key={item.id}>
                            <Tooltip>
                              <TooltipTrigger render={linkEl} />
                              <TooltipContent side="right">
                                {item.label}
                              </TooltipContent>
                            </Tooltip>
                          </li>
                        );
                      }

                      return <li key={item.id}>{linkEl}</li>;
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Bottom demo context card */}
      {(!collapsed || isMobile) && (
        <div className="shrink-0 border-t border-sidebar-border p-3">
          <Link
            href="/demo"
            onClick={onNavigate}
            className="flex items-center justify-between rounded-lg bg-sidebar-accent/70 px-3 py-2 text-xs transition-colors hover:bg-sidebar-accent focus-visible:outline-2 focus-visible:outline-ring"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-sidebar-foreground">
                Mode Démo · {activeUser.roleLabel}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {activeCenter.enabledModules.length} modules actifs
              </p>
            </div>
            <Sparkles className="size-3.5 shrink-0 text-sidebar-primary" />
          </Link>
        </div>
      )}
    </aside>
  );
}
