import { NextRequest, NextResponse } from 'next/server';
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
import { simulationSchema, type SimulationPayload } from '@/lib/validation/simulation';
import { getMinioClient } from '@/lib/minio';
import { sql } from 'drizzle-orm';
import { z } from 'zod';

// ─── Ref validation helpers ─────────────────────────────

function collectRefs(payload: SimulationPayload) {
  const personRefs = new Set(payload.people.map((p) => p._ref));
  const orgRefs = new Set(payload.organizations.map((o) => o._ref));
  const eventRefs = new Set(payload.events.map((e) => e._ref));
  return { personRefs, orgRefs, eventRefs };
}

function checkDuplicateRefs(payload: SimulationPayload): string[] {
  const all: string[] = [
    ...payload.people.map((p) => p._ref),
    ...payload.organizations.map((o) => o._ref),
    ...payload.events.map((e) => e._ref),
  ];
  const seen = new Set<string>();
  const dupes: string[] = [];
  for (const ref of all) {
    if (seen.has(ref)) dupes.push(ref);
    seen.add(ref);
  }
  return dupes;
}

function checkDanglingRefs(
  payload: SimulationPayload,
  personRefs: Set<string>,
  orgRefs: Set<string>,
  eventRefs: Set<string>,
): string[] {
  const errors: string[] = [];

  for (const rel of payload.relationships) {
    switch (rel.type) {
      case 'person-to-person':
        if (!personRefs.has(rel.source)) errors.push(`person-to-person: source "${rel.source}" not found in people`);
        if (!personRefs.has(rel.target)) errors.push(`person-to-person: target "${rel.target}" not found in people`);
        break;
      case 'person-to-org':
        if (!personRefs.has(rel.person)) errors.push(`person-to-org: person "${rel.person}" not found in people`);
        if (!orgRefs.has(rel.organization)) errors.push(`person-to-org: organization "${rel.organization}" not found in organizations`);
        break;
      case 'org-to-org':
        if (!orgRefs.has(rel.source)) errors.push(`org-to-org: source "${rel.source}" not found in organizations`);
        if (!orgRefs.has(rel.target)) errors.push(`org-to-org: target "${rel.target}" not found in organizations`);
        break;
      case 'event-to-person':
        if (!eventRefs.has(rel.event)) errors.push(`event-to-person: event "${rel.event}" not found in events`);
        if (!personRefs.has(rel.person)) errors.push(`event-to-person: person "${rel.person}" not found in people`);
        break;
      case 'event-to-org':
        if (!eventRefs.has(rel.event)) errors.push(`event-to-org: event "${rel.event}" not found in events`);
        if (!orgRefs.has(rel.organization)) errors.push(`event-to-org: organization "${rel.organization}" not found in organizations`);
        break;
      case 'event-to-event':
        if (!eventRefs.has(rel.source)) errors.push(`event-to-event: source "${rel.source}" not found in events`);
        if (!eventRefs.has(rel.target)) errors.push(`event-to-event: target "${rel.target}" not found in events`);
        break;
    }
  }

  return errors;
}

