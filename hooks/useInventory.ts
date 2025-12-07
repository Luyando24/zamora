import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
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

export function useInventory(startDate: Date = new Date(), days: number = 30) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();

    // Realtime Subscriptions
    const roomsChannel = supabase
      .channel('public:rooms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, fetchData)
      .subscribe();

    const bookingsChannel = supabase
      .channel('public:bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(roomsChannel);
      supabase.removeChannel(bookingsChannel);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Rooms
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select(`
          *,
          room_types ( name, base_price )
        `)
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
