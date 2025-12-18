import { useState, useEffect } from 'react';
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  LayoutDashboard, 
  Link as LinkIcon, 
  Bot,
  Globe,
  BarChart3,
  Settings,
  Building2,
  CreditCard,
  Activity,
  Zap,
  Clock,
  RefreshCw,
  Eye,
  Shield,
  FlaskConical,
  TrendingUp,
  Search,
  GitCompare,
  Plug,
  BookOpen,
  Users,
  Bell,
  Brain,
  Target,
  Gauge,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const analyticsItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "KPIs", url: "/kpis", icon: Target },
  { title: "Insights IA", url: "/insights-ia", icon: Brain },
  { title: "Alertas", url: "/alerts", icon: Bell },
];

const automationItems = [
  { title: "Automações", url: "/automations", icon: Zap },
  { title: "Cron Jobs", url: "/cron-jobs", icon: Clock },
  { title: "Analytics Sync", url: "/analytics-sync", icon: RefreshCw },
];

const seoGeoItems = [
  { title: "IGO Dashboard", url: "/igo-dashboard", icon: Gauge },
  { title: "IGO Observability", url: "/igo-observability", icon: Eye },
  { title: "Nucleus Center", url: "/nucleus-center", icon: Activity },
  { title: "Governança Algorítmica", url: "/governance", icon: Shield },
  { title: "Relatórios Científicos", url: "/scientific-reports", icon: FlaskConical },
];

const metricsItems = [
  { title: "GEO Score", url: "/geo-score", icon: Globe },
  { title: "SEO Score", url: "/seo-score", icon: Search },
  { title: "Métricas GEO", url: "/geo-metrics", icon: BarChart3 },
  { title: "Métricas SEO", url: "/seo-metrics", icon: TrendingUp },
  { title: "Análise de URL", url: "/url-analysis", icon: LinkIcon },
  { title: "Menções LLM", url: "/llm-mentions", icon: Bot },
  { title: "Comparação", url: "/comparison", icon: GitCompare },
];

const configItems = [
  { title: "Marcas", url: "/brands", icon: Building2 },
  { title: "Assinatura", url: "/subscription", icon: CreditCard },
];

const systemItems = [
  { title: "System Health", url: "/system-health", icon: Activity },
  { title: "Teste de Conexões LLM", url: "/llm-test", icon: Plug },
  { title: "Painel Admin", url: "/admin", icon: Users },
  { title: "Documentação", url: "/docs", icon: BookOpen },
];

// Local storage helper
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const collapsed = state === "collapsed";

  // Persisted collapsible states
  const [analyticsOpen, setAnalyticsOpen] = useLocalStorage('sidebar-analytics-open', true);
  const [automationOpen, setAutomationOpen] = useLocalStorage('sidebar-automation-open', false);
  const [seoGeoOpen, setSeoGeoOpen] = useLocalStorage('sidebar-seogeo-open', true);
  const [metricsOpen, setMetricsOpen] = useLocalStorage('sidebar-metrics-open', true);
  const [configOpen, setConfigOpen] = useLocalStorage('sidebar-config-open', false);
  const [systemOpen, setSystemOpen] = useLocalStorage('sidebar-system-open', false);

  const isActive = (path: string) => location.pathname === path;

  // Auto-open groups containing active route
  useEffect(() => {
    if (analyticsItems.some(i => isActive(i.url))) setAnalyticsOpen(true);
    if (automationItems.some(i => isActive(i.url))) setAutomationOpen(true);
    if (seoGeoItems.some(i => isActive(i.url))) setSeoGeoOpen(true);
    if (metricsItems.some(i => isActive(i.url))) setMetricsOpen(true);
    if (configItems.some(i => isActive(i.url))) setConfigOpen(true);
    if (systemItems.some(i => isActive(i.url))) setSystemOpen(true);
  }, [location.pathname]);

  const CollapsibleNavGroup = ({ 
    label, 
    items, 
    open, 
    onOpenChange 
  }: { 
    label: string; 
    items: typeof analyticsItems;
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) => (
    <SidebarGroup>
      <Collapsible open={open} onOpenChange={onOpenChange}>
        <CollapsibleTrigger asChild>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70 cursor-pointer hover:text-muted-foreground transition-colors flex items-center justify-between w-full pr-2">
            <span>{label}</span>
            {!collapsed && (
              <ChevronDown className={cn(
                "h-3.5 w-3.5 transition-transform duration-200",
                open && "rotate-180"
              )} />
            )}
          </SidebarGroupLabel>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </Collapsible>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className={cn(
          "flex items-center gap-3 px-2 py-4",
          collapsed && "justify-center"
        )}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-geo-purple to-geo-teal text-white font-bold text-lg">
            T
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight">Teia GEO</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Enterprise Platform</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="overflow-y-auto">
        <CollapsibleNavGroup label="Analytics" items={analyticsItems} open={analyticsOpen} onOpenChange={setAnalyticsOpen} />
        <CollapsibleNavGroup label="Automações" items={automationItems} open={automationOpen} onOpenChange={setAutomationOpen} />
        <CollapsibleNavGroup label="SEO & GEO" items={seoGeoItems} open={seoGeoOpen} onOpenChange={setSeoGeoOpen} />
        <CollapsibleNavGroup label="Métricas" items={metricsItems} open={metricsOpen} onOpenChange={setMetricsOpen} />
        <CollapsibleNavGroup label="Configurações" items={configItems} open={configOpen} onOpenChange={setConfigOpen} />
        <CollapsibleNavGroup label="Sistema" items={systemItems} open={systemOpen} onOpenChange={setSystemOpen} />
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border space-y-2 p-2">
        {/* User info */}
        {user && !collapsed && (
          <div className="px-2 py-2 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        )}
        
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Configurações Gerais">
              <Link to="/settings">
                <Settings className="h-4 w-4" />
                <span>Configurações</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              tooltip="Sair"
              onClick={() => signOut()}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
