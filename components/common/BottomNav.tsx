'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, History, Scale } from 'lucide-react';

const tabs = [
  { href: '/',        label: 'ホーム',   Icon: Home    },
  { href: '/history', label: '履歴',     Icon: History },
  { href: '/body',    label: '体組成',   Icon: Scale   },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-sm">
      <ul className="flex">
        {tabs.map(({ href, label, Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={`flex min-h-[56px] flex-col items-center justify-center gap-1 py-2 text-xs transition-colors ${
                  isActive
                    ? 'text-primary font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className={`rounded-xl px-4 py-1 transition-colors ${isActive ? 'bg-primary/10' : ''}`}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
