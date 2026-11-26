'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  DoorOpen,
  Edit3,
  MapPin,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { ModuleGate } from '@/components/feedback/module-gate';
import { FormFieldWrapper, PhoneInputMA } from '@/components/forms/form-field';
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
import type { RoomRecord } from '@/types/pedagogy';

let siteSeq = 400;
function nextSiteId() {
  siteSeq += 1;
  return `loc-${siteSeq}`;
}

let roomSeq = 400;
function nextRoomId() {
  roomSeq += 1;
  return `room-${roomSeq}`;
}

export default function AdminLocationsPage() {
  const { activeCenter } = useDemoSession();
  const { sites, rooms, sessions, addSite, updateSite, addRoom, updateRoom } =
    usePedagogyStore();

  const [siteModalOpen, setSiteModalOpen] = useState(false);
  const [siteName, setSiteName] = useState('');
  const [siteCity, setSiteCity] = useState(activeCenter.city);
  const [siteAddress, setSiteAddress] = useState('');
  const [sitePhone, setSitePhone] = useState('');
  const [siteHours, setSiteHours] = useState('Lun–Sam · 09:00 – 21:00');

  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomRecord | null>(null);
  const [rSiteId, setRSiteId] = useState('');
  const [rName, setRName] = useState('');
  const [rFloor, setRFloor] = useState('1er étage');
  const [rCapacity, setRCapacity] = useState('22');
  const [rEquipment, setREquipment] = useState('Tableau blanc, Climatisation');
  const [rStatus, setRStatus] = useState<'disponible' | 'maintenance'>(
    'disponible'
  );

  const [selectedSiteMapId, setSelectedSiteMapId] = useState<string>(
    sites[0]?.id ?? ''
  );

  const activeMapSite =
    sites.find((s) => s.id === selectedSiteMapId) ?? sites[0] ?? null;

  const totalCapacity = useMemo(
    () =>
      rooms
        .filter((r) => r.status === 'disponible')
        .reduce((sum, r) => sum + r.capacity, 0),
    [rooms]
  );

  const openAddRoom = () => {
    setEditingRoom(null);
    setRSiteId(sites[0]?.id ?? '');
    setRName('');
    setRFloor('1er étage');
    setRCapacity('22');
    setREquipment('Tableau blanc, Vidéoprojecteur');
    setRStatus('disponible');
    setRoomModalOpen(true);
  };

  const openEditRoom = (room: RoomRecord) => {
    setEditingRoom(room);
    setRSiteId(room.siteId);
    setRName(room.name);
    setRFloor(room.floor);
    setRCapacity(String(room.capacity));
    setREquipment(room.equipment.join(', '));
    setRStatus(room.status);
    setRoomModalOpen(true);
  };

  const handleSaveSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteName.trim() || !siteAddress.trim()) {
      toast.error('Nom et adresse du site requis.');
      return;
    }
    const id = nextSiteId();
    addSite({
      id,
      centerId: activeCenter.id,
      name: siteName.trim(),
      city: siteCity.trim() || activeCenter.city,
      address: siteAddress.trim(),
      phone: sitePhone.trim() || '+212 5 22 00 00 00',
      openingHours: siteHours.trim(),
      lat: 33.57,
      lng: -7.59,
      geocodeStatus: 'ok',
    });
    setSelectedSiteMapId(id);
    toast.success(`Site « ${siteName.trim()} » ajouté (Mode Démo)`);
    setSiteModalOpen(false);
    setSiteName('');
    setSiteAddress('');
  };

  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rName.trim()) {
      toast.error('Le nom de la salle est requis.');
      return;
    }
    const site = sites.find((s) => s.id === rSiteId);
    const equipmentList = rEquipment
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    if (editingRoom) {
      updateRoom(editingRoom.id, {
        siteId: site?.id ?? rSiteId,
        siteName: site?.name ?? editingRoom.siteName,
        name: rName.trim(),
        floor: rFloor.trim(),
        capacity: Math.max(1, Number(rCapacity) || 20),
        equipment: equipmentList,
        status: rStatus,
      });
      toast.success(`Salle « ${rName.trim()} » mise à jour`);
    } else {
      addRoom({
        id: nextRoomId(),
        centerId: activeCenter.id,
        siteId: site?.id ?? rSiteId,
        siteName: site?.name ?? sites[0]?.name ?? 'Site principal',
        name: rName.trim(),
        floor: rFloor.trim(),
        capacity: Math.max(1, Number(rCapacity) || 20),
        equipment: equipmentList,
        status: rStatus,
      });
      toast.success(`Salle « ${rName.trim()} » ajoutée (Mode Démo)`);
    }
    setRoomModalOpen(false);
  };

  return (
    <ModuleGate moduleKey="locations" allowedRoles={['director', 'secretary']}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Salles & sites d&apos;enseignement
            </h1>
            <p className="text-sm text-muted-foreground">
              {activeCenter.name} · {sites.length} site(s) · {rooms.length} salle(s) ·{' '}
              <span className="font-mono tabular-nums">{totalCapacity}</span> places
              disponibles
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSiteModalOpen(true)}
            >
              <Building2 className="size-4" />
              Ajouter un site
            </Button>
            <Button type="button" size="sm" onClick={openAddRoom}>
              <Plus className="size-4" />
              Ajouter une salle
            </Button>
          </div>
        </div>

        {/* Sites grid + interactive geocode preview */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            <div className="grid gap-4 sm:grid-cols-2">
              {sites.map((site) => {
                const siteRooms = rooms.filter((r) => r.siteId === site.id);
                const siteCap = siteRooms.reduce((s, r) => s + r.capacity, 0);
                const selected = activeMapSite?.id === site.id;
                return (
                  <Card
                    key={site.id}
                    className={`cursor-pointer border-border shadow-none transition-colors ${
                      selected ? 'ring-1 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedSiteMapId(site.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-base">{site.name}</CardTitle>
                          <CardDescription className="text-xs">
                            {site.city} · {siteRooms.length} salle(s) · {siteCap}{' '}
                            places
                          </CardDescription>
                        </div>
                        <MapPin className="size-4 shrink-0 text-primary" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1.5 text-xs text-muted-foreground">
                      <p className="text-foreground">{site.address}</p>
                      <p className="font-mono">{site.phone}</p>
                      <p>{site.openingHours}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <Card className="border-border shadow-none">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm font-semibold">
                  Repérage & géolocalisation
                </CardTitle>
                {activeMapSite && (
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    onClick={() =>
                      updateSite(activeMapSite.id, {
                        geocodeStatus:
                          activeMapSite.geocodeStatus === 'ok'
                            ? 'erreur_simulee'
                            : 'ok',
                      })
                    }
                  >
                    <RefreshCw className="size-3" />
                    {activeMapSite.geocodeStatus === 'ok'
                      ? 'Simuler erreur GPS'
                      : 'Réessayer géocodage'}
                  </Button>
                )}
              </div>
              <CardDescription className="text-xs">
                Aperçu schématique multi-sites (Mode Démo sans API Maps externe).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeMapSite ? (
                activeMapSite.geocodeStatus === 'erreur_simulee' ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/40 bg-destructive/10 p-6 text-center text-xs">
                    <AlertTriangle className="mb-2 size-6 text-destructive" />
                    <p className="font-medium text-foreground">
                      Erreur de géocodage simulée
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      Adresse non résolue pour « {activeMapSite.address} ».
                      Vérifiez le format ou saisissez les coordonnées manuellement.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">{activeMapSite.name}</span>
                      <span className="font-mono text-muted-foreground tabular-nums">
                        {activeMapSite.lat.toFixed(4)}, {activeMapSite.lng.toFixed(4)}
                      </span>
                    </div>
                    <div className="relative h-32 overflow-hidden rounded-md border border-border bg-background">
                      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#334155_1px,transparent_1px)]" />
                      <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
                        <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                          <MapPin className="size-4" />
                        </span>
                        <span className="mt-1 rounded bg-background/90 px-2 py-0.5 text-[11px] font-medium shadow-xs">
                          {activeMapSite.name}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <p className="text-xs text-muted-foreground">Aucun site sélectionné.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Rooms list & occupancy schedule */}
        <Card className="border-border shadow-none">
          <CardHeader>
            <CardTitle className="text-base">
              Salles, capacités & occupation du jour
            </CardTitle>
            <CardDescription>
              Visualisez le matériel disponible et les séances planifiées dans chaque salle.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border rounded-lg border border-border">
              {rooms.map((room) => {
                const roomSessions = sessions.filter(
                  (s) => s.roomId === room.id && s.status !== 'annulée'
                );
                return (
                  <div
                    key={room.id}
                    className="flex flex-wrap items-center justify-between gap-4 p-4"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <DoorOpen className="size-4 text-primary" />
                        <span className="font-medium">{room.name}</span>
                        <span className="text-xs text-muted-foreground">
                          · {room.siteName} · {room.floor}
                        </span>
                        <span
                          className={`text-xs font-medium ${
                            room.status === 'disponible'
                              ? 'text-success'
                              : 'text-warning'
                          }`}
                        >
                          · {room.status === 'disponible' ? 'Disponible' : 'En maintenance'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Capacité :{' '}
                        <span className="font-mono font-medium text-foreground tabular-nums">
                          {room.capacity} places
                        </span>{' '}
                        · Équipements : {room.equipment.join(' · ') || 'Standard'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Occupation :{' '}
                        {roomSessions.length > 0
                          ? roomSessions
                              .map(
                                (s) =>
                                  `${s.dateLabel} ${s.startTime}–${s.endTime} (${s.groupName})`
                              )
                              .join(' | ')
                          : 'Libre sur les prochains créneaux'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="xs"
                        variant="outline"
                        onClick={() =>
                          updateRoom(room.id, {
                            status:
                              room.status === 'disponible'
                                ? 'maintenance'
                                : 'disponible',
                          })
                        }
                      >
                        {room.status === 'disponible'
                          ? 'Mettre en maintenance'
                          : 'Remettre en service'}
                      </Button>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Modifier ${room.name}`}
                        onClick={() => openEditRoom(room)}
                      >
                        <Edit3 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Site Dialog */}
      <Dialog open={siteModalOpen} onOpenChange={setSiteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un site</DialogTitle>
            <DialogDescription>
              Nouvelle annexe ou campus pour {activeCenter.name} (Mode Démo).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveSite} className="space-y-4">
            <FormFieldWrapper id="st-name" label="Nom du site" required>
              <Input
                id="st-name"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="Ex: Annexe Hay Riad"
              />
            </FormFieldWrapper>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormFieldWrapper id="st-city" label="Ville">
                <Input
                  id="st-city"
                  value={siteCity}
                  onChange={(e) => setSiteCity(e.target.value)}
                />
              </FormFieldWrapper>
              <FormFieldWrapper id="st-phone" label="Téléphone">
                <PhoneInputMA
                  id="st-phone"
                  value={sitePhone}
                  onChange={(e) => setSitePhone(e.target.value)}
                />
              </FormFieldWrapper>
            </div>
            <FormFieldWrapper id="st-addr" label="Adresse complète" required>
              <Input
                id="st-addr"
                value={siteAddress}
                onChange={(e) => setSiteAddress(e.target.value)}
                placeholder="Avenue Annakhil..."
              />
            </FormFieldWrapper>
            <FormFieldWrapper id="st-hours" label="Horaires d'ouverture">
              <Input
                id="st-hours"
                value={siteHours}
                onChange={(e) => setSiteHours(e.target.value)}
              />
            </FormFieldWrapper>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSiteModalOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit">Créer le site</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Room Dialog */}
      <Dialog open={roomModalOpen} onOpenChange={setRoomModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingRoom ? 'Modifier la salle' : 'Nouvelle salle'}
            </DialogTitle>
            <DialogDescription>
              Définissez le site, la capacité et les équipements pédagogiques.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveRoom} className="space-y-4">
            <FormFieldWrapper id="rm-site" label="Site de rattachement" required>
              <Select
                value={rSiteId}
                onValueChange={(v) => setRSiteId(v ?? '')}
              >
                <SelectTrigger id="rm-site" className="w-full">
                  <SelectValue placeholder="Choisir un site" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormFieldWrapper>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <FormFieldWrapper id="rm-name" label="Nom de la salle" required>
                  <Input
                    id="rm-name"
                    value={rName}
                    onChange={(e) => setRName(e.target.value)}
                    placeholder="Salle Ibn Khaldoun"
                  />
                </FormFieldWrapper>
              </div>
              <FormFieldWrapper id="rm-cap" label="Capacité" required>
                <Input
                  id="rm-cap"
                  type="number"
                  min={1}
                  value={rCapacity}
                  onChange={(e) => setRCapacity(e.target.value)}
                />
              </FormFieldWrapper>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormFieldWrapper id="rm-floor" label="Étage / Repère">
                <Input
                  id="rm-floor"
                  value={rFloor}
                  onChange={(e) => setRFloor(e.target.value)}
                />
              </FormFieldWrapper>
              <FormFieldWrapper id="rm-status" label="Statut">
                <Select
                  value={rStatus}
                  onValueChange={(v) =>
                    setRStatus((v as 'disponible' | 'maintenance') ?? 'disponible')
                  }
                >
                  <SelectTrigger id="rm-status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disponible">Disponible</SelectItem>
                    <SelectItem value="maintenance">En maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </FormFieldWrapper>
            </div>
            <FormFieldWrapper
              id="rm-eq"
              label="Équipements (séparés par des virgules)"
            >
              <Input
                id="rm-eq"
                value={rEquipment}
                onChange={(e) => setREquipment(e.target.value)}
              />
            </FormFieldWrapper>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRoomModalOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit">
                {editingRoom ? 'Enregistrer' : 'Ajouter la salle'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </ModuleGate>
  );
}
