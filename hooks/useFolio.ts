import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export interface Folio {
  id: string;
  booking_id: string;
  status: 'open' | 'closed' | 'paid';
  total_amount: number;
  payment_method: string | null;
  zra_invoice_number: string | null;
  zra_mark_id: string | null;
  zra_qr_code: string | null;
  folio_items: FolioItem[];
}

export interface FolioItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  tax_category: string;
}

export const useFolio = (bookingId: string) => {
  const fetchFolio = async () => {
    // 1. Get or Create Folio for Booking
    let { data: folio, error } = await supabase
      .from('folios')
      .select('*, folio_items(*)')
      .eq('booking_id', bookingId)
      .single();

    if (!folio) {
       // Create one if missing
       const { data: newFolio, error: createError } = await supabase
         .from('folios')
         .insert({ 
           booking_id: bookingId,
           hotel_id: (await supabase.auth.getUser()).data.user?.user_metadata?.hotel_id || '00000000-0000-0000-0000-000000000000'
         })
         .select()
         .single();
       
       if (createError) throw createError;
       folio = { ...newFolio, folio_items: [] };
    }

    return folio as Folio;
  };

  const addCharge = async (folioId: string, description: string, amount: number) => {
    const item = {
      folio_id: folioId,
      description,
      quantity: 1,
      unit_price: amount,
      total_price: amount,
      tax_category: 'A' // 16% VAT
    };

    const { error } = await supabase.from('folio_items').insert(item);
    if (error) throw error;
    
    // Update Total
    // In a real app, use a Database Trigger. For now, manual update.
    // Fetch current total
    const { data: items } = await supabase.from('folio_items').select('total_price').eq('folio_id', folioId);
    const newTotal = items?.reduce((sum, i) => sum + i.total_price, 0) || 0;
    
    await supabase.from('folios').update({ total_amount: newTotal }).eq('id', folioId);
  };

  return { fetchFolio, addCharge };
};
