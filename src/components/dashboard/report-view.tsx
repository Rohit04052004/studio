
'use client';

import type { Report } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import NextImage from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, FileText, Bot, Eye } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { Markdown } from '../markdown';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription
} from '@/components/ui/dialog';

export function ReportView({ report, isLoading }: { report: Report | null, isLoading: boolean }) {
  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/4" />
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                </div>
                <Separator />
                <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                </div>
            </CardContent>
        </Card>
    )
  }
  if (!report) {
    return (
      <Card className="flex h-full min-h-[400px] items-center justify-center">
        <CardContent className="text-center text-muted-foreground p-6">
          <FileText className="mx-auto h-12 w-12" />
          <h3 className="mt-4 text-lg font-semibold">No Report Selected</h3>
          <p className="mt-1 text-sm">Select a report from the list to view its summary, or upload a new one.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="truncate max-w-md">{report.name}</CardTitle>
                <CardDescription>AI-Generated Analysis</CardDescription>
            </div>
            <Badge variant={report.type === 'text' ? 'secondary' : 'outline'}>
                {report.type.charAt(0).toUpperCase() + report.type.slice(1)}
            </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                    <Bot className="mr-2 h-4 w-4" />
                    View AI Summary
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>AI-Generated Summary</DialogTitle>
                    <DialogDescription>
                        Analysis of: {report.name}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-grow overflow-hidden">
                    <ScrollArea className="h-full w-full rounded-md border">
                        <div className="p-4 bg-muted/50 h-full">
                        <Markdown content={report.highlightedSummary || report.summary || 'No summary available.'} />
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>

        <Separator />
        
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                    <Eye className="mr-2 h-4 w-4" />
                    Show Original Report
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{report.name}</DialogTitle>
                </DialogHeader>
                <div className="flex-grow overflow-hidden">
                    <ScrollArea className="h-full w-full rounded-md border p-4">
                        {report.type === 'image' ? (
                        <NextImage
                            src={report.content!}
                            alt={report.name}
                            width={800}
                            height={1000}
                            className="rounded-md object-contain w-full h-auto"
                            data-ai-hint="medical scan"
                        />
                        ) : (
                        <pre className="whitespace-pre-wrap text-sm font-mono">{report.originalText || report.content}</pre>
                        )}
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>

        <div className="flex items-start space-x-2 rounded-lg border border-yellow-200/50 bg-yellow-950/30 p-3 text-yellow-200">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-yellow-400" />
          <p className="text-xs">
            <strong>Disclaimer:</strong> This AI analysis is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
