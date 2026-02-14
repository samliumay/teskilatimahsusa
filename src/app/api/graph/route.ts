import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import {
  person,
  organization,
  event,
  personToPersonRelation,
  personToOrgRelation,
  orgToOrgRelation,
  eventToPerson,
  eventToOrganization,
  eventToEvent,
} from '@/lib/db/schema';
import { notDeleted } from '@/lib/db/helpers';
import type { CytoscapeNode, CytoscapeEdge } from '@/lib/types';

export async function GET() {
  try {
    const db = getDb();

    const [people, orgs, events, p2p, p2o, o2o, e2p, e2o, e2e] = await Promise.all([
      db.select().from(person).where(notDeleted(person.deletedAt)),
      db.select().from(organization).where(notDeleted(organization.deletedAt)),
      db.select().from(event).where(notDeleted(event.deletedAt)),
      db.select().from(personToPersonRelation).where(notDeleted(personToPersonRelation.deletedAt)),
      db.select().from(personToOrgRelation).where(notDeleted(personToOrgRelation.deletedAt)),
      db.select().from(orgToOrgRelation).where(notDeleted(orgToOrgRelation.deletedAt)),
      db.select().from(eventToPerson).where(notDeleted(eventToPerson.deletedAt)),
      db.select().from(eventToOrganization).where(notDeleted(eventToOrganization.deletedAt)),
      db.select().from(eventToEvent).where(notDeleted(eventToEvent.deletedAt)),
    ]);

    const nodes: CytoscapeNode[] = [
      ...people.map((p) => ({
        data: {
          id: p.id,
          label: [p.firstName, p.lastName].filter(Boolean).join(' ') || 'Unknown',
          type: 'person' as const,
          riskLevel: p.riskLevel ?? undefined,
        },
      })),
      ...orgs.map((o) => ({
        data: {
          id: o.id,
          label: o.name,
          type: 'organization' as const,
          riskLevel: o.riskLevel ?? undefined,
        },
      })),
      ...events.map((e) => ({
        data: {
          id: e.id,
          label: e.title,
          type: 'event' as const,
        },
      })),
    ];

    const edges: CytoscapeEdge[] = [
      ...p2p.map((r) => ({
        data: {
          id: r.id,
          source: r.sourcePersonId,
          target: r.targetPersonId,
          label: r.relationshipType ?? undefined,
          relationType: 'person-to-person',
        },
      })),
      ...p2o.map((r) => ({
        data: {
          id: r.id,
          source: r.personId,
          target: r.organizationId,
          label: r.role ?? undefined,
          relationType: 'person-to-org',
        },
      })),
      ...o2o.map((r) => ({
        data: {
          id: r.id,
          source: r.sourceOrgId,
          target: r.targetOrgId,
          label: r.relationshipType ?? undefined,
          relationType: 'org-to-org',
        },
      })),
      ...e2p.map((r) => ({
        data: {
          id: r.id,
          source: r.eventId,
          target: r.personId,
          label: r.role ?? undefined,
          relationType: 'event-to-person',
        },
      })),
      ...e2o.map((r) => ({
        data: {
          id: r.id,
          source: r.eventId,
          target: r.organizationId,
          label: r.role ?? undefined,
          relationType: 'event-to-org',
        },
      })),
      ...e2e.map((r) => ({
        data: {
          id: r.id,
          source: r.sourceEventId,
          target: r.targetEventId,
          label: r.relationshipType ?? undefined,
          relationType: 'event-to-event',
        },
      })),
    ];

    return NextResponse.json({ data: { nodes, edges } });
  } catch (error) {
    console.error('GET /api/graph error:', error);
    return NextResponse.json({ error: 'Failed to fetch graph data' }, { status: 500 });
  }
}
