'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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
  isTrialExpired: boolean;
  daysRemaining: number;
}

const PropertyContext = createContext<PropertyContextType | undefined>(undefined);

export function PropertyProvider({ children }: { children: React.ReactNode }) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(14);
  const [supabase] = useState(() => createClient());

  const fetchProperties = useCallback(async () => {
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
        
        let activeProperty;
        // If we have a saved ID and it exists in the fetched properties, use it
        if (savedId && props.find(p => p.id === savedId)) {
          setSelectedPropertyId(savedId);
          activeProperty = props.find(p => p.id === savedId);
        } else {
          // Otherwise default to the first one
          setSelectedPropertyId(props[0].id);
          activeProperty = props[0];
          if (typeof window !== 'undefined') {
            localStorage.setItem('zamora_selected_property', props[0].id);
          }
        }

        // Check trial/license status
        if (activeProperty) {
          const trialEndsAt = activeProperty.trial_ends_at;
          const licenseExpiresAt = activeProperty.license_expires_at;
          const status = activeProperty.subscription_status;
          const plan = activeProperty.subscription_plan;
          const now = new Date();

          if (status === 'active_licensed' && licenseExpiresAt) {
            const expires = new Date(licenseExpiresAt);
            const diffTime = expires.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            setDaysRemaining(Math.max(0, diffDays));
            setIsTrialExpired(diffDays <= 0 || status === 'suspended');
          } else if (plan === 'trial' || !plan || status === 'trial') {
            const ends = trialEndsAt ? new Date(trialEndsAt) : new Date(new Date(activeProperty.created_at).getTime() + 14 * 24 * 60 * 60 * 1000);
            
            const diffTime = ends.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            setDaysRemaining(Math.max(0, diffDays));
            setIsTrialExpired(diffDays <= 0 && status !== 'active_licensed');
          } else {
            setIsTrialExpired(status === 'suspended');
            setDaysRemaining(365);
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
  }, [supabase]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

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
        isTrialExpired,
        daysRemaining,
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
