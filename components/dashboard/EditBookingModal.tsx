'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { createClient } from '@/utils/supabase/client';
import { format, parseISO } from 'date-fns';
import { addToSyncQueue } from '@/lib/localdb';
import { v4 as uuidv4 } from 'uuid';

interface EditBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  booking: any;
  propertyId?: string | null;
}

export default function EditBookingModal({ isOpen, onClose, onSuccess, booking, propertyId: propPropertyId }: EditBookingModalProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    roomId: '',
    checkIn: '',
    checkOut: '',
    status: '',
    paymentMethod: 'cash',
    paymentStatus: 'pending'
  });

  useEffect(() => {
    if (isOpen) {
      setError(null);
      fetchRooms();
      if (booking) {
        setFormData({
          firstName: booking.guests?.first_name || '',
          lastName: booking.guests?.last_name || '',
          roomId: booking.room_id,
          checkIn: booking.check_in_date,
          checkOut: booking.check_out_date,
          status: booking.status,
          paymentMethod: booking.payment_method || 'cash',
          paymentStatus: booking.payment_status || 'pending'
        });
      }
    }
  }, [isOpen, booking]);

  const fetchRooms = async () => {
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
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (navigator.onLine) {
        // 1. Check for Overlapping Bookings (excluding current booking)
        const { data: existingBookings, error: checkError } = await supabase
            .from('bookings')
            .select('id, room_id, check_in_date, check_out_date')
            .eq('room_id', formData.roomId)
            .neq('id', booking.id) // Exclude current booking
            .in('status', ['confirmed', 'checked_in'])
            .lt('check_in_date', formData.checkOut)
            .gt('check_out_date', formData.checkIn);

        if (checkError) {
             console.error('Error checking availability:', checkError);
             throw new Error('Failed to verify room availability. Please try again.');
        }

        if (existingBookings && existingBookings.length > 0) {
            setLoading(false);
            setError('This room is already booked for the selected dates. Please choose another room or date range.');
            return;
        }

        // Update Guest
        if (booking.guest_id) {
          const { error: guestError } = await supabase
            .from('guests')
            .update({
              first_name: formData.firstName,
              last_name: formData.lastName
            })
            .eq('id', booking.guest_id);
          
          if (guestError) throw guestError;
        }

        // Update Booking
        const { error: bookingError } = await supabase
          .from('bookings')
          .update({
            room_id: formData.roomId,
            check_in_date: formData.checkIn,
            check_out_date: formData.checkOut,
            status: formData.status,
            payment_method: formData.paymentMethod,
            payment_status: formData.paymentStatus
          })
          .eq('id', booking.id);

        if (bookingError) throw bookingError;
      } else {
        // Offline Sync Queue
        const timestamp = Date.now();
        
        if (booking.guest_id) {
          await addToSyncQueue({
            id: uuidv4(),
            table: 'guests',
            action: 'UPDATE',
            payload: {
              id: booking.guest_id,
              first_name: formData.firstName,
              last_name: formData.lastName
            },
            timestamp: timestamp
          });
        }

        await addToSyncQueue({
          id: uuidv4(),
          table: 'bookings',
          action: 'UPDATE',
          payload: {
            id: booking.id,
            room_id: formData.roomId,
            check_in_date: formData.checkIn,
            check_out_date: formData.checkOut,
            status: formData.status,
            payment_method: formData.paymentMethod,
            payment_status: formData.paymentStatus
          },
          timestamp: timestamp + 1
        });
        
        alert('Changes saved locally and will sync when online.');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      alert('Error updating booking: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    setLoading(true);

    try {
      if (navigator.onLine) {
        const { error } = await supabase
          .from('bookings')
          .update({ status: 'cancelled' })
          .eq('id', booking.id);

        if (error) throw error;
      } else {
        await addToSyncQueue({
          id: uuidv4(),
          table: 'bookings',
          action: 'UPDATE',
          payload: { 
            id: booking.id,
            status: 'cancelled' 
          },
          timestamp: Date.now()
        });
        alert('Cancellation saved locally.');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      alert('Error cancelling booking: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Booking">
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
      <form onSubmit={handleUpdate} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">First Name</label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-zambia-green focus:outline-none focus:ring-1 focus:ring-zambia-green text-gray-900 bg-white"
              value={formData.firstName}
              onChange={e => setFormData({ ...formData, firstName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Last Name</label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-zambia-green focus:outline-none focus:ring-1 focus:ring-zambia-green text-gray-900 bg-white"
              value={formData.lastName}
              onChange={e => setFormData({ ...formData, lastName: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Room</label>
          <select
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-zambia-green focus:outline-none focus:ring-1 focus:ring-zambia-green text-gray-900 bg-white"
            value={formData.roomId}
            onChange={e => setFormData({ ...formData, roomId: e.target.value })}
          >
            {rooms.map(room => (
              <option key={room.id} value={room.id}>
                {room.room_number} - {room.room_types?.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Payment Method</label>
            <select
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-zambia-green focus:outline-none focus:ring-1 focus:ring-zambia-green text-gray-900 bg-white"
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
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-zambia-green focus:outline-none focus:ring-1 focus:ring-zambia-green text-gray-900 bg-white"
              value={formData.paymentStatus}
              onChange={e => setFormData({ ...formData, paymentStatus: e.target.value })}
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Check In</label>
            <input
              type="date"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-zambia-green focus:outline-none focus:ring-1 focus:ring-zambia-green text-gray-900 bg-white"
              value={formData.checkIn}
              onChange={e => setFormData({ ...formData, checkIn: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Check Out</label>
            <input
              type="date"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-zambia-green focus:outline-none focus:ring-1 focus:ring-zambia-green text-gray-900 bg-white"
              value={formData.checkOut}
              onChange={e => setFormData({ ...formData, checkOut: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-zambia-green focus:outline-none focus:ring-1 focus:ring-zambia-green text-gray-900 bg-white"
            value={formData.status}
            onChange={e => setFormData({ ...formData, status: e.target.value })}
          >
            <option value="confirmed">Confirmed</option>
            <option value="checked_in">Checked In</option>
            <option value="checked_out">Checked Out</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="flex justify-between pt-4">
          <button
            type="button"
            onClick={handleCancelBooking}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Cancel Booking
          </button>
          
          <div className="flex gap-2">
            <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zambia-green"
            >
                Close
            </button>
            <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-zambia-green hover:bg-zambia-green/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zambia-green disabled:opacity-50"
            >
                {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
