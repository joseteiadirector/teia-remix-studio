import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBrand } from '@/contexts/BrandContext';
import { DashboardWidget } from './DashboardWidget';
import { MessageSquare } from 'lucide-react';

const providerColors: Record<string, string> = {
  chatgpt: 'bg-emerald-500',
  claude: 'bg-orange-500',
  gemini: 'bg-blue-500',
  perplexity: 'bg-purple-500',
};

export function WidgetMentionsChart() {
  const { selectedBrand } = useBrand();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['widget-mentions', selectedBrand?.id],
    queryFn: async () => {
      if (!selectedBrand) return null;

      const { data: mentions } = await supabase
        .from('mentions_llm')
        .select('provider, mentioned, confidence')
        .eq('brand_id', selectedBrand.id)
        .order('collected_at', { ascending: false })
        .limit(100);

      if (!mentions) return null;

      // Group by provider
      const byProvider: Record<string, { total: number; mentioned: number; avgConfidence: number }> = {};
      
      mentions.forEach((m) => {
        if (!byProvider[m.provider]) {
          byProvider[m.provider] = { total: 0, mentioned: 0, avgConfidence: 0 };
        }
        byProvider[m.provider].total++;
        if (m.mentioned) {
          byProvider[m.provider].mentioned++;
          byProvider[m.provider].avgConfidence += m.confidence || 0;
        }
      });

      // Calculate averages
      Object.keys(byProvider).forEach((key) => {
        const p = byProvider[key];
        if (p.mentioned > 0) {
          p.avgConfidence = p.avgConfidence / p.mentioned;
        }
      });

      return byProvider;
    },
    enabled: !!selectedBrand,
    staleTime: 3 * 60 * 1000,
  });

  const providers = data ? Object.entries(data) : [];
  const totalMentions = providers.reduce((acc, [, v]) => acc + v.mentioned, 0);

  return (
    <DashboardWidget
      title="LLM Mentions"
      icon={MessageSquare}
      isLoading={isLoading}
      onRefresh={() => refetch()}
    >
      <div className="space-y-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-foreground">{totalMentions}</span>
          <span className="text-sm text-muted-foreground">total mentions</span>
        </div>

        <div className="space-y-3">
          {providers.map(([provider, stats]) => {
            const rate = stats.total > 0 ? (stats.mentioned / stats.total) * 100 : 0;
            return (
              <div key={provider} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="capitalize font-medium">{provider}</span>
                  <span className="text-muted-foreground">
                    {stats.mentioned}/{stats.total} ({rate.toFixed(0)}%)
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${providerColors[provider] || 'bg-primary'}`}
                    style={{ width: `${rate}%` }}
                  />
                </div>
              </div>
            );
          })}

          {providers.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No mention data yet. Run a query to collect data.
            </p>
          )}
        </div>
      </div>
    </DashboardWidget>
  );
}
