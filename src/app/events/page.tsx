import Link from 'next/link';
import { getDb } from '@/lib/db';
import { event } from '@/lib/db/schema';
import { notDeleted, getPaginationParams, createPaginationMeta } from '@/lib/db/helpers';
import { count, desc, and, or, ilike, eq, type SQL } from 'drizzle-orm';
import { SearchToolbar } from '@/components/ui/SearchToolbar';
import styles from './page.module.scss';

interface PageProps {
  searchParams: Promise<{ page?: string; limit?: string; search?: string; status?: string; type?: string }>;
}

const statusFilters = [
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'SUSPECTED', label: 'Suspected' },
  { value: 'UNVERIFIED', label: 'Unverified' },
  { value: 'DENIED', label: 'Denied' },
];

const typeFilters = [
  { value: 'meeting', label: 'Meeting' },
  { value: 'transaction', label: 'Transaction' },
  { value: 'communication', label: 'Communication' },
  { value: 'incident', label: 'Incident' },
  { value: 'travel', label: 'Travel' },
];

export default async function EventsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const db = getDb();
  const { page, limit, offset } = getPaginationParams({
    page: Number(params.page) || undefined,
    limit: Number(params.limit) || undefined,
  });

  const conditions: SQL[] = [notDeleted(event.deletedAt)];

  if (params.search) {
    const term = `%${params.search}%`;
    conditions.push(
      or(
        ilike(event.title, term),
        ilike(event.location, term),
        ilike(event.country, term),
        ilike(event.type, term),
      )!
    );
  }

  if (params.status) {
    conditions.push(eq(event.estimatedStatus, params.status as 'CONFIRMED' | 'SUSPECTED' | 'UNVERIFIED' | 'DENIED'));
  }

  if (params.type) {
    conditions.push(ilike(event.type, params.type));
  }

  const whereClause = and(...conditions);

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

  const filterStr = [
    params.search ? `&search=${params.search}` : '',
    params.status ? `&status=${params.status}` : '',
    params.type ? `&type=${params.type}` : '',
  ].join('');

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Events</h1>
          <p className={styles.description}>
            {total} recorded event{total !== 1 ? 's' : ''} — meetings, transactions, incidents
          </p>
        </div>
        <Link href="/events/new" className={styles.addBtn}>+ Add Event</Link>
      </div>

      <SearchToolbar
        basePath="/events"
        searchPlaceholder="Search by title, location, type..."
        filters={[
          { key: 'status', placeholder: 'All Statuses', options: statusFilters },
          { key: 'type', placeholder: 'All Types', options: typeFilters },
        ]}
      />

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
            <Link href={`/events?page=${page - 1}&limit=${limit}${filterStr}`} className={styles.pageBtn}>Prev</Link>
          ) : (
            <button className={styles.pageBtn} disabled>Prev</button>
          )}
          <span className={styles.pageIndicator}>Page {page} of {meta.totalPages || 1}</span>
          {page < meta.totalPages ? (
            <Link href={`/events?page=${page + 1}&limit=${limit}${filterStr}`} className={styles.pageBtn}>Next</Link>
          ) : (
            <button className={styles.pageBtn} disabled>Next</button>
          )}
        </div>
      </div>
    </div>
  );
}
