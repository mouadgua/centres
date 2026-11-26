'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import {
  AlertTriangle,
  Archive,
  BookOpen,
  Edit3,
  Plus,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { ModuleGate } from '@/components/feedback/module-gate';
import { ConfirmDialog } from '@/components/feedback/confirm-dialog';
import { DataTable } from '@/components/tables/data-table';
import { FormFieldWrapper } from '@/components/forms/form-field';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useDemoSession } from '@/stores/demo-session-context';
import { usePedagogyStore } from '@/stores/pedagogy-context';
import { useProfilesStore } from '@/stores/profiles-context';
import type { SubjectRecord } from '@/types/pedagogy';

const SUBJECT_COLORS = [
  { label: 'Bleu Cobalt', value: '#2563eb' },
  { label: 'Émeraude', value: '#0d9488' },
  { label: 'Ambre', value: '#d97706' },
  { label: 'Vert Forêt', value: '#16a34a' },
  { label: 'Indigo', value: '#4f46e5' },
  { label: 'Bordeaux', value: '#be123c' },
];

const AVAILABLE_LEVELS = [
  'Collège',
  'Tronc Commun',
  '1ère Bac',
  '2ème Bac',
  'Sup MPSI',
  'Prépa Médecine',
];

let subjectSeq = 500;
function nextSubjectId() {
  subjectSeq += 1;
  return `sub-${subjectSeq}`;
}

