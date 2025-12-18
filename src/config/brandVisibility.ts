// Brand visibility and filtering configuration

export interface BrandFilter {
  id: string;
  name: string;
  isActive: boolean;
}

export interface VisibilityConfig {
  showInactive: boolean;
  sortBy: 'name' | 'createdAt' | 'updatedAt' | 'score';
  sortOrder: 'asc' | 'desc';
  filters: {
    hasLogo: boolean | null;
    hasKeywords: boolean | null;
    hasCompetitors: boolean | null;
    hasDomain: boolean | null;
  };
}

export const DEFAULT_VISIBILITY_CONFIG: VisibilityConfig = {
  showInactive: false,
  sortBy: 'name',
  sortOrder: 'asc',
  filters: {
    hasLogo: null,
    hasKeywords: null,
    hasCompetitors: null,
    hasDomain: null,
  },
};

// Filter brands based on configuration
export function filterBrands<T extends { 
  name: string; 
  logo_url?: string | null;
  keywords?: string[] | null;
  competitors?: string[] | null;
  domain?: string | null;
  created_at?: string;
  updated_at?: string;
}>(
  brands: T[],
  config: VisibilityConfig
): T[] {
  let filtered = [...brands];

  // Apply filters
  if (config.filters.hasLogo !== null) {
    filtered = filtered.filter(b => 
      config.filters.hasLogo ? !!b.logo_url : !b.logo_url
    );
  }

  if (config.filters.hasKeywords !== null) {
    filtered = filtered.filter(b => 
      config.filters.hasKeywords 
        ? (b.keywords && b.keywords.length > 0) 
        : (!b.keywords || b.keywords.length === 0)
    );
  }

  if (config.filters.hasCompetitors !== null) {
    filtered = filtered.filter(b => 
      config.filters.hasCompetitors 
        ? (b.competitors && b.competitors.length > 0) 
        : (!b.competitors || b.competitors.length === 0)
    );
  }

  if (config.filters.hasDomain !== null) {
    filtered = filtered.filter(b => 
      config.filters.hasDomain ? !!b.domain : !b.domain
    );
  }

  // Apply sorting
  filtered.sort((a, b) => {
    let comparison = 0;

    switch (config.sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'createdAt':
        comparison = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        break;
      case 'updatedAt':
        comparison = new Date(a.updated_at || 0).getTime() - new Date(b.updated_at || 0).getTime();
        break;
      default:
        comparison = a.name.localeCompare(b.name);
    }

    return config.sortOrder === 'asc' ? comparison : -comparison;
  });

  return filtered;
}

// Brand completeness score (0-100)
export function calculateBrandCompleteness(brand: {
  name: string;
  description?: string | null;
  domain?: string | null;
  logo_url?: string | null;
  keywords?: string[] | null;
  competitors?: string[] | null;
}): number {
  let score = 0;
  const weights = {
    name: 15,
    description: 20,
    domain: 15,
    logo: 10,
    keywords: 20,
    competitors: 20,
  };

  if (brand.name) score += weights.name;
  if (brand.description) score += weights.description;
  if (brand.domain) score += weights.domain;
  if (brand.logo_url) score += weights.logo;
  if (brand.keywords && brand.keywords.length > 0) score += weights.keywords;
  if (brand.competitors && brand.competitors.length > 0) score += weights.competitors;

  return score;
}

// Get brand completeness level
export function getBrandCompletenessLevel(score: number): {
  level: 'incomplete' | 'basic' | 'good' | 'complete';
  color: string;
  label: string;
} {
  if (score >= 90) {
    return { level: 'complete', color: 'text-emerald-500', label: 'Completa' };
  }
  if (score >= 60) {
    return { level: 'good', color: 'text-blue-500', label: 'Boa' };
  }
  if (score >= 30) {
    return { level: 'basic', color: 'text-amber-500', label: 'Básica' };
  }
  return { level: 'incomplete', color: 'text-red-500', label: 'Incompleta' };
}
