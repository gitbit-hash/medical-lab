// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { NetworkStatus } from './components/network-status';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Medical Laboratory Management',
  description: 'Offline-first laboratory management system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NetworkStatus />
        <div className="pt-10">
          {children}
        </div>
      </body>
    </html>
  );
}