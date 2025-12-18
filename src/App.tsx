import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import UrlAnalysis from "./pages/UrlAnalysis";
import Auth from "./pages/Auth";
import Brands from "./pages/Brands";
import LLMMentions from "./pages/LLMMentions";
import IGODashboard from "./pages/IGODashboard";
import GeoScore from "./pages/GeoScore";
import NucleusCommandCenter from "./pages/NucleusCommandCenter";
import Alerts from "./pages/Alerts";
import Reports from "./pages/Reports";
import BrandComparison from "./pages/BrandComparison";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/url-analysis" element={<UrlAnalysis />} />
              <Route path="/brands" element={<Brands />} />
              <Route path="/llm-mentions" element={<LLMMentions />} />
              <Route path="/igo-dashboard" element={<IGODashboard />} />
              <Route path="/geo-score" element={<GeoScore />} />
              <Route path="/nucleus-center" element={<NucleusCommandCenter />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/comparison" element={<BrandComparison />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;