/**
 * KAPI Metrics Configuration - Single Source of Truth
 * Baseado no documento científico: "Observabilidade Cognitiva Generativa"
 * 
 * As métricas KAPI medem a qualidade da presença de marca em LLMs:
 * - ICE (Index of Cognitive Efficiency): Eficiência cognitiva
 * - GAP (Observability Alignment Precision): Precisão de alinhamento
 * - CPI (Cognitive Predictability Index): Previsibilidade cognitiva
 * - Stability: Estabilidade entre providers
 */

export interface KAPILevel {
  value: number;
  label: string;
  color: string;
}

export interface KAPIConfig {
  id: string;
  name: string;
  fullName: string;
  description: string;
  logic: 'direct' | 'inverse'; // direct = maior é melhor, inverse = menor é melhor
  threshold: number;
  unit: string;
  levels: {
    excellent: KAPILevel;
    good: KAPILevel;
    regular: KAPILevel;
    critical: KAPILevel;
  };
}

export const ICE_CONFIG: KAPIConfig = {
  id: 'ice',
  name: 'ICE',
  fullName: 'Index of Cognitive Efficiency',
  description: 'Mede a eficiência com que a marca é processada cognitivamente pelos LLMs',
  logic: 'direct',
  threshold: 75,
  unit: '%',
  levels: {
    excellent: { value: 90, label: 'Excelente', color: 'emerald' },
    good: { value: 75, label: 'Bom', color: 'yellow' },
    regular: { value: 60, label: 'Regular', color: 'orange' },
    critical: { value: 0, label: 'Crítico', color: 'red' },
  },
};

export const GAP_CONFIG: KAPIConfig = {
  id: 'gap',
  name: 'GAP',
  fullName: 'Observability Alignment Precision',
  description: 'Precisão de alinhamento entre observabilidade esperada e real',
  logic: 'direct',
  threshold: 60,
  unit: '%',
  levels: {
    excellent: { value: 85, label: 'Excelente', color: 'emerald' },
    good: { value: 60, label: 'Bom', color: 'yellow' },
    regular: { value: 40, label: 'Regular', color: 'orange' },
    critical: { value: 0, label: 'Crítico', color: 'red' },
  },
};

export const CPI_CONFIG: KAPIConfig = {
  id: 'cpi',
  name: 'CPI',
  fullName: 'Cognitive Predictability Index',
  description: 'Mede a consistência de menções entre diferentes LLMs',
  logic: 'direct',
  threshold: 70,
  unit: '%',
  levels: {
    excellent: { value: 85, label: 'Excelente', color: 'emerald' },
    good: { value: 70, label: 'Bom', color: 'yellow' },
    regular: { value: 50, label: 'Regular', color: 'orange' },
    critical: { value: 0, label: 'Crítico', color: 'red' },
  },
};

export const STABILITY_CONFIG: KAPIConfig = {
  id: 'stability',
  name: 'Stability',
  fullName: 'Cognitive Stability Index',
  description: 'Estabilidade da confiança de menções ao longo do tempo',
  logic: 'direct',
  threshold: 65,
  unit: '%',
  levels: {
    excellent: { value: 80, label: 'Excelente', color: 'emerald' },
    good: { value: 65, label: 'Bom', color: 'yellow' },
    regular: { value: 45, label: 'Regular', color: 'orange' },
    critical: { value: 0, label: 'Crítico', color: 'red' },
  },
};

export const KAPI_CONFIGS: Record<string, KAPIConfig> = {
  ice: ICE_CONFIG,
  gap: GAP_CONFIG,
  cpi: CPI_CONFIG,
  stability: STABILITY_CONFIG,
};

export interface MetricClassification {
  label: string;
  color: string;
  level: 'excellent' | 'good' | 'regular' | 'critical';
  value: number;
}

/**
 * Classifica um valor de métrica KAPI baseado na configuração
 */
export function classifyKAPIMetric(metricId: string, value: number): MetricClassification {
  const config = KAPI_CONFIGS[metricId];
  
  if (!config) {
    return { label: 'N/A', color: 'gray', level: 'critical', value };
  }

  const { levels } = config;

  if (value >= levels.excellent.value) {
    return { label: levels.excellent.label, color: levels.excellent.color, level: 'excellent', value };
  }
  if (value >= levels.good.value) {
    return { label: levels.good.label, color: levels.good.color, level: 'good', value };
  }
  if (value >= levels.regular.value) {
    return { label: levels.regular.label, color: levels.regular.color, level: 'regular', value };
  }
  return { label: levels.critical.label, color: levels.critical.color, level: 'critical', value };
}

/**
 * Retorna a cor Tailwind para uma métrica
 */
export function getMetricColorClass(classification: MetricClassification): string {
  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-500',
    yellow: 'text-yellow-500',
    orange: 'text-orange-500',
    red: 'text-red-500',
    gray: 'text-gray-500',
  };
  return colorMap[classification.color] || 'text-gray-500';
}

/**
 * Retorna a cor de fundo para uma métrica
 */
export function getMetricBgClass(classification: MetricClassification): string {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-500/20',
    yellow: 'bg-yellow-500/20',
    orange: 'bg-orange-500/20',
    red: 'bg-red-500/20',
    gray: 'bg-gray-500/20',
  };
  return colorMap[classification.color] || 'bg-gray-500/20';
}

/**
 * Calcula o score IGO (Intelligence Gap Observability)
 * Fórmula: (ICE * 0.3) + (GAP * 0.25) + (CPI * 0.25) + (Stability * 0.2)
 */
export function calculateIGOScore(metrics: {
  ice: number;
  gap: number;
  cpi: number;
  stability: number;
}): number {
  const { ice, gap, cpi, stability } = metrics;
  return (ice * 0.30) + (gap * 0.25) + (cpi * 0.25) + (stability * 0.20);
}

/**
 * Lista de todas as métricas disponíveis
 */
export const KAPI_METRIC_IDS = ['ice', 'gap', 'cpi', 'stability'] as const;
export type KAPIMetricId = typeof KAPI_METRIC_IDS[number];
