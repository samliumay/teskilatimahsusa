'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import styles from './SearchToolbar.module.scss';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterConfig {
  key: string;
  placeholder: string;
  options: FilterOption[];
}

interface SearchToolbarProps {
  basePath: string;
  searchPlaceholder: string;
  filters?: FilterConfig[];
}

export function SearchToolbar({ basePath, searchPlaceholder, filters = [] }: SearchToolbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get('search') || '';

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete('page'); // reset to page 1 on filter change
      startTransition(() => {
        router.push(`${basePath}?${params.toString()}`);
      });
    },
    [searchParams, basePath, router]
  );

  return (
    <div className={`${styles.toolbar} ${isPending ? styles.pending : ''}`}>
      <input
        type="text"
        className={styles.search}
        placeholder={searchPlaceholder}
        defaultValue={currentSearch}
        onChange={(e) => {
          // Debounce: only update after user stops typing for 300ms
          const value = e.target.value;
          const el = e.target;
          clearTimeout((el as unknown as { _timer: ReturnType<typeof setTimeout> })._timer);
          (el as unknown as { _timer: ReturnType<typeof setTimeout> })._timer = setTimeout(() => {
            updateParams('search', value);
          }, 300);
        }}
      />
      <div className={styles.filters}>
        {filters.map((f) => (
          <select
            key={f.key}
            className={styles.filterSelect}
            value={searchParams.get(f.key) || ''}
            onChange={(e) => updateParams(f.key, e.target.value)}
          >
            <option value="">{f.placeholder}</option>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ))}
      </div>
    </div>
  );
}
