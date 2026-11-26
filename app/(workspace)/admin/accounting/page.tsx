'use client';

import React, { useMemo, useState } from 'react';
import {
  CheckSquare,
  Download,
  FileSpreadsheet,
  Save,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { ModuleGate } from '@/components/feedback/module-gate';
import { GlobalBanner } from '@/components/feedback/states';
import { FormFieldWrapper } from '@/components/forms/form-field';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { downloadSafeCsv } from '@/lib/format/csv';
import { useDemoSession } from '@/stores/demo-session-context';
import { useFinanceStore } from '@/stores/finance-context';
import type { AccountingTemplate } from '@/types/finance';

export default function AdminAccountingPage() {
  const { activeCenter } = useDemoSession();
  const {
    payments,
    expenses,
    payroll,
    refunds,
    accountingTemplates,
    saveAccountingTemplate,
  } = useFinanceStore();

  const activeTemplate = accountingTemplates[0];
  const [tplName, setTplName] = useState(
    activeTemplate?.name ?? 'Export Cabinet (à valider)'
  );
  const [separator, setSeparator] = useState<';' | ','>(
    activeTemplate?.separator ?? ';'
  );
  const [dateFormat, setDateFormat] = useState<'DD/MM/YYYY' | 'YYYY-MM-DD'>(
    activeTemplate?.dateFormat ?? 'DD/MM/YYYY'
  );
  const [decimalSeparator, setDecimalSeparator] = useState<',' | '.'>(
    activeTemplate?.decimalSeparator ?? ','
  );
  const [accountSales, setAccountSales] = useState(
    activeTemplate?.accountCodeSales ?? '712400'
  );
  const [accountBank, setAccountBank] = useState(
    activeTemplate?.accountCodeBank ?? '514100'
  );
  const [accountExpenses, setAccountExpenses] = useState(
    activeTemplate?.accountCodeExpenses ?? '613100'
  );
  const [accountPayroll, setAccountPayroll] = useState(
    activeTemplate?.accountCodePayroll ?? '617100'
  );

  const [colDate, setColDate] = useState(
    activeTemplate?.columnNames.date ?? 'DateEcriture'
  );
  const [colJournal, setColJournal] = useState(
    activeTemplate?.columnNames.journal ?? 'CodeJournal'
  );
  const [colAccount, setColAccount] = useState(
    activeTemplate?.columnNames.account ?? 'CompteGeneral'
  );
  const [colRef, setColRef] = useState(
    activeTemplate?.columnNames.reference ?? 'PieceRef'
  );
  const [colLabel, setColLabel] = useState(
    activeTemplate?.columnNames.label ?? 'LibelleEcriture'
  );
  const [colDebit, setColDebit] = useState(
    activeTemplate?.columnNames.debit ?? 'DebitMAD'
  );
  const [colCredit, setColCredit] = useState(
    activeTemplate?.columnNames.credit ?? 'CreditMAD'
  );

  const [includePayments, setIncludePayments] = useState(true);
  const [includeReversals, setIncludeReversals] = useState(true);
  const [includeExpenses, setIncludeExpenses] = useState(true);
  const [includePayroll, setIncludePayroll] = useState(true);

  const previewLines = useMemo(() => {
    const formatDateCell = (iso: string) => {
      if (dateFormat === 'YYYY-MM-DD') return iso;
      const [y, m, d] = iso.split('-');
      return y && m && d ? `${d}/${m}/${y}` : iso;
    };

    const formatAmountCell = (amount: number) => {
      const fixed = amount.toFixed(2);
      return decimalSeparator === ',' ? fixed.replace('.', ',') : fixed;
    };

    const lines: Array<{
      date: string;
      journal: string;
      account: string;
      reference: string;
      label: string;
      debit: string;
      credit: string;
    }> = [];

    if (includePayments) {
      payments
        .filter((p) => p.status === 'encaisse' || p.status === 'partiel')
        .forEach((p) => {
          lines.push({
            date: formatDateCell(p.dateISO),
            journal: 'VT',
            account: accountSales,
            reference: p.receiptNumber,
            label: `${p.studentName} — ${p.groupName}`,
            debit: formatAmountCell(0),
            credit: formatAmountCell(p.amountMad),
          });
          lines.push({
            date: formatDateCell(p.dateISO),
            journal: 'BQ',
            account: accountBank,
            reference: p.reference,
            label: `Encaissement ${p.method} ${p.studentName}`,
            debit: formatAmountCell(p.amountMad),
            credit: formatAmountCell(0),
          });
        });
    }

    if (includeReversals) {
      payments
        .filter((p) => p.status === 'contrepasse')
        .forEach((p) => {
          lines.push({
            date: formatDateCell(p.dateISO),
            journal: 'OD',
            account: accountSales,
            reference: p.receiptNumber,
            label: `Contrepassation ${p.reference} (${p.reversalReason ?? 'annulation'})`,
            debit: formatAmountCell(p.amountMad),
            credit: formatAmountCell(0),
          });
        });
      refunds
        .filter((r) => r.status === 'execute_simulation')
        .forEach((r) => {
          lines.push({
            date: formatDateCell('2026-11-26'),
            journal: 'OD',
            account: accountSales,
            reference: r.reference,
            label: `Avoir simulé ${r.beneficiaryName}`,
            debit: formatAmountCell(r.amountMad),
            credit: formatAmountCell(0),
          });
        });
    }

    if (includeExpenses) {
      expenses
        .filter((e) => e.status !== 'archivee')
        .forEach((e) => {
          lines.push({
            date: formatDateCell(e.dateISO),
            journal: 'AC',
            account: accountExpenses,
            reference: e.reference,
            label: `${e.category} — ${e.supplier}`,
            debit: formatAmountCell(e.amountMad),
            credit: formatAmountCell(0),
          });
        });
    }

    if (includePayroll) {
      payroll.forEach((pr) => {
        lines.push({
          date: formatDateCell('2026-11-26'),
          journal: 'PA',
          account: accountPayroll,
          reference: pr.id.toUpperCase(),
          label: `Rémunération indicative ${pr.teacherName} (${pr.periodLabel})`,
          debit: formatAmountCell(pr.netPayableMad),
          credit: formatAmountCell(0),
        });
      });
    }

    return lines;
  }, [
    includePayments,
    includeReversals,
    includeExpenses,
    includePayroll,
    payments,
    refunds,
    expenses,
    payroll,
    accountSales,
    accountBank,
    accountExpenses,
    accountPayroll,
    dateFormat,
    decimalSeparator,
  ]);

  const handleSaveTemplate = () => {
    const next: AccountingTemplate = {
      id: activeTemplate?.id ?? `acct-tpl-${activeCenter.id}`,
      centerId: activeCenter.id,
      name: tplName.trim() || 'Modèle comptable démo',
      separator,
      dateFormat,
      decimalSeparator,
      accountCodeSales: accountSales,
      accountCodeCash: '516100',
      accountCodeBank: accountBank,
      accountCodeExpenses: accountExpenses,
      accountCodePayroll: accountPayroll,
      columnNames: {
        date: colDate,
        journal: colJournal,
        account: colAccount,
        reference: colRef,
        label: colLabel,
        debit: colDebit,
        credit: colCredit,
      },
    };
    saveAccountingTemplate(next);
    toast.success(`Modèle « ${next.name} » mémorisé en démo.`);
  };

  const handleExportCsv = () => {
    downloadSafeCsv(
      `dossier-comptable-demo-${activeCenter.id}.csv`,
      [colDate, colJournal, colAccount, colRef, colLabel, colDebit, colCredit],
      previewLines.map((l) => [
        l.date,
        l.journal,
        l.account,
        l.reference,
        l.label,
        l.debit,
        l.credit,
      ]),
      separator
    );
    toast.success(
      `Dossier comptable CSV UTF-8 (${previewLines.length} écritures) téléchargé.`
    );
  };

  const handleExportJsonBundle = () => {
    const bundle = {
      warning:
        'PROTOTYPE MODE DEMO — Mapping indicatif à faire valider impérativement par votre expert-comptable avant import en comptabilité légale.',
      center: activeCenter.name,
      templateName: tplName,
      entriesCount: previewLines.length,
      entries: previewLines,
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dossier-comptable-demo-${activeCenter.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Lot JSON complet généré pour revue avec le cabinet.');
  };

  return (
    <ModuleGate
      moduleKey="accounting.exports"
      allowedRoles={['director', 'accountant']}
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Comptabilité & dossier pour le comptable
            </h1>
            <p className="text-sm text-muted-foreground">
              {activeCenter.name} · Export configurable, mapping de colonnes et
              journal multi-pièces (Mode Démo)
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSaveTemplate}
              className="gap-1.5"
            >
              <Save className="size-4" />
              Mémoriser modèle
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportJsonBundle}
              className="gap-1.5"
            >
              <FileSpreadsheet className="size-4" />
              Lot JSON démo
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleExportCsv}
              className="gap-1.5"
            >
              <Download className="size-4" />
              Exporter CSV UTF-8
            </Button>
          </div>
        </div>

        <GlobalBanner
          tone="warning"
          title="Avertissement légal & fiscal obligatoire"
          description="Ce module génère un export paramétrable de démonstration. Il ne prétend pas être conforme au Plan Comptable Général Marocain (CGNC) ni au format spécifique d'un logiciel comptable : faites valider le mapping des colonnes et comptes avec votre cabinet comptable."
        />

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Paramétrage & Mapping */}
          <Card className="border-border shadow-none lg:col-span-5">
            <CardHeader>
              <CardTitle className="text-base">
                Configuration du dossier & mapping
              </CardTitle>
              <CardDescription className="text-xs">
                Sélectionnez les pièces et adaptez les noms de colonnes attendus
                par votre cabinet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <FormFieldWrapper id="acc-tpl" label="Nom du modèle">
                <Input
                  id="acc-tpl"
                  value={tplName}
                  onChange={(e) => setTplName(e.target.value)}
                />
              </FormFieldWrapper>

              <div className="space-y-2 rounded-xl border border-border bg-muted/25 p-3">
                <p className="font-semibold">Pièces incluses dans le dossier</p>
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={includePayments}
                    onCheckedChange={(c) => setIncludePayments(Boolean(c))}
                  />
                  <span>Ventes / Encaissements & Reçus</span>
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={includeReversals}
                    onCheckedChange={(c) => setIncludeReversals(Boolean(c))}
                  />
                  <span>Avoirs & contrepassations tracées</span>
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={includeExpenses}
                    onCheckedChange={(c) => setIncludeExpenses(Boolean(c))}
                  />
                  <span>Dépenses & achats fournisseurs</span>
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={includePayroll}
                    onCheckedChange={(c) => setIncludePayroll(Boolean(c))}
                  />
                  <span>Rémunérations professeurs (indicatives)</span>
                </label>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <FormFieldWrapper id="acc-sep" label="Séparateur">
                  <Select
                    value={separator}
                    onValueChange={(v) => setSeparator((v as ';' | ',') ?? ';')}
                  >
                    <SelectTrigger id="acc-sep" className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=";">Point-virgule (;)</SelectItem>
                      <SelectItem value=",">Virgule (,)</SelectItem>
                    </SelectContent>
                  </Select>
                </FormFieldWrapper>
                <FormFieldWrapper id="acc-date" label="Format date">
                  <Select
                    value={dateFormat}
                    onValueChange={(v) =>
                      setDateFormat(
                        (v as 'DD/MM/YYYY' | 'YYYY-MM-DD') ?? 'DD/MM/YYYY'
                      )
                    }
                  >
                    <SelectTrigger id="acc-date" className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">JJ/MM/AAAA</SelectItem>
                      <SelectItem value="YYYY-MM-DD">AAAA-MM-JJ</SelectItem>
                    </SelectContent>
                  </Select>
                </FormFieldWrapper>
                <FormFieldWrapper id="acc-dec" label="Décimales">
                  <Select
                    value={decimalSeparator}
                    onValueChange={(v) =>
                      setDecimalSeparator((v as ',' | '.') ?? ',')
                    }
                  >
                    <SelectTrigger id="acc-dec" className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=",">Virgule (,)</SelectItem>
                      <SelectItem value=".">Point (.)</SelectItem>
                    </SelectContent>
                  </Select>
                </FormFieldWrapper>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <FormFieldWrapper id="c-sales" label="Compte ventes">
                  <Input
                    id="c-sales"
                    value={accountSales}
                    onChange={(e) => setAccountSales(e.target.value)}
                    className="h-8 font-mono text-xs"
                  />
                </FormFieldWrapper>
                <FormFieldWrapper id="c-bank" label="Compte banque">
                  <Input
                    id="c-bank"
                    value={accountBank}
                    onChange={(e) => setAccountBank(e.target.value)}
                    className="h-8 font-mono text-xs"
                  />
                </FormFieldWrapper>
                <FormFieldWrapper id="c-exp" label="Compte charges">
                  <Input
                    id="c-exp"
                    value={accountExpenses}
                    onChange={(e) => setAccountExpenses(e.target.value)}
                    className="h-8 font-mono text-xs"
                  />
                </FormFieldWrapper>
                <FormFieldWrapper id="c-payr" label="Compte paie">
                  <Input
                    id="c-payr"
                    value={accountPayroll}
                    onChange={(e) => setAccountPayroll(e.target.value)}
                    className="h-8 font-mono text-xs"
                  />
                </FormFieldWrapper>
              </div>

              <div className="space-y-2">
                <p className="font-semibold">En-têtes de colonnes personnalisés</p>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={colDate}
                    onChange={(e) => setColDate(e.target.value)}
                    aria-label="Colonne Date"
                    className="h-8 text-xs"
                  />
                  <Input
                    value={colJournal}
                    onChange={(e) => setColJournal(e.target.value)}
                    aria-label="Colonne Journal"
                    className="h-8 text-xs"
                  />
                  <Input
                    value={colAccount}
                    onChange={(e) => setColAccount(e.target.value)}
                    aria-label="Colonne Compte"
                    className="h-8 text-xs"
                  />
                  <Input
                    value={colRef}
                    onChange={(e) => setColRef(e.target.value)}
                    aria-label="Colonne Pièce"
                    className="h-8 text-xs"
                  />
                  <Input
                    value={colLabel}
                    onChange={(e) => setColLabel(e.target.value)}
                    aria-label="Colonne Libellé"
                    className="h-8 text-xs"
                  />
                  <div className="grid grid-cols-2 gap-1">
                    <Input
                      value={colDebit}
                      onChange={(e) => setColDebit(e.target.value)}
                      aria-label="Colonne Débit"
                      className="h-8 text-xs"
                    />
                    <Input
                      value={colCredit}
                      onChange={(e) => setColCredit(e.target.value)}
                      aria-label="Colonne Crédit"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Aperçu des écritures exportées */}
          <Card className="border-border shadow-none lg:col-span-7">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CheckSquare className="size-4 text-primary" />
                    Aperçu du dossier comptable ({previewLines.length} lignes)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Format CSV UTF-8 · Séparateur « {separator} » · Cellules
                    protégées
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-[540px] overflow-auto rounded-xl border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 border-b border-border bg-muted/70 backdrop-blur-xs">
                    <tr>
                      <th className="p-2 font-medium">{colDate}</th>
                      <th className="p-2 font-medium">{colJournal}</th>
                      <th className="p-2 font-medium">{colAccount}</th>
                      <th className="p-2 font-medium">{colRef}</th>
                      <th className="p-2 font-medium">{colLabel}</th>
                      <th className="p-2 text-right font-medium">{colDebit}</th>
                      <th className="p-2 text-right font-medium">
                        {colCredit}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {previewLines.map((line, idx) => (
                      <tr key={idx} className="hover:bg-muted/25">
                        <td className="p-2 font-mono whitespace-nowrap tabular-nums">
                          {line.date}
                        </td>
                        <td className="p-2 font-mono">{line.journal}</td>
                        <td className="p-2 font-mono">{line.account}</td>
                        <td className="p-2 font-mono whitespace-nowrap">
                          {line.reference}
                        </td>
                        <td className="max-w-[200px] truncate p-2">
                          {line.label}
                        </td>
                        <td className="p-2 text-right font-mono tabular-nums">
                          {line.debit}
                        </td>
                        <td className="p-2 text-right font-mono tabular-nums">
                          {line.credit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                <ShieldAlert className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>
                  À valider avec votre expert-comptable avant import définitif
                  dans votre logiciel comptable.
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ModuleGate>
  );
}
