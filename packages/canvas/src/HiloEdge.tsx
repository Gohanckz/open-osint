'use client';

import { memo } from 'react';
import { EdgeLabelRenderer, getBezierPath, getSmoothStepPath, type EdgeProps } from '@xyflow/react';
import { CONNECTION_TYPE_META } from '@hilo/shared';
import { X } from 'lucide-react';
import type { HiloEdgeData } from './types.js';

/**
 * Evento global emitido cuando el usuario quiere eliminar una arista desde
 * el botón flotante de la propia arista. BoardCanvas lo escucha.
 */
export const HILO_EDGE_DELETE_EVENT = 'hilo-edge-delete';
export type HiloEdgeDeleteDetail = { id: string };

/**
 * Devuelve un path con una caída leve (gravedad) entre origen y destino,
 * imitando un hilo tensado por su propio peso.
 */
function getThreadPath(
  sx: number,
  sy: number,
  tx: number,
  ty: number,
): { path: string; midX: number; midY: number } {
  const dx = tx - sx;
  const dy = ty - sy;
  const dist = Math.hypot(dx, dy);

  // Sag proporcional a la distancia (clampeado)
  const sag = Math.min(40, Math.max(8, dist * 0.08));

  const midX = sx + dx * 0.5;
  const midY = sy + dy * 0.5 + sag;

  // Curva cuadrática suave con punto de control desplazado hacia abajo
  const path = `M ${sx},${sy} Q ${midX},${midY} ${tx},${ty}`;
  return { path, midX, midY: midY - sag * 0.5 };
}

function HiloEdgeBase(props: EdgeProps) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, selected } = props;
  const edgeData = data as HiloEdgeData | undefined;
  const meta = edgeData ? CONNECTION_TYPE_META[edgeData.type] : undefined;
  const color = meta?.color ?? '#C1272D';
  const strength = edgeData?.strength ?? 1;
  const verified = edgeData?.verified ?? true;

  // Path con gravedad para sensación de cuerda real
  const { path: threadPath, midX, midY } = getThreadPath(sourceX, sourceY, targetX, targetY);

  // Fallback bezier si los puntos están muy cercanos / verticales
  const [bezierPath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  const [stepFallback] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  const finalPath = threadPath || bezierPath || stepFallback;

  const baseWidth = 2 + strength * 0.7;
  // Cuando está seleccionada, el hilo se ve más grueso y vibrante
  const visibleWidth = selected ? baseWidth + 2 : baseWidth;
  const opacity = selected ? 1 : 0.92;

  return (
    <>
      {/* Halo glow cuando está seleccionada (capa más profunda) */}
      {selected && (
        <path
          d={finalPath}
          fill="none"
          stroke={color}
          strokeWidth={visibleWidth + 12}
          strokeLinecap="round"
          opacity={0.18}
          style={{ pointerEvents: 'none', filter: 'blur(3px)' }}
        />
      )}

      {/* Capa 1: sombra negra profunda debajo del hilo (volumen) */}
      <path
        d={finalPath}
        fill="none"
        stroke="rgba(0, 0, 0, 0.85)"
        strokeWidth={visibleWidth + 1.6}
        strokeLinecap="round"
        transform="translate(0.5, 2)"
        style={{ pointerEvents: 'none', filter: 'blur(0.5px)' }}
      />

      {/* Capa 2: hilo principal (visible) */}
      <path
        id={id}
        d={finalPath}
        fill="none"
        stroke={selected ? `color-mix(in srgb, ${color} 80%, white)` : color}
        strokeWidth={visibleWidth}
        strokeLinecap="round"
        strokeDasharray={verified ? undefined : '6 4'}
        opacity={opacity}
        style={{ pointerEvents: 'none' }}
      />

      {/* Capa 3: highlight (fibra brillante) */}
      <path
        d={finalPath}
        fill="none"
        stroke={`color-mix(in srgb, ${color} 50%, white)`}
        strokeWidth={Math.max(0.5, visibleWidth * 0.28)}
        strokeLinecap="round"
        opacity={selected ? 0.85 : 0.4}
        transform="translate(0, -0.4)"
        style={{ pointerEvents: 'none' }}
      />

      {/* Capa de hit-area invisible (24px) — facilita muchísimo el click */}
      <path
        d={finalPath}
        fill="none"
        stroke="transparent"
        strokeWidth={24}
        strokeLinecap="round"
        className="hilo-edge__hitarea"
        style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
      />

      {/* Nudos en los extremos (donde se ata el hilo a la tachuela) */}
      <circle
        cx={sourceX}
        cy={sourceY}
        r={selected ? 4 : 2.5}
        fill={color}
        opacity={selected ? 1 : 0.85}
        style={{ pointerEvents: 'none', transition: 'r 200ms' }}
      />
      <circle
        cx={targetX}
        cy={targetY}
        r={selected ? 4 : 2.5}
        fill={color}
        opacity={selected ? 1 : 0.85}
        style={{ pointerEvents: 'none', transition: 'r 200ms' }}
      />

      {/* Punta direccional (flecha tipo recorte de papel) */}
      {edgeData?.directional && (
        <ArrowHead x={targetX} y={targetY} sx={sourceX} sy={sourceY} color={color} />
      )}

      {/* Etiqueta tipo nota manuscrita */}
      {edgeData?.label && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${midX}px, ${midY - 24}px) rotate(-2deg)`,
              background: 'var(--color-paper-yellow)',
              color: '#1a1a1a',
              padding: '3px 8px',
              borderRadius: 1,
              fontFamily: 'var(--font-handwritten)',
              fontSize: 14,
              lineHeight: 1,
              boxShadow: '0 2px 4px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)',
              pointerEvents: 'all',
              whiteSpace: 'nowrap',
              border: `1px solid ${color}66`,
            }}
          >
            {edgeData.label}
          </div>
        </EdgeLabelRenderer>
      )}

      {/* Botón de eliminar — solo visible si la arista está seleccionada */}
      {selected && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${midX}px, ${midY}px)`,
              pointerEvents: 'all',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <button
              type="button"
              className="hilo-edge__delete"
              onClick={(e) => {
                e.stopPropagation();
                window.dispatchEvent(
                  new CustomEvent<HiloEdgeDeleteDetail>(HILO_EDGE_DELETE_EVENT, {
                    detail: { id },
                  }),
                );
              }}
              title="Eliminar conexión (o pulsa Supr)"
            >
              <X size={16} strokeWidth={2.6} />
              <span className="hilo-edge__delete-label">Eliminar</span>
            </button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

function ArrowHead({
  x,
  y,
  sx,
  sy,
  color,
}: {
  x: number;
  y: number;
  sx: number;
  sy: number;
  color: string;
}) {
  const angle = (Math.atan2(y - sy, x - sx) * 180) / Math.PI;
  const size = 8;
  return (
    <polygon
      points={`0,${-size / 2} ${size},0 0,${size / 2}`}
      fill={color}
      transform={`translate(${x - size}, ${y}) rotate(${angle}, ${size}, 0)`}
      opacity={0.9}
      style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.4))' }}
    />
  );
}

export const HiloEdge = memo(HiloEdgeBase);
