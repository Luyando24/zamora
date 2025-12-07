'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, PaintBucket } from 'lucide-react';
import Link from 'next/link';

interface Room {
  id: string;
  room_number: string;
  status: 'clean' | 'dirty' | 'maintenance' | 'occupied';
  room_types: { name: string };
}

export default function HousekeepingPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filter, setFilter] = useState<'all' | 'dirty' | 'clean'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRooms();
    
    // Realtime subscription for instant updates
    const channel = supabase
      .channel('housekeeping_rooms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, fetchRooms)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRooms = async () => {
    const { data, error } = await supabase
      .from('rooms')
      .select('*, room_types(name)')
      .order('room_number');
    
    if (data) setRooms(data as any);
    setLoading(false);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    // Optimistic update
    setRooms(rooms.map(r => r.id === id ? { ...r, status: newStatus as any } : r));
    
    const { error } = await supabase
      .from('rooms')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      console.error('Error updating room:', error);
      fetchRooms(); // Revert on error
    }
  };

  const filteredRooms = rooms.filter(r => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const stats = {
    dirty: rooms.filter(r => r.status === 'dirty').length,
    clean: rooms.filter(r => r.status === 'clean').length,
    maintenance: rooms.filter(r => r.status === 'maintenance').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Mobile Header */}
      <div className="bg-zambia-green text-white p-4 sticky top-0 z-10 shadow-md">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="p-2 hover:bg-white/10 rounded-full">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-xl font-bold">Housekeeping</h1>
          <div className="w-8" /> {/* Spacer */}
        </div>
        
        {/* Quick Stats */}
        <div className="flex justify-around mt-4 text-center text-sm">
          <div className="flex flex-col items-center">
            <span className="font-bold text-lg">{stats.dirty}</span>
            <span className="text-white/80">Dirty</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold text-lg">{stats.clean}</span>
            <span className="text-white/80">Clean</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold text-lg">{stats.maintenance}</span>
            <span className="text-white/80">Maint.</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex p-2 gap-2 sticky top-[100px] z-10 bg-gray-50/95 backdrop-blur">
        {(['all', 'dirty', 'clean'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-colors capitalize ${
              filter === f
                ? 'bg-zambia-copper text-white shadow'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Room List */}
      <div className="p-4 space-y-4">
        {loading ? (
          <p className="text-center text-gray-500 mt-10">Loading rooms...</p>
        ) : filteredRooms.length === 0 ? (
          <p className="text-center text-gray-500 mt-10">No rooms found.</p>
        ) : (
          filteredRooms.map((room) => (
            <div key={room.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{room.room_number}</h3>
                  <p className="text-sm text-gray-500">{room.room_types?.name}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                  room.status === 'clean' ? 'bg-green-100 text-green-700' :
                  room.status === 'dirty' ? 'bg-red-100 text-red-700' :
                  room.status === 'maintenance' ? 'bg-orange-100 text-orange-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {room.status}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 border-t border-gray-100 divide-x divide-gray-100">
                <button
                  onClick={() => updateStatus(room.id, 'clean')}
                  disabled={room.status === 'clean'}
                  className={`p-3 flex flex-col items-center justify-center gap-1 hover:bg-green-50 active:bg-green-100 transition-colors ${
                    room.status === 'clean' ? 'opacity-30 cursor-not-allowed' : 'text-green-600'
                  }`}
                >
                  <CheckCircle size={20} />
                  <span className="text-[10px] font-medium">Mark Clean</span>
                </button>

                <button
                  onClick={() => updateStatus(room.id, 'dirty')}
                  disabled={room.status === 'dirty'}
                  className={`p-3 flex flex-col items-center justify-center gap-1 hover:bg-red-50 active:bg-red-100 transition-colors ${
                    room.status === 'dirty' ? 'opacity-30 cursor-not-allowed' : 'text-red-600'
                  }`}
                >
                  <PaintBucket size={20} />
                  <span className="text-[10px] font-medium">Mark Dirty</span>
                </button>

                <button
                  onClick={() => updateStatus(room.id, 'maintenance')}
                  disabled={room.status === 'maintenance'}
                  className={`p-3 flex flex-col items-center justify-center gap-1 hover:bg-orange-50 active:bg-orange-100 transition-colors ${
                    room.status === 'maintenance' ? 'opacity-30 cursor-not-allowed' : 'text-orange-600'
                  }`}
                >
                  <AlertTriangle size={20} />
                  <span className="text-[10px] font-medium">Maintenance</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
