import Link from 'next/link';
import { getDb } from '@/lib/db';
import {
  person,
  organization,
  event,
  personToPersonRelation,
  personToOrgRelation,
  orgToOrgRelation,
} from '@/lib/db/schema';
import { notDeleted } from '@/lib/db/helpers';
import { count, desc } from 'drizzle-orm';
import styles from './page.module.scss';

export default async function DashboardPage() {
  const db = getDb();

  const [peopleCount, orgCount, eventCount, p2pCount, p2oCount, o2oCount, recentPeople, recentOrgs, recentEvents] =
    await Promise.all([
      db.select({ total: count() }).from(person).where(notDeleted(person.deletedAt)),
      db.select({ total: count() }).from(organization).where(notDeleted(organization.deletedAt)),
      db.select({ total: count() }).from(event).where(notDeleted(event.deletedAt)),
      db.select({ total: count() }).from(personToPersonRelation).where(notDeleted(personToPersonRelation.deletedAt)),
      db.select({ total: count() }).from(personToOrgRelation).where(notDeleted(personToOrgRelation.deletedAt)),
      db.select({ total: count() }).from(orgToOrgRelation).where(notDeleted(orgToOrgRelation.deletedAt)),
      db
        .select({ id: person.id, firstName: person.firstName, lastName: person.lastName, riskLevel: person.riskLevel, createdAt: person.createdAt })
        .from(person)
        .where(notDeleted(person.deletedAt))
        .orderBy(desc(person.createdAt))
        .limit(5),
      db
        .select({ id: organization.id, name: organization.name, type: organization.type, country: organization.country, createdAt: organization.createdAt })
        .from(organization)
        .where(notDeleted(organization.deletedAt))
        .orderBy(desc(organization.createdAt))
        .limit(5),
      db
        .select({ id: event.id, title: event.title, type: event.type, date: event.date, createdAt: event.createdAt })
        .from(event)
        .where(notDeleted(event.deletedAt))
        .orderBy(desc(event.createdAt))
        .limit(5),
    ]);

  const totalPeople = peopleCount[0]?.total ?? 0;
  const totalOrgs = orgCount[0]?.total ?? 0;
  const totalEvents = eventCount[0]?.total ?? 0;
  const totalRelationships = (p2pCount[0]?.total ?? 0) + (p2oCount[0]?.total ?? 0) + (o2oCount[0]?.total ?? 0);

  return (
    <div className={styles.dashboard}>
      <h1 className={styles.title}>Intelligence Dashboard</h1>
      <p className={styles.subtitle}>Overview of tracked entities and relationships</p>

      <div className={styles.statsGrid}>
        <Link href="/people" className={styles.statCard}>
          <span className={styles.statCount}>{totalPeople}</span>
          <span className={styles.statLabel}>People</span>
        </Link>
        <Link href="/organizations" className={styles.statCard}>
          <span className={styles.statCount}>{totalOrgs}</span>
          <span className={styles.statLabel}>Organizations</span>
        </Link>
        <Link href="/events" className={styles.statCard}>
          <span className={styles.statCount}>{totalEvents}</span>
          <span className={styles.statLabel}>Events</span>
        </Link>
        <Link href="/relationships" className={styles.statCard}>
          <span className={styles.statCount}>{totalRelationships}</span>
          <span className={styles.statLabel}>Relationships</span>
        </Link>
      </div>

      <div className={styles.recentGrid}>
        {/* Recent People */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Recent People</h2>
          {recentPeople.length === 0 ? (
            <p className={styles.emptyHint}>No people tracked yet</p>
          ) : (
            <div className={styles.recentList}>
              {recentPeople.map((p) => (
                <Link key={p.id} href={`/people/${p.id}`} className={styles.recentItem}>
                  <span className={styles.recentName}>
                    {[p.firstName, p.lastName].filter(Boolean).join(' ') || 'Unknown'}
                  </span>
                  {p.riskLevel && (
                    <span className={`${styles.riskBadge} ${styles[`risk${p.riskLevel}`]}`}>
                      {p.riskLevel}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Organizations */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Recent Organizations</h2>
          {recentOrgs.length === 0 ? (
            <p className={styles.emptyHint}>No organizations tracked yet</p>
          ) : (
            <div className={styles.recentList}>
              {recentOrgs.map((o) => (
                <Link key={o.id} href={`/organizations/${o.id}`} className={styles.recentItem}>
                  <span className={styles.recentName}>{o.name}</span>
                  {o.type && <span className={styles.recentMeta}>{o.type}</span>}
                  {o.country && <span className={styles.recentMeta}>{o.country}</span>}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Events */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Recent Events</h2>
          {recentEvents.length === 0 ? (
            <p className={styles.emptyHint}>No events recorded yet</p>
          ) : (
            <div className={styles.recentList}>
              {recentEvents.map((e) => (
                <Link key={e.id} href={`/events/${e.id}`} className={styles.recentItem}>
                  <span className={styles.recentName}>{e.title}</span>
                  {e.type && <span className={styles.recentMeta}>{e.type}</span>}
                  {e.date && (
                    <span className={styles.recentDate}>
                      {new Date(e.date).toLocaleDateString()}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Quick Actions</h2>
        <div className={styles.actions}>
          <Link href="/people" className={styles.actionBtn}>+ New Person</Link>
          <Link href="/organizations" className={styles.actionBtn}>+ New Organization</Link>
          <Link href="/events" className={styles.actionBtn}>+ New Event</Link>
          <Link href="/graph" className={styles.actionBtn}>View Network Graph</Link>
        </div>
      </div>
    </div>
  );
}
