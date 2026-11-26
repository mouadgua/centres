'use client';

import React from 'react';
import {
  AlertTriangle,
  Info,
  RefreshCw,
  SearchX,
  WifiOff,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondaryAction?: () => void;
  variant?: 'empty' | 'no-results';
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondaryAction,
  variant = 'empty',
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-12 text-center',
        className
      )}
    >
      <div className="mb-3 flex size-11 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        {icon ??
          (variant === 'no-results' ? (
            <SearchX className="size-5" />
          ) : (
            <Info className="size-5" />
          ))}
      </div>
      <h3 className="font-heading text-base font-semibold text-foreground">
        {title}
      </h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        {description}
      </p>
      {(actionLabel || secondaryLabel) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          {actionLabel && onAction && (
            <Button type="button" size="sm" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
          {secondaryLabel && onSecondaryAction && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onSecondaryAction}
            >
              {secondaryLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  description?: string;
  code?: '403' | '404' | '409' | '422' | '500' | 'offline';
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
}

export function ErrorState({
  title,
  description,
  code = '500',
  onRetry,
  retrying = false,
  className,
}: ErrorStateProps) {
  const isOffline = code === 'offline';
  const defaultTitle = isOffline
    ? 'Connexion interrompue (simulation hors-ligne)'
    : code === '403'
      ? 'Action non autorisée'
      : 'Impossible de charger ces données';

  const defaultDesc = isOffline
    ? 'Aucune connexion détectée. Vos brouillons locaux sont conservés ; réessayez dès que la connexion revient.'
    : 'Une erreur simulée est survenue lors de la récupération des données. Aucun changement n’a été perdu.';

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center',
        className
      )}
    >
      <div className="mb-3 flex size-11 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
        {isOffline ? (
          <WifiOff className="size-5" />
        ) : (
          <AlertTriangle className="size-5" />
        )}
      </div>
      <h3 className="font-heading text-base font-semibold text-foreground">
        {title ?? defaultTitle}
      </h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        {description ?? defaultDesc}
      </p>
      {onRetry && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onRetry}
          disabled={retrying}
          className="mt-5 gap-1.5"
        >
          <RefreshCw className={cn('size-3.5', retrying && 'animate-spin')} />
          {retrying ? 'Nouvelle tentative...' : 'Réessayer'}
        </Button>
      )}
    </div>
  );
}

interface GlobalBannerProps {
  tone?: 'info' | 'warning' | 'destructive';
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function GlobalBanner({
  tone = 'warning',
  title,
  description,
  actionLabel,
  onAction,
  dismissible = false,
  onDismiss,
  className,
}: GlobalBannerProps) {
  const toneClasses =
    tone === 'destructive'
      ? 'border-destructive/40 bg-destructive/10 text-foreground'
      : tone === 'warning'
        ? 'border-warning/40 bg-warning/10 text-foreground'
        : 'border-info/40 bg-info/10 text-foreground';

  return (
    <Alert className={cn('relative flex items-start gap-3', toneClasses, className)}>
      {tone === 'destructive' ? (
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
      ) : tone === 'warning' ? (
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
      ) : (
        <Info className="mt-0.5 size-4 shrink-0 text-info" />
      )}
      <div className="min-w-0 flex-1 space-y-1">
        <AlertTitle className="text-sm font-semibold">{title}</AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground">
          {description}
        </AlertDescription>
        {actionLabel && onAction && (
          <div className="pt-1.5">
            <Button
              type="button"
              size="xs"
              variant="outline"
              onClick={onAction}
            >
              {actionLabel}
            </Button>
          </div>
        )}
      </div>
      {dismissible && onDismiss && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={onDismiss}
          aria-label="Fermer la bannière"
          className="shrink-0"
        >
          <X className="size-3.5" />
        </Button>
      )}
    </Alert>
  );
}

export function TableSkeleton({
  rows = 6,
  columns = 5,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border bg-muted/40 px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div
            key={rowIdx}
            className="grid items-center gap-4 px-4 py-3"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: columns }).map((__, colIdx) => (
              <Skeleton
                key={colIdx}
                className={cn(
                  'h-4',
                  colIdx === 0 ? 'w-4/5' : colIdx === columns - 1 ? 'ml-auto w-16' : 'w-2/3'
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="space-y-3 rounded-xl border border-border bg-card p-5"
        >
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-3 w-36" />
        </div>
      ))}
    </div>
  );
}
