'use client';

import { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/ui/Modal';
import { createClient } from '@/utils/supabase/client';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { addToSyncQueue } from '@/lib/localdb';

interface NewBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  propertyId?: string | null;
}

export default function NewBookingModal({ isOpen, onClose, onSuccess, propertyId: propPropertyId }: NewBookingModalProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    roomId: '',
    checkIn: format(new Date(), 'yyyy-MM-dd'),
    checkOut: format(new Date(Date.now() + 86400000), 'yyyy-MM-dd'), // Tomorrow
    paymentMethod: 'cash',
    paymentStatus: 'pending',
  });

  const fetchRooms = useCallback(async () => {
    let propertyId = propPropertyId;

    if (!propertyId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      propertyId = user.user_metadata?.property_id;

      if (!propertyId) {
        const { data: profile } = await supabase.from('profiles').select('property_id').eq('id', user.id).single();
        propertyId = profile?.property_id;
      }
    }
    
    if (propertyId) {
      const { data, error } = await supabase
        .from('rooms')
        .select('id, room_number, room_types(name, base_price)')
        .eq('property_id', propertyId);
      
      if (error) {
        console.error('Error fetching rooms:', error);
      }
      
      if (data) setRooms(data);
    }
  }, [propPropertyId, supabase]);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      fetchRooms();
    }
  }, [isOpen, fetchRooms]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const guestId = uuidv4();
    const bookingId = uuidv4();
    
    try {
      // Get Property ID (Assume user is logged in)
      const { data: { user } } = await supabase.auth.getUser();
      // Fallback for dev/demo without auth
      const propertyId = user?.user_metadata?.property_id || '00000000-0000-0000-0000-000000000000'; 
      
      // 1. Check for Overlapping Bookings
      if (navigator.onLine) {
        const { data: existingBookings, error: checkError } = await supabase
            .from('bookings')
            .select('id, room_id, check_in_date, check_out_date')
            .eq('room_id', formData.roomId)
            .in('status', ['confirmed', 'checked_in'])
            .lt('check_in_date', formData.checkOut)
            .gt('check_out_date', formData.checkIn);

        if (checkError) {
             console.error('Error checking availability:', checkError);
             // Optional: Decide if we want to block or proceed with warning. 
             // For safety, let's block but allow override if needed? No, let's just show error.
             throw new Error('Failed to verify room availability. Please try again.');
        }

        if (existingBookings && existingBookings.length > 0) {
            setLoading(false);
            setError('This room is already booked for the selected dates. Please choose another room or date range.');
            return;
        }
      }

      const guestPayload = {
        id: guestId,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        property_id: propertyId
      };

      const bookingPayload = {
        id: bookingId,
        guest_id: guestId,
        room_id: formData.roomId,
        check_in_date: formData.checkIn,
        check_out_date: formData.checkOut,
        property_id: propertyId,
        status: 'confirmed',
        payment_method: formData.paymentMethod,
        payment_status: formData.paymentStatus
      };

      // Attempt Online Submission
      if (navigator.onLine) {
        const { error: guestError } = await supabase.from('guests').insert(guestPayload);
        if (guestError) throw guestError;

        const { error: bookingError } = await supabase.from('bookings').insert(bookingPayload);
        if (bookingError) throw bookingError;

        // Notify via SMS
        const roomNumber = rooms.find(r => r.id === formData.roomId)?.room_number || 'Unknown';
        fetch('/api/notifications/sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `New Booking: ${formData.firstName} ${formData.lastName} in Room ${roomNumber}. Check-in: ${formData.checkIn}`,
                propertyId: propertyId
            })
        }).catch(err => console.error('Failed to send SMS notification', err));

        // Notify via Push
        fetch('/api/notifications/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            propertyId: propertyId,
            title: 'New Booking 📅',
            message: `${formData.firstName} ${formData.lastName} in Room ${roomNumber}. Check-in: ${formData.checkIn}`,
            url: `/dashboard/bookings`
          })
        }).catch(err => console.error('Failed to send push notification', err));
      } else {
        throw new Error('Offline');
      }

      onSuccess();
      onClose();
      setFormData({ ...formData, firstName: '', lastName: '', phone: '', paymentMethod: 'cash', paymentStatus: 'pending' });

    } catch (error: any) {
      console.log('Online submission failed, queuing for offline sync...', error);
      
      // Queue for Sync
      const timestamp = Date.now();
      
      await addToSyncQueue({
        id: uuidv4(),
        table: 'guests',
        action: 'INSERT',
        payload: { 
           id: guestId,
           first_name: formData.firstName,
           last_name: formData.lastName,
           phone: formData.phone,
           // We might need hotel_id here too, assume we have it or handle it in sync
        },
        timestamp: timestamp
      });

      await addToSyncQueue({
        id: uuidv4(),
        table: 'bookings',
        action: 'INSERT',
        payload: {
           id: bookingId,
           guest_id: guestId,
           room_id: formData.roomId,
           check_in_date: formData.checkIn,
           check_out_date: formData.checkOut,
           status: 'confirmed',
           payment_method: formData.paymentMethod,
           payment_status: formData.paymentStatus
        },
        timestamp: timestamp + 1
      });

      alert('Device is offline. Booking saved locally and will sync when online.');
      onSuccess(); // This triggers refetch, which will load from cache (stale). 
      // Ideally we should inject this new booking into the cache manually, but for now this is MVP.
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Booking">
      {error && (
        <div className="mb-4 p-4 rounded-md bg-red-50 border border-red-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Booking Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">First Name</label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-gray-900 bg-white"
              value={formData.firstName}
              onChange={e => setFormData({ ...formData, firstName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Last Name</label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-gray-900 bg-white"
              value={formData.lastName}
              onChange={e => setFormData({ ...formData, lastName: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Phone</label>
          <input
            type="tel"
            required
            placeholder="097..."
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-gray-900 bg-white"
            value={formData.phone}
            onChange={e => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Room</label>
          <select
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-gray-900 bg-white"
            value={formData.roomId}
            onChange={e => setFormData({ ...formData, roomId: e.target.value })}
          >
            <option value="">Select a room</option>
            {rooms.map(room => (
              <option key={room.id} value={room.id}>
                {room.room_number} - {room.room_types?.name} (K{room.room_types?.base_price})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Check In</label>
            <input
              type="date"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-gray-900 bg-white"
              value={formData.checkIn}
              onChange={e => setFormData({ ...formData, checkIn: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Check Out</label>
            <input
              type="date"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-gray-900 bg-white"
              value={formData.checkOut}
              onChange={e => setFormData({ ...formData, checkOut: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Payment Method</label>
            <select
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-gray-900 bg-white"
              value={formData.paymentMethod}
              onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Payment Status</label>
            <select
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-gray-900 bg-white"
              value={formData.paymentStatus}
              onChange={e => setFormData({ ...formData, paymentStatus: e.target.value })}
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Booking'}
        </button>
      </form>
    </Modal>
  );
}
