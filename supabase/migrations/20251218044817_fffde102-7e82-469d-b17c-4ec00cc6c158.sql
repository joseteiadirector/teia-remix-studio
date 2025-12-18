-- BRAND DOCUMENTS
CREATE TABLE public.brand_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  file_url TEXT,
  file_type TEXT,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.brand_documents(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- SEO METRICS
CREATE TABLE public.seo_metrics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr DECIMAL(5,4) DEFAULT 0,
  position DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (brand_id, date)
);

CREATE TABLE public.gsc_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE NOT NULL,
  query TEXT NOT NULL,
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr DECIMAL(5,4) DEFAULT 0,
  position DECIMAL(5,2) DEFAULT 0,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- LLM CACHE
CREATE TABLE public.llm_query_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  query_hash TEXT NOT NULL,
  query TEXT NOT NULL,
  response TEXT,
  cached_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE (provider, query_hash)
);

-- NUCLEUS
CREATE TABLE public.nucleus_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE NOT NULL,
  query TEXT NOT NULL,
  query_type TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.nucleus_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_id UUID REFERENCES public.nucleus_queries(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL,
  response TEXT,
  tokens_used INTEGER DEFAULT 0,
  latency_ms INTEGER DEFAULT 0,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.hallucination_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID REFERENCES public.nucleus_executions(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE NOT NULL,
  detected BOOLEAN DEFAULT false,
  confidence DECIMAL(3,2),
  details TEXT,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- AUTOMAÇÃO
CREATE TABLE public.automation_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  config JSONB DEFAULT '{}'::jsonb,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.automation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID REFERENCES public.automation_configs(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending',
  result JSONB,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ALERTAS
CREATE TABLE public.alert_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE NOT NULL,
  metric TEXT NOT NULL,
  condition TEXT NOT NULL,
  threshold DECIMAL(10,2) NOT NULL,
  enabled BOOLEAN DEFAULT true,
  notify_email BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.alerts_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID REFERENCES public.alert_configs(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  severity TEXT DEFAULT 'info',
  acknowledged BOOLEAN DEFAULT false,
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RELATÓRIOS
CREATE TABLE public.generated_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  pdf_url TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.scientific_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  abstract TEXT,
  methodology TEXT,
  results JSONB DEFAULT '{}'::jsonb,
  conclusions TEXT,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RECOMENDAÇÕES
CREATE TABLE public.recommendation_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- URL ANALYSIS HISTORY
CREATE TABLE public.url_analysis_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  seo_score INTEGER DEFAULT 0,
  geo_score INTEGER DEFAULT 0,
  results JSONB DEFAULT '{}'::jsonb,
  analyzed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- CHAT
CREATE TABLE public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- COMPETITOR COMPARISONS
CREATE TABLE public.competitor_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE NOT NULL,
  competitor_name TEXT NOT NULL,
  competitor_domain TEXT,
  geo_score DECIMAL(5,2),
  seo_score DECIMAL(5,2),
  comparison_data JSONB DEFAULT '{}'::jsonb,
  compared_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- AUDIT LOGS
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.brand_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_metrics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gsc_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.llm_query_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nucleus_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nucleus_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hallucination_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scientific_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.url_analysis_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "brand_documents_policy" ON public.brand_documents FOR ALL USING (EXISTS (SELECT 1 FROM public.brands WHERE brands.id = brand_documents.brand_id AND brands.user_id = auth.uid()));
CREATE POLICY "document_chunks_policy" ON public.document_chunks FOR ALL USING (EXISTS (SELECT 1 FROM public.brand_documents bd JOIN public.brands b ON bd.brand_id = b.id WHERE bd.id = document_chunks.document_id AND b.user_id = auth.uid()));
CREATE POLICY "seo_metrics_daily_policy" ON public.seo_metrics_daily FOR ALL USING (EXISTS (SELECT 1 FROM public.brands WHERE brands.id = seo_metrics_daily.brand_id AND brands.user_id = auth.uid()));
CREATE POLICY "gsc_queries_policy" ON public.gsc_queries FOR ALL USING (EXISTS (SELECT 1 FROM public.brands WHERE brands.id = gsc_queries.brand_id AND brands.user_id = auth.uid()));
CREATE POLICY "llm_cache_select" ON public.llm_query_cache FOR SELECT USING (true);
CREATE POLICY "llm_cache_insert" ON public.llm_query_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "nucleus_queries_policy" ON public.nucleus_queries FOR ALL USING (EXISTS (SELECT 1 FROM public.brands WHERE brands.id = nucleus_queries.brand_id AND brands.user_id = auth.uid()));
CREATE POLICY "nucleus_executions_policy" ON public.nucleus_executions FOR ALL USING (EXISTS (SELECT 1 FROM public.nucleus_queries nq JOIN public.brands b ON nq.brand_id = b.id WHERE nq.id = nucleus_executions.query_id AND b.user_id = auth.uid()));
CREATE POLICY "hallucination_detections_policy" ON public.hallucination_detections FOR ALL USING (EXISTS (SELECT 1 FROM public.brands WHERE brands.id = hallucination_detections.brand_id AND brands.user_id = auth.uid()));
CREATE POLICY "automation_configs_policy" ON public.automation_configs FOR ALL USING (EXISTS (SELECT 1 FROM public.brands WHERE brands.id = automation_configs.brand_id AND brands.user_id = auth.uid()));
CREATE POLICY "automation_jobs_policy" ON public.automation_jobs FOR ALL USING (EXISTS (SELECT 1 FROM public.automation_configs ac JOIN public.brands b ON ac.brand_id = b.id WHERE ac.id = automation_jobs.config_id AND b.user_id = auth.uid()));
CREATE POLICY "alert_configs_policy" ON public.alert_configs FOR ALL USING (EXISTS (SELECT 1 FROM public.brands WHERE brands.id = alert_configs.brand_id AND brands.user_id = auth.uid()));
CREATE POLICY "alerts_history_policy" ON public.alerts_history FOR ALL USING (EXISTS (SELECT 1 FROM public.brands WHERE brands.id = alerts_history.brand_id AND brands.user_id = auth.uid()));
CREATE POLICY "generated_reports_policy" ON public.generated_reports FOR ALL USING (EXISTS (SELECT 1 FROM public.brands WHERE brands.id = generated_reports.brand_id AND brands.user_id = auth.uid()));
CREATE POLICY "scientific_reports_policy" ON public.scientific_reports FOR ALL USING (EXISTS (SELECT 1 FROM public.brands WHERE brands.id = scientific_reports.brand_id AND brands.user_id = auth.uid()));
CREATE POLICY "recommendation_checklist_policy" ON public.recommendation_checklist FOR ALL USING (EXISTS (SELECT 1 FROM public.brands WHERE brands.id = recommendation_checklist.brand_id AND brands.user_id = auth.uid()));
CREATE POLICY "url_analysis_history_policy" ON public.url_analysis_history FOR ALL USING (brand_id IS NULL OR EXISTS (SELECT 1 FROM public.brands WHERE brands.id = url_analysis_history.brand_id AND brands.user_id = auth.uid()));
CREATE POLICY "chat_conversations_policy" ON public.chat_conversations FOR ALL USING (EXISTS (SELECT 1 FROM public.brands WHERE brands.id = chat_conversations.brand_id AND brands.user_id = auth.uid()));
CREATE POLICY "chat_messages_policy" ON public.chat_messages FOR ALL USING (EXISTS (SELECT 1 FROM public.chat_conversations cc JOIN public.brands b ON cc.brand_id = b.id WHERE cc.id = chat_messages.conversation_id AND b.user_id = auth.uid()));
CREATE POLICY "competitor_comparisons_policy" ON public.competitor_comparisons FOR ALL USING (EXISTS (SELECT 1 FROM public.brands WHERE brands.id = competitor_comparisons.brand_id AND brands.user_id = auth.uid()));
CREATE POLICY "audit_logs_select" ON public.audit_logs FOR SELECT USING (user_id = auth.uid());

-- Triggers
CREATE TRIGGER update_automation_configs_updated_at BEFORE UPDATE ON public.automation_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_chat_conversations_updated_at BEFORE UPDATE ON public.chat_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();