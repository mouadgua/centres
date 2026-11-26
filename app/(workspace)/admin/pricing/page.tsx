'use client';

import React, { useMemo, useState } from 'react';
import { Calculator, History, Plus, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/feedback/confirm-dialog';
import { ModuleGate } from '@/components/feedback/module-gate';
import { CurrencyInput, FormFieldWrapper } from '@/components/forms/form-field';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { formatMAD } from '@/lib/format/morocco';
import { useDemoSession } from '@/stores/demo-session-context';
import { useFinanceStore } from '@/stores/finance-context';
import type { PricingRuleRecord } from '@/types/finance';

export default function AdminPricingPage() {
  const { activeCenter, activeUser } = useDemoSession();
  const { pricingRules, pricingLogs, addPricingRule, togglePricingRule } =
    useFinanceStore();

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [targetType, setTargetType] = useState<'matiere' | 'groupe' | 'niveau'>(
    'groupe'
  );
  const [targetLabel, setTargetLabel] = useState('');
  const [registrationFeeMad, setRegistrationFeeMad] = useState(250);
  const [monthlyFeeMad, setMonthlyFeeMad] = useState(1200);
  const [discountType, setDiscountType] = useState<
    'aucune' | 'pourcentage' | 'fixe'
  >('aucune');
  const [discountValue, setDiscountValue] = useState(0);
  const [validityLabel, setValidityLabel] = useState('Année scolaire 2026–2027');
  const [retroactive, setRetroactive] = useState(false);
  const [retroConfirmOpen, setRetroConfirmOpen] = useState(false);

  const [simRuleId, setSimRuleId] = useState(pricingRules[0]?.id ?? '');
  const [simExtraDiscountPct, setSimExtraDiscountPct] = useState(0);
  const [simIncludeReg, setSimIncludeReg] = useState(true);

  const selectedSimRule = useMemo(
    () => pricingRules.find((r) => r.id === simRuleId) ?? pricingRules[0],
    [pricingRules, simRuleId]
  );

  const invoicePreview = useMemo(() => {
    if (!selectedSimRule) {
      return { base: 0, ruleDiscount: 0, extraDiscount: 0, reg: 0, total: 0 };
    }
    const base = selectedSimRule.monthlyFeeMad;
    const ruleDiscount =
      selectedSimRule.discountType === 'pourcentage'
        ? Math.round((base * selectedSimRule.discountValue) / 100)
        : selectedSimRule.discountType === 'fixe'
          ? selectedSimRule.discountValue
          : 0;
    const afterRule = Math.max(0, base - ruleDiscount);
    const extraDiscount = Math.round(
      (afterRule * Math.max(0, Math.min(50, simExtraDiscountPct))) / 100
    );
    const reg = simIncludeReg ? selectedSimRule.registrationFeeMad : 0;
    const total = Math.max(0, afterRule - extraDiscount + reg);
    return { base, ruleDiscount, extraDiscount, reg, total };
  }, [selectedSimRule, simExtraDiscountPct, simIncludeReg]);

  const commitNewRule = () => {
    addPricingRule(
      {
        name: name.trim(),
        targetType,
        targetLabel: targetLabel.trim() || 'Général',
        registrationFeeMad,
        monthlyFeeMad,
        discountType,
        discountValue,
        priorityOrder: pricingRules.length + 1,
        validityLabel: validityLabel.trim(),
        active: true,
      },
      activeUser.fullName,
      retroactive
    );
    toast.success(`Tarif « ${name.trim()} » ajouté (Mode Démo).`);
    setCreateOpen(false);
    setRetroConfirmOpen(false);
    setName('');
    setTargetLabel('');
    setRetroactive(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Indiquez le libellé du tarif.');
      return;
    }
    if (retroactive) {
      setRetroConfirmOpen(true);
      return;
    }
    commitNewRule();
  };

  return (
    <ModuleGate moduleKey="billing" allowedRoles={['director', 'accountant']}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Tarifs & remises
            </h1>
            <p className="text-sm text-muted-foreground">
              {activeCenter.name} · Catalogue tarifaire MAD, règles de priorité
              et simulateur de facture
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="gap-1.5"
          >
            <Plus className="size-4" />
            Nouveau tarif
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Catalogue des règles */}
          <div className="space-y-3 lg:col-span-7">
            <Card className="border-border shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Tag className="size-4 text-primary" />
                  Règles tarifaires actives (ordre de priorité)
                </CardTitle>
                <CardDescription className="text-xs">
                  Priorité appliquée : 1. Groupe spécifique → 2. Niveau → 3.
                  Matière générale
                </CardDescription>
              </CardHeader>
              <CardContent className="divide-y divide-border">
                {pricingRules.map((rule: PricingRuleRecord) => (
                  <div
                    key={rule.id}
                    className="flex flex-col justify-between gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">
                          #{rule.priorityOrder}
                        </span>
                        <span className="text-sm font-semibold">
                          {rule.name}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Cible : {rule.targetType} ({rule.targetLabel}) ·{' '}
                        {rule.validityLabel}
                      </p>
                      <p className="font-mono text-xs tabular-nums">
                        Mensualité : {formatMAD(rule.monthlyFeeMad)} ·
                        Inscription : {formatMAD(rule.registrationFeeMad)}
                        {rule.discountType !== 'aucune' &&
                          ` · Remise ${
                            rule.discountType === 'pourcentage'
                              ? `${rule.discountValue} %`
                              : formatMAD(rule.discountValue)
                          }`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {rule.active ? 'Actif' : 'Inactif'}
                      </span>
                      <Switch
                        checked={rule.active}
                        onCheckedChange={() => {
                          togglePricingRule(rule.id, activeUser.fullName);
                          toast.info(`Statut tarif mis à jour pour ${rule.name}`);
                        }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <History className="size-4 text-primary" />
                  Historique des changements tarifaires
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-border text-xs">
                {pricingLogs.map((log) => (
                  <div key={log.id} className="py-2.5 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{log.ruleName}</span>
                      <span className="font-mono text-muted-foreground">
                        {log.dateLabel}
                      </span>
                    </div>
                    <p className="mt-0.5 text-muted-foreground">
                      {log.actor} · {log.summary}
                      {log.retroactiveApplied
                        ? ' · Application rétroactive confirmée'
                        : ''}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Aperçu facture avant application */}
          <div className="lg:col-span-5">
            <Card className="border-border shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calculator className="size-4 text-primary" />
                  Aperçu facture avant application
                </CardTitle>
                <CardDescription className="text-xs">
                  Simulez le net à payer avant de valider une inscription ou un
                  échéancier
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <FormFieldWrapper id="sim-rule" label="Tarif de référence">
                  <Select
                    value={selectedSimRule?.id ?? ''}
                    onValueChange={(v) => setSimRuleId(v ?? '')}
                  >
                    <SelectTrigger id="sim-rule">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {pricingRules.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name} ({formatMAD(r.monthlyFeeMad)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormFieldWrapper>

                <FormFieldWrapper
                  id="sim-extra"
                  label="Remise additionnelle fratrie / bourse (%)"
                >
                  <Input
                    id="sim-extra"
                    type="number"
                    min={0}
                    max={50}
                    value={simExtraDiscountPct}
                    onChange={(e) =>
                      setSimExtraDiscountPct(Number(e.target.value) || 0)
                    }
                  />
                </FormFieldWrapper>

                <label className="flex items-center gap-2 text-xs">
                  <Checkbox
                    checked={simIncludeReg}
                    onCheckedChange={(checked) =>
                      setSimIncludeReg(Boolean(checked))
                    }
                  />
                  <span>Inclure les frais d&apos;inscription initiaux</span>
                </label>

                <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-3.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Mensualité brute
                    </span>
                    <span className="font-mono tabular-nums">
                      {formatMAD(invoicePreview.base)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Remise règle tarifaire
                    </span>
                    <span className="font-mono text-emerald-700 tabular-nums dark:text-emerald-300">
                      -{formatMAD(invoicePreview.ruleDiscount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Remise additionnelle
                    </span>
                    <span className="font-mono text-emerald-700 tabular-nums dark:text-emerald-300">
                      -{formatMAD(invoicePreview.extraDiscount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Frais d&apos;inscription
                    </span>
                    <span className="font-mono tabular-nums">
                      +{formatMAD(invoicePreview.reg)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 text-sm font-semibold">
                    <span>Net estimé (1er mois)</span>
                    <span className="font-mono tabular-nums">
                      {formatMAD(invoicePreview.total)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Création tarif */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Créer une règle tarifaire</DialogTitle>
              <DialogDescription>
                Définissez les montants en MAD et la portée d&apos;application.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormFieldWrapper id="prc-name" label="Libellé du tarif" required>
                <Input
                  id="prc-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Pack Maths + Physique 2Bac"
                />
              </FormFieldWrapper>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormFieldWrapper id="prc-ttype" label="Type de cible">
                  <Select
                    value={targetType}
                    onValueChange={(v) =>
                      setTargetType(
                        (v as 'matiere' | 'groupe' | 'niveau') ?? 'groupe'
                      )
                    }
                  >
                    <SelectTrigger id="prc-ttype">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="groupe">Groupe</SelectItem>
                      <SelectItem value="niveau">Niveau</SelectItem>
                      <SelectItem value="matiere">Matière</SelectItem>
                    </SelectContent>
                  </Select>
                </FormFieldWrapper>
                <FormFieldWrapper id="prc-tlabel" label="Cible précise">
                  <Input
                    id="prc-tlabel"
                    value={targetLabel}
                    onChange={(e) => setTargetLabel(e.target.value)}
                    placeholder="Ex: 2ème Bac PC"
                  />
                </FormFieldWrapper>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormFieldWrapper id="prc-month" label="Mensualité (MAD)">
                  <CurrencyInput
                    id="prc-month"
                    value={monthlyFeeMad}
                    onChange={(v) => setMonthlyFeeMad(Number(v) || 0)}
                  />
                </FormFieldWrapper>
                <FormFieldWrapper
                  id="prc-reg"
                  label="Frais d'inscription (MAD)"
                >
                  <CurrencyInput
                    id="prc-reg"
                    value={registrationFeeMad}
                    onChange={(v) => setRegistrationFeeMad(Number(v) || 0)}
                  />
                </FormFieldWrapper>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormFieldWrapper id="prc-dtype" label="Remise intégrée">
                  <Select
                    value={discountType}
                    onValueChange={(v) =>
                      setDiscountType(
                        (v as 'aucune' | 'pourcentage' | 'fixe') ?? 'aucune'
                      )
                    }
                  >
                    <SelectTrigger id="prc-dtype">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aucune">Aucune</SelectItem>
                      <SelectItem value="pourcentage">Pourcentage (%)</SelectItem>
                      <SelectItem value="fixe">Montant fixe (MAD)</SelectItem>
                    </SelectContent>
                  </Select>
                </FormFieldWrapper>
                <FormFieldWrapper id="prc-dval" label="Valeur remise">
                  <Input
                    id="prc-dval"
                    type="number"
                    min={0}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
                  />
                </FormFieldWrapper>
              </div>
              <FormFieldWrapper id="prc-val" label="Validité">
                <Input
                  id="prc-val"
                  value={validityLabel}
                  onChange={(e) => setValidityLabel(e.target.value)}
                />
              </FormFieldWrapper>
              <Label className="flex items-center gap-2 text-xs font-normal">
                <Checkbox
                  checked={retroactive}
                  onCheckedChange={(c) => setRetroactive(Boolean(c))}
                />
                <span>
                  Appliquer rétroactivement aux échéances ouvertes (demande
                  confirmation)
                </span>
              </Label>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit">Enregistrer le tarif</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={retroConfirmOpen}
          onOpenChange={setRetroConfirmOpen}
          title="Confirmer l'application rétroactive du tarif"
          description="Une modification rétroactive peut modifier les montants des échéances non réglées de la période en cours."
          variant="destructive"
          confirmLabel="Appliquer rétroactivement"
          onConfirm={commitNewRule}
        />
      </div>
    </ModuleGate>
  );
}
