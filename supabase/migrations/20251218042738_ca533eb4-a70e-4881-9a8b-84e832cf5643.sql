-- Create URL Analysis table
CREATE TABLE public.url_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  seo_score INTEGER NOT NULL DEFAULT 0 CHECK (seo_score >= 0 AND seo_score <= 100),
  geo_score INTEGER NOT NULL DEFAULT 0 CHECK (geo_score >= 0 AND geo_score <= 100),
  checklist JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (public for now, will be user-specific later)
ALTER TABLE public.url_analyses ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Anyone can view url analyses" 
ON public.url_analyses 
FOR SELECT 
USING (true);

-- Create policy for public insert access  
CREATE POLICY "Anyone can create url analyses" 
ON public.url_analyses 
FOR INSERT 
WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_url_analyses_updated_at
BEFORE UPDATE ON public.url_analyses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster URL lookups
CREATE INDEX idx_url_analyses_url ON public.url_analyses(url);
CREATE INDEX idx_url_analyses_created_at ON public.url_analyses(created_at DESC);