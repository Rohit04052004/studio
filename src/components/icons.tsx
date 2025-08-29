import { Stethoscope } from 'lucide-react';

export const Logo = () => (
  <div className="flex items-center gap-2">
    <Stethoscope className="h-7 w-7 text-primary" />
    <span className="text-xl font-bold tracking-tight text-foreground">
      MedReport
    </span>
  </div>
);
