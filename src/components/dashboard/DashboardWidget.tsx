import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw } from 'lucide-react';

interface DashboardWidgetProps {
  title: string;
  icon?: React.ElementType;
  children: ReactNode;
  isLoading?: boolean;
  isConnected?: boolean;
  onRefresh?: () => void;
  className?: string;
}

export function DashboardWidget({
  title,
  icon: Icon,
  children,
  isLoading,
  isConnected,
  onRefresh,
  className = '',
}: DashboardWidgetProps) {
  return (
    <Card className={`group relative overflow-hidden bg-card/40 backdrop-blur-xl border-border/50 hover:border-primary/30 transition-all duration-300 ${className}`}>
      {/* Gradient border effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-purple-500/10 to-blue-500/10" />
      </div>

      <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Icon className="w-4 h-4 text-primary" />
            </div>
          )}
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </div>
        
        <div className="flex items-center gap-2">
          {isConnected !== undefined && (
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-muted'}`} />
          )}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1 rounded-md hover:bg-muted transition-colors"
              disabled={isLoading}
            >
              <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="relative z-10">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
