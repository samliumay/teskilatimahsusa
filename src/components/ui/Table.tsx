'use client';

import { type KeyboardEvent } from 'react';
import styles from './Table.module.scss';

interface TableColumn {
  key: string;
  label: string;
  mono?: boolean;
}

interface TableProps<T extends Record<string, unknown>> {
  columns: TableColumn[];
  data: T[];
  onRowClick?: (row: T) => void;
  className?: string;
}

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  onRowClick,
  className,
}: TableProps<T>) {
  const wrapperClassNames = [styles.wrapper, className]
    .filter(Boolean)
    .join(' ');

  function handleRowKeyDown(e: KeyboardEvent<HTMLTableRowElement>, row: T) {
    if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onRowClick(row);
    }
  }

  function renderCellValue(value: unknown): string {
    if (value === null || value === undefined) return '\u2014';
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    return JSON.stringify(value);
  }

  return (
    <div className={wrapperClassNames}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={styles.th}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={styles.empty}>
                No records found
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`${styles.row} ${onRowClick ? styles.clickable : ''}`}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={onRowClick ? (e) => handleRowKeyDown(e, row) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                role={onRowClick ? 'button' : undefined}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`${styles.td} ${col.mono ? styles.mono : ''}`}
                  >
                    {renderCellValue(row[col.key])}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
