import { supabase } from '@/lib/supabase';
import RoomDetailsClient from '@/components/guest/RoomDetailsClient';
import { validate as isUuid } from 'uuid';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{
    propertyId: string;
    roomId: string;
  }>;
}

export default async function RoomPage({ params }: PageProps) {
  const { propertyId, roomId } = await params;

  let propertyQuery = supabase
    .from('public_properties')
    .select('*');

  if (isUuid(propertyId)) {
    propertyQuery = propertyQuery.eq('id', propertyId);
  } else {
    propertyQuery = propertyQuery.eq('slug', propertyId);
  }

  const { data: property } = await propertyQuery.single();

  if (!property) return notFound();

  const { data: room } = await supabase
    .from('room_types')
    .select('*')
    .eq('id', roomId)
    .eq('property_id', property.id)
    .single();

  if (!room) return notFound();

  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>}>
      <RoomDetailsClient property={property} room={room} />
    </Suspense>
  );
}
