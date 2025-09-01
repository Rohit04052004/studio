'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, FileText, History, LayoutDashboard } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Logo } from '../icons';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/assistant', label: 'Assistant', icon: Bot },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/history', label: 'History', icon: History },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-col border-r bg-background p-4 sm:flex">
      <div className="mb-8">
        <Logo />
      </div>
      <nav className="flex flex-col gap-2">
        {navItems.map((item) => (
          <Button
            key={item.href}
            asChild
            variant={pathname === item.href ? 'secondary' : 'ghost'}
            className="justify-start"
          >
            <Link href={item.href}>
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </Link>
          </Button>
        ))}
      </nav>
    </aside>
  );
}
