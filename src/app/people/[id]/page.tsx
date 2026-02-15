import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDb } from '@/lib/db';
import {
  person,
  personToPersonRelation,
  personToOrgRelation,
  eventToPerson,
  organization,
  event,
} from '@/lib/db/schema';
import { notDeleted } from '@/lib/db/helpers';
import { eq, and } from 'drizzle-orm';
import { DetailActions } from '@/components/ui/DetailActions';
import { FileSection } from '@/components/files/FileSection';
import styles from './page.module.scss';

function displayName(first: string | null, last: string | null) {
  return [first, last].filter(Boolean).join(' ') || 'Unknown';
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PersonDetailPage({ params }: PageProps) {
  const { id } = await params;
  const db = getDb();

  // Fetch person
  const results = await db
    .select()
    .from(person)
    .where(and(eq(person.id, id), notDeleted(person.deletedAt)));
  const p = results[0];
  if (!p) notFound();

  // Fetch relationships in parallel
  const [p2pAsSource, p2pAsTarget, p2oRels, eventLinks] = await Promise.all([
    db
      .select({
        id: personToPersonRelation.id,
        targetPersonId: personToPersonRelation.targetPersonId,
        relationshipType: personToPersonRelation.relationshipType,
        strength: personToPersonRelation.strength,
        estimatedStatus: personToPersonRelation.estimatedStatus,
        targetFirstName: person.firstName,
        targetLastName: person.lastName,
      })
      .from(personToPersonRelation)
      .innerJoin(person, eq(personToPersonRelation.targetPersonId, person.id))
      .where(and(eq(personToPersonRelation.sourcePersonId, id), notDeleted(personToPersonRelation.deletedAt))),
    db
      .select({
        id: personToPersonRelation.id,
        sourcePersonId: personToPersonRelation.sourcePersonId,
        relationshipType: personToPersonRelation.relationshipType,
        strength: personToPersonRelation.strength,
        estimatedStatus: personToPersonRelation.estimatedStatus,
        sourceFirstName: person.firstName,
        sourceLastName: person.lastName,
      })
      .from(personToPersonRelation)
      .innerJoin(person, eq(personToPersonRelation.sourcePersonId, person.id))
      .where(and(eq(personToPersonRelation.targetPersonId, id), notDeleted(personToPersonRelation.deletedAt))),
    db
      .select({
        id: personToOrgRelation.id,
        organizationId: personToOrgRelation.organizationId,
        role: personToOrgRelation.role,
        department: personToOrgRelation.department,
        currentlyActive: personToOrgRelation.currentlyActive,
        orgName: organization.name,
      })
      .from(personToOrgRelation)
      .innerJoin(organization, eq(personToOrgRelation.organizationId, organization.id))
      .where(and(eq(personToOrgRelation.personId, id), notDeleted(personToOrgRelation.deletedAt))),
    db
      .select({
        id: eventToPerson.id,
        eventId: eventToPerson.eventId,
        role: eventToPerson.role,
        eventTitle: event.title,
        eventDate: event.date,
        eventType: event.type,
      })
      .from(eventToPerson)
      .innerJoin(event, eq(eventToPerson.eventId, event.id))
      .where(and(eq(eventToPerson.personId, id), notDeleted(eventToPerson.deletedAt))),
  ]);

  const fullName = displayName(p.firstName, p.lastName);
  const socialMedia = p.socialMedia as Record<string, string> | null;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <span className={styles.breadcrumb}>
            <Link href="/people" className={styles.breadcrumbLink}>People</Link>
            <span className={styles.breadcrumbSep}>/</span>
            <span>{fullName}</span>
          </span>
          <h1 className={styles.title}>
            {fullName}
            {p.riskLevel && (
              <span className={`${styles.riskBadge} ${styles[`risk${p.riskLevel}`]}`}>
                {p.riskLevel}
              </span>
            )}
          </h1>
          <span className={styles.entityId}>{id}</span>
        </div>
        <DetailActions entityType="people" entityId={id} entityName={fullName} />
      </div>

      <div className={styles.grid}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Personal Information</h2>
          <div className={styles.card}>
            <div className={styles.fieldGrid}>
              <Field label="First Name" value={p.firstName} />
              <Field label="Last Name" value={p.lastName} />
              <Field label="Aliases" value={p.aliases?.join(', ')} />
              <Field label="Date of Birth" value={p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString() : null} mono />
              <Field label="Place of Birth" value={p.placeOfBirth} />
              <Field label="Nationality" value={p.nationality} />
              <Field label="Gender" value={p.gender} />
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Tags</span>
                {p.tags && p.tags.length > 0 ? (
                  <div className={styles.tagList}>
                    {p.tags.map((t) => <span key={t} className={styles.tag}>{t}</span>)}
                  </div>
                ) : (
                  <span className={styles.fieldValue}>--</span>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Contact & Identifiers</h2>
          <div className={styles.card}>
            <div className={styles.fieldGrid}>
              <Field label="Email" value={p.email?.join(', ')} mono />
              <Field label="Phone" value={p.phone?.join(', ')} mono />
              <Field label="Address" value={p.address} />
              <Field label="Passport No." value={p.passportNo} mono />
              <Field label="National ID" value={p.nationalId} mono />
              <Field label="Tax ID" value={p.taxId} mono />
              <Field label="Driver's License" value={p.driversLicense} mono />
            </div>
            {socialMedia && Object.keys(socialMedia).length > 0 && (
              <div className={styles.fieldGrid} style={{ marginTop: '1rem' }}>
                {Object.entries(socialMedia).map(([platform, handle]) => (
                  <Field key={platform} label={platform} value={handle} mono />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Person Connections ({p2pAsSource.length + p2pAsTarget.length})
          </h2>
          <div className={styles.card}>
            {p2pAsSource.length + p2pAsTarget.length === 0 ? (
              <div className={styles.emptyState}>No person relationships recorded</div>
            ) : (
              <>
                {p2pAsSource.map((r) => (
                  <div key={r.id} className={styles.relItem}>
                    <Link href={`/people/${r.targetPersonId}`} className={styles.entityLink}>
                      {displayName(r.targetFirstName, r.targetLastName)}
                    </Link>
                    <div className={styles.relMeta}>
                      {r.relationshipType && <span className={styles.relType}>{r.relationshipType}</span>}
                      {r.strength && <span className={styles.relType}>{r.strength}</span>}
                      {r.estimatedStatus && (
                        <span className={`${styles.statusBadge} ${styles[`status${r.estimatedStatus}`]}`}>
                          {r.estimatedStatus}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {p2pAsTarget.map((r) => (
                  <div key={r.id} className={styles.relItem}>
                    <Link href={`/people/${r.sourcePersonId}`} className={styles.entityLink}>
                      {displayName(r.sourceFirstName, r.sourceLastName)}
                    </Link>
                    <div className={styles.relMeta}>
                      {r.relationshipType && <span className={styles.relType}>{r.relationshipType}</span>}
                      {r.strength && <span className={styles.relType}>{r.strength}</span>}
                      {r.estimatedStatus && (
                        <span className={`${styles.statusBadge} ${styles[`status${r.estimatedStatus}`]}`}>
                          {r.estimatedStatus}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Organization Affiliations ({p2oRels.length})
          </h2>
          <div className={styles.card}>
            {p2oRels.length === 0 ? (
              <div className={styles.emptyState}>No organization affiliations recorded</div>
            ) : (
              p2oRels.map((r) => (
                <div key={r.id} className={styles.relItem}>
                  <Link href={`/organizations/${r.organizationId}`} className={styles.entityLink}>
                    {r.orgName}
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
            Linked Events ({eventLinks.length})
          </h2>
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
                      <span className={styles.relType}>
                        {new Date(r.eventDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <FileSection entityType="person" entityId={id} />

        {p.notes && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Notes</h2>
            <div className={styles.card}>
              <p className={styles.notesText}>{p.notes}</p>
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
