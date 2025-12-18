import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, RefreshCw, Gauge, Building2 } from "lucide-react";
import { toast } from "sonner";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

interface Brand {
  id: string;
  name: string;
}

type GeoBreakdown = Record<string, unknown> | null;

interface GeoScoreRow {
  score: number;
  cpi: number | null;
  breakdown: GeoBreakdown;
  calculated_at: string;
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

export default function GeoScore() {
  const { user } = useAuth();

  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>(localStorage.getItem("selectedBrandId") || "");
  const [loading, setLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);

  const [latest, setLatest] = useState<GeoScoreRow | null>(null);
  const [history, setHistory] = useState<Array<Pick<GeoScoreRow, "score" | "cpi" | "calculated_at">>>([]);

  useEffect(() => {
    setPageMeta({
      title: "GEO Score | Teia GEO",
      description: "Acompanhe seu GEO Score e CPI para visibilidade da marca em LLMs.",
      canonicalPath: "/geo-score",
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
        console.error("[GeoScore] fetch brands error", e);
        toast.error("Erro ao carregar marcas");
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchGeo = async (brandId: string) => {
    const [latestRes, historyRes] = await Promise.all([
      supabase
        .from("geo_scores")
        .select("score, cpi, breakdown, calculated_at")
        .eq("brand_id", brandId)
        .order("calculated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("geo_scores")
        .select("score, cpi, calculated_at")
        .eq("brand_id", brandId)
        .order("calculated_at", { ascending: true })
        .limit(30),
    ]);

    if (latestRes.error) {
      console.error("[GeoScore] latest error", latestRes.error);
      toast.error("Erro ao carregar GEO Score");
    } else {
      setLatest((latestRes.data as GeoScoreRow) || null);
    }

    if (historyRes.error) {
      console.error("[GeoScore] history error", historyRes.error);
    } else {
      setHistory((historyRes.data as any[]) || []);
    }
  };

  useEffect(() => {
    if (!selectedBrand) return;
    localStorage.setItem("selectedBrandId", selectedBrand);
    fetchGeo(selectedBrand);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBrand]);

  const chartData = useMemo(
    () =>
      history.map((h) => ({
        date: new Date(h.calculated_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
        score: Number(h.score) || 0,
        cpi: Number(h.cpi) || 0,
      })),
    [history]
  );

  const calculate = async () => {
    if (!selectedBrand) return;
    setIsCalculating(true);
    try {
      const { data, error } = await supabase.functions.invoke("calculate-geo-metrics", {
        body: { brandId: selectedBrand },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("GEO Score recalculado!");
        await fetchGeo(selectedBrand);
      } else {
        toast.error(data?.error || data?.message || "Não foi possível calcular agora");
      }
    } catch (e) {
      console.error("[GeoScore] calculate error", e);
      toast.error("Erro ao recalcular GEO Score");
    } finally {
      setIsCalculating(false);
    }
  };

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
          <h1 className="text-3xl font-bold tracking-tight">GEO Score</h1>
          <p className="text-muted-foreground mt-1">Faça login para ver métricas da sua marca.</p>
        </header>
        <Card className="glass-card border-dashed">
          <CardContent className="py-16 text-center">
            <h2 className="text-lg font-medium mb-2">Sessão necessária</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">Entre para visualizar e recalcular seu GEO Score.</p>
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
          <h1 className="text-3xl font-bold tracking-tight">GEO Score</h1>
          <p className="text-muted-foreground mt-1">Crie uma marca para começar a medir visibilidade em LLMs.</p>
        </header>
        <Card className="glass-card border-dashed">
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-medium mb-2">Nenhuma marca cadastrada</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">Cadastre uma marca para ativar o GEO Score.</p>
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
          <h1 className="text-3xl font-bold tracking-tight">GEO Score</h1>
          <p className="text-muted-foreground mt-1">Score de visibilidade em respostas de IA + CPI de consistência.</p>
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

          <Button variant="outline" className="gap-2" onClick={calculate} disabled={isCalculating}>
            {isCalculating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Recalcular
          </Button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="glass-card md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5 text-primary" />
              Resultado atual
            </CardTitle>
            <CardDescription>Última leitura do GEO Score</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-sm text-muted-foreground">GEO Score</p>
                <p className="text-4xl font-bold text-foreground">
                  {latest ? latest.score.toFixed(1) : "—"}
                </p>
              </div>
              <Badge variant={latest && latest.score >= 70 ? "default" : "secondary"}>
                {latest ? (latest.score >= 70 ? "Forte" : "Em evolução") : "Sem dados"}
              </Badge>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">CPI</p>
                <p className="text-2xl font-semibold text-foreground">
                  {latest?.cpi != null ? latest.cpi.toFixed(1) : "—"}
                </p>
              </div>
              <p className="text-xs text-muted-foreground text-right">
                {latest ? new Date(latest.calculated_at).toLocaleString("pt-BR") : ""}
              </p>
            </div>

            {!latest && (
              <p className="text-sm text-muted-foreground">
                Sem dados ainda. Colete menções em <Link className="underline" to="/llm-mentions">Menções LLM</Link> e recalcule.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card md:col-span-2">
          <CardHeader>
            <CardTitle>Evolução (últimas 30 medições)</CardTitle>
            <CardDescription>Histórico de GEO Score e CPI</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 1 ? (
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
                  <Line type="monotone" dataKey="score" name="GEO" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="cpi" name="CPI" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                <p>Sem histórico suficiente ainda.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
