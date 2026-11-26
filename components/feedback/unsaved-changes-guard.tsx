'use client';

import React, { useEffect } from 'react';
import { ConfirmDialog } from '@/components/feedback/confirm-dialog';

export function useUnsavedChangesGuard(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);
}

export function UnsavedChangesDialog({
  open,
  onOpenChange,
  onDiscard,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDiscard: () => void;
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      variant="destructive"
      title="Quitter sans enregistrer ?"
      description="Des modifications non enregistrées sont présentes dans ce formulaire. Si vous quittez maintenant, ces saisies seront perdues."
      confirmLabel="Quitter sans enregistrer"
      cancelLabel="Rester sur la page"
      onConfirm={onDiscard}
    />
  );
}
