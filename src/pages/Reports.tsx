import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Download, Plus, Building2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

interface Report {
  id: string;
  type: string;
  title: string;
  pdf_url: string | null;
  created_at: string;
}

export default function Reports() {
  const { user } = useAuth();
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

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
    if (selectedBrand) {
      fetchReports();
    }
  }, [selectedBrand]);

  const fetchReports = async () => {
    const { data } = await supabase
      .from("generated_reports")
      .select("*")
      .eq("brand_id", selectedBrand)
      .order("created_at", { ascending: false });
    if (data) setReports(data);
  };

  const handleGenerate = async (type: string) => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-manual-report", {
        body: { brandId: selectedBrand, type },
      });

      if (error) throw error;
      toast.success("Relatório gerado com sucesso!");
      fetchReports();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erro ao gerar relatório");
    } finally {
      setGenerating(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      weekly: "Semanal",
      monthly: "Mensal",
      geo: "GEO Analysis",
      seo: "SEO Analysis",
      comparison: "Comparativo",
    };
    return types[type] || type;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (brands.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-3xl font-bold">Relatórios</h1>
        <Card className="glass-card border-dashed">
          <CardContent className="py-16 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Nenhuma marca cadastrada</h3>
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
            <FileText className="h-8 w-8 text-geo-teal" />
            Relatórios
          </h1>
          <p className="text-muted-foreground mt-1">Gere e exporte relatórios de análise</p>
        </div>
        <Select value={selectedBrand} onValueChange={setSelectedBrand}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            {brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {["weekly", "monthly", "geo", "seo"].map((type) => (
          <Card key={type} className="glass-card card-hover cursor-pointer" onClick={() => handleGenerate(type)}>
            <CardContent className="pt-6 text-center">
              <Plus className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="font-medium">Gerar {getTypeLabel(type)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {generating && (
        <Card className="glass-card">
          <CardContent className="py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
            <p>Gerando relatório...</p>
          </CardContent>
        </Card>
      )}

      {/* Reports List */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Relatórios Gerados</CardTitle>
          <CardDescription>Histórico de relatórios da marca</CardDescription>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum relatório gerado ainda</p>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                  <div className="flex items-center gap-4">
                    <FileText className="h-8 w-8 text-geo-purple" />
                    <div>
                      <p className="font-medium">{report.title}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline">{getTypeLabel(report.type)}</Badge>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(report.created_at).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>
                  </div>
                  {report.pdf_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={report.pdf_url} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}