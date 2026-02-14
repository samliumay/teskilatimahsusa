import { type ReactNode } from 'react';
import styles from './Card.module.scss';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

export function Card({ children, className, title }: CardProps) {
  const classNames = [styles.card, className].filter(Boolean).join(' ');

  return (
    <div className={classNames}>
      {title && (
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
        </div>
      )}
      {children}
    </div>
  );
}
