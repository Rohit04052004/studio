
'use client';

import type { Report } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Image, CheckCircle2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ReportListProps {
  reports: Report[];
  selectedReportId: string | null;
  onSelectReport: (id: string) => void;
}

export function ReportList({ reports, selectedReportId, onSelectReport }: ReportListProps) {
  return (
    <div className="w-full">
        <ScrollArea className="h-96">
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
                    <div className="flex-grow text-left w-full min-w-0">
                        <p className="truncate text-sm font-medium">{report.name}</p>
                        <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(report.createdAt as string), { addSuffix: true })}
                        </p>
                    </div>
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
    </div>
  );
}
