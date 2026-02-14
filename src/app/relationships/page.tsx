import Link from 'next/link';
import { getDb } from '@/lib/db';
import {
  person,
  organization,
  event,
  personToPersonRelation,
  personToOrgRelation,
  orgToOrgRelation,
  eventToEvent,
} from '@/lib/db/schema';
import { notDeleted } from '@/lib/db/helpers';
import { eq } from 'drizzle-orm';
import styles from './page.module.scss';

function personName(firstName: string | null, lastName: string | null) {
  return [firstName, lastName].filter(Boolean).join(' ') || 'Unknown';
}

export default async function RelationshipsPage() {
  const db = getDb();

  const [p2pRows, p2oRows, o2oRows, e2eRows] = await Promise.all([
    db
      .select({
        id: personToPersonRelation.id,
        relationshipType: personToPersonRelation.relationshipType,
        estimatedStatus: personToPersonRelation.estimatedStatus,
        strength: personToPersonRelation.strength,
        context: personToPersonRelation.context,
        sourceFirstName: person.firstName,
        sourceLastName: person.lastName,
        sourcePersonId: personToPersonRelation.sourcePersonId,
        targetPersonId: personToPersonRelation.targetPersonId,
      })
      .from(personToPersonRelation)
      .innerJoin(person, eq(personToPersonRelation.sourcePersonId, person.id))
      .where(notDeleted(personToPersonRelation.deletedAt)),
    db
      .select({
        id: personToOrgRelation.id,
        role: personToOrgRelation.role,
        department: personToOrgRelation.department,
        estimatedStatus: personToOrgRelation.estimatedStatus,
        currentlyActive: personToOrgRelation.currentlyActive,
        personId: personToOrgRelation.personId,
        organizationId: personToOrgRelation.organizationId,
        personFirstName: person.firstName,
        personLastName: person.lastName,
        orgName: organization.name,
      })
      .from(personToOrgRelation)
      .innerJoin(person, eq(personToOrgRelation.personId, person.id))
      .innerJoin(organization, eq(personToOrgRelation.organizationId, organization.id))
      .where(notDeleted(personToOrgRelation.deletedAt)),
    db
      .select({
        id: orgToOrgRelation.id,
        relationshipType: orgToOrgRelation.relationshipType,
        estimatedStatus: orgToOrgRelation.estimatedStatus,
        currentlyActive: orgToOrgRelation.currentlyActive,
        sourceOrgId: orgToOrgRelation.sourceOrgId,
        targetOrgId: orgToOrgRelation.targetOrgId,
        sourceOrgName: organization.name,
      })
      .from(orgToOrgRelation)
      .innerJoin(organization, eq(orgToOrgRelation.sourceOrgId, organization.id))
      .where(notDeleted(orgToOrgRelation.deletedAt)),
    db
      .select({
        id: eventToEvent.id,
        relationshipType: eventToEvent.relationshipType,
        sourceEventId: eventToEvent.sourceEventId,
        targetEventId: eventToEvent.targetEventId,
        sourceTitle: event.title,
      })
      .from(eventToEvent)
      .innerJoin(event, eq(eventToEvent.sourceEventId, event.id))
      .where(notDeleted(eventToEvent.deletedAt)),
  ]);

  // We need target names too — fetch them in bulk
  const targetPersonIds = [...new Set(p2pRows.map((r) => r.targetPersonId))];
  const targetOrgIds = [...new Set(o2oRows.map((r) => r.targetOrgId))];
  const targetEventIds = [...new Set(e2eRows.map((r) => r.targetEventId))];

  const [targetPersons, targetOrgs, targetEvents] = await Promise.all([
    targetPersonIds.length > 0
      ? db.select({ id: person.id, firstName: person.firstName, lastName: person.lastName }).from(person)
      : Promise.resolve([]),
    targetOrgIds.length > 0
      ? db.select({ id: organization.id, name: organization.name }).from(organization)
      : Promise.resolve([]),
    targetEventIds.length > 0
      ? db.select({ id: event.id, title: event.title }).from(event)
      : Promise.resolve([]),
  ]);

  const personMap = new Map(targetPersons.map((p) => [p.id, personName(p.firstName, p.lastName)]));
  const orgMap = new Map(targetOrgs.map((o) => [o.id, o.name]));
  const eventMap = new Map(targetEvents.map((e) => [e.id, e.title]));

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Relationship Explorer</h1>
          <p className={styles.description}>
            {p2pRows.length + p2oRows.length + o2oRows.length + e2eRows.length} connections mapped across all entities
          </p>
        </div>
      </div>

      <div className={styles.categories}>
        {/* Person-to-Person */}
        <section className={styles.category}>
          <div className={styles.categoryHeader}>
            <h2 className={styles.categoryTitle}>Person to Person</h2>
            <span className={styles.categoryCount}>{p2pRows.length}</span>
          </div>
          <div className={styles.cardList}>
            {p2pRows.length === 0 ? (
              <div className={styles.emptyState}>No person-to-person relationships recorded</div>
            ) : (
              p2pRows.map((r) => (
                <div key={r.id} className={styles.relCard}>
                  <div className={styles.relEntities}>
                    <Link href={`/people/${r.sourcePersonId}`} className={styles.entityLink}>
                      {personName(r.sourceFirstName, r.sourceLastName)}
                    </Link>
                    <span className={styles.relArrow}>&rarr;</span>
                    <Link href={`/people/${r.targetPersonId}`} className={styles.entityLink}>
                      {personMap.get(r.targetPersonId) || 'Unknown'}
                    </Link>
                  </div>
                  <div className={styles.relMeta}>
                    {r.relationshipType && <span className={styles.relType}>{r.relationshipType}</span>}
                    {r.strength && <span className={styles.relStrength}>{r.strength}</span>}
                    {r.estimatedStatus && (
                      <span className={`${styles.statusBadge} ${styles[`status${r.estimatedStatus}`]}`}>
                        {r.estimatedStatus}
                      </span>
                    )}
                  </div>
                  {r.context && <p className={styles.relContext}>{r.context}</p>}
                </div>
              ))
            )}
          </div>
        </section>

        {/* Person-to-Organization */}
        <section className={styles.category}>
          <div className={styles.categoryHeader}>
            <h2 className={styles.categoryTitle}>Person to Organization</h2>
            <span className={styles.categoryCount}>{p2oRows.length}</span>
          </div>
          <div className={styles.cardList}>
            {p2oRows.length === 0 ? (
              <div className={styles.emptyState}>No person-to-organization affiliations recorded</div>
            ) : (
              p2oRows.map((r) => (
                <div key={r.id} className={styles.relCard}>
                  <div className={styles.relEntities}>
                    <Link href={`/people/${r.personId}`} className={styles.entityLink}>
                      {personName(r.personFirstName, r.personLastName)}
                    </Link>
                    <span className={styles.relArrow}>&rarr;</span>
                    <Link href={`/organizations/${r.organizationId}`} className={styles.entityLink}>
                      {r.orgName}
                    </Link>
                  </div>
                  <div className={styles.relMeta}>
                    {r.role && <span className={styles.relType}>{r.role}</span>}
                    {r.department && <span className={styles.relDept}>{r.department}</span>}
                    <span className={r.currentlyActive ? styles.activeTag : styles.inactiveTag}>
                      {r.currentlyActive ? 'Active' : 'Inactive'}
                    </span>
                    {r.estimatedStatus && (
                      <span className={`${styles.statusBadge} ${styles[`status${r.estimatedStatus}`]}`}>
                        {r.estimatedStatus}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Organization-to-Organization */}
        <section className={styles.category}>
          <div className={styles.categoryHeader}>
            <h2 className={styles.categoryTitle}>Organization to Organization</h2>
            <span className={styles.categoryCount}>{o2oRows.length}</span>
          </div>
          <div className={styles.cardList}>
            {o2oRows.length === 0 ? (
              <div className={styles.emptyState}>No organization-to-organization relationships recorded</div>
            ) : (
              o2oRows.map((r) => (
                <div key={r.id} className={styles.relCard}>
                  <div className={styles.relEntities}>
                    <Link href={`/organizations/${r.sourceOrgId}`} className={styles.entityLink}>
                      {r.sourceOrgName}
                    </Link>
                    <span className={styles.relArrow}>&rarr;</span>
                    <Link href={`/organizations/${r.targetOrgId}`} className={styles.entityLink}>
                      {orgMap.get(r.targetOrgId) || 'Unknown'}
                    </Link>
                  </div>
                  <div className={styles.relMeta}>
                    {r.relationshipType && <span className={styles.relType}>{r.relationshipType}</span>}
                    <span className={r.currentlyActive ? styles.activeTag : styles.inactiveTag}>
                      {r.currentlyActive ? 'Active' : 'Inactive'}
                    </span>
                    {r.estimatedStatus && (
                      <span className={`${styles.statusBadge} ${styles[`status${r.estimatedStatus}`]}`}>
                        {r.estimatedStatus}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Event Chains */}
        <section className={styles.category}>
          <div className={styles.categoryHeader}>
            <h2 className={styles.categoryTitle}>Event Chains</h2>
            <span className={styles.categoryCount}>{e2eRows.length}</span>
          </div>
          <div className={styles.cardList}>
            {e2eRows.length === 0 ? (
              <div className={styles.emptyState}>No event-to-event chains recorded</div>
            ) : (
              e2eRows.map((r) => (
                <div key={r.id} className={styles.relCard}>
                  <div className={styles.relEntities}>
                    <Link href={`/events/${r.sourceEventId}`} className={styles.entityLink}>
                      {r.sourceTitle}
                    </Link>
                    <span className={styles.relArrow}>&rarr;</span>
                    <Link href={`/events/${r.targetEventId}`} className={styles.entityLink}>
                      {eventMap.get(r.targetEventId) || 'Unknown'}
                    </Link>
                  </div>
                  <div className={styles.relMeta}>
                    {r.relationshipType && <span className={styles.relType}>{r.relationshipType}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
