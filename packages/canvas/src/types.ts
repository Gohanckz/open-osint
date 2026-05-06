import type { NodeTypeKey, ConnectionTypeKey } from '@hilo/shared';

export interface HiloNodeData extends Record<string, unknown> {
  type: NodeTypeKey;
  title: string;
  subtitle?: string;
  tags?: string[];
  attachmentsCount?: number;
  commentsCount?: number;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';
  color?: string;
  /**
   * Datos arbitrarios del nodo:
   * - Campos por tipo (firstName, email, phone, ...)
   * - Foto (photoUrl: data URL)
   * - Adjuntos (attachments: Array<{name, mime, size, dataUrl}>)
   * - Apariencia: rotation (number), textColor (string)
   * - Visibilidad de elementos en la tarjeta: display: { subtitle, tags, photo, ... }
   */
  fields?: Record<string, unknown>;
}

export interface HiloEdgeData extends Record<string, unknown> {
  type: ConnectionTypeKey;
  label?: string;
  strength?: number;
  verified?: boolean;
  directional?: boolean;
}
