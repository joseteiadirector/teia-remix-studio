-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create brands table
CREATE TABLE public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  domain TEXT,
  logo_url TEXT,
  description TEXT,
  keywords TEXT[],
  competitors TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mentions_llm table
CREATE TABLE public.mentions_llm (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL,
  query TEXT NOT NULL,
  mentioned BOOLEAN NOT NULL DEFAULT false,
  confidence DECIMAL(3,2),
  answer_excerpt TEXT,
  full_response TEXT,
  position INTEGER,
  competitors_mentioned TEXT[],
  collected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create geo_scores table
CREATE TABLE public.geo_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE NOT NULL,
  score DECIMAL(5,2) NOT NULL DEFAULT 0,
  cpi DECIMAL(5,2),
  breakdown JSONB DEFAULT '{}'::jsonb,
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create geo_pillars_monthly table
CREATE TABLE public.geo_pillars_monthly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE NOT NULL,
  month DATE NOT NULL,
  visibility DECIMAL(5,2) DEFAULT 0,
  authority DECIMAL(5,2) DEFAULT 0,
  sentiment DECIMAL(5,2) DEFAULT 0,
  consistency DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (brand_id, month)
);

-- Create igo_metrics_history table
CREATE TABLE public.igo_metrics_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE NOT NULL,
  ice DECIMAL(5,2),
  gap DECIMAL(5,2),
  cpi DECIMAL(5,2),
  stability DECIMAL(5,2),
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentions_llm ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geo_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geo_pillars_monthly ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.igo_metrics_history ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles policies (users can only view their own roles)
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Brands policies
CREATE POLICY "Users can view own brands" ON public.brands FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own brands" ON public.brands FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own brands" ON public.brands FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own brands" ON public.brands FOR DELETE USING (auth.uid() = user_id);

-- Mentions policies (through brand ownership)
CREATE POLICY "Users can view mentions of own brands" ON public.mentions_llm FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.brands WHERE brands.id = mentions_llm.brand_id AND brands.user_id = auth.uid()));
CREATE POLICY "Users can insert mentions for own brands" ON public.mentions_llm FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.brands WHERE brands.id = mentions_llm.brand_id AND brands.user_id = auth.uid()));

-- GEO scores policies
CREATE POLICY "Users can view geo scores of own brands" ON public.geo_scores FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.brands WHERE brands.id = geo_scores.brand_id AND brands.user_id = auth.uid()));
CREATE POLICY "Users can insert geo scores for own brands" ON public.geo_scores FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.brands WHERE brands.id = geo_scores.brand_id AND brands.user_id = auth.uid()));

-- GEO pillars policies
CREATE POLICY "Users can view geo pillars of own brands" ON public.geo_pillars_monthly FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.brands WHERE brands.id = geo_pillars_monthly.brand_id AND brands.user_id = auth.uid()));
CREATE POLICY "Users can insert geo pillars for own brands" ON public.geo_pillars_monthly FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.brands WHERE brands.id = geo_pillars_monthly.brand_id AND brands.user_id = auth.uid()));

-- IGO metrics policies
CREATE POLICY "Users can view igo metrics of own brands" ON public.igo_metrics_history FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.brands WHERE brands.id = igo_metrics_history.brand_id AND brands.user_id = auth.uid()));
CREATE POLICY "Users can insert igo metrics for own brands" ON public.igo_metrics_history FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.brands WHERE brands.id = igo_metrics_history.brand_id AND brands.user_id = auth.uid()));

-- Trigger to create profile and default role on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON public.brands
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();