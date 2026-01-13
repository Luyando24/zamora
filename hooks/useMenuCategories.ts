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

      // Fetch categories
      let query = supabase
        .from('menu_categories')
        .select('*')
        .order('name');
      
      if (propertyId) {
        query = query.eq('property_id', propertyId);
      } else {
        // If no property selected (e.g. creating new property or admin view), 
        // we shouldn't show categories or show all? 
        // Better to return empty or handle gracefully.
        // For now, let's just return empty if no propertyId is provided to avoid global confusion
        setCategories([]);
        setLoading(false);
        return;
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
      // Check if it's a global category (no property_id)
      const category = categories.find(c => c.id === id);
      
      if (!category?.property_id) {
        throw new Error('System default categories cannot be deleted.');
      } else {
        // It's a custom category, delete it for real
        const { error, count } = await supabase
          .from('menu_categories')
          .delete({ count: 'exact' })
          .eq('id', id);

        if (error) throw error;

        if (count === 0) {
           throw new Error('Could not delete category.');
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
