import { z } from 'zod';

const riskLevelValues = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
const estimatedStatusValues = ['CONFIRMED', 'SUSPECTED', 'UNVERIFIED', 'DENIED'] as const;
const relationStrengthValues = ['STRONG', 'MODERATE', 'WEAK', 'UNKNOWN'] as const;

// ─── Entity Schemas ─────────────────────────────────────

const personEntrySchema = z.object({
  _ref: z.string().min(1),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  aliases: z.array(z.string()).optional(),
  dateOfBirth: z.string().datetime().optional(),
  placeOfBirth: z.string().optional(),
  nationality: z.string().optional(),
  gender: z.string().optional(),
  photoUrl: z.string().optional(),
  email: z.array(z.string()).optional(),
  phone: z.array(z.string()).optional(),
  address: z.string().optional(),
  passportNo: z.string().optional(),
  nationalId: z.string().optional(),
  taxId: z.string().optional(),
  driversLicense: z.string().optional(),
  socialMedia: z.record(z.string(), z.string()).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  riskLevel: z.enum(riskLevelValues).optional(),
});

const orgEntrySchema = z.object({
  _ref: z.string().min(1),
  name: z.string().min(1),
  type: z.string().optional(),
  industry: z.string().optional(),
  country: z.string().optional(),
  address: z.string().optional(),
  website: z.string().optional(),
  phone: z.array(z.string()).optional(),
  email: z.array(z.string()).optional(),
  foundedAt: z.string().datetime().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  riskLevel: z.enum(riskLevelValues).optional(),
});

const eventEntrySchema = z.object({
  _ref: z.string().min(1),
  title: z.string().min(1),
  type: z.string().optional(),
  description: z.string().optional(),
  date: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  location: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  country: z.string().optional(),
  estimatedStatus: z.enum(estimatedStatusValues).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// ─── Relationship Schemas ───────────────────────────────

const p2pRelSchema = z.object({
  type: z.literal('person-to-person'),
  source: z.string().min(1),
  target: z.string().min(1),
  relationshipType: z.string().optional(),
  context: z.string().optional(),
  estimatedStatus: z.enum(estimatedStatusValues).optional(),
  strength: z.enum(relationStrengthValues).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const p2oRelSchema = z.object({
  type: z.literal('person-to-org'),
  person: z.string().min(1),
  organization: z.string().min(1),
  role: z.string().optional(),
  department: z.string().optional(),
  context: z.string().optional(),
  estimatedStatus: z.enum(estimatedStatusValues).optional(),
  currentlyActive: z.boolean().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const o2oRelSchema = z.object({
  type: z.literal('org-to-org'),
  source: z.string().min(1),
  target: z.string().min(1),
  relationshipType: z.string().optional(),
  context: z.string().optional(),
  estimatedStatus: z.enum(estimatedStatusValues).optional(),
  currentlyActive: z.boolean().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const e2pRelSchema = z.object({
  type: z.literal('event-to-person'),
  event: z.string().min(1),
  person: z.string().min(1),
  role: z.string().optional(),
  notes: z.string().optional(),
});

const e2oRelSchema = z.object({
  type: z.literal('event-to-org'),
  event: z.string().min(1),
  organization: z.string().min(1),
  role: z.string().optional(),
  notes: z.string().optional(),
});

const e2eRelSchema = z.object({
  type: z.literal('event-to-event'),
  source: z.string().min(1),
  target: z.string().min(1),
  relationshipType: z.string().optional(),
  notes: z.string().optional(),
});

const relationshipEntrySchema = z.discriminatedUnion('type', [
  p2pRelSchema,
  p2oRelSchema,
  o2oRelSchema,
  e2pRelSchema,
  e2oRelSchema,
  e2eRelSchema,
]);

// ─── Top-Level Schema ───────────────────────────────────

export const simulationSchema = z.object({
  people: z.array(personEntrySchema).default([]),
  organizations: z.array(orgEntrySchema).default([]),
  events: z.array(eventEntrySchema).default([]),
  relationships: z.array(relationshipEntrySchema).default([]),
});

export type SimulationPayload = z.infer<typeof simulationSchema>;
