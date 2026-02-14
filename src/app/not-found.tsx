import Link from 'next/link';
import styles from './not-found.module.scss';

export default function NotFound() {
  return (
    <div className={styles.container}>
      <span className={styles.code}>404</span>
      <h1 className={styles.title}>Entity Not Found</h1>
      <p className={styles.description}>
        The record you are looking for does not exist or has been archived.
      </p>
      <Link href="/" className={styles.backLink}>
        Return to Dashboard
      </Link>
    </div>
  );
}