// ─── POST handler ───────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = simulationSchema.parse(body);

    // Pre-flight: check for duplicate _ref keys
    const dupes = checkDuplicateRefs(payload);
    if (dupes.length > 0) {
      return NextResponse.json(
        { error: 'Duplicate _ref keys found', details: dupes },
        { status: 400 },
      );
    }

    // Pre-flight: check for dangling refs in relationships
    const { personRefs, orgRefs, eventRefs } = collectRefs(payload);
    const danglingErrors = checkDanglingRefs(payload, personRefs, orgRefs, eventRefs);
    if (danglingErrors.length > 0) {
      return NextResponse.json(
        { error: 'Dangling _ref references in relationships', details: danglingErrors },
        { status: 400 },
      );
    }

    // Execute everything in a single transaction
    const db = getDb();
    const result = await db.transaction(async (tx) => {
      const refToUuid = new Map<string, string>();

      // 1. Insert people
      if (payload.people.length > 0) {
        const rows = await tx
          .insert(person)
          .values(
            payload.people.map((p) => ({
              firstName: p.firstName,
              lastName: p.lastName,
              aliases: p.aliases,
              dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth) : undefined,
              placeOfBirth: p.placeOfBirth,
              nationality: p.nationality,
              gender: p.gender,
              photoUrl: p.photoUrl,
              email: p.email,
              phone: p.phone,
              address: p.address,
              passportNo: p.passportNo,
              nationalId: p.nationalId,
              taxId: p.taxId,
              driversLicense: p.driversLicense,
              socialMedia: p.socialMedia,
              notes: p.notes,
              tags: p.tags,
              riskLevel: p.riskLevel,
            })),
          )
          .returning({ id: person.id });

        for (let i = 0; i < payload.people.length; i++) {
          refToUuid.set(payload.people[i]!._ref, rows[i]!.id);
        }
      }

      // 2. Insert organizations
      if (payload.organizations.length > 0) {
        const rows = await tx
          .insert(organization)
          .values(
            payload.organizations.map((o) => ({
              name: o.name,
              type: o.type,
              industry: o.industry,
              country: o.country,
              address: o.address,
              website: o.website,
              phone: o.phone,
              email: o.email,
              foundedAt: o.foundedAt ? new Date(o.foundedAt) : undefined,
              description: o.description,
              notes: o.notes,
              tags: o.tags,
              riskLevel: o.riskLevel,
            })),
          )
          .returning({ id: organization.id });

        for (let i = 0; i < payload.organizations.length; i++) {
          refToUuid.set(payload.organizations[i]!._ref, rows[i]!.id);
        }
      }

      // 3. Insert events
      if (payload.events.length > 0) {
        const rows = await tx
          .insert(event)
          .values(
            payload.events.map((e) => ({
              title: e.title,
              type: e.type,
              description: e.description,
              date: e.date ? new Date(e.date) : undefined,
              endDate: e.endDate ? new Date(e.endDate) : undefined,
              location: e.location,
              latitude: e.latitude,
              longitude: e.longitude,
              country: e.country,
              estimatedStatus: e.estimatedStatus,
              notes: e.notes,
              tags: e.tags,
            })),
          )
          .returning({ id: event.id });

        for (let i = 0; i < payload.events.length; i++) {
          refToUuid.set(payload.events[i]!._ref, rows[i]!.id);
        }
      }

      // 4. Insert relationships by type
      const breakdown = {
        personToPerson: 0,
        personToOrg: 0,
        orgToOrg: 0,
        eventToPerson: 0,
        eventToOrg: 0,
        eventToEvent: 0,
      };

      const p2pRels = payload.relationships.filter((r) => r.type === 'person-to-person');
      if (p2pRels.length > 0) {
        await tx.insert(personToPersonRelation).values(
          p2pRels.map((r) => {
            if (r.type !== 'person-to-person') throw new Error('unreachable');
            return {
              sourcePersonId: refToUuid.get(r.source)!,
              targetPersonId: refToUuid.get(r.target)!,
              relationshipType: r.relationshipType,
              context: r.context,
              estimatedStatus: r.estimatedStatus,
              strength: r.strength,
              startDate: r.startDate ? new Date(r.startDate) : undefined,
              endDate: r.endDate ? new Date(r.endDate) : undefined,
              notes: r.notes,
              tags: r.tags,
            };
          }),
        );
        breakdown.personToPerson = p2pRels.length;
      }

      const p2oRels = payload.relationships.filter((r) => r.type === 'person-to-org');
      if (p2oRels.length > 0) {
        await tx.insert(personToOrgRelation).values(
          p2oRels.map((r) => {
            if (r.type !== 'person-to-org') throw new Error('unreachable');
            return {
              personId: refToUuid.get(r.person)!,
              organizationId: refToUuid.get(r.organization)!,
              role: r.role,
              department: r.department,
              context: r.context,
              estimatedStatus: r.estimatedStatus,
              currentlyActive: r.currentlyActive ?? true,
              startDate: r.startDate ? new Date(r.startDate) : undefined,
              endDate: r.endDate ? new Date(r.endDate) : undefined,
              notes: r.notes,
              tags: r.tags,
            };
          }),
        );
        breakdown.personToOrg = p2oRels.length;
      }

      const o2oRels = payload.relationships.filter((r) => r.type === 'org-to-org');
      if (o2oRels.length > 0) {
        await tx.insert(orgToOrgRelation).values(
          o2oRels.map((r) => {
            if (r.type !== 'org-to-org') throw new Error('unreachable');
            return {
              sourceOrgId: refToUuid.get(r.source)!,
              targetOrgId: refToUuid.get(r.target)!,
              relationshipType: r.relationshipType,
              context: r.context,
              estimatedStatus: r.estimatedStatus,
              currentlyActive: r.currentlyActive ?? true,
              startDate: r.startDate ? new Date(r.startDate) : undefined,
              endDate: r.endDate ? new Date(r.endDate) : undefined,
              notes: r.notes,
              tags: r.tags,
            };
          }),
        );
        breakdown.orgToOrg = o2oRels.length;
      }

      const e2pRels = payload.relationships.filter((r) => r.type === 'event-to-person');
      if (e2pRels.length > 0) {
        await tx.insert(eventToPerson).values(
          e2pRels.map((r) => {
            if (r.type !== 'event-to-person') throw new Error('unreachable');
            return {
              eventId: refToUuid.get(r.event)!,
              personId: refToUuid.get(r.person)!,
              role: r.role,
              notes: r.notes,
            };
          }),
        );
        breakdown.eventToPerson = e2pRels.length;
      }

      const e2oRels = payload.relationships.filter((r) => r.type === 'event-to-org');
      if (e2oRels.length > 0) {
        await tx.insert(eventToOrganization).values(
          e2oRels.map((r) => {
            if (r.type !== 'event-to-org') throw new Error('unreachable');
            return {
              eventId: refToUuid.get(r.event)!,
              organizationId: refToUuid.get(r.organization)!,
              role: r.role,
              notes: r.notes,
            };
          }),
        );
        breakdown.eventToOrg = e2oRels.length;
      }

      const e2eRels = payload.relationships.filter((r) => r.type === 'event-to-event');
      if (e2eRels.length > 0) {
        await tx.insert(eventToEvent).values(
          e2eRels.map((r) => {
            if (r.type !== 'event-to-event') throw new Error('unreachable');
            return {
              sourceEventId: refToUuid.get(r.source)!,
              targetEventId: refToUuid.get(r.target)!,
              relationshipType: r.relationshipType,
              notes: r.notes,
            };
          }),
        );
        breakdown.eventToEvent = e2eRels.length;
      }

      return {
        people: payload.people.length,
        organizations: payload.organizations.length,
        events: payload.events.length,
        relationships: payload.relationships.length,
        breakdown,
      };
    });

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 },
      );
    }
    console.error('POST /api/simulation error:', error);
    return NextResponse.json(
      { error: 'Failed to import simulation data. Transaction rolled back.' },
      { status: 500 },
    );
  }
}

