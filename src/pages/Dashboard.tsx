import { BrandProvider } from '@/contexts/BrandContext';
import { DashboardPremiumHeader } from '@/components/dashboard/DashboardPremiumHeader';
import { DashboardKPIHero } from '@/components/dashboard/DashboardKPIHero';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { DashboardWidgets } from '@/components/dashboard/DashboardWidgets';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

function DashboardContent() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Premium Header with Brand Selector */}
      <DashboardPremiumHeader />

      {/* KPI Hero Cards */}
      <DashboardKPIHero />

      {/* Quick Actions Grid */}
      <QuickActions />

      {/* Widgets Grid */}
      <DashboardWidgets 
        widgets={{
          score: true,
          mentions: true,
          alerts: true,
        }}
      />

      {/* Info Section */}
      <Card className="bg-card/40 backdrop-blur-xl border-primary/20">
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

export default function Dashboard() {
  return (
    <BrandProvider>
      <DashboardContent />
    </BrandProvider>
  );
}
