'use client';

import React, { useMemo, useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Archive, Download, Plus, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/feedback/confirm-dialog';
import { ModuleGate } from '@/components/feedback/module-gate';
import { CurrencyInput, FormFieldWrapper } from '@/components/forms/form-field';
import { DataTable } from '@/components/tables/data-table';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { downloadSafeCsv } from '@/lib/format/csv';
import { formatMAD } from '@/lib/format/morocco';
import { useDemoSession } from '@/stores/demo-session-context';
import { useFinanceStore } from '@/stores/finance-context';
import type { ExpenseRecord, PaymentMethod } from '@/types/finance';

const DEFAULT_CATEGORIES = [
  'Loyer & charges locatives',
  'Fournitures & reprographie',
  'Équipement pédagogique',
  'Communication & marketing',
  'Entretien & ménage',
];

export default function AdminExpensesPage() {
  const { activeCenter } = useDemoSession();
  const { expenses, addExpense, updateExpense } = useFinanceStore();

  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseRecord | null>(null);

  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [supplier, setSupplier] = useState('');
  const [amountMad, setAmountMad] = useState(1200);
  const [method, setMethod] = useState<PaymentMethod>('Virement');
  const [dateISO, setDateISO] = useState('2026-11-26');
  const [attachmentName, setAttachmentName] = useState('facture_demo.pdf');
  const [notes, setNotes] = useState('');

  const [archiveTarget, setArchiveTarget] = useState<ExpenseRecord | null>(
    null
  );

  const totals = useMemo(() => {
    const active = expenses.filter((e) => e.status !== 'archivee');
    const sum = active.reduce((acc, e) => acc + e.amountMad, 0);
    const pending = active.filter((e) => e.status === 'en_attente').length;
    return { sum, count: active.length, pending };
  }, [expenses]);

  const openCreate = () => {
    setEditing(null);
    setCategory(categories[0]);
    setCustomCategory('');
    setSupplier('');
    setAmountMad(1200);
    setMethod('Virement');
    setDateISO('2026-11-26');
    setAttachmentName('facture_demo.pdf');
    setNotes('');
    setModalOpen(true);
  };

  const openEdit = (exp: ExpenseRecord) => {
    setEditing(exp);
    setCategory(exp.category);
    setCustomCategory('');
    setSupplier(exp.supplier);
    setAmountMad(exp.amountMad);
    setMethod(exp.method);
    setDateISO(exp.dateISO);
    setAttachmentName(exp.attachmentName);
    setNotes(exp.notes);
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCat = customCategory.trim() || category;
    if (customCategory.trim() && !categories.includes(customCategory.trim())) {
      setCategories((prev) => [...prev, customCategory.trim()]);
    }
    if (!supplier.trim() || amountMad <= 0) {
      toast.error('Indiquez un fournisseur et un montant valide.');
      return;
    }

    if (editing) {
      updateExpense(editing.id, {
        category: finalCat,
        supplier: supplier.trim(),
        amountMad,
        method,
        dateISO,
        dateLabel: dateISO,
        attachmentName: attachmentName.trim() || 'piece_demo.pdf',
        notes: notes.trim(),
      });
      toast.success(`Dépense ${editing.reference} mise à jour.`);
    } else {
      addExpense({
        dateISO,
        dateLabel: dateISO,
        category: finalCat,
        supplier: supplier.trim(),
        amountMad,
        method,
        attachmentName: attachmentName.trim() || 'piece_demo.pdf',
        status: 'validee',
        notes: notes.trim(),
      });
      toast.success('Dépense ajoutée en mode démo.');
    }
    setModalOpen(false);
  };

  const columns: ColumnDef<ExpenseRecord>[] = [
    {
      accessorKey: 'reference',
      header: 'Référence',
      cell: ({ row }) => {
        const exp = row.original;
        return (
          <div>
            <p className="font-mono text-xs font-semibold">{exp.reference}</p>
            <p className="text-[11px] text-muted-foreground tabular-nums">
              {exp.dateLabel}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: 'category',
      header: 'Catégorie & fournisseur',
      cell: ({ row }) => {
        const exp = row.original;
        return (
          <div>
            <p className="text-xs font-medium">{exp.category}</p>
            <p className="text-[11px] text-muted-foreground">
              {exp.supplier} · {exp.attachmentName}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: 'amountMad',
      header: 'Montant',
      cell: ({ row }) => {
        const exp = row.original;
        return (
          <div className="font-mono text-xs font-semibold tabular-nums">
            {formatMAD(exp.amountMad)}
            <p className="font-sans text-[11px] font-normal text-muted-foreground">
              {exp.method}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Statut',
      cell: ({ row }) => {
        const st = row.original.status;
        return (
          <span
            className={
              st === 'validee'
                ? 'text-xs font-medium text-emerald-700 dark:text-emerald-300'
                : st === 'en_attente'
                  ? 'text-xs font-medium text-amber-700 dark:text-amber-300'
                  : 'text-xs text-muted-foreground line-through'
            }
          >
            {st === 'validee'
              ? 'Validée'
              : st === 'en_attente'
                ? 'En attente'
                : 'Archivée'}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const exp = row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => openEdit(exp)}
              className="h-7 px-2.5 text-xs"
            >
              Éditer
            </Button>
            {exp.status !== 'archivee' && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setArchiveTarget(exp)}
                className="h-7 px-2 text-xs text-destructive hover:text-destructive"
              >
                <Archive className="size-3.5" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <ModuleGate moduleKey="expenses" allowedRoles={['director', 'accountant']}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Dépenses & charges du centre
            </h1>
            <p className="text-sm text-muted-foreground">
              {activeCenter.name} · Catégories personnalisables, pièces locales
              démo et archivage justifié
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                downloadSafeCsv(
                  `depenses-${activeCenter.id}.csv`,
                  ['Référence', 'Date', 'Catégorie', 'Fournisseur', 'Montant MAD', 'Mode', 'Pièce', 'Statut'],
                  expenses.map((e) => [
                    e.reference,
                    e.dateISO,
                    e.category,
                    e.supplier,
                    e.amountMad,
                    e.method,
                    e.attachmentName,
                    e.status,
                  ])
                );
                toast.success('Export CSV des dépenses généré.');
              }}
              className="gap-1.5"
            >
              <Download className="size-4" />
              Exporter CSV
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={openCreate}
              className="gap-1.5"
            >
              <Plus className="size-4" />
              Ajouter dépense
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-border shadow-none">
            <CardHeader className="pb-1.5">
              <CardDescription className="text-xs">
                Total charges actives
              </CardDescription>
              <CardTitle className="font-mono text-2xl tabular-nums">
                {formatMAD(totals.sum)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-border shadow-none">
            <CardHeader className="pb-1.5">
              <CardDescription className="text-xs">
                Nombre de pièces actives
              </CardDescription>
              <CardTitle className="font-mono text-2xl tabular-nums">
                {totals.count}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-border shadow-none">
            <CardHeader className="pb-1.5">
              <CardDescription className="text-xs">
                En attente de validation
              </CardDescription>
              <CardTitle className="font-mono text-2xl tabular-nums">
                {totals.pending}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <DataTable
          columns={columns}
          data={expenses}
          searchPlaceholder="Rechercher fournisseur, référence, catégorie..."
          facetColumnId="status"
          facetOptions={[
            { value: 'validee', label: 'Validée' },
            { value: 'en_attente', label: 'En attente' },
            { value: 'archivee', label: 'Archivée' },
          ]}
          emptyTitle="Aucune dépense enregistrée"
          emptyDescription="Ajoutez une charge de fonctionnement en mode démo."
          emptyActionLabel="Ajouter dépense"
          onEmptyAction={openCreate}
        />

        {/* Modal ajout / édition */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editing ? `Éditer ${editing.reference}` : 'Ajouter une dépense'}
              </DialogTitle>
              <DialogDescription>
                Saisie locale en Mode Démo avec pièce justificative fictive.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <FormFieldWrapper id="exp-cat" label="Catégorie">
                  <Select
                    value={category}
                    onValueChange={(v) => setCategory(v ?? categories[0])}
                  >
                    <SelectTrigger id="exp-cat">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormFieldWrapper>
                <FormFieldWrapper
                  id="exp-newcat"
                  label="Ou nouvelle catégorie"
                >
                  <Input
                    id="exp-newcat"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Ex: Sécurité / Gardiennage"
                  />
                </FormFieldWrapper>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormFieldWrapper id="exp-sup" label="Fournisseur" required>
                  <Input
                    id="exp-sup"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                  />
                </FormFieldWrapper>
                <FormFieldWrapper id="exp-amt" label="Montant (MAD)" required>
                  <CurrencyInput
                    id="exp-amt"
                    value={amountMad}
                    onChange={(v) => setAmountMad(Number(v) || 0)}
                  />
                </FormFieldWrapper>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormFieldWrapper id="exp-meth" label="Mode de paiement">
                  <Select
                    value={method}
                    onValueChange={(v) =>
                      setMethod((v as PaymentMethod) ?? 'Virement')
                    }
                  >
                    <SelectTrigger id="exp-meth">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Virement">Virement</SelectItem>
                      <SelectItem value="Chèque">Chèque</SelectItem>
                      <SelectItem value="Espèces">Espèces</SelectItem>
                      <SelectItem value="TPE / Carte (démo)">
                        TPE / Carte (démo)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormFieldWrapper>
                <FormFieldWrapper id="exp-date" label="Date">
                  <Input
                    id="exp-date"
                    type="date"
                    value={dateISO}
                    onChange={(e) => setDateISO(e.target.value)}
                  />
                </FormFieldWrapper>
              </div>
              <FormFieldWrapper id="exp-att" label="Pièce jointe locale (démo)">
                <Input
                  id="exp-att"
                  value={attachmentName}
                  onChange={(e) => setAttachmentName(e.target.value)}
                />
              </FormFieldWrapper>
              <FormFieldWrapper id="exp-notes" label="Notes">
                <Textarea
                  id="exp-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </FormFieldWrapper>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" className="gap-1.5">
                  <Receipt className="size-4" />
                  Enregistrer
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={Boolean(archiveTarget)}
          onOpenChange={(open) => !open && setArchiveTarget(null)}
          title={
            archiveTarget
              ? `Archiver la dépense ${archiveTarget.reference}`
              : ''
          }
          description="L'écriture sera conservée en archive avec son motif."
          variant="destructive"
          requireReason
          reasonLabel="Motif d'archivage obligatoire"
          confirmLabel="Archiver"
          onConfirm={(reason) => {
            if (!archiveTarget) return;
            updateExpense(archiveTarget.id, {
              status: 'archivee',
              archiveReason: reason,
            });
            toast.warning(`Dépense ${archiveTarget.reference} archivée.`);
            setArchiveTarget(null);
          }}
        />
      </div>
    </ModuleGate>
  );
}
