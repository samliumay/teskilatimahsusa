import styles from './loading.module.scss';

export default function Loading() {
  return (
    <div className={styles.container}>
      <div className={styles.spinner} />
      <span className={styles.text}>Loading...</span>
    </div>
  );
}
