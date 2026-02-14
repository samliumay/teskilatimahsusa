import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { event } from '@/lib/db/schema';
import { notDeleted, getPaginationParams, createPaginationMeta } from '@/lib/db/helpers';
import { count, desc } from 'drizzle-orm';
import { z } from 'zod';

const createEventSchema = z.object({
  title: z.string().min(1),
  type: z.string().optional(),
  description: z.string().optional(),
  date: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  location: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  country: z.string().optional(),
  estimatedStatus: z.enum(['CONFIRMED', 'SUSPECTED', 'UNVERIFIED', 'DENIED']).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
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

    const whereClause = includeDeleted ? undefined : notDeleted(event.deletedAt);

    const countResult = await db
      .select({ total: count() })
      .from(event)
      .where(whereClause);
    const total = countResult[0]?.total ?? 0;

    const events = await db
      .select()
      .from(event)
      .where(whereClause)
      .orderBy(desc(event.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      data: events,
      meta: createPaginationMeta(page, limit, total),
    });
  } catch (error) {
    console.error('GET /api/events error:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createEventSchema.parse(body);

    const db = getDb();
    const [newEvent] = await db
      .insert(event)
      .values({
        ...validated,
        date: validated.date ? new Date(validated.date) : undefined,
        endDate: validated.endDate ? new Date(validated.endDate) : undefined,
      })
      .returning();

    return NextResponse.json({ data: newEvent }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('POST /api/events error:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
