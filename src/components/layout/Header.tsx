'use client';

import { ThemeSwitcher } from './ThemeSwitcher';
import styles from './Header.module.scss';

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        {/* Breadcrumb or page title can go here */}
      </div>
      <div className={styles.right}>
        <ThemeSwitcher />
      </div>
    </header>
  );
}
