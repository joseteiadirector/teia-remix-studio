import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bot, Loader2, Search, RefreshCw, MessageSquare, Building2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

interface Brand {
  id: string;
  name: string;
}

interface Mention {
  id: string;
  provider: string;
  query: string;
  mentioned: boolean;
  confidence: number | null;
  answer_excerpt: string | null;
  position: number | null;
  collected_at: string;
}

const PROVIDERS = [
  { value: "chatgpt", label: "ChatGPT", color: "bg-emerald-500" },
  { value: "gemini", label: "Google Gemini", color: "bg-blue-500" },
  { value: "claude", label: "Claude", color: "bg-orange-500" },
  { value: "perplexity", label: "Perplexity", color: "bg-purple-500" },
];

export default function LLMMentions() {
  const { user } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [loading, setLoading] = useState(true);
  const [collecting, setCollecting] = useState(false);
  const [query, setQuery] = useState("");

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

  const fetchMentions = async () => {
    if (!selectedBrand) return;
    
    const { data, error } = await supabase
      .from("mentions_llm")
      .select("*")
      .eq("brand_id", selectedBrand)
      .order("collected_at", { ascending: false })
      .limit(50);

    if (!error) {
      setMentions(data || []);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, [user]);

  useEffect(() => {
    if (selectedBrand) {
      fetchMentions();
    }
  }, [selectedBrand]);

  const handleCollect = async () => {
    if (!selectedBrand || !query.trim()) {
      toast.error("Selecione uma marca e digite uma consulta");
      return;
    }

    setCollecting(true);

    try {
      const { data, error } = await supabase.functions.invoke("collect-llm-mentions", {
        body: { brandId: selectedBrand, query: query.trim() },
      });

      if (error) throw error;

      if (data.success) {
        toast.success(`Menções coletadas: ${data.results?.length || 0} providers`);
        fetchMentions();
        setQuery("");
      } else {
        toast.error(data.error || "Erro ao coletar menções");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erro ao coletar menções");
    } finally {
      setCollecting(false);
    }
  };

  const getProviderConfig = (provider: string) => {
    return PROVIDERS.find(p => p.value === provider) || PROVIDERS[0];
  };

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
          <h1 className="text-3xl font-bold tracking-tight">Menções LLM</h1>
          <p className="text-muted-foreground mt-1">
            Monitore como sua marca aparece em ChatGPT, Claude, Gemini e Perplexity
          </p>
        </div>
        <Card className="glass-card border-dashed">
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Nenhuma marca cadastrada</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Você precisa cadastrar uma marca antes de coletar menções
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Menções LLM</h1>
        <p className="text-muted-foreground mt-1">
          Monitore como sua marca aparece em ChatGPT, Claude, Gemini e Perplexity
        </p>
      </div>

      {/* Controls */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-48">
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger>
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
            </div>
            <div className="flex-1 flex gap-3">
              <Input
                placeholder="Digite uma consulta (ex: melhor CRM para vendas)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCollect()}
              />
              <Button onClick={handleCollect} disabled={collecting} className="gap-2">
                {collecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Coletando...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Coletar
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Provider Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {PROVIDERS.map((provider) => {
          const providerMentions = mentions.filter(m => m.provider === provider.value);
          const mentionedCount = providerMentions.filter(m => m.mentioned).length;
          return (
            <Card key={provider.value} className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`h-3 w-3 rounded-full ${provider.color}`} />
                  <span className="font-medium">{provider.label}</span>
                </div>
                <div className="text-2xl font-bold">
                  {mentionedCount}/{providerMentions.length}
                </div>
                <p className="text-xs text-muted-foreground">menções encontradas</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Mentions List */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Histórico de Menções</CardTitle>
              <CardDescription>Últimas consultas e respostas dos LLMs</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchMentions} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {mentions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma menção coletada ainda</p>
              <p className="text-sm">Use o campo acima para coletar menções</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mentions.map((mention) => {
                const providerConfig = getProviderConfig(mention.provider);
                return (
                  <div
                    key={mention.id}
                    className={`p-4 rounded-lg border ${
                      mention.mentioned 
                        ? "bg-geo-green/5 border-geo-green/20" 
                        : "bg-muted/50 border-border"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="gap-1">
                          <div className={`h-2 w-2 rounded-full ${providerConfig.color}`} />
                          {providerConfig.label}
                        </Badge>
                        {mention.mentioned ? (
                          <Badge className="bg-geo-green text-white">Mencionado</Badge>
                        ) : (
                          <Badge variant="secondary">Não mencionado</Badge>
                        )}
                        {mention.confidence && (
                          <Badge variant="outline">
                            {(mention.confidence * 100).toFixed(0)}% confiança
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(mention.collected_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <p className="text-sm font-medium mb-1">"{mention.query}"</p>
                    {mention.answer_excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {mention.answer_excerpt}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
