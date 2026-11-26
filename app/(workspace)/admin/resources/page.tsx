'use client';

import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Download,
  Eye,
  EyeOff,
  FileText,
  FolderOpen,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { ModuleGate } from '@/components/feedback/module-gate';
import { ConfirmDialog } from '@/components/feedback/confirm-dialog';
import { FormFieldWrapper } from '@/components/forms/form-field';
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
import { useDemoSession } from '@/stores/demo-session-context';
import { usePedagogyStore } from '@/stores/pedagogy-context';
import type {
  ResourceMaterialRecord,
  ResourceVisibility,
} from '@/types/pedagogy';

let resSeq = 500;
function nextResourceId() {
  resSeq += 1;
  return `res-${resSeq}`;
}

const VISIBILITY_LABELS: Record<ResourceVisibility, string> = {
  eleves_groupe: 'Élèves du groupe',
  professeurs: 'Professeurs uniquement',
  parents_eleves: 'Parents & élèves',
};

export default function AdminResourcesPage() {
  const { activeCenter } = useDemoSession();
  const {
    resources,
    subjects,
    groups,
    addResource,
    updateResource,
    deleteResource,
  } = usePedagogyStore();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [quotaSimulatedError, setQuotaSimulatedError] = useState(false);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uTitle, setUTitle] = useState('');
  const [uFileName, setUFileName] = useState('');
  const [uSizeKb, setUSizeKb] = useState(1250);
  const [uObjectUrl, setUObjectUrl] = useState<string | undefined>(undefined);
  const [uSubjectId, setUSubjectId] = useState(subjects[0]?.id ?? '');
  const [uGroupId, setUGroupId] = useState(groups[0]?.id ?? '');
  const [uFolder, setUFolder] = useState('Séries TD');
  const [uTags, setUTags] = useState('TD, Fiche de cours');
  const [uVisibility, setUVisibility] =
    useState<ResourceVisibility>('eleves_groupe');

  const [previewTarget, setPreviewTarget] =
    useState<ResourceMaterialRecord | null>(null);
  const [renameTarget, setRenameTarget] =
    useState<ResourceMaterialRecord | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [renameTags, setRenameTags] = useState('');
  const [deleteTarget, setDeleteTarget] =
    useState<ResourceMaterialRecord | null>(null);

  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      if (subjectFilter !== 'all' && r.subjectId !== subjectFilter) return false;
      if (groupFilter !== 'all' && r.groupId !== groupFilter) return false;
      return true;
    });
  }, [resources, subjectFilter, groupFilter]);

  const totalUsedMb = useMemo(() => {
    const totalKb = resources.reduce((s, r) => s + r.sizeKb, 0);
    return (totalKb / 1024).toFixed(1);
  }, [resources]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      setQuotaSimulatedError(true);
      toast.error('Fichier supérieur au plafond démo (15 Mo).');
      return;
    }
    setQuotaSimulatedError(false);
    setUFileName(file.name);
    if (!uTitle) setUTitle(file.name.replace(/\.[^.]+$/, ''));
    setUSizeKb(Math.max(12, Math.round(file.size / 1024)));
    setUObjectUrl(URL.createObjectURL(file));
  };

  const handleCreateResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (quotaSimulatedError) {
      toast.error('Impossible de déposer tant que l’alerte de quota est active.');
      return;
    }
    if (!uTitle.trim()) {
      toast.error('Titre du support requis.');
      return;
    }
    const sub = subjects.find((s) => s.id === uSubjectId) ?? subjects[0];
    const grp = groups.find((g) => g.id === uGroupId) ?? groups[0];
    const ext = (uFileName.split('.').pop() || 'PDF').toUpperCase();
    const fileType: ResourceMaterialRecord['fileType'] =
      ext === 'DOCX' || ext === 'PPTX' || ext === 'PDF'
        ? (ext as ResourceMaterialRecord['fileType'])
        : ext === 'PNG' || ext === 'JPG' || ext === 'JPEG'
          ? 'IMAGE'
          : 'PDF';

    addResource({
      id: nextResourceId(),
      centerId: activeCenter.id,
      title: uTitle.trim(),
      fileName: uFileName || `${uTitle.trim().replace(/\s+/g, '_')}.pdf`,
      fileType,
      sizeKb: uSizeKb,
      subjectId: sub?.id ?? '',
      subjectName: sub?.name ?? 'Matière',
      groupId: grp?.id ?? '',
      groupName: grp?.name ?? 'Tous groupes',
      teacherName: grp?.teacherName ?? 'Équipe pédagogique',
      folder: uFolder.trim() || 'Général',
      tags: uTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      visibility: uVisibility,
      published: true,
      updatedAtLabel: "Aujourd'hui",
      objectUrl: uObjectUrl,
    });
    toast.success('Support déposé en mémoire locale (Mode Démo)');
    setUploadOpen(false);
    setUTitle('');
    setUFileName('');
    setUObjectUrl(undefined);
  };

  return (
    <ModuleGate
      moduleKey="documents.teachers"
      allowedRoles={['director', 'secretary']}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Supports de cours & ressources
            </h1>
            <p className="text-sm text-muted-foreground">
              {activeCenter.name} · {resources.length} support(s) · stockage démo{' '}
              <span className="font-mono tabular-nums">{totalUsedMb} Mo / 2 048 Mo</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={quotaSimulatedError ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => setQuotaSimulatedError((v) => !v)}
            >
              {quotaSimulatedError ? 'Réinitialiser quota' : 'Simuler quota dépassé'}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setUSubjectId(subjects[0]?.id ?? '');
                setUGroupId(groups[0]?.id ?? '');
                setUploadOpen(true);
              }}
            >
              <Upload className="size-4" />
              Déposer un support
            </Button>
          </div>
        </div>

        {quotaSimulatedError && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertTriangle className="size-4 shrink-0" />
            <span>
              Quota de stockage démo simulé atteint (ou fichier &gt; 15 Mo).
              Supprimez un support ou réinitialisez la simulation de quota.
            </span>
          </div>
        )}

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={subjectFilter}
            onValueChange={(v) => setSubjectFilter(v ?? 'all')}
          >
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Matière" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les matières</SelectItem>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={groupFilter}
            onValueChange={(v) => setGroupFilter(v ?? 'all')}
          >
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Groupe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les groupes</SelectItem>
              {groups.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filteredResources.length === 0 ? (
          <Card className="border-border shadow-none">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FolderOpen className="mb-3 size-8 text-muted-foreground" />
              <p className="text-sm font-medium">Aucun support pour ces filtres</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Déposez un PDF, DOCX ou diaporama temporaire pour vos groupes.
              </p>
              <Button
                type="button"
                size="sm"
                className="mt-4"
                onClick={() => setUploadOpen(true)}
              >
                <Plus className="size-4" />
                Déposer un fichier
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredResources.map((res) => (
              <Card key={res.id} className="border-border shadow-none">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {res.subjectName} · {res.folder} · {res.fileType}
                      </p>
                      <CardTitle className="mt-1 text-base">
                        {res.title}
                      </CardTitle>
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        res.published ? 'text-success' : 'text-muted-foreground'
                      }`}
                    >
                      {res.published ? 'Publié' : 'Brouillon'}
                    </span>
                  </div>
                  <CardDescription className="text-xs">
                    {res.groupName} · {res.teacherName}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>{VISIBILITY_LABELS[res.visibility]}</span>
                    <span className="font-mono tabular-nums">
                      {(res.sizeKb / 1024).toFixed(2)} Mo · {res.updatedAtLabel}
                    </span>
                  </div>
                  {res.tags.length > 0 && (
                    <p className="text-[11px] text-muted-foreground">
                      Mots-clés : {res.tags.join(' · ')}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        size="xs"
                        variant="outline"
                        onClick={() => setPreviewTarget(res)}
                      >
                        <FileText className="size-3.5" />
                        Aperçu
                      </Button>
                      <Button
                        type="button"
                        size="xs"
                        variant="outline"
                        onClick={() => {
                          if (res.objectUrl) {
                            const a = document.createElement('a');
                            a.href = res.objectUrl;
                            a.download = res.fileName;
                            a.click();
                          } else {
                            const blob = new Blob(
                              [
                                `Support MarkazFlow (Mode Démo)\nTitre: ${res.title}\nGroupe: ${res.groupName}\n`,
                              ],
                              { type: 'text/plain;charset=utf-8' }
                            );
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${res.fileName}.txt`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }
                          toast.success(`Téléchargement démo : ${res.fileName}`);
                        }}
                      >
                        <Download className="size-3.5" />
                        Télécharger
                      </Button>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        size="xs"
                        variant="ghost"
                        onClick={() => {
                          setRenameTarget(res);
                          setRenameTitle(res.title);
                          setRenameTags(res.tags.join(', '));
                        }}
                      >
                        Renommer
                      </Button>
                      <Button
                        type="button"
                        size="icon-xs"
                        variant="ghost"
                        aria-label={
                          res.published ? 'Dépublier' : 'Publier'
                        }
                        onClick={() => {
                          updateResource(res.id, { published: !res.published });
                          toast.success(
                            res.published
                              ? 'Support dépublié'
                              : 'Support publié auprès de la cible'
                          );
                        }}
                      >
                        {res.published ? (
                          <EyeOff className="size-3.5" />
                        ) : (
                          <Eye className="size-3.5" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        size="icon-xs"
                        variant="ghost"
                        aria-label={`Supprimer ${res.title}`}
                        onClick={() => setDeleteTarget(res)}
                      >
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Upload Support Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Déposer un support pédagogique</DialogTitle>
            <DialogDescription>
              Crée une URL locale temporaire (object URL) en session sans stockage serveur.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateResource} className="space-y-4">
            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="size-3.5" />
                Choisir un fichier local (optionnel)
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">
                {uFileName
                  ? `Sélectionné : ${uFileName} (${uSizeKb} Ko)`
                  : 'PDF, DOCX, PPTX ou image — max 15 Mo en démo'}
              </p>
            </div>

            <FormFieldWrapper id="res-title" label="Titre du support" required>
              <Input
                id="res-title"
                value={uTitle}
                onChange={(e) => setUTitle(e.target.value)}
                placeholder="Ex: Série exercices probabilités"
              />
            </FormFieldWrapper>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormFieldWrapper id="res-sub" label="Matière">
                <Select
                  value={uSubjectId}
                  onValueChange={(v) => setUSubjectId(v ?? '')}
                >
                  <SelectTrigger id="res-sub" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormFieldWrapper>
              <FormFieldWrapper id="res-grp" label="Groupe cible">
                <Select
                  value={uGroupId}
                  onValueChange={(v) => setUGroupId(v ?? '')}
                >
                  <SelectTrigger id="res-grp" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormFieldWrapper>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormFieldWrapper id="res-folder" label="Dossier">
                <Input
                  id="res-folder"
                  value={uFolder}
                  onChange={(e) => setUFolder(e.target.value)}
                />
              </FormFieldWrapper>
              <FormFieldWrapper id="res-vis" label="Visibilité">
                <Select
                  value={uVisibility}
                  onValueChange={(v) =>
                    setUVisibility(
                      (v as ResourceVisibility) ?? 'eleves_groupe'
                    )
                  }
                >
                  <SelectTrigger id="res-vis" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eleves_groupe">
                      Élèves du groupe
                    </SelectItem>
                    <SelectItem value="parents_eleves">
                      Parents & élèves
                    </SelectItem>
                    <SelectItem value="professeurs">
                      Professeurs uniquement
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormFieldWrapper>
            </div>

            <FormFieldWrapper id="res-tags" label="Tags (virgules)">
              <Input
                id="res-tags"
                value={uTags}
                onChange={(e) => setUTags(e.target.value)}
              />
            </FormFieldWrapper>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setUploadOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit">Déposer (démo)</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={Boolean(previewTarget)}
        onOpenChange={(o) => {
          if (!o) setPreviewTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{previewTarget?.title}</DialogTitle>
            <DialogDescription>
              {previewTarget?.fileName} · Aperçu métadonnées Mode Démo
            </DialogDescription>
          </DialogHeader>
          {previewTarget && (
            <div className="space-y-3 text-xs">
              <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-1.5">
                <p>
                  Matière : <strong>{previewTarget.subjectName}</strong>
                </p>
                <p>
                  Groupe : <strong>{previewTarget.groupName}</strong>
                </p>
                <p>
                  Visibilité :{' '}
                  <strong>{VISIBILITY_LABELS[previewTarget.visibility]}</strong>
                </p>
                <p>
                  Taille :{' '}
                  <strong className="font-mono">
                    {(previewTarget.sizeKb / 1024).toFixed(2)} Mo
                  </strong>
                </p>
                {previewTarget.objectUrl && (
                  <a
                    href={previewTarget.objectUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block pt-2 font-medium text-primary underline"
                  >
                    Ouvrir l&apos;object URL temporaire
                  </a>
                )}
              </div>
              <div className="flex justify-end">
                <Button type="button" onClick={() => setPreviewTarget(null)}>
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rename / Tag Dialog */}
      <Dialog
        open={Boolean(renameTarget)}
        onOpenChange={(o) => {
          if (!o) setRenameTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Renommer & classer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <FormFieldWrapper id="ren-t" label="Nouveau titre">
              <Input
                id="ren-t"
                value={renameTitle}
                onChange={(e) => setRenameTitle(e.target.value)}
              />
            </FormFieldWrapper>
            <FormFieldWrapper id="ren-tags" label="Tags (virgules)">
              <Input
                id="ren-tags"
                value={renameTags}
                onChange={(e) => setRenameTags(e.target.value)}
              />
            </FormFieldWrapper>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRenameTarget(null)}
              >
                Annuler
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (!renameTarget) return;
                  updateResource(renameTarget.id, {
                    title: renameTitle.trim() || renameTarget.title,
                    tags: renameTags
                      .split(',')
                      .map((t) => t.trim())
                      .filter(Boolean),
                  });
                  toast.success('Support renommé');
                  setRenameTarget(null);
                }}
              >
                Enregistrer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
        variant="destructive"
        title={`Supprimer « ${deleteTarget?.title} » ?`}
        description="Ce support sera retiré de la bibliothèque locale de démonstration."
        confirmLabel="Supprimer"
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteResource(deleteTarget.id);
          toast.success('Support supprimé');
          setDeleteTarget(null);
        }}
      />
    </ModuleGate>
  );
}
