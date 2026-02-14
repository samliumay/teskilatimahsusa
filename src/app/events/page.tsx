import Link from 'next/link';
import { getDb } from '@/lib/db';
import { event } from '@/lib/db/schema';
import { notDeleted, getPaginationParams, createPaginationMeta } from '@/lib/db/helpers';
import { count, desc } from 'drizzle-orm';
import styles from './page.module.scss';

interface PageProps {
  searchParams: Promise<{ page?: string; limit?: string }>;
}

export default async function EventsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const db = getDb();
  const { page, limit, offset } = getPaginationParams({
    page: Number(params.page) || undefined,
    limit: Number(params.limit) || undefined,
  });

  const whereClause = notDeleted(event.deletedAt);

  const [countResult, events] = await Promise.all([
    db.select({ total: count() }).from(event).where(whereClause),
    db
      .select()
      .from(event)
      .where(whereClause)
      .orderBy(desc(event.createdAt))
      .limit(limit)
      .offset(offset),
  ]);

  const total = countResult[0]?.total ?? 0;
  const meta = createPaginationMeta(page, limit, total);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Events</h1>
          <p className={styles.description}>
            {total} recorded event{total !== 1 ? 's' : ''} — meetings, transactions, incidents
          </p>
        </div>
        <button className={styles.addBtn}>+ Add Event</button>
      </div>

      <div className={styles.toolbar}>
        <input
          type="text"
          className={styles.search}
          placeholder="Search by title, location, type..."
        />
        <div className={styles.filters}>
          <select className={styles.filterSelect}>
            <option value="">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="SUSPECTED">Suspected</option>
            <option value="UNVERIFIED">Unverified</option>
            <option value="DENIED">Denied</option>
          </select>
          <select className={styles.filterSelect}>
            <option value="">All Types</option>
            <option value="meeting">Meeting</option>
            <option value="transaction">Transaction</option>
            <option value="communication">Communication</option>
            <option value="incident">Incident</option>
            <option value="travel">Travel</option>
          </select>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Date</th>
              <th>Location</th>
              <th>Country</th>
              <th>Status</th>
              <th>Tags</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr className={styles.emptyRow}>
                <td colSpan={7}>
                  <div className={styles.emptyState}>
                    <span className={styles.emptyIcon}>&#9679;</span>
                    <span>No events recorded. Add your first event to begin mapping intelligence.</span>
                  </div>
                </td>
              </tr>
            ) : (
              events.map((e) => (
                <tr key={e.id}>
                  <td>
                    <Link href={`/events/${e.id}`} className={styles.entityLink}>
                      {e.title}
                    </Link>
                  </td>
                  <td>{e.type || '—'}</td>
                  <td>{e.date ? new Date(e.date).toLocaleDateString() : '—'}</td>
                  <td>{e.location || '—'}</td>
                  <td>{e.country || '—'}</td>
                  <td>
                    {e.estimatedStatus ? (
                      <span className={`${styles.statusBadge} ${styles[`status${e.estimatedStatus}`]}`}>
                        {e.estimatedStatus}
                      </span>
                    ) : '—'}
                  </td>
                  <td>{e.tags?.join(', ') || '—'}</td>
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
            <Link href={`/events?page=${page - 1}&limit=${limit}`} className={styles.pageBtn}>Prev</Link>
          ) : (
            <button className={styles.pageBtn} disabled>Prev</button>
          )}
          <span className={styles.pageIndicator}>Page {page} of {meta.totalPages || 1}</span>
          {page < meta.totalPages ? (
            <Link href={`/events?page=${page + 1}&limit=${limit}`} className={styles.pageBtn}>Next</Link>
          ) : (
            <button className={styles.pageBtn} disabled>Next</button>
          )}
        </div>
      </div>
    </div>
  );
}
