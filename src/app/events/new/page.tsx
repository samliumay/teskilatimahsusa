import Link from 'next/link';
import { EventForm } from '@/components/events/EventForm';
import styles from '../[id]/page.module.scss';

export default function NewEventPage() {
  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <span className={styles.breadcrumb}>
            <Link href="/events" className={styles.breadcrumbLink}>Events</Link>
            <span className={styles.breadcrumbSep}>/</span>
            <span>New Event</span>
          </span>
          <h1 className={styles.title}>Create Event</h1>
        </div>
      </div>
      <div className={styles.card}>
        <EventForm mode="create" />
      </div>
    </div>
  );
}
