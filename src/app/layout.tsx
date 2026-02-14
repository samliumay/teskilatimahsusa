import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import '@/styles/globals.scss';
import styles from './layout.module.scss';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Teskilat-i Mahsusa',
  description: 'Social network analysis and intelligence system',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable}`}>
        <ThemeProvider>
          <div className={styles.app}>
            <Sidebar />
            <div className={styles.main}>
              <Header />
              <main className={styles.content}>{children}</main>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
