
'use client';

import type { Report } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bug } from 'lucide-react';

interface DebugCardProps {
  reports: Report[];
  selectedReport: Report | null;
  isLoading: boolean;
}

export function DebugCard({ reports, selectedReport, isLoading }: DebugCardProps) {
  // A safe replacer to handle circular references and format dates
  const replacer = (key: string, value: any) => {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  };

  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Debug Info
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-xs">
        <div>
          <h4 className="font-semibold text-sm">Loading State</h4>
          <pre className="p-2 bg-muted rounded-md mt-1 overflow-auto">
            isLoading: {JSON.stringify(isLoading, null, 2)}
          </pre>
        </div>
        <div>
          <h4 className="font-semibold text-sm">Reports State ({reports.length} items)</h4>
          <pre className="p-2 bg-muted rounded-md mt-1 max-h-64 overflow-auto">
            {JSON.stringify(reports, replacer, 2)}
          </pre>
        </div>
        <div>
          <h4 className="font-semibold text-sm">Selected Report State</h4>
          <pre className="p-2 bg-muted rounded-md mt-1 max-h-64 overflow-auto">
            {JSON.stringify(selectedReport, replacer, 2)}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
