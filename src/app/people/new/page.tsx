import Link from 'next/link';
import { PersonForm } from '@/components/people/PersonForm';
import styles from '../[id]/page.module.scss';

export default function NewPersonPage() {
  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <span className={styles.breadcrumb}>
            <Link href="/people" className={styles.breadcrumbLink}>People</Link>
            <span className={styles.breadcrumbSep}>/</span>
            <span>New Person</span>
          </span>
          <h1 className={styles.title}>Create Person</h1>
        </div>
      </div>
      <div className={styles.card}>
        <PersonForm mode="create" />
      </div>
    </div>
  );
}
