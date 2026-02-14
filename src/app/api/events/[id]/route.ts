import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { event } from '@/lib/db/schema';
import { notDeleted } from '@/lib/db/helpers';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

const updateEventSchema = z.object({
  title: z.string().min(1).optional(),
  type: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  date: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
  location: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  country: z.string().nullable().optional(),
  estimatedStatus: z.enum(['CONFIRMED', 'SUSPECTED', 'UNVERIFIED', 'DENIED']).nullable().optional(),
  notes: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const [found] = await db
      .select()
      .from(event)
      .where(and(eq(event.id, id), notDeleted(event.deletedAt)));

    if (!found) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ data: found });
  } catch (error) {
    console.error('GET /api/events/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = updateEventSchema.parse(body);

    const db = getDb();
    const { date, endDate, ...rest } = validated;
    const [updated] = await db
      .update(event)
      .set({
        ...rest,
        ...(date !== undefined ? { date: date ? new Date(date) : null } : {}),
        ...(endDate !== undefined ? { endDate: endDate ? new Date(endDate) : null } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(event.id, id), notDeleted(event.deletedAt)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('PATCH /api/events/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const [deleted] = await db
      .update(event)
      .set({ deletedAt: new Date() })
      .where(and(eq(event.id, id), notDeleted(event.deletedAt)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error('DELETE /api/events/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
