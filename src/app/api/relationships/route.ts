import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import {
  personToPersonRelation,
  personToOrgRelation,
  orgToOrgRelation,
} from '@/lib/db/schema';
import { notDeleted } from '@/lib/db/helpers';

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
