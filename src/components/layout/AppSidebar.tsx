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
import { 
  LayoutDashboard, 
  Link as LinkIcon, 
  Bot,
  Globe,
  BarChart3,
  FileText,
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
} from "lucide-react";
import { cn } from "@/lib/utils";

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

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === "collapsed";

  const isActive = (path: string) => location.pathname === path;

  const NavGroup = ({ label, items }: { label: string; items: typeof analyticsItems }) => (
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70">
        {label}
      </SidebarGroupLabel>
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
        <NavGroup label="Analytics" items={analyticsItems} />
        <NavGroup label="Automações" items={automationItems} />
        <NavGroup label="SEO & GEO" items={seoGeoItems} />
        <NavGroup label="Métricas" items={metricsItems} />
        <NavGroup label="Configurações" items={configItems} />
        <NavGroup label="Sistema" items={systemItems} />
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Configurações Gerais">
              <Link to="/settings">
                <Settings className="h-4 w-4" />
                <span>Configurações</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}