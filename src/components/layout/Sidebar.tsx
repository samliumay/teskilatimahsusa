'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.scss';

const navItems = [
  { href: '/', label: 'Dashboard', shortcut: 'D' },
  { href: '/people', label: 'People', shortcut: 'P' },
  { href: '/organizations', label: 'Organizations', shortcut: 'O' },
  { href: '/events', label: 'Events', shortcut: 'E' },
  { href: '/relationships', label: 'Relationships', shortcut: 'R' },
  { href: '/graph', label: 'Network Graph', shortcut: 'G' },
  { href: '/simulation', label: 'Simulation', shortcut: 'S' },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <Image
          src="/symboll.png"
          alt="Teşkilât-ı Mahsusa"
          width={36}
          height={36}
          className={styles.logoImage}
          priority
        />
        <div className={styles.logoText}>
          <span className={styles.title}>Teskilat</span>
          <span className={styles.subtitle}>Intelligence System</span>
        </div>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navItem} ${isActive(item.href) ? styles.active : ''}`}
          >
            <span className={styles.shortcut}>{item.shortcut}</span>
            <span className={styles.label}>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className={styles.footer}>
        <span className={styles.version}>v0.1.0</span>
      </div>
    </aside>
  );
}
