'use client';

import type { Report } from '@/types';
import { useState, useMemo } from 'react';
import { ReportUpload } from './report-upload';
import { ReportList } from './report-list';
import { ReportView } from './report-view';
import { ChatInterface } from './chat-interface';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export function DashboardClient() {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const selectedReport = useMemo(
    () => reports.find((r) => r.id === selectedReportId) || null,
    [reports, selectedReportId]
  );

  const handleAddReport = (report: Omit<Report, 'id' | 'chatHistory'>) => {
    const newReport: Report = {
      ...report,
      id: `rep-${Date.now()}`,
      chatHistory: [],
    };
    setReports((prev) => [newReport, ...prev]);
    setSelectedReportId(newReport.id);
  };
  
  const handleSelectReport = (id: string) => {
    setSelectedReportId(id);
  };

  const updateChatHistory = (reportId: string, newMessages: Report['chatHistory']) => {
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
          <ReportUpload onAddReport={handleAddReport} />
          <ReportList
            reports={reports}
            selectedReportId={selectedReportId}
            onSelectReport={handleSelectReport}
          />
        </div>
      </aside>

      <div className="lg:col-span-8 xl:col-span-9">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
          <div className="lg:col-span-2">
            <ReportView report={selectedReport} />
          </div>
          <div className="lg:col-span-2">
            <ChatInterface report={selectedReport} onUpdateChat={updateChatHistory} />
          </div>
        </div>
      </div>
    </div>
  );
}
