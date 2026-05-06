import type { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import { Special_Elite, Caveat, Inter } from 'next/font/google';
import './globals.css';
import { TRPCProvider } from '@/lib/trpc';
import { I18nProvider } from '@/i18n/client';
import { getLocale } from '@/i18n/server';

const specialElite = Special_Elite({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-typewriter',
});

const caveat = Caveat({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-handwritten',
});

const inter = Inter({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-ui',
});

export const metadata: Metadata = {
  title: 'Open Osint — The Investigation Board',
  description: 'Connect evidence. Follow the thread.',
};

export const viewport: Viewport = {
  themeColor: '#14171c',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={`${specialElite.variable} ${caveat.variable} ${inter.variable}`}
    >
      <body>
        <I18nProvider initialLocale={locale}>
          <TRPCProvider>{children}</TRPCProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
