'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import Modal from '@/components/ui/Modal';
import { Plus, Edit, Trash2, BedDouble, Image as ImageIcon, AlertTriangle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface RoomType {
  id: string;
  name: string;
  base_price: number;
  description: string | null;
  image_url: string | null;
  capacity: number;
}

interface Room {
  id: string;
  room_number: string;
  room_type_id: string;
  status: string;
  notes: string | null;
  room_types?: {
    name: string;
  };
  hotel_id: string;
}

export default function RoomsPage() {
  const [activeTab, setActiveTab] = useState<'rooms' | 'types'>('types');
  const supabase = createClient();
  const [hasProperty, setHasProperty] = useState(false);
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const router = useRouter();
  
  // Data State
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State (Only for adding physical rooms now)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Room | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Check for property
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
       let hotelId = user.user_metadata?.hotel_id;
       if (!hotelId) {
          const { data: profile } = await supabase.from('profiles').select('hotel_id').eq('id', user.id).single();
          hotelId = profile?.hotel_id;
       }
       setHasProperty(!!hotelId);
    }

    const { data: rData } = await supabase.from('rooms').select('*, room_types(name)').order('room_number');
    const { data: tData } = await supabase.from('room_types').select('*').order('name');
    
    if (rData) setRooms(rData);
    if (tData) setRoomTypes(tData);
    setLoading(false);
  };

  const handleAddClick = (type: 'type' | 'unit') => {
    if (!hasProperty) {
      setIsWarningOpen(true);
      return;
    }

    if (type === 'type') {
      router.push('/dashboard/rooms/types/new');
    } else {
      setEditItem(null);
      setIsModalOpen(true);
    }
  };

  const handleDelete = async (id: string, table: 'rooms' | 'room_types') => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) {
      alert('Error deleting item: ' + error.message);
    } else {
      fetchData();
    }
  };

  // Content
  const SkeletonGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-gray-100 rounded-lg h-64"></div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Rooms Management</h1>
        <div className="flex gap-3">
          <button
            onClick={() => handleAddClick('type')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 font-medium"
          >
            <Plus size={18} /> Add Room Type
          </button>
          <button
            onClick={() => handleAddClick('unit')}
            className="flex items-center gap-2 px-4 py-2 bg-zambia-green text-white rounded hover:bg-zambia-green/90 font-medium shadow-sm"
          >
            <Plus size={18} /> Add Room Unit
          </button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
           {/* ... tab buttons ... */}
           <button
             onClick={() => setActiveTab('types')}
             className={`py-4 px-1 border-b-2 font-medium text-sm ${
               activeTab === 'types'
                 ? 'border-zambia-green text-zambia-green'
                 : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
             }`}
           >
             Room Types
           </button>
           <button
             onClick={() => setActiveTab('rooms')}
             className={`py-4 px-1 border-b-2 font-medium text-sm ${
               activeTab === 'rooms'
                 ? 'border-zambia-green text-zambia-green'
                 : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
             }`}
           >
             Physical Rooms (Units)
           </button>
        </nav>
      </div>

      {/* Content */}
      {loading ? (
        <SkeletonGrid />
      ) : activeTab === 'types' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {roomTypes.map((type) => (
            <div key={type.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              <div className="h-48 bg-gray-100 flex items-center justify-center relative">
                 {type.image_url ? (
                   <img src={type.image_url} alt={type.name} className="w-full h-full object-cover" />
                 ) : (
                   <BedDouble className="text-gray-300" size={48} />
                 )}
                 <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
                   Capacity: {type.capacity}
                 </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start">
                   <h3 className="font-bold text-gray-900">{type.name}</h3>
                   <p className="font-bold text-zambia-copper">K{type.base_price}</p>
                </div>
                <p className="text-sm text-gray-600 mt-2 line-clamp-2 flex-1">{type.description || 'No description provided.'}</p>
                
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end gap-2">
                  <Link 
                    href={`/dashboard/rooms/types/${type.id}`}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit size={18} />
                  </Link>
                  <button 
                    onClick={() => handleDelete(type.id, 'room_types')}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {roomTypes.length === 0 && (
             <div className="col-span-full text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
               No room types found. Create one to get started.
             </div>
          )}
        </div>
      ) : (
        <RoomsTable 
          rooms={rooms} 
          onEdit={(r) => { setEditItem(r); setIsModalOpen(true); }} 
          onDelete={(id) => handleDelete(id, 'rooms')} 
        />
      )}

      {/* Modal only for adding/editing physical rooms now */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`${editItem ? 'Edit' : 'Add'} Room Unit`}
      >
        <RoomForm 
          key={editItem?.id || 'new-room'}
          initialData={editItem} 
          roomTypes={roomTypes}
          onSuccess={() => { setIsModalOpen(false); fetchData(); }} 
        />
      </Modal>

      {/* No Property Warning Modal */}
      <Modal
        isOpen={isWarningOpen}
        onClose={() => setIsWarningOpen(false)}
        title="Property Setup Required"
      >
        <div className="space-y-4">
           <div className="flex items-center gap-3 text-orange-600 bg-orange-50 p-3 rounded-lg">
             <AlertTriangle size={24} />
             <p className="font-medium">You need to set up your property first.</p>
           </div>
           <p className="text-gray-600">
             Before you can add rooms or room types, you must register your hotel, lodge, or guesthouse details.
           </p>
           <div className="flex justify-end gap-3 pt-2">
             <button
               onClick={() => setIsWarningOpen(false)}
               className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
             >
               Cancel
             </button>
             <Link
               href="/dashboard/setup"
               className="flex items-center gap-2 px-4 py-2 bg-zambia-green text-white rounded hover:bg-zambia-green/90 font-medium"
             >
               Setup Property <ArrowRight size={16} />
             </Link>
           </div>
        </div>
      </Modal>
    </div>
  );
}

// --- Sub-Components ---

interface RoomsTableProps {
  rooms: Room[];
  onEdit: (room: Room) => void;
  onDelete: (id: string) => void;
}

function RoomsTable({ rooms, onEdit, onDelete }: RoomsTableProps) {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
      <ul className="divide-y divide-gray-200">
        {rooms.map((room) => (
          <li key={room.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
            <div>
              <p className="text-sm font-medium text-gray-900">Room {room.room_number}</p>
              <p className="text-sm text-gray-500">{room.room_types?.name || 'No Type Assigned'}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => onEdit(room)} className="text-blue-600 hover:text-blue-800"><Edit size={18} /></button>
              <button onClick={() => onDelete(room.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
            </div>
          </li>
        ))}
        {rooms.length === 0 && <li className="px-6 py-4 text-center text-gray-500">No rooms found.</li>}
      </ul>
    </div>
  );
}

interface RoomFormProps {
  initialData: Room | null;
  roomTypes: RoomType[];
  onSuccess: () => void;
}

function RoomForm({ initialData, roomTypes, onSuccess }: RoomFormProps) {
  const supabase = createClient();
  const [formData, setFormData] = useState({
    room_number: initialData?.room_number || '',
    room_type_id: initialData?.room_type_id || '',
    status: initialData?.status || 'clean',
    notes: initialData?.notes || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    const hotel_id = user?.user_metadata?.hotel_id || '00000000-0000-0000-0000-000000000000';

    const payload = { ...formData, hotel_id };
    
    let error;
    if (initialData) {
      const { error: err } = await supabase.from('rooms').update(payload).eq('id', initialData.id);
      error = err;
    } else {
      const { error: err } = await supabase.from('rooms').insert(payload);
      error = err;
    }

    if (error) alert('Error: ' + error.message);
    else onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Room Number</label>
        <input
          required
          placeholder="e.g. 101"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white focus:ring-zambia-green focus:border-zambia-green"
          value={formData.room_number}
          onChange={e => setFormData({ ...formData, room_number: e.target.value })}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Room Type</label>
        <select
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white focus:ring-zambia-green focus:border-zambia-green"
          value={formData.room_type_id}
          onChange={e => setFormData({ ...formData, room_type_id: e.target.value })}
        >
          <option value="">Select Type</option>
          {roomTypes.map((t) => (
            <option key={t.id} value={t.id}>{t.name} (K{t.base_price})</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Status</label>
        <select
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white focus:ring-zambia-green focus:border-zambia-green"
          value={formData.status}
          onChange={e => setFormData({ ...formData, status: e.target.value })}
        >
          <option value="clean">Clean</option>
          <option value="dirty">Dirty</option>
          <option value="maintenance">Maintenance</option>
          <option value="occupied">Occupied</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Notes</label>
        <textarea
          rows={3}
          placeholder="Optional notes about this room..."
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white focus:ring-zambia-green focus:border-zambia-green"
          value={formData.notes}
          onChange={e => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      <button type="submit" className="w-full bg-zambia-green text-white py-2 rounded hover:bg-zambia-green/90 font-bold transition-colors">
        {initialData ? 'Update Room' : 'Add Room'}
      </button>
    </form>
  );
}
