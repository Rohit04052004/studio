
'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, MessageSquare, User, Bot, History, ArrowRight, ShieldCheck, ShieldAlert, LoaderCircle, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useState, useEffect } from 'react';
import { getReportsAction, getUserProfileAction } from '../actions';
import type { Report, UserProfile } from '@/types';
import { Bar, BarChart, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { format, parseISO } from 'date-fns';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (user) {
        setLoading(true);
        const [profileResult, reportsResult] = await Promise.all([
          getUserProfileAction(user.uid),
          getReportsAction(user.uid)
        ]);

        if (profileResult.success && profileResult.profile) {
          setProfile(profileResult.profile);
        }
        if (reportsResult.success && reportsResult.reports) {
          setReports(reportsResult.reports);
        }
        setLoading(false);
      } else if (!authLoading) {
        setLoading(false);
      }
    }
    fetchData();
  }, [user, authLoading]);
  
  if (loading || authLoading) {
    return (
        <div className="flex items-center justify-center h-full">
            <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
        </div>
    )
  }
  
  if (!user) {
      return (
         <div className="flex flex-1 items-center justify-center">
          <Card className="w-full max-w-4xl">
            <CardContent className="flex items-center justify-center h-full p-12">
                <p className="text-muted-foreground text-center">Please sign in to view the dashboard.</p>
            </CardContent>
          </Card>
        </div>
    )
  }
  
  const reportsByMonth = reports.reduce((acc, report) => {
    const month = format(parseISO(report.createdAt as string), 'MMM');
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const reportsOverTimeData = Object.keys(reportsByMonth).map(month => ({
    month,
    reports: reportsByMonth[month],
  }));

  const reportTypes = reports.reduce((acc, report) => {
    const type = report.type.charAt(0).toUpperCase() + report.type.slice(1);
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const reportTypesData = Object.keys(reportTypes).map(type => ({
    name: type,
    value: reportTypes[type],
  }));
  
  const PIE_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];


  return (
    <div className="flex flex-col gap-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Welcome back, {profile?.firstName || 'User'}!
        </h1>
        <p className="max-w-3xl mx-auto text-lg text-muted-foreground">
          Here's a summary of your recent activity. Jump back in to analyze a new report or continue a conversation with our AI assistant.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Reports Analyzed
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Chat Sessions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.filter(r => (r.chatHistory || []).length > 0).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Last Login</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3/> Reports Over Time</CardTitle>
          </CardHeader>
          <CardContent>
             <ChartContainer config={{}} className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportsOverTimeData}>
                    <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="reports" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><PieChartIcon/> Report Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={reportTypesData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                            {reportTypesData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<ChartTooltipContent />} />
                    </PieChart>
                </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot />
              AI Assistant
            </CardTitle>
            <CardDescription>
              Get answers to your health questions using advanced RAG technology.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow" />
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/assistant">
                Ask Assistant <ArrowRight />
              </Link>
            </Button>
          </CardFooter>
        </Card>
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText />
              Report Analysis
            </CardTitle>
            <CardDescription>
              Upload and analyze your medical reports with AI interpretation.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow" />
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/reports">
                Upload Report <ArrowRight />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

    