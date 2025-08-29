'use client';

import type { Report } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Image, CheckCircle2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface ReportListProps {
  reports: Report[];
  selectedReportId: string | null;
  onSelectReport: (id: string) => void;
}

export function ReportList({ reports, selectedReportId, onSelectReport }: ReportListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Reports</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-72">
          {reports.length > 0 ? (
            <div className="space-y-2">
              {reports.map((report) => (
                <Button
                  key={report.id}
                  variant={selectedReportId === report.id ? 'secondary' : 'ghost'}
                  className="w-full justify-start h-auto py-2"
                  onClick={() => onSelectReport(report.id)}
                >
                  <div className="flex items-center gap-3 w-full">
                    {report.type === 'text' ? (
                      <FileText className="h-5 w-5 flex-shrink-0 text-primary" />
                    ) : (
                      <Image className="h-5 w-5 flex-shrink-0 text-primary" />
                    )}
                    <span className="truncate text-sm text-left flex-grow">{report.name}</span>
                    {selectedReportId === report.id && (
                       <CheckCircle2 className="h-5 w-5 text-accent" />
                    )}
                  </div>
                </Button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
              <p className="text-sm">No reports uploaded yet.</p>
              <p className="text-xs">Upload a report to get started.</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
