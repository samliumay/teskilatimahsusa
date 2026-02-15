import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { file } from '@/lib/db/schema';
import { notDeleted } from '@/lib/db/helpers';
import { uploadFile, getFileUrl } from '@/lib/minio';
import { randomUUID } from 'crypto';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const uploadedFile = formData.get('file') as File | null;

    if (!uploadedFile) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read optional association fields
    const personId = formData.get('personId') as string | null;
    const organizationId = formData.get('organizationId') as string | null;
    const eventId = formData.get('eventId') as string | null;
    const description = formData.get('description') as string | null;

    const buffer = Buffer.from(await uploadedFile.arrayBuffer());
    const objectName = `${randomUUID()}-${uploadedFile.name}`;

    await uploadFile(objectName, buffer, buffer.length, uploadedFile.type);

    const db = getDb();
    const [newFile] = await db
      .insert(file)
      .values({
        fileName: uploadedFile.name,
        fileType: uploadedFile.type,
        fileUrl: objectName,
        fileSize: buffer.length,
        description,
        personId,
        organizationId,
        eventId,
      })
      .returning();

    return NextResponse.json({ data: newFile }, { status: 201 });
  } catch (error) {
    console.error('POST /api/files error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fileId = searchParams.get('id');
    const personId = searchParams.get('personId');
    const organizationId = searchParams.get('organizationId');
    const eventId = searchParams.get('eventId');

    const db = getDb();

    // Single file by ID
    if (fileId) {
      const [found] = await db
        .select()
        .from(file)
        .where(and(eq(file.id, fileId), notDeleted(file.deletedAt)));

      if (!found) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }

      const url = await getFileUrl(found.fileUrl);
      return NextResponse.json({ data: { ...found, downloadUrl: url } });
    }

    // List files by entity
    if (personId) {
      const files = await db.select().from(file)
        .where(and(eq(file.personId, personId), notDeleted(file.deletedAt)));
      return NextResponse.json({ data: files });
    }

    if (organizationId) {
      const files = await db.select().from(file)
        .where(and(eq(file.organizationId, organizationId), notDeleted(file.deletedAt)));
      return NextResponse.json({ data: files });
    }

    if (eventId) {
      const files = await db.select().from(file)
        .where(and(eq(file.eventId, eventId), notDeleted(file.deletedAt)));
      return NextResponse.json({ data: files });
    }

    return NextResponse.json({ error: 'Provide id, personId, organizationId, or eventId' }, { status: 400 });
  } catch (error) {
    console.error('GET /api/files error:', error);
    return NextResponse.json({ error: 'Failed to get file' }, { status: 500 });
  }
}
