'use client';

import React, { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  consequences?: string[];
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  requireTypedText?: string;
  requireReason?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  loading?: boolean;
  onConfirm: (reason?: string) => void | Promise<void>;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  consequences = [],
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'default',
  requireTypedText,
  requireReason = false,
  reasonLabel = 'Motif obligatoire',
  reasonPlaceholder = 'Précisez la raison de cette opération...',
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  const [typedValue, setTypedValue] = useState('');
  const [reason, setReason] = useState('');

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setTypedValue('');
      setReason('');
    }
    onOpenChange(nextOpen);
  };

  const typedValid =
    !requireTypedText ||
    typedValue.trim().toLowerCase() === requireTypedText.trim().toLowerCase();
  const reasonValid = !requireReason || reason.trim().length >= 4;
  const canConfirm = typedValid && reasonValid && !loading;

  const handleConfirm = async () => {
    if (!canConfirm) return;
    await onConfirm(requireReason ? reason.trim() : undefined);
    setTypedValue('');
    setReason('');
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          {variant === 'destructive' && (
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <AlertTriangle className="size-5" />
            </AlertDialogMedia>
          )}
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {(consequences.length > 0 || requireReason || requireTypedText) && (
          <div className="space-y-3 text-sm">
            {consequences.length > 0 && (
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <p className="text-xs font-medium text-foreground">
                  Conséquences prévues :
                </p>
                <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                  {consequences.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {requireReason && (
              <div className="space-y-1.5">
                <Label htmlFor="confirm-reason" className="text-xs font-medium">
                  {reasonLabel}
                </Label>
                <Textarea
                  id="confirm-reason"
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={reasonPlaceholder}
                />
                {!reasonValid && reason.length > 0 && (
                  <p className="text-[11px] text-destructive">
                    Veuillez saisir au moins 4 caractères.
                  </p>
                )}
              </div>
            )}

            {requireTypedText && (
              <div className="space-y-1.5">
                <Label htmlFor="confirm-typed" className="text-xs font-medium">
                  Saisissez{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                    {requireTypedText}
                  </code>{' '}
                  pour confirmer
                </Label>
                <Input
                  id="confirm-typed"
                  value={typedValue}
                  onChange={(e) => setTypedValue(e.target.value)}
                  placeholder={requireTypedText}
                  autoComplete="off"
                />
              </div>
            )}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelLabel}</AlertDialogCancel>
          <Button
            type="button"
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            disabled={!canConfirm}
            onClick={handleConfirm}
          >
            {loading && <Loader2 className="size-3.5 animate-spin" />}
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
