'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Camera,
  CameraOff,
  Flashlight,
  Pause,
  Play,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QrCameraScannerProps {
  onSimulatedDetect: (sampleCode: string) => void;
}

export function QrCameraScanner({ onSimulatedDetect }: QrCameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [permissionState, setPermissionState] = useState<
    'idle' | 'prompting' | 'active' | 'paused' | 'denied' | 'unsupported'
  >('idle');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>(
    'environment'
  );
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const stopCameraTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setTorchOn(false);
    setTorchSupported(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCameraTracks();
    };
  }, [stopCameraTracks]);

  const startCamera = useCallback(
    async (mode: 'environment' | 'user') => {
      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices?.getUserMedia
      ) {
        setPermissionState('unsupported');
        setErrorMessage(
          "L'accès caméra n'est pas disponible dans cet environnement navigateur. Utilisez la saisie manuelle ou les scénarios de scan simulé ci-dessous."
        );
        return;
      }

      stopCameraTracks();
      setPermissionState('prompting');
      setErrorMessage(null);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: mode },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        const track = stream.getVideoTracks()[0];
        const capabilities =
          track && typeof track.getCapabilities === 'function'
            ? (track.getCapabilities() as { torch?: boolean })
            : undefined;
        setTorchSupported(Boolean(capabilities?.torch));
        setPermissionState('active');
      } catch {
        setPermissionState('denied');
        setErrorMessage(
          "Permission caméra refusée ou périphérique indisponible. Passez à la saisie d'identifiant ou au simulateur de scan."
        );
      }
    },
    [stopCameraTracks]
  );

  const togglePause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (permissionState === 'active') {
      video.pause();
      setPermissionState('paused');
    } else if (permissionState === 'paused') {
      void video.play();
      setPermissionState('active');
    }
  };

  const switchCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    if (permissionState === 'active' || permissionState === 'paused') {
      void startCamera(nextMode);
    }
  };

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track || !torchSupported) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({
        advanced: [{ torch: next } as MediaTrackConstraintSet],
      });
      setTorchOn(next);
    } catch {
      setTorchOn(false);
    }
  };

  return (
    <div className="space-y-3">
      {permissionState === 'idle' && (
        <div className="rounded-xl border border-dashed border-border bg-muted/25 p-5 text-center">
          <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Camera className="size-5" />
          </div>
          <h3 className="mt-3 text-sm font-semibold">
            Activer la caméra pour le scan QR
          </h3>
          <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
            Le flux vidéo reste strictement local dans votre navigateur. Aucune
            image n&apos;est envoyée ni enregistrée sur un serveur dans ce
            prototype.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button
              type="button"
              onClick={() => void startCamera(facingMode)}
              className="gap-2"
            >
              <Camera className="size-4" />
              Activer la caméra
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onSimulatedDetect('ELV-2026-001')}
            >
              Tester détection sans caméra
            </Button>
          </div>
        </div>
      )}

      {(permissionState === 'prompting' ||
        permissionState === 'active' ||
        permissionState === 'paused') && (
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-xl border border-border bg-slate-950">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="aspect-[4/3] w-full object-cover sm:aspect-video"
            />
            {/* Cadre de visée QR */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative size-44 rounded-2xl border-2 border-primary/80 shadow-[0_0_0_9999px_rgba(2,6,23,0.45)] sm:size-52">
                <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900/85 px-2 py-0.5 text-[11px] text-white">
                  {permissionState === 'paused'
                    ? 'Scanner en pause'
                    : permissionState === 'prompting'
                      ? 'Demande de permission...'
                      : 'Cadrez le QR étudiant'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={togglePause}
              className="gap-1.5"
            >
              {permissionState === 'paused' ? (
                <>
                  <Play className="size-3.5" /> Reprendre
                </>
              ) : (
                <>
                  <Pause className="size-3.5" /> Pause
                </>
              )}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={switchCamera}
              className="gap-1.5"
            >
              <RefreshCw className="size-3.5" />
              Changer caméra ({facingMode === 'environment' ? 'Arrière' : 'Avant'})
            </Button>
            {torchSupported && (
              <Button
                type="button"
                size="sm"
                variant={torchOn ? 'default' : 'outline'}
                onClick={() => void toggleTorch()}
                className="gap-1.5"
              >
                <Flashlight className="size-3.5" />
                Torche
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                stopCameraTracks();
                setPermissionState('idle');
              }}
              className="gap-1.5 text-destructive hover:text-destructive"
            >
              <CameraOff className="size-3.5" />
              Fermer caméra
            </Button>
          </div>
        </div>
      )}

      {(permissionState === 'denied' || permissionState === 'unsupported') && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-950 dark:text-amber-100">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="space-y-2">
              <p className="font-medium">Caméra indisponible</p>
              <p className="text-muted-foreground">{errorMessage}</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void startCamera(facingMode)}
              >
                Réessayer la caméra
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
