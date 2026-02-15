import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { organization } from '@/lib/db/schema';
import { notDeleted, getPaginationParams, createPaginationMeta } from '@/lib/db/helpers';
import { count, desc } from 'drizzle-orm';
import { z } from 'zod';

const createOrgSchema = z.object({
  name: z.string().min(1),
  type: z.string().optional(),
  industry: z.string().optional(),
  country: z.string().optional(),
  address: z.string().optional(),
  website: z.string().optional(),
  phone: z.array(z.string()).optional(),
  email: z.array(z.string().email()).optional(),
  foundedAt: z.string().datetime().optional(),
  description: z.string().optional(),
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

    const whereClause = includeDeleted ? undefined : notDeleted(organization.deletedAt);

    const countResult = await db
      .select({ total: count() })
      .from(organization)
      .where(whereClause);
    const total = countResult[0]?.total ?? 0;

    const orgs = await db
      .select()
      .from(organization)
      .where(whereClause)
      .orderBy(desc(organization.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      data: orgs,
      meta: createPaginationMeta(page, limit, total),
    });
  } catch (error) {
    console.error('GET /api/organizations error:', error);
    return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createOrgSchema.parse(body);

    const db = getDb();
    const [newOrg] = await db
      .insert(organization)
      .values({
        ...validated,
        foundedAt: validated.foundedAt ? new Date(validated.foundedAt) : undefined,
      })
      .returning();

    return NextResponse.json({ data: newOrg }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('POST /api/organizations error:', error);
    return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 });
  }
}
