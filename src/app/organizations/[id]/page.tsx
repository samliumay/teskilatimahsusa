import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDb } from '@/lib/db';
import {
  person,
  organization,
  event,
  personToOrgRelation,
  orgToOrgRelation,
  eventToOrganization,
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

export default async function OrganizationDetailPage({ params }: PageProps) {
  const { id } = await params;
  const db = getDb();

  const results = await db
    .select()
    .from(organization)
    .where(and(eq(organization.id, id), notDeleted(organization.deletedAt)));
  const org = results[0];
  if (!org) notFound();

  const [personnel, o2oAsSource, o2oAsTarget, eventLinks] = await Promise.all([
    db
      .select({
        id: personToOrgRelation.id,
        personId: personToOrgRelation.personId,
        role: personToOrgRelation.role,
        department: personToOrgRelation.department,
        currentlyActive: personToOrgRelation.currentlyActive,
        firstName: person.firstName,
        lastName: person.lastName,
      })
      .from(personToOrgRelation)
      .innerJoin(person, eq(personToOrgRelation.personId, person.id))
      .where(and(eq(personToOrgRelation.organizationId, id), notDeleted(personToOrgRelation.deletedAt))),
    db
      .select({
        id: orgToOrgRelation.id,
        targetOrgId: orgToOrgRelation.targetOrgId,
        relationshipType: orgToOrgRelation.relationshipType,
        currentlyActive: orgToOrgRelation.currentlyActive,
        estimatedStatus: orgToOrgRelation.estimatedStatus,
        targetName: organization.name,
      })
      .from(orgToOrgRelation)
      .innerJoin(organization, eq(orgToOrgRelation.targetOrgId, organization.id))
      .where(and(eq(orgToOrgRelation.sourceOrgId, id), notDeleted(orgToOrgRelation.deletedAt))),
    db
      .select({
        id: orgToOrgRelation.id,
        sourceOrgId: orgToOrgRelation.sourceOrgId,
        relationshipType: orgToOrgRelation.relationshipType,
        currentlyActive: orgToOrgRelation.currentlyActive,
        estimatedStatus: orgToOrgRelation.estimatedStatus,
        sourceName: organization.name,
      })
      .from(orgToOrgRelation)
      .innerJoin(organization, eq(orgToOrgRelation.sourceOrgId, organization.id))
      .where(and(eq(orgToOrgRelation.targetOrgId, id), notDeleted(orgToOrgRelation.deletedAt))),
    db
      .select({
        id: eventToOrganization.id,
        eventId: eventToOrganization.eventId,
        role: eventToOrganization.role,
        eventTitle: event.title,
        eventDate: event.date,
        eventType: event.type,
      })
      .from(eventToOrganization)
      .innerJoin(event, eq(eventToOrganization.eventId, event.id))
      .where(and(eq(eventToOrganization.organizationId, id), notDeleted(eventToOrganization.deletedAt))),
  ]);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <span className={styles.breadcrumb}>
            <Link href="/organizations" className={styles.breadcrumbLink}>Organizations</Link>
            <span className={styles.breadcrumbSep}>/</span>
            <span>{org.name}</span>
          </span>
          <h1 className={styles.title}>
            {org.name}
            {org.riskLevel && (
              <span className={`${styles.riskBadge} ${styles[`risk${org.riskLevel}`]}`}>
                {org.riskLevel}
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
          <h2 className={styles.sectionTitle}>Organization Information</h2>
          <div className={styles.card}>
            <div className={styles.fieldGrid}>
              <Field label="Name" value={org.name} />
              <Field label="Type" value={org.type} />
              <Field label="Industry" value={org.industry} />
              <Field label="Country" value={org.country} />
              <Field label="Website" value={org.website} mono />
              <Field label="Founded" value={org.foundedAt ? new Date(org.foundedAt).toLocaleDateString() : null} mono />
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Tags</span>
                {org.tags && org.tags.length > 0 ? (
                  <div className={styles.tagList}>
                    {org.tags.map((t) => <span key={t} className={styles.tag}>{t}</span>)}
                  </div>
                ) : (
                  <span className={styles.fieldValue}>--</span>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Contact Details</h2>
          <div className={styles.card}>
            <div className={styles.fieldGrid}>
              <Field label="Address" value={org.address} />
              <Field label="Phone" value={org.phone?.join(', ')} mono />
              <Field label="Email" value={org.email?.join(', ')} mono />
            </div>
          </div>
        </section>

        {org.description && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Description</h2>
            <div className={styles.card}>
              <p className={styles.notesText}>{org.description}</p>
            </div>
          </section>
        )}

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Personnel ({personnel.length})</h2>
          <div className={styles.card}>
            {personnel.length === 0 ? (
              <div className={styles.emptyState}>No personnel records linked</div>
            ) : (
              personnel.map((r) => (
                <div key={r.id} className={styles.relItem}>
                  <Link href={`/people/${r.personId}`} className={styles.entityLink}>
                    {personName(r.firstName, r.lastName)}
                  </Link>
                  <div className={styles.relMeta}>
                    {r.role && <span className={styles.relType}>{r.role}</span>}
                    {r.department && <span className={styles.relType}>{r.department}</span>}
                    <span className={r.currentlyActive ? styles.activeTag : styles.inactiveTag}>
                      {r.currentlyActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Organization Connections ({o2oAsSource.length + o2oAsTarget.length})
          </h2>
          <div className={styles.card}>
            {o2oAsSource.length + o2oAsTarget.length === 0 ? (
              <div className={styles.emptyState}>No organization relationships recorded</div>
            ) : (
              <>
                {o2oAsSource.map((r) => (
                  <div key={r.id} className={styles.relItem}>
                    <Link href={`/organizations/${r.targetOrgId}`} className={styles.entityLink}>
                      {r.targetName}
                    </Link>
                    <div className={styles.relMeta}>
                      {r.relationshipType && <span className={styles.relType}>{r.relationshipType}</span>}
                      <span className={r.currentlyActive ? styles.activeTag : styles.inactiveTag}>
                        {r.currentlyActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))}
                {o2oAsTarget.map((r) => (
                  <div key={r.id} className={styles.relItem}>
                    <Link href={`/organizations/${r.sourceOrgId}`} className={styles.entityLink}>
                      {r.sourceName}
                    </Link>
                    <div className={styles.relMeta}>
                      {r.relationshipType && <span className={styles.relType}>{r.relationshipType}</span>}
                      <span className={r.currentlyActive ? styles.activeTag : styles.inactiveTag}>
                        {r.currentlyActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Linked Events ({eventLinks.length})</h2>
          <div className={styles.card}>
            {eventLinks.length === 0 ? (
              <div className={styles.emptyState}>No linked events recorded</div>
            ) : (
              eventLinks.map((r) => (
                <div key={r.id} className={styles.relItem}>
                  <Link href={`/events/${r.eventId}`} className={styles.entityLink}>
                    {r.eventTitle}
                  </Link>
                  <div className={styles.relMeta}>
                    {r.role && <span className={styles.relType}>{r.role}</span>}
                    {r.eventType && <span className={styles.relType}>{r.eventType}</span>}
                    {r.eventDate && (
                      <span className={styles.relType}>{new Date(r.eventDate).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {org.notes && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Notes</h2>
            <div className={styles.card}>
              <p className={styles.notesText}>{org.notes}</p>
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
