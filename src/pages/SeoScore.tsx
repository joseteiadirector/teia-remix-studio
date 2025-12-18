import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, RefreshCw, Search, Building2, MousePointerClick, Eye, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Bar,
  BarChart,
} from "recharts";

interface Brand {
  id: string;
  name: string;
}

interface SeoMetricRow {
  id: string;
  date: string;
  clicks: number | null;
  impressions: number | null;
  ctr: number | null;
  position: number | null;
}

function setPageMeta({ title, description, canonicalPath }: { title: string; description: string; canonicalPath: string }) {
  document.title = title;

  const ensureMeta = (name: string) => {
    let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("name", name);
      document.head.appendChild(el);
    }
    return el;
  };

  ensureMeta("description").content = description;

  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.appendChild(canonical);
  }
  canonical.href = `${window.location.origin}${canonicalPath}`;
}

export default function SeoScore() {
  const { user } = useAuth();

  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>(localStorage.getItem("selectedBrandId") || "");
  const [loading, setLoading] = useState(true);

  const [metrics, setMetrics] = useState<SeoMetricRow[]>([]);

  useEffect(() => {
    setPageMeta({
      title: "SEO Score | Teia GEO",
      description: "Acompanhe métricas de SEO: cliques, impressões, CTR e posição média.",
      canonicalPath: "/seo-score",
    });
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("brands")
          .select("id, name")
          .order("name");

        if (error) throw error;

        const list = (data || []) as Brand[];
        setBrands(list);

        if (!selectedBrand && list.length > 0) {
          setSelectedBrand(list[0].id);
          localStorage.setItem("selectedBrandId", list[0].id);
        }
      } catch (e) {
        console.error("[SeoScore] fetch brands error", e);
        toast.error("Erro ao carregar marcas");
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchSeo = async (brandId: string) => {
    const { data, error } = await supabase
      .from("seo_metrics_daily")
      .select("*")
      .eq("brand_id", brandId)
      .order("date", { ascending: true })
      .limit(30);

    if (error) {
      console.error("[SeoScore] fetch error", error);
      toast.error("Erro ao carregar métricas SEO");
    } else {
      setMetrics((data as SeoMetricRow[]) || []);
    }
  };

  useEffect(() => {
    if (!selectedBrand) return;
    localStorage.setItem("selectedBrandId", selectedBrand);
    fetchSeo(selectedBrand);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBrand]);

  const latest = metrics.length > 0 ? metrics[metrics.length - 1] : null;

  const chartData = useMemo(
    () =>
      metrics.map((m) => ({
        date: new Date(m.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
        clicks: Number(m.clicks) || 0,
        impressions: Number(m.impressions) || 0,
        ctr: Number(m.ctr) || 0,
        position: Number(m.position) || 0,
      })),
    [metrics]
  );

  const totals = useMemo(() => {
    const totalClicks = metrics.reduce((sum, m) => sum + (m.clicks || 0), 0);
    const totalImpressions = metrics.reduce((sum, m) => sum + (m.impressions || 0), 0);
    const avgCtr = metrics.length > 0
      ? metrics.reduce((sum, m) => sum + (m.ctr || 0), 0) / metrics.length
      : 0;
    const avgPosition = metrics.length > 0
      ? metrics.reduce((sum, m) => sum + (m.position || 0), 0) / metrics.length
      : 0;
    return { totalClicks, totalImpressions, avgCtr, avgPosition };
  }, [metrics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <main className="space-y-6 animate-fade-in">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">SEO Score</h1>
          <p className="text-muted-foreground mt-1">Faça login para ver métricas da sua marca.</p>
        </header>
        <Card className="glass-card border-dashed">
          <CardContent className="py-16 text-center">
            <h2 className="text-lg font-medium mb-2">Sessão necessária</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">Entre para visualizar suas métricas SEO.</p>
            <Button asChild>
              <Link to="/auth">Ir para Login</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (brands.length === 0) {
    return (
      <main className="space-y-6 animate-fade-in">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">SEO Score</h1>
          <p className="text-muted-foreground mt-1">Crie uma marca para começar a medir SEO.</p>
        </header>
        <Card className="glass-card border-dashed">
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-medium mb-2">Nenhuma marca cadastrada</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">Cadastre uma marca para ativar o SEO Score.</p>
            <Button asChild>
              <Link to="/brands">Ir para Marcas</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="space-y-6 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SEO Score</h1>
          <p className="text-muted-foreground mt-1">Cliques, impressões, CTR e posição média (Google Search Console).</p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedBrand} onValueChange={setSelectedBrand}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Selecione a marca" />
            </SelectTrigger>
            <SelectContent>
              {brands.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" className="gap-2" onClick={() => fetchSeo(selectedBrand)}>
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <MousePointerClick className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-sm text-muted-foreground">Cliques (30d)</p>
            </div>
            <p className="text-3xl font-bold">{totals.totalClicks.toLocaleString("pt-BR")}</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Eye className="h-5 w-5 text-purple-500" />
              </div>
              <p className="text-sm text-muted-foreground">Impressões (30d)</p>
            </div>
            <p className="text-3xl font-bold">{totals.totalImpressions.toLocaleString("pt-BR")}</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <p className="text-sm text-muted-foreground">CTR Médio</p>
            </div>
            <p className="text-3xl font-bold">{totals.avgCtr.toFixed(2)}%</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Search className="h-5 w-5 text-orange-500" />
              </div>
              <p className="text-sm text-muted-foreground">Posição Média</p>
            </div>
            <p className="text-3xl font-bold">{totals.avgPosition.toFixed(1)}</p>
          </CardContent>
        </Card>
      </section>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Cliques & Impressões</CardTitle>
            <CardDescription>Últimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 1 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="clicks" name="Cliques" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="impressions" name="Impressões" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                <p>Sem dados suficientes ainda.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>CTR & Posição</CardTitle>
            <CardDescription>Evolução nos últimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 1 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" reversed tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="ctr" name="CTR %" stroke="hsl(var(--geo-teal))" strokeWidth={2} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="position" name="Posição" stroke="hsl(var(--geo-orange))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                <p>Sem dados suficientes ainda.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {metrics.length === 0 && (
        <Card className="glass-card border-dashed">
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Sem dados de SEO</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Conecte o Google Search Console ou importe dados para visualizar métricas SEO.
            </p>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
