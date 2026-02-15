import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import {
  personToPersonRelation,
  personToOrgRelation,
  orgToOrgRelation,
  eventToPerson,
  eventToOrganization,
} from '@/lib/db/schema';
import { notDeleted } from '@/lib/db/helpers';
import { z } from 'zod';

export async function GET() {
  try {
    const db = getDb();

    const [p2p, p2o, o2o] = await Promise.all([
      db
        .select()
        .from(personToPersonRelation)
        .where(notDeleted(personToPersonRelation.deletedAt)),
      db
        .select()
        .from(personToOrgRelation)
        .where(notDeleted(personToOrgRelation.deletedAt)),
      db
        .select()
        .from(orgToOrgRelation)
        .where(notDeleted(orgToOrgRelation.deletedAt)),
    ]);

    return NextResponse.json({
      data: {
        personToPerson: p2p,
        personToOrg: p2o,
        orgToOrg: o2o,
      },
    });
  } catch (error) {
    console.error('GET /api/relationships error:', error);
    return NextResponse.json({ error: 'Failed to fetch relationships' }, { status: 500 });
  }
}

const p2pSchema = z.object({
  type: z.literal('person-to-person'),
  sourcePersonId: z.string().uuid(),
  targetPersonId: z.string().uuid(),
  relationshipType: z.string().optional(),
  context: z.string().optional(),
  estimatedStatus: z.enum(['CONFIRMED', 'SUSPECTED', 'UNVERIFIED', 'DENIED']).optional(),
  strength: z.enum(['STRONG', 'MODERATE', 'WEAK', 'UNKNOWN']).optional(),
  notes: z.string().optional(),
});

const p2oSchema = z.object({
  type: z.literal('person-to-org'),
  personId: z.string().uuid(),
  organizationId: z.string().uuid(),
  role: z.string().optional(),
  department: z.string().optional(),
  context: z.string().optional(),
  estimatedStatus: z.enum(['CONFIRMED', 'SUSPECTED', 'UNVERIFIED', 'DENIED']).optional(),
  currentlyActive: z.boolean().optional(),
  notes: z.string().optional(),
});

const o2oSchema = z.object({
  type: z.literal('org-to-org'),
  sourceOrgId: z.string().uuid(),
  targetOrgId: z.string().uuid(),
  relationshipType: z.string().optional(),
  context: z.string().optional(),
  estimatedStatus: z.enum(['CONFIRMED', 'SUSPECTED', 'UNVERIFIED', 'DENIED']).optional(),
  currentlyActive: z.boolean().optional(),
  notes: z.string().optional(),
});

const e2pSchema = z.object({
  type: z.literal('event-to-person'),
  eventId: z.string().uuid(),
  personId: z.string().uuid(),
  role: z.string().optional(),
  notes: z.string().optional(),
});

const e2oSchema = z.object({
  type: z.literal('event-to-org'),
  eventId: z.string().uuid(),
  organizationId: z.string().uuid(),
  role: z.string().optional(),
  notes: z.string().optional(),
});

const createRelSchema = z.discriminatedUnion('type', [
  p2pSchema,
  p2oSchema,
  o2oSchema,
  e2pSchema,
  e2oSchema,
]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createRelSchema.parse(body);
    const db = getDb();

    let result;

    switch (validated.type) {
      case 'person-to-person': {
        const { type: _, ...data } = validated;
        [result] = await db.insert(personToPersonRelation).values(data).returning();
        break;
      }
      case 'person-to-org': {
        const { type: _, ...data } = validated;
        [result] = await db.insert(personToOrgRelation).values(data).returning();
        break;
      }
      case 'org-to-org': {
        const { type: _, ...data } = validated;
        [result] = await db.insert(orgToOrgRelation).values(data).returning();
        break;
      }
      case 'event-to-person': {
        const { type: _, ...data } = validated;
        [result] = await db.insert(eventToPerson).values(data).returning();
        break;
      }
      case 'event-to-org': {
        const { type: _, ...data } = validated;
        [result] = await db.insert(eventToOrganization).values(data).returning();
        break;
      }
    }

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('POST /api/relationships error:', error);
    return NextResponse.json({ error: 'Failed to create relationship' }, { status: 500 });
  }
}
