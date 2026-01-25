import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { bookingsStore, roomsStore } from '@/lib/localdb';
import { addDays, format, startOfMonth, endOfMonth } from 'date-fns';

export interface Room {
  id: string;
  room_number: string;
  status: 'clean' | 'dirty' | 'maintenance' | 'occupied';
  room_types: {
    name: string;
    base_price: number;
  };
}

export interface Booking {
  id: string;
  room_id: string;
  check_in_date: string;
  check_out_date: string;
  status: string;
  guests: {
    first_name: string;
    last_name: string;
  };
}

export function useInventory(startDate: Date = new Date(), days: number = 30, propertyId?: string | null) {
  const supabase = createClient();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();

    if (!propertyId) return;

    // Realtime Subscriptions
    const roomsChannel = supabase
      .channel('public:rooms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `property_id=eq.${propertyId}` }, fetchData)
      .subscribe();

    const bookingsChannel = supabase
      .channel('public:bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `property_id=eq.${propertyId}` }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(roomsChannel);
      supabase.removeChannel(bookingsChannel);
    };
  }, [propertyId]);

  const fetchData = async () => {
    if (!propertyId) return;
    try {
      setLoading(true);
      
      // 1. Fetch Rooms (only accommodation rooms)
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select(`
          *,
          room_types!inner ( name, base_price, category )
        `)
        .eq('property_id', propertyId)
        .or('category.eq.room,category.is.null', { foreignTable: 'room_types' })
        .order('room_number', { ascending: true });

      if (roomsError) throw roomsError;

      // Cache rooms
      await roomsStore.setItem('all_rooms', roomsData);
      setRooms(roomsData as any);

      // 2. Fetch Bookings overlapping the window
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          guests ( first_name, last_name )
        `)
        .eq('property_id', propertyId)
        .in('status', ['confirmed', 'checked_in']);

      if (bookingsError) throw bookingsError;

      // Cache bookings
      await bookingsStore.setItem('active_bookings', bookingsData);
      setBookings(bookingsData as any);

    } catch (error) {
      console.error('Error fetching inventory (falling back to cache):', error);
      
      // Fallback to cache
      const cachedRooms = await roomsStore.getItem<Room[]>('all_rooms');
      if (cachedRooms) setRooms(cachedRooms);

      const cachedBookings = await bookingsStore.getItem<Booking[]>('active_bookings');
      if (cachedBookings) setBookings(cachedBookings);
      
    } finally {
      setLoading(false);
    }
  };

  return { rooms, bookings, loading, refetch: fetchData };
}
