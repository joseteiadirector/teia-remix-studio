import { useBrand } from '@/contexts/BrandContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Building2 } from 'lucide-react';

export function DashboardPremiumHeader() {
  const { brands, selectedBrand, setSelectedBrand, isLoading } = useBrand();

  const handleBrandChange = (brandId: string) => {
    const brand = brands.find(b => b.id === brandId);
    if (brand) {
      setSelectedBrand(brand);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/20 via-purple-500/10 to-blue-500/10 border border-primary/30 p-6 mb-6">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/20 backdrop-blur-xl border border-primary/30">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Command Center
            </h1>
            <p className="text-sm text-muted-foreground">
              AI-Powered Brand Intelligence Dashboard
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/50 backdrop-blur-sm border border-border/50">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Brand:</span>
          </div>
          
          <Select
            value={selectedBrand?.id}
            onValueChange={handleBrandChange}
            disabled={isLoading || brands.length === 0}
          >
            <SelectTrigger className="w-[200px] bg-background/50 backdrop-blur-sm border-primary/30">
              <SelectValue placeholder={isLoading ? "Loading..." : "Select brand"} />
            </SelectTrigger>
            <SelectContent>
              {brands.map((brand) => (
                <SelectItem key={brand.id} value={brand.id}>
                  <div className="flex items-center gap-2">
                    {brand.logo_url ? (
                      <img src={brand.logo_url} alt={brand.name} className="w-5 h-5 rounded object-cover" />
                    ) : (
                      <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center text-xs font-bold">
                        {brand.name.charAt(0)}
                      </div>
                    )}
                    <span>{brand.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
