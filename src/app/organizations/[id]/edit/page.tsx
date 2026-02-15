import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDb } from '@/lib/db';
import { organization } from '@/lib/db/schema';
import { notDeleted } from '@/lib/db/helpers';
import { eq, and } from 'drizzle-orm';
import { OrgForm } from '@/components/organizations/OrgForm';
import styles from '../page.module.scss';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditOrganizationPage({ params }: PageProps) {
  const { id } = await params;
  const db = getDb();

  const results = await db
    .select()
    .from(organization)
    .where(and(eq(organization.id, id), notDeleted(organization.deletedAt)));
  const org = results[0];
  if (!org) notFound();

  const initialData = {
    ...org,
    foundedAt: org.foundedAt?.toISOString() ?? null,
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <span className={styles.breadcrumb}>
            <Link href="/organizations" className={styles.breadcrumbLink}>Organizations</Link>
            <span className={styles.breadcrumbSep}>/</span>
            <Link href={`/organizations/${id}`} className={styles.breadcrumbLink}>{org.name}</Link>
            <span className={styles.breadcrumbSep}>/</span>
            <span>Edit</span>
          </span>
          <h1 className={styles.title}>Edit {org.name}</h1>
        </div>
      </div>
      <div className={styles.card}>
        <OrgForm mode="edit" initialData={initialData} />
      </div>
    </div>
  );
}
