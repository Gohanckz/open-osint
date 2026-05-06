import { z } from 'zod';
import { NODE_TYPES, CONNECTION_TYPES } from './nodes.js';

export const NodeTypeSchema = z.enum(NODE_TYPES);
export const ConnectionTypeSchema = z.enum(CONNECTION_TYPES);

export const VisibilitySchema = z.enum(['PRIVATE', 'UNLISTED', 'PUBLIC']);
export const ContributionModeSchema = z.enum([
  'CLOSED',
  'INVITE',
  'OPEN_PENDING',
  'OPEN_INSTANT',
]);
export const RoleSchema = z.enum([
  'OWNER',
  'EDITOR',
  'COMMENTER',
  'VIEWER',
  'VERIFIED_CONTRIBUTOR',
]);

// fields es JSON arbitrario en DB: campos por tipo + foto/adjuntos (data URLs) +
// apariencia (rotation, textColor) + visibilidad (display flags). Permitimos
// cualquier valor serializable JSON.
export const NodeFieldsSchema = z.record(z.string(), z.unknown());

export const CreateNodeSchema = z.object({
  boardId: z.string().cuid(),
  type: NodeTypeSchema,
  title: z.string().min(1).max(200),
  subtitle: z.string().max(200).nullish(),
  fields: NodeFieldsSchema.default({}),
  contentMd: z.string().max(50_000).nullish(),
  tags: z.array(z.string().max(40)).max(30).default([]),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .nullish(),
  x: z.number(),
  y: z.number(),
  width: z.number().positive().default(240),
  height: z.number().positive().default(160),
});

export const UpdateNodeSchema = CreateNodeSchema.partial().extend({
  id: z.string().cuid(),
});

export const CreateConnectionSchema = z.object({
  boardId: z.string().cuid(),
  fromNodeId: z.string().cuid(),
  toNodeId: z.string().cuid(),
  type: ConnectionTypeSchema,
  label: z.string().max(80).optional(),
  directional: z.boolean().default(true),
  strength: z.number().int().min(1).max(5).default(1),
  verified: z.boolean().default(false),
});

export const CreateBoardSchema = z.object({
  workspaceId: z.string().cuid().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(2_000).optional(),
  visibility: VisibilitySchema.default('PRIVATE'),
  contributionMode: ContributionModeSchema.default('CLOSED'),
  templateKey: z.string().optional(),
});

export const ContributionPayloadSchema = z.object({
  ops: z.array(
    z.object({
      op: z.enum(['add', 'replace', 'remove']),
      path: z.string(),
      value: z.unknown().optional(),
    }),
  ),
});

export const CreateContributionSchema = z.object({
  boardId: z.string().cuid(),
  anonHandle: z.string().max(40).optional(),
  message: z.string().max(1_000).optional(),
  payload: ContributionPayloadSchema,
  turnstileToken: z.string(),
});

export const InviteSchema = z.object({
  boardId: z.string().cuid(),
  email: z.string().email(),
  role: RoleSchema,
});

export const ReportSchema = z.object({
  boardId: z.string().cuid().optional(),
  nodeId: z.string().cuid().optional(),
  reason: z.enum([
    'SPAM',
    'HARASSMENT',
    'DOXXING',
    'COPYRIGHT',
    'MISINFORMATION',
    'ILLEGAL',
    'OTHER',
  ]),
  details: z.string().max(2_000).optional(),
});

export type CreateNodeInput = z.infer<typeof CreateNodeSchema>;
export type CreateConnectionInput = z.infer<typeof CreateConnectionSchema>;
export type CreateBoardInput = z.infer<typeof CreateBoardSchema>;
export type CreateContributionInput = z.infer<typeof CreateContributionSchema>;
