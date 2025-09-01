
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, FileText, History, LayoutDashboard } from 'lucide-react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';

import { Logo } from '../icons';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/assistant', label: 'Assistant', icon: Bot },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/history', label: 'History', icon: History },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar className="hidden w-64 flex-col border-r bg-background p-4 sm:flex">
       <SidebarHeader className="mb-8">
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
        {navItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href} passHref>
              <SidebarMenuButton 
                  isActive={pathname === item.href}
                  className="justify-start"
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
