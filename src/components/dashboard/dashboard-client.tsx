
'use client';

import { useState, useEffect, useTransition } from 'react';
import { ReportUpload } from './report-upload';
import { ReportList } from './report-list';
import { ReportView } from './report-view';
import { ChatInterface } from './chat-interface';
import { DebugCard } from './debug-card';
import { getReportsAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import type { Report, Message } from '@/types';
import { LoaderCircle } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

export function DashboardClient() {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    async function fetchReports() {
      if (user) {
        setIsLoading(true);
        const result = await getReportsAction(user.uid);
        if (result.success && result.reports) {
          // The sorting is now done in the server action
          setReports(result.reports);
          if (result.reports.length > 0 && !selectedReportId) {
            setSelectedReportId(result.reports[0].id);
          }
        } else {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: result.error || 'Failed to fetch reports.',
          });
        }
        setIsLoading(false);
      } else if (!authLoading) {
        setIsLoading(false);
      }
    }
    fetchReports();
  }, [user, authLoading]);

  const handleAddReport = (newReport: Report) => {
    setReports(prev => [newReport, ...prev]);
    setSelectedReportId(newReport.id);
  };

  const handleUpdateChat = (reportId: string, newMessages: Message[]) => {
     setReports(prev => prev.map(r => r.id === reportId ? { ...r, chatHistory: newMessages } : r));
  }

  const selectedReport = reports.find(r => r.id === selectedReportId) || null;
  
  if (authLoading) {
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
                <p className="text-muted-foreground text-center">Please sign in to upload and manage your reports.</p>
            </CardContent>
          </Card>
        </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full items-start">
      <div className="lg:col-span-1 flex flex-col gap-6">
        <ReportUpload onAddReport={handleAddReport} user={user} />
        <ReportList 
            reports={reports} 
            selectedReportId={selectedReportId} 
            onSelectReport={setSelectedReportId}
        />
      </div>
      <div className="lg:col-span-2 flex flex-col gap-6">
        <ReportView report={selectedReport} isLoading={isLoading} />
        <ChatInterface report={selectedReport} onUpdateChat={handleUpdateChat} />
      </div>
      <DebugCard reports={reports} selectedReport={selectedReport} isLoading={isLoading} />
    </div>
  );
}
