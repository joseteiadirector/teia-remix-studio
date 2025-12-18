import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBrand } from '@/contexts/BrandContext';
import { TrendingUp, TrendingDown, Globe, Search, Brain, Activity, Shield } from 'lucide-react';

const colorVariants = {
  purple: {
    bg: 'from-purple-500/30 via-purple-500/10 to-transparent',
    border: 'border-purple-500/40',
    icon: 'text-purple-400',
    glow: 'group-hover:shadow-purple-500/30',
    text: 'text-purple-300',
  },
  blue: {
    bg: 'from-blue-500/30 via-blue-500/10 to-transparent',
    border: 'border-blue-500/40',
    icon: 'text-blue-400',
    glow: 'group-hover:shadow-blue-500/30',
    text: 'text-blue-300',
  },
  emerald: {
    bg: 'from-emerald-500/30 via-emerald-500/10 to-transparent',
    border: 'border-emerald-500/40',
    icon: 'text-emerald-400',
    glow: 'group-hover:shadow-emerald-500/30',
    text: 'text-emerald-300',
  },
  amber: {
    bg: 'from-amber-500/30 via-amber-500/10 to-transparent',
    border: 'border-amber-500/40',
    icon: 'text-amber-400',
    glow: 'group-hover:shadow-amber-500/30',
    text: 'text-amber-300',
  },
  cyan: {
    bg: 'from-cyan-500/30 via-cyan-500/10 to-transparent',
    border: 'border-cyan-500/40',
    icon: 'text-cyan-400',
    glow: 'group-hover:shadow-cyan-500/30',
    text: 'text-cyan-300',
  },
};

interface KPICardProps {
  title: string;
  value: number | string;
  trend?: number;
  icon: React.ElementType;
  color: keyof typeof colorVariants;
  subtitle?: string;
  delay?: number;
}

function KPICard({ title, value, trend, icon: Icon, color, subtitle, delay = 0 }: KPICardProps) {
  const variant = colorVariants[color];
  const isPositiveTrend = trend && trend > 0;

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${variant.bg} 
        border-2 ${variant.border} backdrop-blur-xl p-5 transition-all duration-500
        hover:scale-[1.02] hover:shadow-2xl ${variant.glow}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      {/* Floating background icon */}
      <div className="absolute -right-4 -bottom-4 opacity-5">
        <Icon className="w-24 h-24" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className={`p-2 rounded-xl bg-background/40 ${variant.icon}`}>
            <Icon className="w-5 h-5" />
          </div>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-sm ${isPositiveTrend ? 'text-emerald-400' : 'text-red-400'}`}>
              {isPositiveTrend ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className={`text-3xl font-bold ${variant.text}`}>
            {typeof value === 'number' ? value.toFixed(1) : value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground/70">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function DashboardKPIHero() {
  const { selectedBrand } = useBrand();

  const { data: geoScore } = useQuery({
    queryKey: ['geo-score', selectedBrand?.id],
    queryFn: async () => {
      if (!selectedBrand) return null;
      const { data } = await supabase
        .from('geo_scores')
        .select('*')
        .eq('brand_id', selectedBrand.id)
        .order('calculated_at', { ascending: false })
        .limit(1)
        .single();
      return data;
    },
    enabled: !!selectedBrand,
  });

  const { data: igoMetrics } = useQuery({
    queryKey: ['igo-metrics', selectedBrand?.id],
    queryFn: async () => {
      if (!selectedBrand) return null;
      const { data } = await supabase
        .from('igo_metrics_history')
        .select('*')
        .eq('brand_id', selectedBrand.id)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single();
      return data;
    },
    enabled: !!selectedBrand,
  });

  const { data: mentionsCount } = useQuery({
    queryKey: ['mentions-count', selectedBrand?.id],
    queryFn: async () => {
      if (!selectedBrand) return 0;
      const { count } = await supabase
        .from('mentions_llm')
        .select('*', { count: 'exact', head: true })
        .eq('brand_id', selectedBrand.id)
        .eq('mentioned', true);
      return count || 0;
    },
    enabled: !!selectedBrand,
  });

  const kpis = [
    {
      title: 'GEO Score',
      value: geoScore?.score || 0,
      trend: 5.2,
      icon: Globe,
      color: 'purple' as const,
      subtitle: 'Generative Engine Optimization',
    },
    {
      title: 'SEO Score',
      value: 72,
      trend: 2.1,
      icon: Search,
      color: 'blue' as const,
      subtitle: 'Search Engine Optimization',
    },
    {
      title: 'LLM Mentions',
      value: mentionsCount || 0,
      trend: 12,
      icon: Brain,
      color: 'emerald' as const,
      subtitle: 'Across all AI models',
    },
    {
      title: 'CPI',
      value: igoMetrics?.cpi || 0,
      trend: -1.5,
      icon: Activity,
      color: 'amber' as const,
      subtitle: 'Cognitive Predictability Index',
    },
    {
      title: 'Stability',
      value: igoMetrics?.stability || 0,
      trend: 3.8,
      icon: Shield,
      color: 'cyan' as const,
      subtitle: 'Response Consistency',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {kpis.map((kpi, index) => (
        <KPICard key={kpi.title} {...kpi} delay={index * 100} />
      ))}
    </div>
  );
}
