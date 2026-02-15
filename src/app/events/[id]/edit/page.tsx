import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDb } from '@/lib/db';
import { event } from '@/lib/db/schema';
import { notDeleted } from '@/lib/db/helpers';
import { eq, and } from 'drizzle-orm';
import { EventForm } from '@/components/events/EventForm';
import styles from '../page.module.scss';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEventPage({ params }: PageProps) {
  const { id } = await params;
  const db = getDb();

  const results = await db
    .select()
    .from(event)
    .where(and(eq(event.id, id), notDeleted(event.deletedAt)));
  const evt = results[0];
  if (!evt) notFound();

  const initialData = {
    ...evt,
    date: evt.date?.toISOString() ?? null,
    endDate: evt.endDate?.toISOString() ?? null,
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <span className={styles.breadcrumb}>
            <Link href="/events" className={styles.breadcrumbLink}>Events</Link>
            <span className={styles.breadcrumbSep}>/</span>
            <Link href={`/events/${id}`} className={styles.breadcrumbLink}>{evt.title}</Link>
            <span className={styles.breadcrumbSep}>/</span>
            <span>Edit</span>
          </span>
          <h1 className={styles.title}>Edit {evt.title}</h1>
        </div>
      </div>
      <div className={styles.card}>
        <EventForm mode="edit" initialData={initialData} />
      </div>
    </div>
  );
}
