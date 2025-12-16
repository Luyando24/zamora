'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export interface Property {
  id: string;
  name: string;
  slug?: string;
  logo_url?: string;
  [key: string]: any;
}

interface PropertyContextType {
  properties: Property[];
  selectedProperty: Property | null;
  selectedPropertyId: string | null;
  setSelectedPropertyId: (id: string) => void;
  isLoading: boolean;
  refreshProperties: () => Promise<void>;
}

const PropertyContext = createContext<PropertyContextType | undefined>(undefined);

export function PropertyProvider({ children }: { children: React.ReactNode }) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const fetchProperties = async () => {
    try {
      const { data: props, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching properties:', error);
        return;
      }

      if (props && props.length > 0) {
        setProperties(props);
        
        // Determine initial selection
        const savedId = typeof window !== 'undefined' ? localStorage.getItem('zamora_selected_property') : null;
        
        // If we have a saved ID and it exists in the fetched properties, use it
        if (savedId && props.find(p => p.id === savedId)) {
          setSelectedPropertyId(savedId);
        } else {
          // Otherwise default to the first one
          setSelectedPropertyId(props[0].id);
          if (typeof window !== 'undefined') {
            localStorage.setItem('zamora_selected_property', props[0].id);
          }
        }
      } else {
        setProperties([]);
        setSelectedPropertyId(null);
      }
    } catch (err) {
      console.error('Exception fetching properties:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleSetSelectedPropertyId = (id: string) => {
    setSelectedPropertyId(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('zamora_selected_property', id);
    }
  };

  const selectedProperty = properties.find(p => p.id === selectedPropertyId) || null;

  return (
    <PropertyContext.Provider
      value={{
        properties,
        selectedProperty,
        selectedPropertyId,
        setSelectedPropertyId: handleSetSelectedPropertyId,
        isLoading,
        refreshProperties: fetchProperties,
      }}
    >
      {children}
    </PropertyContext.Provider>
  );
}

export function useProperty() {
  const context = useContext(PropertyContext);
  if (context === undefined) {
    throw new Error('useProperty must be used within a PropertyProvider');
  }
  return context;
}
