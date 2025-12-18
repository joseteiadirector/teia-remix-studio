import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Bot, Sparkles, Brain, Zap, MessageSquare, Building2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

interface Brand { id: string; name: string; }
interface Execution { provider: string; response: string; latency_ms: number; success: boolean; }

const PROVIDERS = [
  { id: "chatgpt", name: "ChatGPT", icon: "🤖", color: "bg-emerald-500" },
  { id: "gemini", name: "Gemini", icon: "✨", color: "bg-blue-500" },
  { id: "claude", name: "Claude", icon: "🧠", color: "bg-orange-500" },
  { id: "perplexity", name: "Perplexity", icon: "🔮", color: "bg-purple-500" },
];

export default function NucleusCommandCenter() {
  const { user } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [executions, setExecutions] = useState<Execution[]>([]);

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

  const handleExecute = async () => {
    if (!query.trim() || !selectedBrand) {
      toast.error("Selecione uma marca e digite uma consulta");
      return;
    }

    setExecuting(true);
    setExecutions([]);

    try {
      const { data, error } = await supabase.functions.invoke("nucleus-chat", {
        body: { brandId: selectedBrand, query: query.trim() },
      });

      if (error) throw error;

      if (data.executions) {
        setExecutions(data.executions);
        toast.success("Consulta executada em todos os LLMs!");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erro ao executar consulta");
    } finally {
      setExecuting(false);
    }
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
          <h1 className="text-3xl font-bold tracking-tight">Nucleus Command Center</h1>
          <p className="text-muted-foreground mt-1">Centro de comando multi-LLM</p>
        </div>
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
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Brain className="h-8 w-8 text-geo-purple" />
            Nucleus Command Center
          </h1>
          <p className="text-muted-foreground mt-1">
            Execute consultas simultâneas em ChatGPT, Claude, Gemini e Perplexity
          </p>
        </div>
      </div>

      {/* Query Input */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-geo-orange" />
            Nova Consulta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Marca" />
              </SelectTrigger>
              <SelectContent>
                {brands.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Textarea
            placeholder="Digite sua consulta para os LLMs... (ex: Quais são os melhores CRMs para pequenas empresas?)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={3}
          />
          <Button onClick={handleExecute} disabled={executing} className="gap-2">
            {executing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Executando em 4 LLMs...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Executar Multi-LLM
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results Grid */}
      {executions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {executions.map((exec, i) => {
            const provider = PROVIDERS.find(p => p.id === exec.provider);
            return (
              <Card key={i} className={`glass-card ${exec.success ? '' : 'border-destructive'}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <span className="text-xl">{provider?.icon}</span>
                      {provider?.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{exec.latency_ms}ms</Badge>
                      {exec.success ? (
                        <Badge className="bg-geo-green">OK</Badge>
                      ) : (
                        <Badge variant="destructive">Erro</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {exec.response}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {executions.length === 0 && !executing && (
        <Card className="glass-card border-dashed">
          <CardContent className="py-16 text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">Pronto para consultar</h3>
            <p className="text-muted-foreground">
              Digite uma consulta acima para ver respostas de 4 LLMs simultaneamente
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}