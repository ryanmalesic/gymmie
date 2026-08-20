import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { Figtree, Geist, Geist_Mono } from 'next/font/google';

import './globals.css';
import { cn } from '@/lib/utils';

const figtree = Figtree({ subsets: ['latin'], variable: '--font-sans' });

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
});

export const metadata: Metadata = {
  description: 'Your personal fitness companion.',
  title: 'Gymmie | Personal Fitness Companion',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      className={cn(
        'h-full',
        'antialiased',
        geistSans.variable,
        geistMono.variable,
        'font-sans',
        figtree.variable
      )}
      lang="en"
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