export default function AdminSubjectsPage() {
  const { activeCenter } = useDemoSession();
  const { subjects, groups, addSubject, updateSubject } = usePedagogyStore();
  const { teachers } = useProfilesStore();

  const [showArchived, setShowArchived] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectRecord | null>(
    null
  );
  const [archiveTarget, setArchiveTarget] = useState<SubjectRecord | null>(
    null
  );

  // Form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [color, setColor] = useState('#2563eb');
  const [description, setDescription] = useState('');
  const [selectedLevels, setSelectedLevels] = useState<string[]>(['2ème Bac']);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);

  const visibleSubjects = useMemo(
    () =>
      subjects.filter((s) => (showArchived ? true : s.status === 'active')),
    [subjects, showArchived]
  );

  // Duplicate detector (same normalized name or code among active subjects)
  const duplicates = useMemo(() => {
    const active = subjects.filter((s) => s.status === 'active');
    const seenNames = new Map<string, SubjectRecord[]>();
    for (const sub of active) {
      const key = sub.name.trim().toLowerCase();
      const arr = seenNames.get(key) ?? [];
      arr.push(sub);
      seenNames.set(key, arr);
    }
    return Array.from(seenNames.values()).filter((arr) => arr.length > 1);
  }, [subjects]);

  const teacherMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of teachers) m.set(t.id, t.fullName);
    return m;
  }, [teachers]);

  const openCreateModal = () => {
    setEditingSubject(null);
    setCode('');
    setName('');
    setColor('#2563eb');
    setDescription('');
    setSelectedLevels(['2ème Bac']);
    setSelectedTeachers([]);
    setModalOpen(true);
  };

  const openEditModal = (sub: SubjectRecord) => {
    setEditingSubject(sub);
    setCode(sub.code);
    setName(sub.name);
    setColor(sub.color);
    setDescription(sub.description);
    setSelectedLevels(sub.levels);
    setSelectedTeachers(sub.defaultTeacherIds);
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      toast.error('Le code et le nom de la matière sont obligatoires.');
      return;
    }

    if (editingSubject) {
      updateSubject(editingSubject.id, {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        color,
        description: description.trim(),
        levels: selectedLevels,
        defaultTeacherIds: selectedTeachers,
      });
      toast.success(`Matière « ${name.trim()} » mise à jour`);
    } else {
      const duplicateMatch = subjects.find(
        (s) =>
          s.status === 'active' &&
          (s.code.toLowerCase() === code.trim().toLowerCase() ||
            s.name.toLowerCase() === name.trim().toLowerCase())
      );
      addSubject({
        id: nextSubjectId(),
        centerId: activeCenter.id,
        code: code.trim().toUpperCase(),
        name: name.trim(),
        color,
        description: description.trim(),
        levels: selectedLevels,
        defaultTeacherIds: selectedTeachers,
        status: 'active',
      });
      if (duplicateMatch) {
        toast.warning(
          `Matière créée — attention : doublon potentiel avec « ${duplicateMatch.name} »`
        );
      } else {
        toast.success(`Matière « ${name.trim()} » créée (Mode Démo)`);
      }
    }
    setModalOpen(false);
  };

  const columns = useMemo<ColumnDef<SubjectRecord>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Matière',
        cell: ({ row }) => {
          const linkedGroups = groups.filter(
            (g) => g.subjectId === row.original.id
          );
          return (
            <div className="flex items-start gap-2.5">
              <span
                className="mt-1 size-3 shrink-0 rounded-sm"
                style={{ backgroundColor: row.original.color }}
                aria-hidden="true"
              />
              <div>
                <p className="font-medium text-foreground">
                  {row.original.name}{' '}
                  <span className="font-mono text-xs text-muted-foreground">
                    · {row.original.code}
                  </span>
                </p>
                <p className="max-w-md truncate text-xs text-muted-foreground">
                  {row.original.description || 'Aucune description'}
                </p>
                {linkedGroups.length > 0 && (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {linkedGroups.length} groupe(s) lié(s) :{' '}
                    {linkedGroups.map((g) => g.name).join(' · ')}
                  </p>
                )}
              </div>
            </div>
          );
        },
      },
      {
        id: 'levels',
        header: 'Niveaux couverts',
        cell: ({ row }) => (
          <span className="text-xs text-foreground">
            {row.original.levels.join(' · ') || 'Tous niveaux'}
          </span>
        ),
      },
      {
        id: 'teachers',
        header: 'Professeurs assignés',
        cell: ({ row }) => {
          const names = row.original.defaultTeacherIds
            .map((id) => teacherMap.get(id))
            .filter(Boolean);
          return (
            <span className="text-xs text-muted-foreground">
              {names.length > 0 ? names.join(', ') : 'Non assigné'}
            </span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'État',
        cell: ({ row }) => (
          <span
            className={
              row.original.status === 'active'
                ? 'text-xs font-medium text-success'
                : 'text-xs font-medium text-muted-foreground'
            }
          >
            {row.original.status === 'active' ? 'Active' : 'Archivée'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Modifier ${row.original.name}`}
              onClick={() => openEditModal(row.original)}
            >
              <Edit3 className="size-3.5" />
            </Button>
            {row.original.status === 'active' ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Archiver ${row.original.name}`}
                onClick={() => setArchiveTarget(row.original)}
              >
                <Archive className="size-3.5 text-muted-foreground" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Restaurer ${row.original.name}`}
                onClick={() => {
                  updateSubject(row.original.id, { status: 'active' });
                  toast.success(`Matière « ${row.original.name} » réactivée`);
                }}
              >
                <RotateCcw className="size-3.5 text-primary" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [groups, teacherMap, updateSubject]
  );

  const impactedGroupsCount = archiveTarget
    ? groups.filter((g) => g.subjectId === archiveTarget.id).length
    : 0;

  return (
    <ModuleGate moduleKey="subjects" allowedRoles={['director', 'secretary']}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Matières & disciplines
            </h1>
            <p className="text-sm text-muted-foreground">
              {activeCenter.name} · {subjects.filter((s) => s.status === 'active').length}{' '}
              matière(s) active(s) · codes couleurs & affectations professeurs
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={showArchived ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setShowArchived((v) => !v)}
            >
              {showArchived ? 'Masquer archivées' : 'Voir archivées'}
            </Button>
            <Button type="button" size="sm" onClick={openCreateModal}>
              <Plus className="size-4" />
              Nouvelle matière
            </Button>
          </div>
        </div>

        {duplicates.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs">
            <div className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="size-4 shrink-0 text-warning" />
              <span>
                Doublon détecté sur {duplicates.length} intitulé(s) :{' '}
                {duplicates.map((arr) => arr[0]?.name).join(', ')}. Vous pouvez
                renommer ou archiver le doublon.
              </span>
            </div>
            <Button
              type="button"
              size="xs"
              variant="outline"
              onClick={() => {
                const dup = duplicates[0]?.[1];
                if (dup) setArchiveTarget(dup);
              }}
            >
              Traiter le premier doublon
            </Button>
          </div>
        )}

        <DataTable
          columns={columns}
          data={visibleSubjects}
          searchPlaceholder="Rechercher une matière, un code ou un niveau..."
          emptyTitle="Aucune matière enregistrée"
          emptyDescription="Ajoutez une matière pour pouvoir ouvrir vos groupes de soutien."
          emptyActionLabel="Créer une matière"
          onEmptyAction={openCreateModal}
          renderMobileCard={(sub) => (
            <div className="space-y-2 rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="size-3 rounded-sm"
                    style={{ backgroundColor: sub.color }}
                  />
                  <span className="font-medium">{sub.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    · {sub.code}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {sub.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {sub.levels.join(' · ')}
              </p>
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() => openEditModal(sub)}
                >
                  Modifier
                </Button>
                {sub.status === 'active' && (
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    onClick={() => setArchiveTarget(sub)}
                  >
                    Archiver
                  </Button>
                )}
              </div>
            </div>
          )}
        />

        <div className="flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <BookOpen className="size-3.5" />
            Les matières alimentent les groupes et les affectations professeurs.
          </span>
          <Link href="/admin/groups" className="font-medium text-primary hover:underline">
            Gérer les groupes →
          </Link>
        </div>
      </div>

      {/* Create / Edit Subject Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingSubject ? 'Modifier la matière' : 'Nouvelle matière'}
            </DialogTitle>
            <DialogDescription>
              Définissez le code, la couleur repère, les niveaux et les professeurs par défaut.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <FormFieldWrapper id="sub-code" label="Code" required>
                <Input
                  id="sub-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="MATH"
                />
              </FormFieldWrapper>
              <div className="sm:col-span-2">
                <FormFieldWrapper id="sub-name" label="Intitulé" required>
                  <Input
                    id="sub-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Mathématiques"
                  />
                </FormFieldWrapper>
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-foreground">
                Couleur repère (calendrier & groupes)
              </p>
              <div className="flex flex-wrap gap-2">
                {SUBJECT_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
                      color === c.value
                        ? 'border-primary bg-accent font-medium text-foreground'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span
                      className="size-3 rounded-sm"
                      style={{ backgroundColor: c.value }}
                    />
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <FormFieldWrapper id="sub-desc" label="Description">
              <Textarea
                id="sub-desc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Objectifs pédagogiques et programme couvert..."
              />
            </FormFieldWrapper>

            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">
                Niveaux couverts
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {AVAILABLE_LEVELS.map((lvl) => {
                  const checked = selectedLevels.includes(lvl);
                  return (
                    <label
                      key={lvl}
                      className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => {
                          if (v) {
                            setSelectedLevels((prev) => [...prev, lvl]);
                          } else {
                            setSelectedLevels((prev) =>
                              prev.filter((item) => item !== lvl)
                            );
                          }
                        }}
                      />
                      <span>{lvl}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">
                Professeurs assignés par défaut
              </p>
              {teachers.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Aucun professeur enregistré dans ce centre.
                </p>
              ) : (
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {teachers.map((t) => {
                    const checked = selectedTeachers.includes(t.id);
                    return (
                      <label
                        key={t.id}
                        className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) => {
                            if (v) {
                              setSelectedTeachers((prev) => [...prev, t.id]);
                            } else {
                              setSelectedTeachers((prev) =>
                                prev.filter((id) => id !== t.id)
                              );
                            }
                          }}
                        />
                        <span className="truncate">{t.fullName}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit">
                {editingSubject ? 'Enregistrer' : 'Créer la matière'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Archive Impact Warning ConfirmDialog */}
      <ConfirmDialog
        open={Boolean(archiveTarget)}
        onOpenChange={(o) => {
          if (!o) setArchiveTarget(null);
        }}
        variant="destructive"
        title={`Archiver la matière « ${archiveTarget?.name} » ?`}
        description={
          impactedGroupsCount > 0
            ? `Attention : ${impactedGroupsCount} groupe(s) utilisent actuellement cette matière. L'archivage la masquera des nouvelles créations tout en préservant l'historique démo.`
            : 'Cette matière sera retirée des listes actives (réactivable à tout moment).'
        }
        confirmLabel="Archiver"
        onConfirm={() => {
          if (!archiveTarget) return;
          updateSubject(archiveTarget.id, { status: 'archivée' });
          toast.success(`Matière « ${archiveTarget.name} » archivée`);
          setArchiveTarget(null);
        }}
      />
    </ModuleGate>
  );
}
