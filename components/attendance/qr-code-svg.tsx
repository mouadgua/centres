'use client';

import React, { useMemo } from 'react';

interface QrCodeSvgProps {
  value: string;
  size?: number;
  label?: string;
}

const GRID_SIZE = 25;

function isFinderCell(row: number, col: number): boolean {
  const inTopLeft = row < 7 && col < 7;
  const inTopRight = row < 7 && col >= GRID_SIZE - 7;
  const inBottomLeft = row >= GRID_SIZE - 7 && col < 7;

  if (inTopLeft || inTopRight || inBottomLeft) {
    const localRow = row >= GRID_SIZE - 7 ? row - (GRID_SIZE - 7) : row;
    const localCol = col >= GRID_SIZE - 7 ? col - (GRID_SIZE - 7) : col;
    if (
      localRow === 0 ||
      localRow === 6 ||
      localCol === 0 ||
      localCol === 6
    ) {
      return true;
    }
    if (localRow >= 2 && localRow <= 4 && localCol >= 2 && localCol <= 4) {
      return true;
    }
    return false;
  }

  // Quiet separator ring around finders
  if (
    (row === 7 && col <= 7) ||
    (col === 7 && row <= 7) ||
    (row === 7 && col >= GRID_SIZE - 8) ||
    (col === GRID_SIZE - 8 && row <= 7) ||
    (row === GRID_SIZE - 8 && col <= 7) ||
    (col === 7 && row >= GRID_SIZE - 8)
  ) {
    return false;
  }

  // Timing patterns
  if (row === 6 || col === 6) {
    return (row + col) % 2 === 0;
  }

  // Small alignment square near bottom-right
  if (row >= 16 && row <= 20 && col >= 16 && col <= 20) {
    if (row === 16 || row === 20 || col === 16 || col === 20) return true;
    return row === 18 && col === 18;
  }

  return false;
}

function isProtectedZone(row: number, col: number): boolean {
  if (row <= 7 && col <= 7) return true;
  if (row <= 7 && col >= GRID_SIZE - 8) return true;
  if (row >= GRID_SIZE - 8 && col <= 7) return true;
  if (row === 6 || col === 6) return true;
  if (row >= 16 && row <= 20 && col >= 16 && col <= 20) return true;
  return false;
}

function hashToken(value: string): number[] {
  const bytes: number[] = [];
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    h1 ^= code;
    h1 = Math.imul(h1, 0x01000193);
    h2 = Math.imul(h2 ^ (code + i), 0x85ebca6b);
    bytes.push((h1 >>> 0) & 0xff, (h2 >>> 0) & 0xff);
  }
  while (bytes.length < 128) {
    const prev = bytes[bytes.length - 1] ?? 42;
    h1 = Math.imul(h1 ^ prev, 0x27d4eb2d);
    bytes.push((h1 >>> 0) & 0xff);
  }
  return bytes;
}

export function QrCodeSvg({
  value,
  size = 220,
  label = 'QR Code étudiant de démonstration',
}: QrCodeSvgProps) {
  const cells = useMemo(() => {
    const digest = hashToken(value || 'DEMO-QR');
    const filled: { x: number; y: number }[] = [];
    let bitIdx = 0;

    for (let r = 0; r < GRID_SIZE; r += 1) {
      for (let c = 0; c < GRID_SIZE; c += 1) {
        if (isProtectedZone(r, c)) {
          if (isFinderCell(r, c)) {
            filled.push({ x: c, y: r });
          }
          continue;
        }
        const byte = digest[Math.floor(bitIdx / 8) % digest.length];
        const bit = (byte >> (bitIdx % 8)) & 1;
        bitIdx += 1;
        if (bit === 1) {
          filled.push({ x: c, y: r });
        }
      }
    }
    return filled;
  }, [value]);

  return (
    <div
      className="inline-flex items-center justify-center rounded-2xl border border-border bg-white p-4 shadow-xs"
      role="img"
      aria-label={label}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${GRID_SIZE} ${GRID_SIZE}`}
        shapeRendering="crispEdges"
        className="block"
      >
        <rect x="0" y="0" width={GRID_SIZE} height={GRID_SIZE} fill="#ffffff" />
        {cells.map((cell) => (
          <rect
            key={`${cell.x}-${cell.y}`}
            x={cell.x}
            y={cell.y}
            width={1}
            height={1}
            fill="#0f172a"
          />
        ))}
      </svg>
    </div>
  );
}
