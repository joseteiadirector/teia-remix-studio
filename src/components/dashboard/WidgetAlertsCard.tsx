import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBrand } from '@/contexts/BrandContext';
import { DashboardWidget } from './DashboardWidget';
import { Bell, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const severityConfig = {
  critical: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/20' },
  warning: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/20' },
  info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/20' },
};

export function WidgetAlertsCard() {
  const { selectedBrand } = useBrand();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['widget-alerts', selectedBrand?.id],
    queryFn: async () => {
      if (!selectedBrand) return null;

      const { data: alerts } = await supabase
        .from('alerts_history')
        .select('*')
        .eq('brand_id', selectedBrand.id)
        .order('triggered_at', { ascending: false })
        .limit(5);

      return alerts || [];
    },
    enabled: !!selectedBrand,
    staleTime: 60 * 1000,
  });

  const unacknowledgedCount = data?.filter(a => !a.acknowledged).length || 0;

  return (
    <DashboardWidget
      title="Recent Alerts"
      icon={Bell}
      isLoading={isLoading}
      onRefresh={() => refetch()}
    >
      <div className="space-y-3">
        {unacknowledgedCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-amber-300">
              {unacknowledgedCount} unacknowledged alert{unacknowledgedCount > 1 ? 's' : ''}
            </span>
          </div>
        )}

        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {data?.map((alert) => {
            const severity = (alert.severity as keyof typeof severityConfig) || 'info';
            const config = severityConfig[severity];
            const Icon = config.icon;

            return (
              <div
                key={alert.id}
                className={`flex items-start gap-3 p-3 rounded-lg ${config.bg} border border-border/30`}
              >
                <Icon className={`w-4 h-4 mt-0.5 ${config.color}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground line-clamp-2">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(alert.triggered_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
                {alert.acknowledged && (
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
              </div>
            );
          })}

          {(!data || data.length === 0) && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle className="w-8 h-8 text-emerald-400 mb-2" />
              <p className="text-sm text-muted-foreground">No alerts</p>
              <p className="text-xs text-muted-foreground/70">Everything is running smoothly</p>
            </div>
          )}
        </div>
      </div>
    </DashboardWidget>
  );
}
