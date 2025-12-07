import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface MenuCategory {
  id: string;
  name: string;
}

const DEFAULT_CATEGORIES = ['Food', 'Drink', 'Alcohol', 'Dessert'];

export function useMenuCategories() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const hotel_id = user?.user_metadata?.hotel_id;

      if (!hotel_id) return;

      const { data, error } = await supabase
        .from('menu_categories')
        .select('*')
        .order('name');

      if (error) throw error;

      if (data && data.length > 0) {
        setCategories(data);
      } else {
        // Lazy init defaults
        await initDefaults(hotel_id);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const initDefaults = async (hotel_id: string) => {
    try {
      const inserts = DEFAULT_CATEGORIES.map(name => ({
        hotel_id,
        name
      }));

      const { data, error } = await supabase
        .from('menu_categories')
        .insert(inserts)
        .select();

      if (error) throw error;
      if (data) setCategories(data);
    } catch (error) {
      console.error('Error initializing default categories:', error);
      // Fallback to local defaults if DB write fails (e.g. permissions)
      setCategories(DEFAULT_CATEGORIES.map(name => ({ id: name, name }))); 
    }
  };

  const addCategory = async (name: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const hotel_id = user?.user_metadata?.hotel_id;

      const { data, error } = await supabase
        .from('menu_categories')
        .insert({ hotel_id, name })
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
      const { error } = await supabase
        .from('menu_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
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
    deleteCategory,
    refreshCategories: fetchCategories
  };
}
