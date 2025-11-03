
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bot, FileText, History, LayoutDashboard, User, LogOut, Settings, ChevronsUpDown, PlusCircle, LoaderCircle,LogIn } from 'lucide-react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
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
import { Skeleton } from '../ui/skeleton';
import { useProfile } from '@/hooks/use-profile';
import { archiveAssistantChatAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useState, useTransition } from 'react';


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
        // Instead of router.push, we refresh the page to ensure all state is cleared.
        window.location.href = '/';
        } catch (error) {
        console.error('Logout failed', error);
        }
    };
    
    const isLoading = authLoading || (user && profileLoading);

    if (isLoading) {
        return <Skeleton className="h-10 w-full" />;
    }

    if (!user) {
        return (
            <Button asChild className="w-full">
                <Link href="/login"><LogIn className="mr-2 h-4 w-4"/>Sign In</Link>
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
                <Button variant="ghost" className="w-full justify-start text-left h-auto py-2 px-3">
                     <div className="flex items-center gap-3 w-full">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={user.photoURL || `https://avatar.vercel.sh/${user.uid}.png`} alt={profile?.firstName || 'User'} data-ai-hint="person face" />
                            <AvatarFallback>
                                {getInitials()}
                            </AvatarFallback>
                        </Avatar>
                         <div className="flex-1 truncate">
                            <p className="text-sm font-medium leading-none truncate">{profile ? `${profile.firstName} ${profile.lastName}` : 'Anonymous User'}</p>
                            <p className="text-xs leading-none text-muted-foreground truncate">
                                {user.email}
                            </p>
                        </div>
                        <ChevronsUpDown className="h-4 w-4 text-muted-foreground ml-auto" />
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{profile ? `${profile.firstName} ${profile.lastName}` : 'Anonymous User'}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                        </p>
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
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isClearing, startClearingTransition] = useTransition();

  const handleNewChat = () => {
      if (!user) return;
      startClearingTransition(async () => {
          const result = await archiveAssistantChatAction(user.uid);
          if (result.success) {
              toast({ title: 'Success', description: 'New chat started. Old chat saved to history.' });
              // Force a reload of the page to reset the state
              if (pathname === '/assistant') {
                router.refresh();
              } else {
                router.push('/assistant');
              }
          } else {
              toast({ variant: 'destructive', title: 'Error', description: result.error || 'Failed to start a new chat.' });
          }
      });
  }

  return (
    <Sidebar className="hidden w-64 flex-col border-r bg-background p-4 sm:flex">
       <SidebarHeader className="mb-8">
            <Logo />
      </SidebarHeader>
      <SidebarContent>
        {user && (
            <SidebarMenu>
            {navItems.map((item) => (
            <SidebarMenuItem key={item.href} className="relative">
                <Link href={item.href} className="flex-grow">
                    <SidebarMenuButton 
                        isActive={pathname.startsWith(item.href)}
                        className="justify-start w-full"
                    >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                    </SidebarMenuButton>
                </Link>
                {item.href === '/assistant' && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={handleNewChat}
                        disabled={isClearing}
                    >
                        {isClearing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                        <span className="sr-only">New Chat</span>
                    </Button>
                )}
            </SidebarMenuItem>
            ))}
            </SidebarMenu>
        )}
      </SidebarContent>
       <SidebarFooter className="mt-auto">
        <UserProfileButton />
      </SidebarFooter>
    </Sidebar>
  );
}
