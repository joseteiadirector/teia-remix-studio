import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface IGOMetrics {
  ice: number;      // Índice de Eficiência Cognitiva
  gap: number;      // Precisão de Alinhamento de Observabilidade
  cpi: number;      // Índice de Previsibilidade Cognitiva
  stability: number; // Estabilidade Cognitiva
}

export interface KAPIMetricsResponse {
  brandId: string;
  metrics: IGOMetrics;
  metadata: {
    totalMentions: number;
    correctMentions: number;
    providers: string[];
    calculatedAt: string;
  };
}

export function useKAPIMetrics(brandId: string | undefined) {
  const queryClient = useQueryClient();

  // Fetch latest IGO metrics
  const metricsQuery = useQuery({
    queryKey: ['kapi-metrics', brandId],
    queryFn: async (): Promise<KAPIMetricsResponse | null> => {
      if (!brandId) return null;

      const { data, error } = await supabase
        .from('igo_metrics_history')
        .select('*')
        .eq('brand_id', brandId)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No data
        throw error;
      }

      return {
        brandId,
        metrics: {
          ice: data.ice || 0,
          gap: data.gap || 0,
          cpi: data.cpi || 0,
          stability: data.stability || 0,
        },
        metadata: {
          totalMentions: 0,
          correctMentions: 0,
          providers: [],
          calculatedAt: data.recorded_at,
        },
      };
    },
    enabled: !!brandId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch metrics history for charts
  const historyQuery = useQuery({
    queryKey: ['kapi-metrics-history', brandId],
    queryFn: async () => {
      if (!brandId) return [];

      const { data, error } = await supabase
        .from('igo_metrics_history')
        .select('*')
        .eq('brand_id', brandId)
        .order('recorded_at', { ascending: true })
        .limit(30);

      if (error) throw error;
      return data || [];
    },
    enabled: !!brandId,
    staleTime: 5 * 60 * 1000,
  });

  // Calculate new metrics
  const calculateMutation = useMutation({
    mutationFn: async () => {
      if (!brandId) throw new Error('Brand ID required');

      const { data, error } = await supabase.functions.invoke('calculate-igo-metrics', {
        body: { brandId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kapi-metrics', brandId] });
      queryClient.invalidateQueries({ queryKey: ['kapi-metrics-history', brandId] });
      toast({
        title: 'Métricas calculadas',
        description: 'As métricas IGO foram recalculadas com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao calcular métricas',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  return {
    metrics: metricsQuery.data?.metrics,
    metadata: metricsQuery.data?.metadata,
    history: historyQuery.data,
    isLoading: metricsQuery.isLoading,
    isHistoryLoading: historyQuery.isLoading,
    isCalculating: calculateMutation.isPending,
    calculate: calculateMutation.mutate,
    refetch: metricsQuery.refetch,
  };
}
