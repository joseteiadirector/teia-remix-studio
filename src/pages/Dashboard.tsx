import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Link as LinkIcon, 
  Bot, 
  Search, 
  TrendingUp, 
  ArrowRight,
  Sparkles,
  Globe,
  BarChart3,
} from "lucide-react";

export default function Dashboard() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-background border border-border p-8 md:p-12">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/5 rounded-full blur-3xl" />
        
        <div className="relative">
          <div className="flex items-center gap-2 text-primary mb-4">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-medium">Bem-vindo ao Teia GEO</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Análise de Presença Digital
          </h1>
          <p className="text-muted-foreground max-w-2xl text-lg">
            Monitore sua visibilidade em motores de busca tradicionais e LLMs como 
            ChatGPT, Claude e Gemini. O futuro do SEO é GEO.
          </p>
          
          <div className="flex flex-wrap gap-3 mt-6">
            <Button asChild size="lg" className="gap-2">
              <Link to="/url-analysis">
                <LinkIcon className="h-4 w-4" />
                Analisar URL
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link to="/llm-mentions">
                <Bot className="h-4 w-4" />
                Ver Menções LLM
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card card-hover">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              URLs Analisadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">Últimos 30 dias</p>
          </CardContent>
        </Card>

        <Card className="glass-card card-hover">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Média SEO Score
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-geo-teal">--</div>
            <p className="text-xs text-muted-foreground mt-1">Todas as análises</p>
          </CardContent>
        </Card>

        <Card className="glass-card card-hover">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Média GEO Score
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-geo-purple">--</div>
            <p className="text-xs text-muted-foreground mt-1">Todas as análises</p>
          </CardContent>
        </Card>

        <Card className="glass-card card-hover">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Menções LLM
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">Esta semana</p>
          </CardContent>
        </Card>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="glass-card card-hover group">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-geo-teal/10 flex items-center justify-center mb-4 group-hover:bg-geo-teal/20 transition-colors">
              <LinkIcon className="h-6 w-6 text-geo-teal" />
            </div>
            <CardTitle>Análise de URL</CardTitle>
            <CardDescription>
              Analise qualquer página e obtenha scores detalhados de SEO e GEO 
              com checklist de otimizações.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="ghost" className="gap-2 p-0 h-auto text-primary hover:text-primary">
              <Link to="/url-analysis">
                Começar análise <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card card-hover group">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-geo-purple/10 flex items-center justify-center mb-4 group-hover:bg-geo-purple/20 transition-colors">
              <Bot className="h-6 w-6 text-geo-purple" />
            </div>
            <CardTitle>Menções em LLMs</CardTitle>
            <CardDescription>
              Monitore como sua marca aparece nas respostas do ChatGPT, 
              Claude, Gemini e Perplexity.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="ghost" className="gap-2 p-0 h-auto text-primary hover:text-primary">
              <Link to="/llm-mentions">
                Ver menções <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card card-hover group">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-geo-blue/10 flex items-center justify-center mb-4 group-hover:bg-geo-blue/20 transition-colors">
              <BarChart3 className="h-6 w-6 text-geo-blue" />
            </div>
            <CardTitle>Análise Competitiva</CardTitle>
            <CardDescription>
              Compare sua presença digital com concorrentes e identifique 
              oportunidades de melhoria.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="ghost" className="gap-2 p-0 h-auto text-primary hover:text-primary">
              <Link to="/competitive">
                Comparar <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Info Section */}
      <Card className="glass-card border-primary/20">
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">O que é GEO?</h3>
              <p className="text-sm text-muted-foreground">
                GEO (Generative Engine Optimization) é a otimização de conteúdo para 
                aparecer nas respostas de LLMs. Com o crescimento do uso de IA para 
                buscas, otimizar para SEO tradicional não é mais suficiente.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
