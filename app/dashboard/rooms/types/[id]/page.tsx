'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import RoomTypeWizard from '../../components/RoomTypeWizard';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function EditRoomTypePage({ params }: { params: Promise<{ id: string }> }) {
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    // Unwrap params (Next.js 15+ requirement)
    Promise.resolve(params).then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;

    const fetchItem = async () => {
      const { data, error } = await supabase
        .from('room_types')
        .select('*')
        .eq('id', id)
        .single();
      
      if (data) setItem(data);
      if (error) console.error(error);
      setLoading(false);
    };

    fetchItem();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Room Type not found.</p>
        <Link href="/dashboard/rooms" className="text-primary hover:underline mt-2 inline-block">
          Back to Rooms
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-8">
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/rooms" 
          className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Room Type</h1>
          <p className="text-gray-500">Update details for <span className="font-medium text-gray-900">{item.name}</span></p>
        </div>
      </div>

      <RoomTypeWizard initialData={item} />
    </div>
  );
}
