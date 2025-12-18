import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScoreRing } from "@/components/url-analysis/ScoreRing";
import { ChecklistItem } from "@/components/url-analysis/ChecklistItem";
import { Search, Loader2, Globe, Bot, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface AnalysisResult {
  url: string;
  seoScore: number;
  geoScore: number;
  checklist: {
    title: string;
    description: string;
    status: "pass" | "fail" | "warning";
    category: string;
  }[];
  analyzedAt: string;
}

export default function UrlAnalysis() {
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (!url.trim()) {
      toast.error("Digite uma URL para analisar");
      return;
    }

    // Basic URL validation
    try {
      new URL(url.startsWith("http") ? url : `https://${url}`);
    } catch {
      toast.error("URL inválida");
      return;
    }

    setIsAnalyzing(true);

    // Simulated analysis for now - will be replaced with actual API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock result
    setResult({
      url: url.startsWith("http") ? url : `https://${url}`,
      seoScore: Math.floor(Math.random() * 30) + 65,
      geoScore: Math.floor(Math.random() * 40) + 45,
      checklist: [
        {
          title: "Meta Title",
          description: "Título encontrado e com tamanho adequado (55 caracteres)",
          status: "pass",
          category: "SEO",
        },
        {
          title: "Meta Description",
          description: "Descrição presente mas pode ser otimizada para incluir mais palavras-chave",
          status: "warning",
          category: "SEO",
        },
        {
          title: "Heading Structure",
          description: "Estrutura H1-H6 bem organizada",
          status: "pass",
          category: "SEO",
        },
        {
          title: "Mobile Friendly",
          description: "Página responsiva e otimizada para mobile",
          status: "pass",
          category: "UX",
        },
        {
          title: "Page Speed",
          description: "LCP acima de 2.5s - considere otimizar imagens",
          status: "warning",
          category: "Performance",
        },
        {
          title: "Mencionado no ChatGPT",
          description: "Marca não aparece nas respostas do ChatGPT para queries relevantes",
          status: "fail",
          category: "GEO",
        },
        {
          title: "Mencionado no Claude",
          description: "Marca citada em 2 de 10 queries testadas",
          status: "warning",
          category: "GEO",
        },
        {
          title: "Conteúdo Citável",
          description: "Conteúdo estruturado com dados e estatísticas que podem ser citados por LLMs",
          status: "pass",
          category: "GEO",
        },
        {
          title: "Schema Markup",
          description: "Schema.org estruturado não encontrado",
          status: "fail",
          category: "SEO",
        },
      ],
      analyzedAt: new Date().toISOString(),
    });

    setIsAnalyzing(false);
    toast.success("Análise concluída!");
  };

  const seoItems = result?.checklist.filter((item) => item.category === "SEO" || item.category === "UX" || item.category === "Performance") || [];
  const geoItems = result?.checklist.filter((item) => item.category === "GEO") || [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Análise de URL</h1>
        <p className="text-muted-foreground mt-1">
          Analise qualquer página para obter scores de SEO e GEO com recomendações acionáveis
        </p>
      </div>

      {/* URL Input */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Digite a URL para analisar (ex: exemplo.com.br)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                className="pl-10 h-12 text-base"
              />
            </div>
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              size="lg"
              className="h-12 px-6 gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Analisar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <div className="space-y-6 animate-fade-in">
          {/* Scores Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="glass-card card-hover">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-geo-teal" />
                  SEO Score
                </CardTitle>
                <CardDescription>
                  Otimização para motores de busca tradicionais
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center py-6">
                <ScoreRing score={result.seoScore} label="SEO Score" size="lg" variant="seo" />
              </CardContent>
            </Card>

            <Card className="glass-card card-hover">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-geo-purple" />
                  GEO Score
                </CardTitle>
                <CardDescription>
                  Visibilidade em LLMs (ChatGPT, Claude, Gemini)
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center py-6">
                <ScoreRing score={result.geoScore} label="GEO Score" size="lg" variant="geo" />
              </CardContent>
            </Card>
          </div>

          {/* URL Analyzed */}
          <Card className="glass-card">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <span className="font-mono text-sm">{result.url}</span>
                </div>
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1 text-sm"
                >
                  Visitar <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Checklist */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Checklist de Otimização</CardTitle>
              <CardDescription>
                Itens verificados na análise com recomendações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="all">Todos ({result.checklist.length})</TabsTrigger>
                  <TabsTrigger value="seo">SEO ({seoItems.length})</TabsTrigger>
                  <TabsTrigger value="geo">GEO ({geoItems.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-3">
                  {result.checklist.map((item, index) => (
                    <ChecklistItem key={index} {...item} />
                  ))}
                </TabsContent>

                <TabsContent value="seo" className="space-y-3">
                  {seoItems.map((item, index) => (
                    <ChecklistItem key={index} {...item} />
                  ))}
                </TabsContent>

                <TabsContent value="geo" className="space-y-3">
                  {geoItems.map((item, index) => (
                    <ChecklistItem key={index} {...item} />
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {!result && !isAnalyzing && (
        <Card className="glass-card border-dashed">
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Nenhuma análise realizada</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Digite uma URL acima para analisar a presença digital da página, 
              incluindo métricas de SEO tradicional e visibilidade em LLMs.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
