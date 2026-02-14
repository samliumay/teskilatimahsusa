'use client';

import { useTheme } from './ThemeProvider';
import type { Theme } from '@/lib/types';
import styles from './ThemeSwitcher.module.scss';

const themes: { value: Theme; label: string }[] = [
  { value: 'dark', label: 'Dark' },
  { value: 'gray', label: 'Gray' },
  { value: 'white', label: 'Light' },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className={styles.switcher}>
      {themes.map((t) => (
        <button
          key={t.value}
          onClick={() => setTheme(t.value)}
          className={`${styles.btn} ${theme === t.value ? styles.active : ''}`}
          aria-label={`${t.label} theme`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
