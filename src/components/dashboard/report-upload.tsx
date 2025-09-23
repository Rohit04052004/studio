
'use client';

import { useState, useTransition, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, LoaderCircle, Bug } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { processReportAction } from '@/app/actions';
import type { Report } from '@/types';
import type { User } from 'firebase/auth';

interface ReportUploadProps {
  onAddReport: (report: Report) => void;
  user: User | null;
}

type UploadResult = {
  success: boolean;
  report?: Report;
  error?: string;
} | null;

export function ReportUpload({ onAddReport, user }: ReportUploadProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [dragActive, setDragActive] = useState(false);
  const [lastResult, setLastResult] = useState<UploadResult>(null);

  const handleFile = useCallback((file: File) => {
    if (!file || !user) {
        if(!user) toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to upload a report.' });
        return;
    }


    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const dataUri = reader.result as string;
      
      // For text files, we also want to read the content as text for chat context
      if (file.type.startsWith('text/')) {
        const textReader = new FileReader();
        textReader.readAsText(file);
        textReader.onload = () => {
          const fileContent = textReader.result as string;
          startTransition(async () => {
            const result = await processReportAction(user.uid, dataUri, file.type, fileContent, file.name);
            setLastResult(result);
            if (result.success && result.report) {
              onAddReport(result.report);
              toast({
                title: 'Success',
                description: 'Report analyzed successfully.',
              });
            } else {
              toast({
                variant: 'destructive',
                title: 'Error',
                description: result.error,
              });
            }
          });
        }
      } else { // For images, fileContent is empty
         startTransition(async () => {
          const result = await processReportAction(user.uid, dataUri, file.type, '', file.name);
          setLastResult(result);
          if (result.success && result.report) {
            onAddReport(result.report);
            toast({
              title: 'Success',
              description: 'Report analyzed successfully.',
            });
          } else {
            toast({
              variant: 'destructive',
              title: 'Error',
              description: result.error,
            });
          }
        });
      }
    };
  }, [onAddReport, toast, user]);

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload New Report
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => e.preventDefault()}>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              dragActive ? 'border-primary bg-accent/20' : 'border-border hover:border-primary/50'
            }`}
          >
            <input
              type="file"
              id="file-upload"
              className="absolute w-full h-full opacity-0 cursor-pointer"
              onChange={handleChange}
              accept="text/plain, image/png, image/jpeg, image/webp"
              disabled={isPending || !user}
            />
            {isPending ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                <p>Analyzing report...</p>
              </div>
            ) : (
              <label htmlFor="file-upload" className={`flex flex-col items-center justify-center w-full h-full ${user ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                  <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">TXT, PNG, JPG, or WEBP files</p>
                </div>
              </label>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
    {lastResult && (
       <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bug className="h-5 w-5" />
              Upload Debug Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
              <h4 className="font-semibold text-sm">Last Upload Result</h4>
              <pre className="p-2 bg-muted rounded-md mt-1 max-h-64 overflow-auto">
                {JSON.stringify(lastResult, null, 2)}
              </pre>
          </CardContent>
        </Card>
    )}
    </>
  );
}
