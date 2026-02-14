import Link from 'next/link';
import { getDb } from '@/lib/db';
import { person } from '@/lib/db/schema';
import { notDeleted, getPaginationParams, createPaginationMeta } from '@/lib/db/helpers';
import { count, desc } from 'drizzle-orm';
import styles from './page.module.scss';

interface PageProps {
  searchParams: Promise<{ page?: string; limit?: string }>;
}

export default async function PeoplePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const db = getDb();
  const { page, limit, offset } = getPaginationParams({
    page: Number(params.page) || undefined,
    limit: Number(params.limit) || undefined,
  });

  const whereClause = notDeleted(person.deletedAt);

  const [countResult, people] = await Promise.all([
    db.select({ total: count() }).from(person).where(whereClause),
    db
      .select()
      .from(person)
      .where(whereClause)
      .orderBy(desc(person.createdAt))
      .limit(limit)
      .offset(offset),
  ]);

  const total = countResult[0]?.total ?? 0;
  const meta = createPaginationMeta(page, limit, total);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>People</h1>
          <p className={styles.description}>
            {total} tracked individual{total !== 1 ? 's' : ''} and persons of interest
          </p>
        </div>
        <button className={styles.addBtn}>+ Add Person</button>
      </div>

      <div className={styles.toolbar}>
        <input
          type="text"
          className={styles.search}
          placeholder="Search by name, alias, ID..."
        />
        <div className={styles.filters}>
          <select className={styles.filterSelect}>
            <option value="">All Risk Levels</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Aliases</th>
              <th>Nationality</th>
              <th>Risk Level</th>
              <th>Tags</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {people.length === 0 ? (
              <tr className={styles.emptyRow}>
                <td colSpan={6}>
                  <div className={styles.emptyState}>
                    <span className={styles.emptyIcon}>&#9679;</span>
                    <span>No people records found. Add your first person to begin tracking.</span>
                  </div>
                </td>
              </tr>
            ) : (
              people.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link href={`/people/${p.id}`} className={styles.entityLink}>
                      {[p.firstName, p.lastName].filter(Boolean).join(' ') || 'Unknown'}
                    </Link>
                  </td>
                  <td>{p.aliases?.join(', ') || '—'}</td>
                  <td>{p.nationality || '—'}</td>
                  <td>
                    {p.riskLevel ? (
                      <span className={`${styles.riskBadge} ${styles[`risk${p.riskLevel}`]}`}>
                        {p.riskLevel}
                      </span>
                    ) : '—'}
                  </td>
                  <td>{p.tags?.join(', ') || '—'}</td>
                  <td>{new Date(p.createdAt).toLocaleDateString()}</td>
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
            <Link href={`/people?page=${page - 1}&limit=${limit}`} className={styles.pageBtn}>Prev</Link>
          ) : (
            <button className={styles.pageBtn} disabled>Prev</button>
          )}
          <span className={styles.pageIndicator}>Page {page} of {meta.totalPages || 1}</span>
          {page < meta.totalPages ? (
            <Link href={`/people?page=${page + 1}&limit=${limit}`} className={styles.pageBtn}>Next</Link>
          ) : (
            <button className={styles.pageBtn} disabled>Next</button>
          )}
        </div>
      </div>
    </div>
  );
}
