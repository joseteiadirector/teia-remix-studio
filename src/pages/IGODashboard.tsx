import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, TrendingUp, TrendingDown, Minus, Building2, Gauge, Activity, Target, Shield } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";

interface Brand {
  id: string;
  name: string;
}

interface IGOMetric {
  id: string;
  ice: number | null;
  gap: number | null;
  cpi: number | null;
  stability: number | null;
  recorded_at: string;
}

interface GEOPillar {
  month: string;
  visibility: number | null;
  authority: number | null;
  sentiment: number | null;
  consistency: number | null;
}

const METRIC_CONFIG = {
  ice: { label: "ICE", description: "Index de Citação Estratégica", color: "hsl(var(--geo-purple))", icon: Target },
  gap: { label: "GAP", description: "Generative AI Presence", color: "hsl(var(--geo-teal))", icon: Activity },
  cpi: { label: "CPI", description: "Cognitive Performance Index", color: "hsl(var(--geo-orange))", icon: Gauge },
  stability: { label: "Stability", description: "Consistência de Menções", color: "hsl(var(--geo-green))", icon: Shield },
};

export default function IGODashboard() {
  const { user } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [metrics, setMetrics] = useState<IGOMetric[]>([]);
  const [pillars, setPillars] = useState<GEOPillar[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  const fetchBrands = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("brands")
      .select("id, name")
      .order("name");

    if (!error && data) {
      setBrands(data);
      if (data.length > 0 && !selectedBrand) {
        setSelectedBrand(data[0].id);
      }
    }
    setLoading(false);
  };

  const fetchMetrics = async () => {
    if (!selectedBrand) return;
    
    const [metricsResult, pillarsResult] = await Promise.all([
      supabase
        .from("igo_metrics_history")
        .select("*")
        .eq("brand_id", selectedBrand)
        .order("recorded_at", { ascending: true })
        .limit(30),
      supabase
        .from("geo_pillars_monthly")
        .select("*")
        .eq("brand_id", selectedBrand)
        .order("month", { ascending: true })
        .limit(12)
    ]);

    if (!metricsResult.error) {
      setMetrics(metricsResult.data || []);
    }
    if (!pillarsResult.error) {
      setPillars(pillarsResult.data || []);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, [user]);

  useEffect(() => {
    if (selectedBrand) {
      fetchMetrics();
    }
  }, [selectedBrand]);

  const handleCalculate = async () => {
    if (!selectedBrand) return;
    setCalculating(true);

    try {
      const { data, error } = await supabase.functions.invoke("calculate-geo-metrics", {
        body: { brandId: selectedBrand },
      });

      if (error) throw error;

      if (data.success) {
        toast.success("Métricas calculadas com sucesso!");
        fetchMetrics();
      } else {
        toast.error(data.error || data.message || "Erro ao calcular métricas");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erro ao calcular métricas");
    } finally {
      setCalculating(false);
    }
  };

  const getLatestMetrics = () => {
    if (metrics.length === 0) return null;
    return metrics[metrics.length - 1];
  };

  const getTrend = (current: number | null, previous: number | null) => {
    if (current === null || previous === null) return "neutral";
    if (current > previous) return "up";
    if (current < previous) return "down";
    return "neutral";
  };

  const latestMetrics = getLatestMetrics();
  const previousMetrics = metrics.length > 1 ? metrics[metrics.length - 2] : null;

  const radarData = latestMetrics ? [
    { metric: "ICE", value: latestMetrics.ice || 0, fullMark: 100 },
    { metric: "GAP", value: latestMetrics.gap || 0, fullMark: 100 },
    { metric: "CPI", value: latestMetrics.cpi || 0, fullMark: 100 },
    { metric: "Stability", value: latestMetrics.stability || 0, fullMark: 100 },
  ] : [];

  const chartData = metrics.map((m) => ({
    date: new Date(m.recorded_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
    ice: m.ice || 0,
    gap: m.gap || 0,
    cpi: m.cpi || 0,
    stability: m.stability || 0,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (brands.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">IGO Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Intelligent GEO Optimization - Métricas avançadas de presença em IA
          </p>
        </div>
        <Card className="glass-card border-dashed">
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Nenhuma marca cadastrada</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Cadastre uma marca para visualizar as métricas IGO
            </p>
            <Button asChild>
              <Link to="/brands">Ir para Marcas</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">IGO Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Intelligent GEO Optimization - Métricas avançadas de presença em IA
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedBrand} onValueChange={setSelectedBrand}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Selecione a marca" />
            </SelectTrigger>
            <SelectContent>
              {brands.map((brand) => (
                <SelectItem key={brand.id} value={brand.id}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleCalculate} disabled={calculating} variant="outline" className="gap-2">
            {calculating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Recalcular
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(Object.keys(METRIC_CONFIG) as Array<keyof typeof METRIC_CONFIG>).map((key) => {
          const config = METRIC_CONFIG[key];
          const Icon = config.icon;
          const value = latestMetrics?.[key];
          const prevValue = previousMetrics?.[key];
          const trend = getTrend(value ?? null, prevValue ?? null);

          return (
            <Card key={key} className="glass-card card-hover">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-10 w-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${config.color}20` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: config.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{config.label}</p>
                      <p className="text-xs text-muted-foreground">{config.description}</p>
                    </div>
                  </div>
                  {trend !== "neutral" && (
                    <Badge variant={trend === "up" ? "default" : "destructive"} className="gap-1">
                      {trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    </Badge>
                  )}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold" style={{ color: config.color }}>
                    {value !== null && value !== undefined ? value.toFixed(1) : "—"}
                  </span>
                  <span className="text-sm text-muted-foreground">/ 100</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Radar Chart */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Visão Geral</CardTitle>
            <CardDescription>Performance em cada dimensão IGO</CardDescription>
          </CardHeader>
          <CardContent>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                  <Radar
                    name="Score"
                    dataKey="value"
                    stroke="hsl(var(--geo-purple))"
                    fill="hsl(var(--geo-purple))"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                <p>Sem dados disponíveis</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Line Chart */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle>Evolução Temporal</CardTitle>
            <CardDescription>Histórico das métricas IGO nos últimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="ice" name="ICE" stroke="hsl(var(--geo-purple))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="gap" name="GAP" stroke="hsl(var(--geo-teal))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="cpi" name="CPI" stroke="hsl(var(--geo-orange))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="stability" name="Stability" stroke="hsl(var(--geo-green))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                <p>Colete menções para gerar dados de evolução</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pillars History */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Pilares GEO - Histórico Mensal</CardTitle>
          <CardDescription>Visibility, Authority, Sentiment e Consistency ao longo do tempo</CardDescription>
        </CardHeader>
        <CardContent>
          {pillars.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={pillars.map(p => ({
                month: new Date(p.month).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
                visibility: p.visibility || 0,
                authority: p.authority || 0,
                sentiment: p.sentiment || 0,
                consistency: p.consistency || 0,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Area type="monotone" dataKey="visibility" name="Visibility" stroke="hsl(var(--geo-purple))" fill="hsl(var(--geo-purple))" fillOpacity={0.2} stackId="1" />
                <Area type="monotone" dataKey="authority" name="Authority" stroke="hsl(var(--geo-teal))" fill="hsl(var(--geo-teal))" fillOpacity={0.2} stackId="2" />
                <Area type="monotone" dataKey="sentiment" name="Sentiment" stroke="hsl(var(--geo-orange))" fill="hsl(var(--geo-orange))" fillOpacity={0.2} stackId="3" />
                <Area type="monotone" dataKey="consistency" name="Consistency" stroke="hsl(var(--geo-green))" fill="hsl(var(--geo-green))" fillOpacity={0.2} stackId="4" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
              <Gauge className="h-12 w-12 mb-3 opacity-50" />
              <p>Sem dados de pilares mensais</p>
              <p className="text-sm">Colete menções e calcule métricas para gerar histórico</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}