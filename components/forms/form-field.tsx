'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FormFieldWrapperProps {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

export function FormFieldWrapper({
  id,
  label,
  required = false,
  hint,
  error,
  className,
  children,
}: FormFieldWrapperProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id} className="text-xs font-medium text-foreground">
          {label}
          {required && (
            <span aria-hidden="true" className="ml-0.5 text-destructive">
              *
            </span>
          )}
        </Label>
        {hint && !error && (
          <span className="text-[11px] text-muted-foreground">{hint}</span>
        )}
      </div>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

interface CurrencyInputProps
  extends Omit<React.ComponentProps<typeof Input>, 'type'> {
  currencyLabel?: string;
}

export function CurrencyInput({
  currencyLabel = 'MAD',
  className,
  ...props
}: CurrencyInputProps) {
  return (
    <div className="relative flex items-center">
      <Input
        type="number"
        step="0.01"
        min="0"
        className={cn('pr-14 font-mono tabular-nums', className)}
        {...props}
      />
      <span className="pointer-events-none absolute right-3 text-xs font-medium text-muted-foreground">
        {currencyLabel}
      </span>
    </div>
  );
}

export function PhoneInputMA({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <div className="relative flex items-center">
      <span className="pointer-events-none absolute left-3 font-mono text-xs text-muted-foreground">
        +212
      </span>
      <Input
        type="tel"
        inputMode="tel"
        placeholder="6 12 34 56 78"
        className={cn('pl-12 font-mono tabular-nums', className)}
        {...props}
      />
    </div>
  );
}
