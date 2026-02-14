import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { person } from '@/lib/db/schema';
import { notDeleted, getPaginationParams, createPaginationMeta } from '@/lib/db/helpers';
import { count, desc } from 'drizzle-orm';
import { z } from 'zod';

const createPersonSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  aliases: z.array(z.string()).optional(),
  dateOfBirth: z.string().datetime().optional(),
  placeOfBirth: z.string().optional(),
  nationality: z.string().optional(),
  gender: z.string().optional(),
  photoUrl: z.string().url().optional(),
  email: z.array(z.string().email()).optional(),
  phone: z.array(z.string()).optional(),
  address: z.string().optional(),
  passportNo: z.string().optional(),
  nationalId: z.string().optional(),
  taxId: z.string().optional(),
  driversLicense: z.string().optional(),
  socialMedia: z.record(z.string(), z.string()).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const searchParams = request.nextUrl.searchParams;
    const includeDeleted = searchParams.get('includeDeleted') === 'true';

    const { page, limit, offset } = getPaginationParams({
      page: Number(searchParams.get('page')) || undefined,
      limit: Number(searchParams.get('limit')) || undefined,
    });

    const whereClause = includeDeleted ? undefined : notDeleted(person.deletedAt);

    const countResult = await db
      .select({ total: count() })
      .from(person)
      .where(whereClause);
    const total = countResult[0]?.total ?? 0;

    const people = await db
      .select()
      .from(person)
      .where(whereClause)
      .orderBy(desc(person.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      data: people,
      meta: createPaginationMeta(page, limit, total),
    });
  } catch (error) {
    console.error('GET /api/people error:', error);
    return NextResponse.json({ error: 'Failed to fetch people' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createPersonSchema.parse(body);

    const db = getDb();
    const [newPerson] = await db
      .insert(person)
      .values({
        ...validated,
        dateOfBirth: validated.dateOfBirth ? new Date(validated.dateOfBirth) : undefined,
      })
      .returning();

    return NextResponse.json({ data: newPerson }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('POST /api/people error:', error);
    return NextResponse.json({ error: 'Failed to create person' }, { status: 500 });
  }
}
