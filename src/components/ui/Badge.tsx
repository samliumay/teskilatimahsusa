import { type ReactNode } from 'react';
import styles from './Badge.module.scss';

type BadgeVariant = 'low' | 'medium' | 'high' | 'critical' | 'info' | 'default';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  const classNames = [styles.badge, styles[variant], className]
    .filter(Boolean)
    .join(' ');

  return <span className={classNames}>{children}</span>;
}
