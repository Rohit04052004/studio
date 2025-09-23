
'use client';

import type { Report, Message } from '@/types';
import { useState, useMemo, useEffect } from 'react';
import { ReportUpload } from './report-upload';
import { ReportList } from './report-list';
import { ReportView } from './report-view';
import { ChatInterface } from './chat-interface';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getReportsAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';
import { useAuth } from '@/hooks/use-auth';

export function DashboardClient() {
  const { user, loading: authLoading } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
        setIsLoading(true);
        getReportsAction(user.uid)
            .then(result => {
                if (result.success && result.reports) {
                    setReports(result.reports);
                    // Select the first report only if no report is currently selected
                    if (result.reports.length > 0 && !selectedReportId) {
                        setSelectedReportId(result.reports[0].id);
                    }
                } else {
                    toast({ variant: 'destructive', title: 'Error', description: result.error });
                }
            })
            .finally(() => setIsLoading(false));
    } else if (!authLoading) {
        setIsLoading(false);
        setReports([]);
        setSelectedReportId(null);
    }
  }, [user, authLoading, toast]);


  const selectedReport = useMemo(
    () => reports.find((r) => r.id === selectedReportId) || null,
    [reports, selectedReportId]
  );

  const handleAddReport = (report: Report) => {
    setReports((prev) => [report, ...prev]);
    setSelectedReportId(report.id);
  };
  
  const handleSelectReport = (id: string) => {
    setSelectedReportId(id);
  };

  const updateChatHistory = (reportId: string, newMessages: Message[]) => {
    setReports(prevReports => 
      prevReports.map(report => 
        report.id === reportId 
          ? { ...report, chatHistory: newMessages } 
          : report
      )
    );
  };

  return (
    <div className="container mx-auto grid grid-cols-1 gap-6 p-4 sm:p-6 lg:grid-cols-12 lg:gap-8">
      <aside className="lg:col-span-4 xl:col-span-3">
        <div className="space-y-6">
          <ReportUpload onAddReport={handleAddReport} user={user} />
           {isLoading || authLoading ? (
            <Card>
              <CardHeader>
                <CardTitle>My Reports</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ) : (
            <ReportList
              reports={reports}
              selectedReportId={selectedReportId}
              onSelectReport={handleSelectReport}
            />
          )}
        </div>
      </aside>

      <div className="lg:col-span-8 xl:col-span-9">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
          <div className="lg:col-span-2">
             <ReportView report={selectedReport} isLoading={isLoading || authLoading} />
          </div>
          <div className="lg:col-span-2">
            <ChatInterface report={selectedReport} onUpdateChat={updateChatHistory} />
          </div>
        </div>
      </div>
    </div>
  );
}
