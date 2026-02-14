import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core';

// ─── Enums ───────────────────────────────────────────────

export const riskLevelEnum = pgEnum('risk_level', ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

export const estimatedStatusEnum = pgEnum('estimated_status', [
  'CONFIRMED',
  'SUSPECTED',
  'UNVERIFIED',
  'DENIED',
]);

export const relationStrengthEnum = pgEnum('relation_strength', [
  'STRONG',
  'MODERATE',
  'WEAK',
  'UNKNOWN',
]);

// ─── Core Entities ───────────────────────────────────────

export const person = pgTable('person', {
  id: uuid('id').defaultRandom().primaryKey(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  aliases: text('aliases').array(),
  dateOfBirth: timestamp('date_of_birth'),
  placeOfBirth: text('place_of_birth'),
  nationality: text('nationality'),
  gender: text('gender'),
  photoUrl: text('photo_url'),
  email: text('email').array(),
  phone: text('phone').array(),
  address: text('address'),
  passportNo: text('passport_no'),
  nationalId: text('national_id'),
  taxId: text('tax_id'),
  driversLicense: text('drivers_license'),
  socialMedia: jsonb('social_media'),
  notes: text('notes'),
  tags: text('tags').array(),
  riskLevel: riskLevelEnum('risk_level'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const organization = pgTable('organization', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  type: text('type'),
  industry: text('industry'),
  country: text('country'),
  address: text('address'),
  website: text('website'),
  phone: text('phone').array(),
  email: text('email').array(),
  foundedAt: timestamp('founded_at'),
  description: text('description'),
  notes: text('notes'),
  tags: text('tags').array(),
  riskLevel: riskLevelEnum('risk_level'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const event = pgTable('event', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  type: text('type'),
  description: text('description'),
  date: timestamp('date'),
  endDate: timestamp('end_date'),
  location: text('location'),
  latitude: doublePrecision('latitude'),
  longitude: doublePrecision('longitude'),
  country: text('country'),
  estimatedStatus: estimatedStatusEnum('estimated_status'),
  notes: text('notes'),
  tags: text('tags').array(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

// ─── Relationship Tables ─────────────────────────────────

export const personToPersonRelation = pgTable('person_to_person_relation', {
  id: uuid('id').defaultRandom().primaryKey(),
  sourcePersonId: uuid('source_person_id')
    .notNull()
    .references(() => person.id),
  targetPersonId: uuid('target_person_id')
    .notNull()
    .references(() => person.id),
  relationshipType: text('relationship_type'),
  context: text('context'),
  estimatedStatus: estimatedStatusEnum('estimated_status'),
  strength: relationStrengthEnum('strength'),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  notes: text('notes'),
  tags: text('tags').array(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const personToOrgRelation = pgTable('person_to_org_relation', {
  id: uuid('id').defaultRandom().primaryKey(),
  personId: uuid('person_id')
    .notNull()
    .references(() => person.id),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organization.id),
  role: text('role'),
  department: text('department'),
  context: text('context'),
  estimatedStatus: estimatedStatusEnum('estimated_status'),
  currentlyActive: boolean('currently_active').default(true).notNull(),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  notes: text('notes'),
  tags: text('tags').array(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const orgToOrgRelation = pgTable('org_to_org_relation', {
  id: uuid('id').defaultRandom().primaryKey(),
  sourceOrgId: uuid('source_org_id')
    .notNull()
    .references(() => organization.id),
  targetOrgId: uuid('target_org_id')
    .notNull()
    .references(() => organization.id),
  relationshipType: text('relationship_type'),
  context: text('context'),
  estimatedStatus: estimatedStatusEnum('estimated_status'),
  currentlyActive: boolean('currently_active').default(true).notNull(),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  notes: text('notes'),
  tags: text('tags').array(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

// ─── Junction Tables ─────────────────────────────────────

export const eventToPerson = pgTable('event_to_person', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id')
    .notNull()
    .references(() => event.id),
  personId: uuid('person_id')
    .notNull()
    .references(() => person.id),
  role: text('role'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const eventToOrganization = pgTable('event_to_organization', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id')
    .notNull()
    .references(() => event.id),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organization.id),
  role: text('role'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const eventToEvent = pgTable('event_to_event', {
  id: uuid('id').defaultRandom().primaryKey(),
  sourceEventId: uuid('source_event_id')
    .notNull()
    .references(() => event.id),
  targetEventId: uuid('target_event_id')
    .notNull()
    .references(() => event.id),
  relationshipType: text('relationship_type'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

// ─── File (polymorphic attachment) ───────────────────────

export const file = pgTable('file', {
  id: uuid('id').defaultRandom().primaryKey(),
  fileName: text('file_name').notNull(),
  fileType: text('file_type').notNull(),
  fileUrl: text('file_url').notNull(),
  fileSize: integer('file_size'),
  description: text('description'),
  uploadedBy: text('uploaded_by'),

  // Polymorphic FKs — exactly one should be set per record
  personId: uuid('person_id').references(() => person.id),
  organizationId: uuid('organization_id').references(() => organization.id),
  eventId: uuid('event_id').references(() => event.id),
  personToPersonRelationId: uuid('person_to_person_relation_id').references(
    () => personToPersonRelation.id
  ),
  personToOrgRelationId: uuid('person_to_org_relation_id').references(
    () => personToOrgRelation.id
  ),
  orgToOrgRelationId: uuid('org_to_org_relation_id').references(() => orgToOrgRelation.id),
  eventToEventRelationId: uuid('event_to_event_relation_id').references(() => eventToEvent.id),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

// ─── Type Exports ────────────────────────────────────────

export type Person = typeof person.$inferSelect;
export type NewPerson = typeof person.$inferInsert;
export type Organization = typeof organization.$inferSelect;
export type NewOrganization = typeof organization.$inferInsert;
export type Event = typeof event.$inferSelect;
export type NewEvent = typeof event.$inferInsert;
export type PersonToPersonRelation = typeof personToPersonRelation.$inferSelect;
export type PersonToOrgRelation = typeof personToOrgRelation.$inferSelect;
export type OrgToOrgRelation = typeof orgToOrgRelation.$inferSelect;
export type EventToPerson = typeof eventToPerson.$inferSelect;
export type EventToOrganization = typeof eventToOrganization.$inferSelect;
export type EventToEvent = typeof eventToEvent.$inferSelect;
export type File = typeof file.$inferSelect;
