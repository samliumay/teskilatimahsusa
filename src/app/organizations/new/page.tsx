import Link from 'next/link';
import { OrgForm } from '@/components/organizations/OrgForm';
import styles from '../[id]/page.module.scss';

export default function NewOrganizationPage() {
  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <span className={styles.breadcrumb}>
            <Link href="/organizations" className={styles.breadcrumbLink}>Organizations</Link>
            <span className={styles.breadcrumbSep}>/</span>
            <span>New Organization</span>
          </span>
          <h1 className={styles.title}>Create Organization</h1>
        </div>
      </div>
      <div className={styles.card}>
        <OrgForm mode="create" />
      </div>
    </div>
  );
}
