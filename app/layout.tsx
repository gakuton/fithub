import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/components/common/QueryProvider';
import { BottomNav } from '@/components/common/BottomNav';
import { Toaster } from '@/components/ui/sonner';

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FitHub',
  description: '個人用フィットネス管理アプリ',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <QueryProvider>
          <main className="pb-20">{children}</main>
          <BottomNav />
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
