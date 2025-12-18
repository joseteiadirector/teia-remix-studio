import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Brand {
  id: string;
  name: string;
  domain: string | null;
  logo_url: string | null;
  description: string | null;
  keywords: string[] | null;
  competitors: string[] | null;
}

interface BrandContextType {
  brands: Brand[];
  selectedBrand: Brand | null;
  setSelectedBrand: (brand: Brand | null) => void;
  isLoading: boolean;
  refreshBrands: () => Promise<void>;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export function BrandProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBrands = async () => {
    if (!user) {
      setBrands([]);
      setSelectedBrand(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setBrands(data || []);
      
      // Auto-select first brand if none selected
      if (!selectedBrand && data && data.length > 0) {
        const savedBrandId = localStorage.getItem('selectedBrandId');
        const savedBrand = data.find(b => b.id === savedBrandId);
        setSelectedBrand(savedBrand || data[0]);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, [user]);

  useEffect(() => {
    if (selectedBrand) {
      localStorage.setItem('selectedBrandId', selectedBrand.id);
    }
  }, [selectedBrand]);

  return (
    <BrandContext.Provider value={{
      brands,
      selectedBrand,
      setSelectedBrand,
      isLoading,
      refreshBrands: fetchBrands,
    }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
}
