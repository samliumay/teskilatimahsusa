import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { person } from '@/lib/db/schema';
import { notDeleted } from '@/lib/db/helpers';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

const updatePersonSchema = z.object({
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  aliases: z.array(z.string()).optional(),
  dateOfBirth: z.string().datetime().nullable().optional(),
  placeOfBirth: z.string().nullable().optional(),
  nationality: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  photoUrl: z.string().url().nullable().optional(),
  email: z.array(z.string().email()).optional(),
  phone: z.array(z.string()).optional(),
  address: z.string().nullable().optional(),
  passportNo: z.string().nullable().optional(),
  nationalId: z.string().nullable().optional(),
  taxId: z.string().nullable().optional(),
  driversLicense: z.string().nullable().optional(),
  socialMedia: z.record(z.string(), z.string()).nullable().optional(),
  notes: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).nullable().optional(),
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
      .from(person)
      .where(and(eq(person.id, id), notDeleted(person.deletedAt)));

    if (!found) {
      return NextResponse.json({ error: 'Person not found' }, { status: 404 });
    }

    return NextResponse.json({ data: found });
  } catch (error) {
    console.error('GET /api/people/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch person' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = updatePersonSchema.parse(body);
    const { dateOfBirth, ...rest } = validated;

    const db = getDb();
    const [updated] = await db
      .update(person)
      .set({
        ...rest,
        ...(dateOfBirth !== undefined
          ? { dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null }
          : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(person.id, id), notDeleted(person.deletedAt)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Person not found' }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('PATCH /api/people/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update person' }, { status: 500 });
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
      .update(person)
      .set({ deletedAt: new Date() })
      .where(and(eq(person.id, id), notDeleted(person.deletedAt)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Person not found' }, { status: 404 });
    }

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error('DELETE /api/people/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete person' }, { status: 500 });
  }
}
