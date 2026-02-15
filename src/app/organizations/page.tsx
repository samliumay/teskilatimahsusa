import Link from 'next/link';
import { getDb } from '@/lib/db';
import { organization } from '@/lib/db/schema';
import { notDeleted, getPaginationParams, createPaginationMeta } from '@/lib/db/helpers';
import { count, desc, and, or, ilike, eq, type SQL } from 'drizzle-orm';
import { SearchToolbar } from '@/components/ui/SearchToolbar';
import styles from './page.module.scss';

interface PageProps {
  searchParams: Promise<{ page?: string; limit?: string; search?: string; risk?: string; type?: string }>;
}

const riskFilters = [
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];

const typeFilters = [
  { value: 'company', label: 'Company' },
  { value: 'government', label: 'Government' },
  { value: 'ngo', label: 'NGO' },
  { value: 'military', label: 'Military' },
];

export default async function OrganizationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const db = getDb();
  const { page, limit, offset } = getPaginationParams({
    page: Number(params.page) || undefined,
    limit: Number(params.limit) || undefined,
  });

  const conditions: SQL[] = [notDeleted(organization.deletedAt)];

  if (params.search) {
    const term = `%${params.search}%`;
    conditions.push(
      or(
        ilike(organization.name, term),
        ilike(organization.country, term),
        ilike(organization.type, term),
        ilike(organization.industry, term),
      )!
    );
  }

  if (params.risk) {
    conditions.push(eq(organization.riskLevel, params.risk as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'));
  }

  if (params.type) {
    conditions.push(ilike(organization.type, params.type));
  }

  const whereClause = and(...conditions);

  const [countResult, orgs] = await Promise.all([
    db.select({ total: count() }).from(organization).where(whereClause),
    db
      .select()
      .from(organization)
      .where(whereClause)
      .orderBy(desc(organization.createdAt))
      .limit(limit)
      .offset(offset),
  ]);

  const total = countResult[0]?.total ?? 0;
  const meta = createPaginationMeta(page, limit, total);

  const filterStr = [
    params.search ? `&search=${params.search}` : '',
    params.risk ? `&risk=${params.risk}` : '',
    params.type ? `&type=${params.type}` : '',
  ].join('');

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Organizations</h1>
          <p className={styles.description}>
            {total} tracked entit{total !== 1 ? 'ies' : 'y'} — companies, agencies, and groups
          </p>
        </div>
        <Link href="/organizations/new" className={styles.addBtn}>+ Add Organization</Link>
      </div>

      <SearchToolbar
        basePath="/organizations"
        searchPlaceholder="Search by name, country, type..."
        filters={[
          { key: 'risk', placeholder: 'All Risk Levels', options: riskFilters },
          { key: 'type', placeholder: 'All Types', options: typeFilters },
        ]}
      />

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Country</th>
              <th>Industry</th>
              <th>Risk Level</th>
              <th>Tags</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {orgs.length === 0 ? (
              <tr className={styles.emptyRow}>
                <td colSpan={7}>
                  <div className={styles.emptyState}>
                    <span className={styles.emptyIcon}>&#9679;</span>
                    <span>No organizations found. Add your first organization to begin tracking.</span>
                  </div>
                </td>
              </tr>
            ) : (
              orgs.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link href={`/organizations/${o.id}`} className={styles.entityLink}>
                      {o.name}
                    </Link>
                  </td>
                  <td>{o.type || '—'}</td>
                  <td>{o.country || '—'}</td>
                  <td>{o.industry || '—'}</td>
                  <td>
                    {o.riskLevel ? (
                      <span className={`${styles.riskBadge} ${styles[`risk${o.riskLevel}`]}`}>
                        {o.riskLevel}
                      </span>
                    ) : '—'}
                  </td>
                  <td>{o.tags?.join(', ') || '—'}</td>
                  <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <span className={styles.paginationInfo}>{total} record{total !== 1 ? 's' : ''}</span>
        <div className={styles.paginationControls}>
          {page > 1 ? (
            <Link href={`/organizations?page=${page - 1}&limit=${limit}${filterStr}`} className={styles.pageBtn}>Prev</Link>
          ) : (
            <button className={styles.pageBtn} disabled>Prev</button>
          )}
          <span className={styles.pageIndicator}>Page {page} of {meta.totalPages || 1}</span>
          {page < meta.totalPages ? (
            <Link href={`/organizations?page=${page + 1}&limit=${limit}${filterStr}`} className={styles.pageBtn}>Next</Link>
          ) : (
            <button className={styles.pageBtn} disabled>Next</button>
          )}
        </div>
      </div>
    </div>
  );
}
