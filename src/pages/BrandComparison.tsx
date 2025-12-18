import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, GitCompare, Plus, Building2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Comparison {
  id: string;
  competitor_name: string;
  competitor_domain: string | null;
  geo_score: number | null;
  seo_score: number | null;
  compared_at: string;
}

export default function BrandComparison() {
  const { user } = useAuth();
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCompetitor, setNewCompetitor] = useState({ name: "", domain: "" });
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    const fetchBrands = async () => {
      if (!user) return;
      const { data } = await supabase.from("brands").select("id, name").order("name");
      if (data) {
        setBrands(data);
        if (data.length > 0) setSelectedBrand(data[0].id);
      }
      setLoading(false);
    };
    fetchBrands();
  }, [user]);

  useEffect(() => {
    if (selectedBrand) fetchComparisons();
  }, [selectedBrand]);

  const fetchComparisons = async () => {
    const { data } = await supabase
      .from("competitor_comparisons")
      .select("*")
      .eq("brand_id", selectedBrand)
      .order("compared_at", { ascending: false });
    if (data) setComparisons(data);
  };

  const handleCompare = async () => {
    if (!newCompetitor.name.trim()) {
      toast.error("Digite o nome do concorrente");
      return;
    }
    setComparing(true);
    try {
      // Simulate comparison scores
      const geoScore = Math.floor(Math.random() * 40) + 40;
      const seoScore = Math.floor(Math.random() * 40) + 40;

      const { error } = await supabase.from("competitor_comparisons").insert({
        brand_id: selectedBrand,
        competitor_name: newCompetitor.name,
        competitor_domain: newCompetitor.domain || null,
        geo_score: geoScore,
        seo_score: seoScore,
      });

      if (error) throw error;
      toast.success("Comparação adicionada!");
      setNewCompetitor({ name: "", domain: "" });
      fetchComparisons();
    } catch (error) {
      toast.error("Erro ao comparar");
    } finally {
      setComparing(false);
    }
  };

  const chartData = comparisons.slice(0, 5).map(c => ({
    name: c.competitor_name,
    GEO: c.geo_score || 0,
    SEO: c.seo_score || 0,
  }));

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (brands.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-3xl font-bold">Comparação</h1>
        <Card className="glass-card border-dashed">
          <CardContent className="py-16 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <Button asChild><Link to="/brands">Ir para Marcas</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <GitCompare className="h-8 w-8 text-geo-purple" />
            Comparação Competitiva
          </h1>
          <p className="text-muted-foreground mt-1">Compare sua marca com concorrentes</p>
        </div>
        <Select value={selectedBrand} onValueChange={setSelectedBrand}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            {brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Add Competitor */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Adicionar Concorrente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Nome do concorrente"
              value={newCompetitor.name}
              onChange={(e) => setNewCompetitor(p => ({ ...p, name: e.target.value }))}
            />
            <Input
              placeholder="Domínio (opcional)"
              value={newCompetitor.domain}
              onChange={(e) => setNewCompetitor(p => ({ ...p, domain: e.target.value }))}
            />
            <Button onClick={handleCompare} disabled={comparing} className="gap-2">
              {comparing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Comparar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Visão Comparativa</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                <Legend />
                <Bar dataKey="GEO" fill="hsl(var(--geo-purple))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="SEO" fill="hsl(var(--geo-teal))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Comparisons List */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Concorrentes Analisados</CardTitle>
        </CardHeader>
        <CardContent>
          {comparisons.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum concorrente adicionado</p>
          ) : (
            <div className="space-y-3">
              {comparisons.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                  <div>
                    <p className="font-medium">{c.competitor_name}</p>
                    {c.competitor_domain && <p className="text-sm text-muted-foreground">{c.competitor_domain}</p>}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-geo-purple">{c.geo_score || "—"}</p>
                      <p className="text-xs text-muted-foreground">GEO</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-geo-teal">{c.seo_score || "—"}</p>
                      <p className="text-xs text-muted-foreground">SEO</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}