// ─── DELETE handler — wipe all data ─────────────────────

export async function DELETE() {
  try {
    const db = getDb();

    // 1. Truncate all tables in FK-safe order via CASCADE
    await db.execute(sql`
      TRUNCATE TABLE
        file,
        event_to_event,
        event_to_organization,
        event_to_person,
        org_to_org_relation,
        person_to_org_relation,
        person_to_person_relation,
        event,
        organization,
        person
      CASCADE
    `);

    // 2. Clear all objects from MinIO bucket
    const bucket = process.env.MINIO_BUCKET || 'teskilat-files';
    const minio = getMinioClient();
    const bucketExists = await minio.bucketExists(bucket);

    let filesRemoved = 0;
    if (bucketExists) {
      const objects: string[] = [];
      const stream = minio.listObjects(bucket, '', true);

      await new Promise<void>((resolve, reject) => {
        stream.on('data', (obj) => {
          if (obj.name) objects.push(obj.name);
        });
        stream.on('end', resolve);
        stream.on('error', reject);
      });

      if (objects.length > 0) {
        await minio.removeObjects(bucket, objects);
        filesRemoved = objects.length;
      }
    }

    return NextResponse.json({
      data: { message: 'All data wiped', filesRemoved },
    });
  } catch (error) {
    console.error('DELETE /api/simulation error:', error);
    return NextResponse.json(
      { error: 'Failed to wipe data' },
      { status: 500 },
    );
  }
}
