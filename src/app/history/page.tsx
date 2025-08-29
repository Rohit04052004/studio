import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { History } from 'lucide-react';

export default function HistoryPage() {
  return (
    <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
      <div className="flex flex-col items-center gap-1 text-center">
        <History className="h-12 w-12 text-muted-foreground" />
        <h3 className="text-2xl font-bold tracking-tight">
          No History Yet
        </h3>
        <p className="text-sm text-muted-foreground">
          Your analyzed reports and conversations will appear here.
        </p>
      </div>
    </div>
  );
}
