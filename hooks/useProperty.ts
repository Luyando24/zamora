import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export function useProperty() {
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchProperty() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        let pid = user.user_metadata?.property_id || user.user_metadata?.hotel_id;

        if (!pid) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('property_id')
            .eq('id', user.id)
            .single();
          pid = profile?.property_id;
        }
        
        setPropertyId(pid);
      } catch (error) {
        console.error('Error fetching property ID:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProperty();
  }, []);

  return { propertyId, loading };
}
