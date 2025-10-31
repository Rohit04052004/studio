
'use client';

import { useState, useTransition, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, LoaderCircle, X, File, Paperclip } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { processReportsAction } from '@/app/actions';
import type { Report } from '@/types';
import type { User } from 'firebase/auth';
import { Button } from '@/components/ui/button';

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
  const [files, setFiles] = useState<File[]>([]);

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles || !user) {
        if(!user) toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to upload a report.' });
        return;
    }
    setFiles(prev => [...prev, ...Array.from(newFiles)]);
  };
  
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }

  const handleProcessReports = useCallback(() => {
    if (files.length === 0 || !user) {
      return;
    }

    startTransition(async () => {
      try {
        const reportData = await Promise.all(
          files.map(file => {
            return new Promise<{name: string, dataUri: string}>((resolve, reject) => {
              const reader = new FileReader();
              reader.readAsDataURL(file);
              reader.onload = () => resolve({ name: file.name, dataUri: reader.result as string});
              reader.onerror = error => reject(error);
            });
          })
        );
        
        const result = await processReportsAction(user.uid, reportData);

        if (result.success && result.report) {
          onAddReport(result.report);
          setFiles([]);
          toast({
            title: 'Success',
            description: 'Report(s) analyzed successfully.',
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: result.error,
          });
        }
      } catch(e: any) {
         toast({
            variant: 'destructive',
            title: 'Error reading files',
            description: e.message || 'Could not read the selected files.',
          });
      }
    });

  }, [files, onAddReport, toast, user]);

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
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    handleFiles(e.target.files);
  };

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload New Report(s)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={(e) => e.preventDefault()}>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              dragActive ? 'border-primary bg-accent/20' : 'border-border hover:border-primary/50'
            }`}
          >
            <input
              type="file"
              id="file-upload"
              multiple
              className="absolute w-full h-full opacity-0 cursor-pointer"
              onChange={handleChange}
              accept="text/plain, image/png, image/jpeg, image/webp"
              disabled={isPending || !user}
            />
            <label htmlFor="file-upload" className={`flex flex-col items-center justify-center w-full h-full ${user ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                <div className="flex flex-col items-center justify-center text-center">
                  <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">TXT, PNG, JPG, or WEBP files</p>
                </div>
              </label>
          </div>
        </form>

        {files.length > 0 && (
          <div className="space-y-2">
             <h4 className="text-sm font-medium flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Selected Files ({files.length})
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md text-sm">
                        <span className="truncate pr-2">{file.name}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(index)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>
          </div>
        )}

        <Button 
            className="w-full" 
            disabled={isPending || files.length === 0} 
            onClick={handleProcessReports}
        >
            {isPending ? (
                <LoaderCircle className="animate-spin" />
            ) : (
                `Analyze ${files.length} Report(s)`
            )}
        </Button>

      </CardContent>
    </Card>
    </>
  );
}

    