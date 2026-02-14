import Link from 'next/link';
import { getDb } from '@/lib/db';
import { organization } from '@/lib/db/schema';
import { notDeleted, getPaginationParams, createPaginationMeta } from '@/lib/db/helpers';
import { count, desc } from 'drizzle-orm';
import styles from './page.module.scss';

interface PageProps {
  searchParams: Promise<{ page?: string; limit?: string }>;
}

export default async function OrganizationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const db = getDb();
  const { page, limit, offset } = getPaginationParams({
    page: Number(params.page) || undefined,
    limit: Number(params.limit) || undefined,
  });

  const whereClause = notDeleted(organization.deletedAt);

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

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Organizations</h1>
          <p className={styles.description}>
            {total} tracked entit{total !== 1 ? 'ies' : 'y'} — companies, agencies, and groups
          </p>
        </div>
        <button className={styles.addBtn}>+ Add Organization</button>
      </div>

      <div className={styles.toolbar}>
        <input
          type="text"
          className={styles.search}
          placeholder="Search by name, country, type..."
        />
        <div className={styles.filters}>
          <select className={styles.filterSelect}>
            <option value="">All Risk Levels</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          <select className={styles.filterSelect}>
            <option value="">All Types</option>
            <option value="company">Company</option>
            <option value="government">Government</option>
            <option value="ngo">NGO</option>
            <option value="military">Military</option>
          </select>
        </div>
      </div>

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
            <Link href={`/organizations?page=${page - 1}&limit=${limit}`} className={styles.pageBtn}>Prev</Link>
          ) : (
            <button className={styles.pageBtn} disabled>Prev</button>
          )}
          <span className={styles.pageIndicator}>Page {page} of {meta.totalPages || 1}</span>
          {page < meta.totalPages ? (
            <Link href={`/organizations?page=${page + 1}&limit=${limit}`} className={styles.pageBtn}>Next</Link>
          ) : (
            <button className={styles.pageBtn} disabled>Next</button>
          )}
        </div>
      </div>
    </div>
  );
}
