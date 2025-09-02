
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, FileText, History, LayoutDashboard, User, LogOut, Settings } from 'lucide-react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '../ui/button';
import { Logo } from '../icons';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Skeleton } from '../ui/skeleton';
import { useProfile } from '@/hooks/use-profile';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/assistant', label: 'Assistant', icon: Bot },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/history', label: 'History', icon: History },
];

function UserProfileButton() {
    const { user, loading: authLoading } = useAuth();
    const { profile, loading: profileLoading } = useProfile();
    const router = useRouter();

    const handleLogout = async () => {
        try {
        await fetch('/api/auth/session', { method: 'DELETE' });
        router.push('/');
        } catch (error) {
        console.error('Logout failed', error);
        }
    };

    if (authLoading) {
        return <Skeleton className="h-8 w-8 rounded-full" />;
    }

    if (!user) {
        return (
            <Button asChild size="sm">
                <Link href="/login">Sign In</Link>
            </Button>
        );
    }
    
    const getInitials = () => {
      if (profile) {
        return `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`;
      }
      return <User className="h-5 w-5" />;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                <AvatarImage src={user.photoURL || `https://avatar.vercel.sh/${user.uid}.png`} alt={profile?.firstName || 'User'} data-ai-hint="person face" />
                <AvatarFallback>
                    {profileLoading ? <Skeleton className="h-10 w-10 rounded-full" /> : getInitials()}
                </AvatarFallback>
                </Avatar>
            </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={user.photoURL || `https://avatar.vercel.sh/${user.uid}.png`} alt={profile?.firstName || 'User'} data-ai-hint="person face" />
                        <AvatarFallback>
                             {profileLoading ? <Skeleton className="h-10 w-10 rounded-full" /> : getInitials()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{profile ? `${profile.firstName} ${profile.lastName}` : 'Anonymous User'}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                        </p>
                    </div>
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link href="/profile">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
                </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
            </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}


export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  // For unauthenticated users (e.g., on the landing page), show a minimal sidebar
  if (!user) {
     return (
        <Sidebar className="hidden w-64 flex-col border-r bg-background p-4 sm:flex">
            <SidebarHeader className="mb-8 flex items-center justify-between">
                <Logo />
                <UserProfileButton />
            </SidebarHeader>
        </Sidebar>
     );
  }

  return (
    <Sidebar className="hidden w-64 flex-col border-r bg-background p-4 sm:flex">
       <SidebarHeader className="mb-8 flex items-center justify-between">
            <Logo />
            <UserProfileButton />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
        {navItems.map((item) => (
          <SidebarMenuItem key={item.href}>
             <Link href={item.href}>
                <SidebarMenuButton 
                    isActive={pathname === item.href}
                    className="justify-start w-full"
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
