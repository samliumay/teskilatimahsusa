import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { organization } from '@/lib/db/schema';
import { notDeleted } from '@/lib/db/helpers';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

const updateOrgSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  website: z.string().url().nullable().optional(),
  phone: z.array(z.string()).optional(),
  email: z.array(z.string().email()).optional(),
  foundedAt: z.string().datetime().nullable().optional(),
  description: z.string().nullable().optional(),
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
      .from(organization)
      .where(and(eq(organization.id, id), notDeleted(organization.deletedAt)));

    if (!found) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({ data: found });
  } catch (error) {
    console.error('GET /api/organizations/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch organization' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = updateOrgSchema.parse(body);
    const { foundedAt, ...rest } = validated;

    const db = getDb();
    const [updated] = await db
      .update(organization)
      .set({
        ...rest,
        ...(foundedAt !== undefined ? { foundedAt: foundedAt ? new Date(foundedAt) : null } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(organization.id, id), notDeleted(organization.deletedAt)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('PATCH /api/organizations/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 });
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
      .update(organization)
      .set({ deletedAt: new Date() })
      .where(and(eq(organization.id, id), notDeleted(organization.deletedAt)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error('DELETE /api/organizations/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete organization' }, { status: 500 });
  }
}
