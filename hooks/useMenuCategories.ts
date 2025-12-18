import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export interface MenuCategory {
  id: string;
  name: string;
  property_id?: string | null;
  created_by?: string;
}

export function useMenuCategories(propertyId?: string | null) {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
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

      // Fetch categories. RLS will handle filtering (user's own + global public ones)
      let query = supabase
        .from('menu_categories')
        .select('*')
        .order('name');
      
      if (propertyId) {
        query = query.or(`property_id.eq.${propertyId},property_id.is.null`);
      }

      const { data, error } = await Promise.race([query, timeout]) as any;

      if (error) throw error;

      if (data) {
        setCategories(data);
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
      
      // Independent categories - no property_id needed. 
      // RLS assigns created_by automatically to the current user.
      const payload: any = { name };
      if (user) {
          payload.created_by = user.id;
      }
      if (propertyId) {
        payload.property_id = propertyId;
      }

      const { data, error } = await supabase
        .from('menu_categories')
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
      const { error, count } = await supabase
        .from('menu_categories')
        .delete({ count: 'exact' })
        .eq('id', id);

      if (error) throw error;

      if (count === 0) {
        throw new Error('Could not delete category. It may be a system category or you do not have permission.');
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
