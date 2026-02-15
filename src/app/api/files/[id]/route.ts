import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { file } from '@/lib/db/schema';
import { notDeleted } from '@/lib/db/helpers';
import { getFileUrl } from '@/lib/minio';
import { eq, and } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const db = getDb();

    const [found] = await db
      .select()
      .from(file)
      .where(and(eq(file.id, id), notDeleted(file.deletedAt)));

    if (!found) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const downloadUrl = await getFileUrl(found.fileUrl);

    return NextResponse.json({ data: { ...found, downloadUrl } });
  } catch (error) {
    console.error('GET /api/files/[id] error:', error);
    return NextResponse.json({ error: 'Failed to get file' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const db = getDb();

    const [found] = await db
      .select()
      .from(file)
      .where(and(eq(file.id, id), notDeleted(file.deletedAt)));

    if (!found) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const [deleted] = await db
      .update(file)
      .set({ deletedAt: new Date() })
      .where(eq(file.id, id))
      .returning();

    return NextResponse.json({ data: deleted });
  } catch (error) {
    console.error('DELETE /api/files/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}
