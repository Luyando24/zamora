import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
    req: NextRequest,
    { params }: { params: { propertyId: string } }
) {
    const propertyId = params.propertyId;
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
        return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            global: {
                headers: {
                    Authorization: authHeader,
                },
            },
        }
    );

    try {
        // 1. Verify Authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Verify Property Access
        // Check if user is associated with the property
        const { data: profile } = await supabase
            .from('profiles')
            .select('property_id, role')
            .eq('id', user.id)
            .single();

        if (!profile || (profile.property_id !== propertyId && profile.role !== 'admin')) {
            return NextResponse.json({ error: 'Forbidden: Property mismatch' }, { status: 403 });
        }

        // 3. Verify Property Type is 'hotel'
        const { data: property } = await supabase
            .from('properties')
            .select('type')
            .eq('id', propertyId)
            .single();

        console.log('[Backend] Fetching hotel data for property:', propertyId);
        console.log('[Backend] Property type found:', property?.type);

        const ALLOWED_TYPES = ['hotel', 'lodge'];
        
        if (!property || !ALLOWED_TYPES.includes(property.type)) {
            console.error('[Backend] Invalid property type:', property?.type);
            return NextResponse.json({ 
                error: 'This feature is only available for hotels and lodges',
                code: 'INVALID_PROPERTY_TYPE',
                details: `Property type is ${property?.type}`
            }, { status: 400 });
        }

        // 4. Fetch Hotel Data (Parallel Execution)
        // We fetch: Rooms, Room Types, Active/Recent Bookings, Guests (related), Folios (related)
        
        const [
            { data: rooms, error: roomsError },
            { data: roomTypes, error: typesError },
            { data: bookings, error: bookingsError },
        ] = await Promise.all([
            // Filter out rooms that are actually tables (category = 'table')
            supabase.from('rooms')
                .select('*, room_types!inner(category)')
                .eq('property_id', propertyId)
                .neq('room_types.category', 'table'),
            
            // Filter out room types that are for tables
            supabase.from('room_types')
                .select('*')
                .eq('property_id', propertyId)
                .neq('category', 'table'),

            // Fetch bookings from last 30 days and future
            supabase.from('bookings')
                .select('*')
                .eq('property_id', propertyId)
                .order('check_in_date', { ascending: false })
                .limit(500) // Limit to recent 500 bookings for performance
        ]);

        if (roomsError) throw roomsError;
        if (typesError) throw typesError;
        if (bookingsError) throw bookingsError;

        // Clean up rooms data to remove joined room_types object
        const cleanRooms = rooms?.map(room => {
            const { room_types, ...rest } = room as any;
            return rest;
        }) || [];

        // Fetch related Guests
        const guestIds = bookings?.map(b => b.guest_id) || [];
        const uniqueGuestIds = Array.from(new Set(guestIds));
        
        let guests: any[] = [];
        if (uniqueGuestIds.length > 0) {
            const { data: guestData, error: guestError } = await supabase
                .from('guests')
                .select('*')
                .in('id', uniqueGuestIds);
            
            if (guestError) throw guestError;
            guests = guestData || [];
        }

        // Fetch related Folios
        // We fetch folios for these bookings
        const bookingIds = bookings?.map(b => b.id) || [];
        let folios: any[] = [];
        let folioItems: any[] = [];

        if (bookingIds.length > 0) {
            const { data: folioData, error: folioError } = await supabase
                .from('folios')
                .select('*, folio_items(*)')
                .in('booking_id', bookingIds);
            
            if (folioError) throw folioError;

            // Flatten folio items for easier consumption if needed, or keep nested
            // The desktop app likely expects flat structure for syncing to local tables
            folios = folioData?.map(({ folio_items, ...rest }) => rest) || [];
            
            // Extract all folio items into a flat array
            folioData?.forEach((folio: any) => {
                if (folio.folio_items && Array.isArray(folio.folio_items)) {
                    folioItems.push(...folio.folio_items.map((item: any) => ({
                        ...item,
                        folio_id: folio.id // Ensure foreign key is present
                    })));
                }
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                rooms: cleanRooms,
                room_types: roomTypes || [],
                bookings: bookings || [],
                guests: guests || [],
                folios: folios || [],
                folio_items: folioItems || []
            }
        });

    } catch (error: any) {
        console.error('Error fetching hotel data:', error);
        return NextResponse.json({ 
            error: 'Internal Server Error', 
            details: error.message 
        }, { status: 500 });
    }
}
