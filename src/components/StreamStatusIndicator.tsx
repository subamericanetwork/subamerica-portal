import { Badge } from "@/components/ui/badge";
import { Loader2, Radio, CircleOff, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreamStatusIndicatorProps {
  status: 'idle' | 'creating' | 'waiting' | 'live' | 'ended';
  className?: string;
}

export const StreamStatusIndicator = ({ status, className }: StreamStatusIndicatorProps) => {
  const statusConfig = {
    idle: {
      icon: CircleOff,
      label: 'Not Streaming',
      variant: 'secondary' as const,
      color: 'text-muted-foreground',
    },
    creating: {
      icon: Loader2,
      label: 'Creating...',
      variant: 'secondary' as const,
      color: 'text-blue-500',
      animate: true,
    },
    waiting: {
      icon: Radio,
      label: 'Waiting for Stream',
      variant: 'outline' as const,
      color: 'text-yellow-500',
      pulse: true,
    },
    live: {
      icon: Radio,
      label: 'LIVE',
      variant: 'destructive' as const,
      color: 'text-red-500',
      pulse: true,
    },
    ended: {
      icon: CheckCircle2,
      label: 'Stream Ended',
      variant: 'secondary' as const,
      color: 'text-green-500',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={cn("gap-2", className)}>
      <Icon 
        className={cn(
          "h-3 w-3",
          config.color,
          'animate' in config && config.animate && "animate-spin",
          'pulse' in config && config.pulse && "animate-pulse"
        )} 
      />
      {config.label}
    </Badge>
  );
};
