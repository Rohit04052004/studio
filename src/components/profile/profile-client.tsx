
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';
import { getReportsAction, updateUserProfileAction } from '@/app/actions';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Bot, Camera, Save, LogOut, LoaderCircle } from 'lucide-react';
import type { Report } from '@/types';

const ProfileFormSchema = z.object({
  fullName: z.string().min(1, 'Full name is required.'),
  language: z.string(),
  tone: z.string(),
});

type ProfileFormValues = z.infer<typeof ProfileFormSchema>;

export function ProfileClient() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [reports, setReports] = useState<Report[]>([]);
  const [isReportsLoading, setIsReportsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileFormSchema),
    defaultValues: {
      fullName: '',
      language: 'english',
      tone: 'professional',
    },
  });
  
  const watchedFullName = useWatch({ control: form.control, name: 'fullName' });

  useEffect(() => {
    if (profile) {
      form.reset({
        fullName: `${profile.firstName} ${profile.lastName}`,
        language: 'english', // Placeholder
        tone: 'professional', // Placeholder
      });
    }
  }, [profile, form]);

  useEffect(() => {
    async function fetchReports() {
      if (user) {
        setIsReportsLoading(true);
        const result = await getReportsAction(user.uid);
        if (result.success && result.reports) {
          setReports(result.reports);
        }
        setIsReportsLoading(false);
      }
    }
    fetchReports();
  }, [user]);

  const handleLogout = async () => {
    await fetch('/api/auth/session', { method: 'DELETE' });
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
    router.push('/login');
  };

  const onSubmit = (data: ProfileFormValues) => {
    if (!user || !profile) return;
    
    const [firstName, ...lastNameParts] = data.fullName.split(' ');
    const lastName = lastNameParts.join(' ');

    // Only submit if name has changed
    if (firstName === profile.firstName && lastName === profile.lastName) {
         toast({ title: 'No Changes', description: 'There are no new changes to save.' });
         return;
    }

    startTransition(async () => {
      const result = await updateUserProfileAction(user.uid, { firstName, lastName });
      if (result.success) {
        toast({ title: 'Success', description: 'Your profile has been updated.' });
        router.refresh();
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
      }
    });
  };
  
  const isLoading = authLoading || profileLoading;

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (!user || !profile) {
    return (
        <div className="flex flex-1 items-center justify-center">
            <p>Please log in to view your profile.</p>
        </div>
    )
  }
  
  const getInitials = () => `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`;
  const questionsAsked = reports.reduce((acc, report) => acc + report.chatHistory.filter(m => m.role === 'user').length, 0);

  const isFormDirty = watchedFullName !== `${profile.firstName} ${profile.lastName}`;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><User /> Personal Information</CardTitle>
                <CardDescription>Update your personal details and contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={`https://avatar.vercel.sh/${user.uid}.png`} alt="User Avatar" data-ai-hint="person face"/>
                    <AvatarFallback>{getInitials()}</AvatarFallback>
                  </Avatar>
                  <Button type="button" variant="outline"><Camera className="mr-2 h-4 w-4" /> Change Avatar</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <Input readOnly disabled value={profile.email} />
                    <p className="text-xs text-muted-foreground pt-1">Email cannot be changed here.</p>
                  </FormItem>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bot /> AI Assistant Preferences</CardTitle>
                <CardDescription>Customize how the AI assistant communicates with you</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Language</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select a language" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="english">English</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Communication Tone</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select a tone" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="friendly">Friendly</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Account Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button type="submit" className="w-full" disabled={isPending || !isFormDirty}>
                  {isPending ? <LoaderCircle className="animate-spin" /> : <Save />}
                  Save Changes
                </Button>
                <Button type="button" variant="destructive" className="w-full" onClick={handleLogout}>
                  <LogOut /> Logout
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Member since</span>
                  <span className="font-medium">{format(new Date(profile.createdAt), 'MMM yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reports analyzed</span>
                  <span className="font-medium">{isReportsLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : reports.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Questions asked</span>
                  <span className="font-medium">{isReportsLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : questionsAsked}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  );
}


function ProfileSkeleton() {
    return (
        <div className="space-y-8">
            <div className="text-center">
                <Skeleton className="h-9 w-64 mx-auto" />
                <Skeleton className="h-5 w-80 mx-auto mt-2" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-4 w-64 mt-1" />
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-16 w-16 rounded-full" />
                                <Skeleton className="h-10 w-32" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-56" />
                            <Skeleton className="h-4 w-72 mt-1" />
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                             <div className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-8">
                    <Card>
                        <CardHeader>
                             <Skeleton className="h-6 w-32" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </CardContent>
                    </Card>
                    <Card>
                         <CardHeader>
                             <Skeleton className="h-6 w-28" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-5 w-full" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
