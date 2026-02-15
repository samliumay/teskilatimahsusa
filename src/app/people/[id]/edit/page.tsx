import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDb } from '@/lib/db';
import { person } from '@/lib/db/schema';
import { notDeleted } from '@/lib/db/helpers';
import { eq, and } from 'drizzle-orm';
import { PersonForm } from '@/components/people/PersonForm';
import styles from '../page.module.scss';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPersonPage({ params }: PageProps) {
  const { id } = await params;
  const db = getDb();

  const results = await db
    .select()
    .from(person)
    .where(and(eq(person.id, id), notDeleted(person.deletedAt)));
  const p = results[0];
  if (!p) notFound();

  const initialData = {
    ...p,
    dateOfBirth: p.dateOfBirth?.toISOString() ?? null,
  };

  const fullName = [p.firstName, p.lastName].filter(Boolean).join(' ') || 'Unknown';

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <span className={styles.breadcrumb}>
            <Link href="/people" className={styles.breadcrumbLink}>People</Link>
            <span className={styles.breadcrumbSep}>/</span>
            <Link href={`/people/${id}`} className={styles.breadcrumbLink}>{fullName}</Link>
            <span className={styles.breadcrumbSep}>/</span>
            <span>Edit</span>
          </span>
          <h1 className={styles.title}>Edit {fullName}</h1>
        </div>
      </div>
      <div className={styles.card}>
        <PersonForm mode="edit" initialData={initialData} />
      </div>
    </div>
  );
}
