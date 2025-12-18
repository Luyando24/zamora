import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export interface BarMenuCategory {
  id: string;
  name: string;
  property_id?: string | null;
  created_by?: string;
}

export function useBarMenuCategories(propertyId?: string | null) {
  const [categories, setCategories] = useState<BarMenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      // Timeout race (5s)
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Categories timeout')), 5000));

      // Fetch categories
      let query = supabase
        .from('bar_menu_categories')
        .select('*')
        .order('name');
      
      if (propertyId) {
        query = query.or(`property_id.eq.${propertyId},property_id.is.null`);
      }

      // Fetch hidden categories if propertyId is present
      let hiddenIds: string[] = [];
      if (propertyId) {
        const { data: hiddenData } = await supabase
          .from('hidden_bar_menu_categories')
          .select('category_id')
          .eq('property_id', propertyId);
        
        if (hiddenData) {
          hiddenIds = hiddenData.map(h => h.category_id);
        }
      }

      const { data, error } = await Promise.race([query, timeout]) as any;

      if (error) throw error;

      if (data) {
        // Filter out hidden categories
        const visibleCategories = data.filter((c: any) => !hiddenIds.includes(c.id));
        setCategories(visibleCategories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async (name: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const payload: any = { name };
      if (user) {
          payload.created_by = user.id;
      }
      if (propertyId) {
        payload.property_id = propertyId;
      }

      const { data, error } = await supabase
        .from('bar_menu_categories')
        .insert(payload) 
        .select()
        .single();

      if (error) throw error;
      if (data) setCategories(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      // Check if it's a global category (no property_id)
      const category = categories.find(c => c.id === id);
      
      if (!category?.property_id && propertyId) {
        // It's a global category, "hide" it instead of deleting
        const { error } = await supabase
          .from('hidden_bar_menu_categories')
          .insert({
            property_id: propertyId,
            category_id: id
          });
        
        if (error) throw error;
      } else {
        // It's a custom category, delete it for real
        const { error, count } = await supabase
          .from('bar_menu_categories')
          .delete({ count: 'exact' })
          .eq('id', id);

        if (error) throw error;

        if (count === 0) {
          // Fallback: If we couldn't delete it (maybe permission issue), try hiding it
          if (propertyId) {
             const { error: hideError } = await supabase
              .from('hidden_bar_menu_categories')
              .insert({
                property_id: propertyId,
                category_id: id
              });
             if (hideError) throw new Error('Could not delete or hide category.');
          } else {
             throw new Error('Could not delete category.');
          }
        }
      }

      setCategories(prev => prev.filter(c => c.id !== id));
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  return {
    categories,
    loading,
    addCategory,
    deleteCategory
  };
}
