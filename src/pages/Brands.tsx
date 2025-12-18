import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Globe, Loader2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Brand {
  id: string;
  name: string;
  domain: string | null;
  logo_url: string | null;
  description: string | null;
  keywords: string[] | null;
  competitors: string[] | null;
  created_at: string;
}

export default function Brands() {
  const { user } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    domain: "",
    description: "",
    keywords: "",
    competitors: "",
  });

  const fetchBrands = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching brands:", error);
      toast.error("Erro ao carregar marcas");
    } else {
      setBrands(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBrands();
  }, [user]);

  const resetForm = () => {
    setForm({ name: "", domain: "", description: "", keywords: "", competitors: "" });
    setEditingBrand(null);
  };

  const handleOpenDialog = (brand?: Brand) => {
    if (brand) {
      setEditingBrand(brand);
      setForm({
        name: brand.name,
        domain: brand.domain || "",
        description: brand.description || "",
        keywords: brand.keywords?.join(", ") || "",
        competitors: brand.competitors?.join(", ") || "",
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!form.name.trim()) {
      toast.error("Nome da marca é obrigatório");
      return;
    }

    setIsSubmitting(true);

    const brandData = {
      name: form.name.trim(),
      domain: form.domain.trim() || null,
      description: form.description.trim() || null,
      keywords: form.keywords.split(",").map(k => k.trim()).filter(Boolean),
      competitors: form.competitors.split(",").map(c => c.trim()).filter(Boolean),
      user_id: user.id,
    };

    if (editingBrand) {
      const { error } = await supabase
        .from("brands")
        .update(brandData)
        .eq("id", editingBrand.id);

      if (error) {
        toast.error("Erro ao atualizar marca");
      } else {
        toast.success("Marca atualizada!");
        fetchBrands();
      }
    } else {
      const { error } = await supabase
        .from("brands")
        .insert(brandData);

      if (error) {
        toast.error("Erro ao criar marca");
      } else {
        toast.success("Marca criada!");
        fetchBrands();
      }
    }

    setIsSubmitting(false);
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta marca?")) return;

    const { error } = await supabase.from("brands").delete().eq("id", id);

    if (error) {
      toast.error("Erro ao excluir marca");
    } else {
      toast.success("Marca excluída!");
      fetchBrands();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marcas</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas marcas para monitorar presença em LLMs
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Marca
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingBrand ? "Editar Marca" : "Nova Marca"}</DialogTitle>
              <DialogDescription>
                {editingBrand 
                  ? "Atualize as informações da sua marca" 
                  : "Adicione uma nova marca para monitorar"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Marca *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Minha Empresa"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="domain">Domínio</Label>
                <Input
                  id="domain"
                  value={form.domain}
                  onChange={(e) => setForm(prev => ({ ...prev, domain: e.target.value }))}
                  placeholder="Ex: minhaempresa.com.br"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Breve descrição da marca..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="keywords">Palavras-chave</Label>
                <Input
                  id="keywords"
                  value={form.keywords}
                  onChange={(e) => setForm(prev => ({ ...prev, keywords: e.target.value }))}
                  placeholder="Ex: tecnologia, software, SaaS (separadas por vírgula)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="competitors">Concorrentes</Label>
                <Input
                  id="competitors"
                  value={form.competitors}
                  onChange={(e) => setForm(prev => ({ ...prev, competitors: e.target.value }))}
                  placeholder="Ex: Empresa A, Empresa B (separados por vírgula)"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    editingBrand ? "Atualizar" : "Criar"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {brands.length === 0 ? (
        <Card className="glass-card border-dashed">
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Nenhuma marca cadastrada</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Adicione sua primeira marca para começar a monitorar a presença em LLMs
            </p>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Marca
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <Card key={brand.id} className="glass-card card-hover">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{brand.name}</CardTitle>
                      {brand.domain && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Globe className="h-3 w-3" />
                          {brand.domain}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleOpenDialog(brand)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(brand.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {brand.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {brand.description}
                  </p>
                )}
                {brand.keywords && brand.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {brand.keywords.slice(0, 4).map((keyword, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                    {brand.keywords.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{brand.keywords.length - 4}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
