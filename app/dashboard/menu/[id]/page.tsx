'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import MenuWizard from '../components/MenuWizard';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function EditMenuItemPage({ params }: { params: { id: string } }) {
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItem = async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('id', params.id)
        .single();
      
      if (data) setItem(data);
      if (error) console.error(error);
      setLoading(false);
    };

    fetchItem();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zambia-green" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Item not found.</p>
        <Link href="/dashboard/menu" className="text-zambia-green hover:underline mt-2 inline-block">
          Back to Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-8">
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/menu" 
          className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Item</h1>
          <p className="text-gray-500">Update details for <span className="font-medium text-gray-900">{item.name}</span></p>
        </div>
      </div>

      <MenuWizard initialData={item} />
    </div>
  );
}
