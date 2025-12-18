import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBrand } from '@/contexts/BrandContext';
import { DashboardWidget } from './DashboardWidget';
import { Target, TrendingUp, TrendingDown } from 'lucide-react';

export function WidgetScoreCard() {
  const { selectedBrand } = useBrand();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['widget-score', selectedBrand?.id],
    queryFn: async () => {
      if (!selectedBrand) return null;
      
      const { data: scores } = await supabase
        .from('geo_scores')
        .select('*')
        .eq('brand_id', selectedBrand.id)
        .order('calculated_at', { ascending: false })
        .limit(2);
      
      if (!scores || scores.length === 0) return null;
      
      const current = scores[0];
      const previous = scores[1];
      const trend = previous ? current.score - previous.score : 0;
      
      return { current, trend };
    },
    enabled: !!selectedBrand,
    staleTime: 3 * 60 * 1000,
  });

  const score = data?.current?.score || 0;
  const trend = data?.trend || 0;
  const isPositive = trend >= 0;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <DashboardWidget
      title="GEO Score"
      icon={Target}
      isLoading={isLoading}
      onRefresh={() => refetch()}
    >
      <div className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <p className={`text-4xl font-bold ${getScoreColor(score)}`}>
              {score.toFixed(1)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">out of 100</p>
          </div>
          
          {trend !== 0 && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
              isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{Math.abs(trend).toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Score bar */}
        <div className="space-y-1">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${score}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Poor</span>
            <span>Average</span>
            <span>Excellent</span>
          </div>
        </div>
      </div>
    </DashboardWidget>
  );
}
