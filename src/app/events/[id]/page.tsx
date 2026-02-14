import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDb } from '@/lib/db';
import {
  person,
  organization,
  event,
  eventToPerson,
  eventToOrganization,
  eventToEvent,
} from '@/lib/db/schema';
import { notDeleted } from '@/lib/db/helpers';
import { eq, and } from 'drizzle-orm';
import styles from './page.module.scss';

function personName(first: string | null, last: string | null) {
  return [first, last].filter(Boolean).join(' ') || 'Unknown';
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const db = getDb();

  const results = await db
    .select()
    .from(event)
    .where(and(eq(event.id, id), notDeleted(event.deletedAt)));
  const evt = results[0];
  if (!evt) notFound();

  const [personLinks, orgLinks, e2eAsSource, e2eAsTarget] = await Promise.all([
    db
      .select({
        id: eventToPerson.id,
        personId: eventToPerson.personId,
        role: eventToPerson.role,
        firstName: person.firstName,
        lastName: person.lastName,
      })
      .from(eventToPerson)
      .innerJoin(person, eq(eventToPerson.personId, person.id))
      .where(and(eq(eventToPerson.eventId, id), notDeleted(eventToPerson.deletedAt))),
    db
      .select({
        id: eventToOrganization.id,
        organizationId: eventToOrganization.organizationId,
        role: eventToOrganization.role,
        orgName: organization.name,
      })
      .from(eventToOrganization)
      .innerJoin(organization, eq(eventToOrganization.organizationId, organization.id))
      .where(and(eq(eventToOrganization.eventId, id), notDeleted(eventToOrganization.deletedAt))),
    db
      .select({
        id: eventToEvent.id,
        targetEventId: eventToEvent.targetEventId,
        relationshipType: eventToEvent.relationshipType,
        targetTitle: event.title,
      })
      .from(eventToEvent)
      .innerJoin(event, eq(eventToEvent.targetEventId, event.id))
      .where(and(eq(eventToEvent.sourceEventId, id), notDeleted(eventToEvent.deletedAt))),
    db
      .select({
        id: eventToEvent.id,
        sourceEventId: eventToEvent.sourceEventId,
        relationshipType: eventToEvent.relationshipType,
        sourceTitle: event.title,
      })
      .from(eventToEvent)
      .innerJoin(event, eq(eventToEvent.sourceEventId, event.id))
      .where(and(eq(eventToEvent.targetEventId, id), notDeleted(eventToEvent.deletedAt))),
  ]);

  const hasCoords = evt.latitude != null && evt.longitude != null;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <span className={styles.breadcrumb}>
            <Link href="/events" className={styles.breadcrumbLink}>Events</Link>
            <span className={styles.breadcrumbSep}>/</span>
            <span>{evt.title}</span>
          </span>
          <h1 className={styles.title}>
            {evt.title}
            {evt.estimatedStatus && (
              <span className={`${styles.statusBadge} ${styles[`status${evt.estimatedStatus}`]}`}>
                {evt.estimatedStatus}
              </span>
            )}
          </h1>
          <span className={styles.entityId}>{id}</span>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.editBtn}>Edit</button>
          <button className={styles.deleteBtn}>Archive</button>
        </div>
      </div>

      <div className={styles.grid}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Event Information</h2>
          <div className={styles.card}>
            <div className={styles.fieldGrid}>
              <Field label="Title" value={evt.title} />
              <Field label="Type" value={evt.type} />
              <Field label="Date" value={evt.date ? new Date(evt.date).toLocaleString() : null} mono />
              <Field label="End Date" value={evt.endDate ? new Date(evt.endDate).toLocaleString() : null} mono />
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Tags</span>
                {evt.tags && evt.tags.length > 0 ? (
                  <div className={styles.tagList}>
                    {evt.tags.map((t) => <span key={t} className={styles.tag}>{t}</span>)}
                  </div>
                ) : (
                  <span className={styles.fieldValue}>--</span>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Location</h2>
          <div className={styles.card}>
            <div className={styles.fieldGrid}>
              <Field label="Location" value={evt.location} />
              <Field label="Country" value={evt.country} />
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Coordinates</span>
                {hasCoords ? (
                  <a
                    href={`https://www.google.com/maps?q=${evt.latitude},${evt.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.coordLink}
                  >
                    {evt.latitude?.toFixed(4)}, {evt.longitude?.toFixed(4)}
                  </a>
                ) : (
                  <span className={styles.fieldValueMono}>--</span>
                )}
              </div>
            </div>
          </div>
        </section>

        {evt.description && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Description</h2>
            <div className={styles.card}>
              <p className={styles.notesText}>{evt.description}</p>
            </div>
          </section>
        )}

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            People ({personLinks.length})
          </h2>
          <div className={styles.card}>
            {personLinks.length === 0 ? (
              <div className={styles.emptyState}>No people linked to this event</div>
            ) : (
              personLinks.map((r) => (
                <div key={r.id} className={styles.relItem}>
                  <Link href={`/people/${r.personId}`} className={styles.entityLink}>
                    {personName(r.firstName, r.lastName)}
                  </Link>
                  <div className={styles.relMeta}>
                    {r.role && <span className={styles.relType}>{r.role}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Organizations ({orgLinks.length})
          </h2>
          <div className={styles.card}>
            {orgLinks.length === 0 ? (
              <div className={styles.emptyState}>No organizations linked to this event</div>
            ) : (
              orgLinks.map((r) => (
                <div key={r.id} className={styles.relItem}>
                  <Link href={`/organizations/${r.organizationId}`} className={styles.entityLink}>
                    {r.orgName}
                  </Link>
                  <div className={styles.relMeta}>
                    {r.role && <span className={styles.relType}>{r.role}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {(e2eAsSource.length + e2eAsTarget.length > 0) && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              Related Events ({e2eAsSource.length + e2eAsTarget.length})
            </h2>
            <div className={styles.card}>
              {e2eAsSource.map((r) => (
                <div key={r.id} className={styles.relItem}>
                  <span className={styles.relType}>{r.relationshipType || 'related'}</span>
                  <span className={styles.relArrow}>&rarr;</span>
                  <Link href={`/events/${r.targetEventId}`} className={styles.entityLink}>
                    {r.targetTitle}
                  </Link>
                </div>
              ))}
              {e2eAsTarget.map((r) => (
                <div key={r.id} className={styles.relItem}>
                  <Link href={`/events/${r.sourceEventId}`} className={styles.entityLink}>
                    {r.sourceTitle}
                  </Link>
                  <span className={styles.relArrow}>&rarr;</span>
                  <span className={styles.relType}>{r.relationshipType || 'related'}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {evt.notes && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Notes</h2>
            <div className={styles.card}>
              <p className={styles.notesText}>{evt.notes}</p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <span className={mono ? styles.fieldValueMono : styles.fieldValue}>
        {value || '--'}
      </span>
    </div>
  );
}
