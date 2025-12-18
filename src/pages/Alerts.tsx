import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Bell, Plus, Trash2, Loader2, Building2, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

interface AlertConfig {
  id: string;
  metric: string;
  condition: string;
  threshold: number;
  enabled: boolean;
  notify_email: boolean;
}

interface AlertHistory {
  id: string;
  message: string;
  severity: string;
  acknowledged: boolean;
  triggered_at: string;
}

const METRICS = [
  { value: "geo_score", label: "GEO Score" },
  { value: "seo_score", label: "SEO Score" },
  { value: "mentions_count", label: "Contagem de Menções" },
  { value: "cpi", label: "CPI" },
];

const CONDITIONS = [
  { value: "below", label: "Menor que" },
  { value: "above", label: "Maior que" },
  { value: "equals", label: "Igual a" },
];

export default function Alerts() {
  const { user } = useAuth();
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [configs, setConfigs] = useState<AlertConfig[]>([]);
  const [history, setHistory] = useState<AlertHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newAlert, setNewAlert] = useState({ metric: "", condition: "below", threshold: 50 });

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
      fetchAlerts();
    }
  }, [selectedBrand]);

  const fetchAlerts = async () => {
    const [configsRes, historyRes] = await Promise.all([
      supabase.from("alert_configs").select("*").eq("brand_id", selectedBrand),
      supabase.from("alerts_history").select("*").eq("brand_id", selectedBrand).order("triggered_at", { ascending: false }).limit(20)
    ]);
    if (configsRes.data) setConfigs(configsRes.data);
    if (historyRes.data) setHistory(historyRes.data);
  };

  const handleCreate = async () => {
    if (!newAlert.metric) {
      toast.error("Selecione uma métrica");
      return;
    }
    const { error } = await supabase.from("alert_configs").insert({
      brand_id: selectedBrand,
      metric: newAlert.metric,
      condition: newAlert.condition,
      threshold: newAlert.threshold,
    });
    if (error) {
      toast.error("Erro ao criar alerta");
    } else {
      toast.success("Alerta criado!");
      setDialogOpen(false);
      fetchAlerts();
    }
  };

  const toggleEnabled = async (id: string, enabled: boolean) => {
    await supabase.from("alert_configs").update({ enabled }).eq("id", id);
    fetchAlerts();
  };

  const deleteConfig = async (id: string) => {
    await supabase.from("alert_configs").delete().eq("id", id);
    toast.success("Alerta removido");
    fetchAlerts();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (brands.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-3xl font-bold">Alertas</h1>
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
            <Bell className="h-8 w-8 text-geo-orange" />
            Alertas
          </h1>
          <p className="text-muted-foreground mt-1">Configure alertas para suas métricas</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedBrand} onValueChange={setSelectedBrand}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              {brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" />Novo Alerta</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo Alerta</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Métrica</Label>
                  <Select value={newAlert.metric} onValueChange={(v) => setNewAlert(p => ({ ...p, metric: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {METRICS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Condição</Label>
                  <Select value={newAlert.condition} onValueChange={(v) => setNewAlert(p => ({ ...p, condition: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CONDITIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Threshold</Label>
                  <Input type="number" value={newAlert.threshold} onChange={(e) => setNewAlert(p => ({ ...p, threshold: Number(e.target.value) }))} />
                </div>
                <Button onClick={handleCreate} className="w-full">Criar Alerta</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Active Alerts */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Alertas Configurados</CardTitle>
        </CardHeader>
        <CardContent>
          {configs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum alerta configurado</p>
          ) : (
            <div className="space-y-3">
              {configs.map((config) => (
                <div key={config.id} className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                  <div className="flex items-center gap-4">
                    <Switch checked={config.enabled} onCheckedChange={(v) => toggleEnabled(config.id, v)} />
                    <div>
                      <p className="font-medium">{METRICS.find(m => m.value === config.metric)?.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {CONDITIONS.find(c => c.value === config.condition)?.label} {config.threshold}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteConfig(config.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* History */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Histórico de Alertas</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum alerta disparado</p>
          ) : (
            <div className="space-y-2">
              {history.map((h) => (
                <div key={h.id} className={`flex items-center gap-3 p-3 rounded-lg border ${h.severity === 'critical' ? 'bg-destructive/10 border-destructive/20' : 'bg-muted/50'}`}>
                  {h.severity === 'critical' ? <AlertTriangle className="h-5 w-5 text-destructive" /> : <CheckCircle className="h-5 w-5 text-geo-green" />}
                  <div className="flex-1">
                    <p className="text-sm">{h.message}</p>
                    <p className="text-xs text-muted-foreground">{new Date(h.triggered_at).toLocaleString("pt-BR")}</p>
                  </div>
                  <Badge variant={h.acknowledged ? "secondary" : "default"}>{h.acknowledged ? "Visto" : "Novo"}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}