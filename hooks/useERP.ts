import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';

export interface Supplier {
  id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  unit: string | null;
  quantity: number;
  min_quantity: number;
  cost_per_unit: number;
  location: string | null;
  supplier_id: string | null;
  supplier?: Supplier;
}

export function useERP(propertyId?: string | null) {
  const supabase = createClient();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!propertyId) return;
    try {
      setLoading(true);

      // Fetch Suppliers
      const { data: suppliersData, error: suppliersError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('property_id', propertyId)
        .order('name');

      if (suppliersError) {
        console.error('Error fetching suppliers:', suppliersError);
        // Don't throw, just log
      } else {
        setSuppliers(suppliersData || []);
      }

      // Fetch Inventory
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory_items')
        .select('*, supplier:suppliers(name)')
        .eq('property_id', propertyId)
        .order('name');

      if (inventoryError) {
        console.error('Error fetching inventory:', inventoryError);
      } else {
        setInventory(inventoryData || []);
      }

    } catch (error) {
      console.error('Error in useERP:', error);
    } finally {
      setLoading(false);
    }
  }, [propertyId, supabase]);

  useEffect(() => {
    fetchData();

    if (!propertyId) return;

    // Realtime subscriptions
    const suppliersChannel = supabase
      .channel('public:suppliers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'suppliers', filter: `property_id=eq.${propertyId}` }, fetchData)
      .subscribe();

    const inventoryChannel = supabase
      .channel('public:inventory_items')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items', filter: `property_id=eq.${propertyId}` }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(suppliersChannel);
      supabase.removeChannel(inventoryChannel);
    };
  }, [propertyId, fetchData, supabase]);

  return { suppliers, inventory, loading, refetch: fetchData };
}
