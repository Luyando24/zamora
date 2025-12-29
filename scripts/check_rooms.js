
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRooms() {
  console.log('Checking room types...');

  // 1. Get all properties
  const { data: properties, error: propError } = await supabase
    .from('properties')
    .select('id, name');

  if (propError) {
    console.error('Error fetching properties:', propError);
    return;
  }

  console.log(`Found ${properties.length} properties.`);

  for (const prop of properties) {
    console.log(`\nProperty: ${prop.name} (${prop.id})`);
    
    // 2. Get room types for this property
    // Note: The table is 'room_types', column is 'property_id' (based on recent migrations)
    // Wait, let's try 'property_id' first, then 'hotel_id'
    let { data: roomTypes, error: rtError } = await supabase
      .from('room_types')
      .select('id, name, base_price')
      .eq('property_id', prop.id);

    if (rtError && rtError.message.includes('column room_types.property_id does not exist')) {
        // Fallback to hotel_id if property_id doesn't exist
        const { data: roomTypes2, error: rtError2 } = await supabase
        .from('room_types')
        .select('id, name, base_price')
        .eq('hotel_id', prop.id);
        
        roomTypes = roomTypes2;
        rtError = rtError2;
    }


    if (rtError) {
      console.error(`  Error fetching room types: ${rtError.message}`);
      continue;
    }

    if (roomTypes.length === 0) {
      console.log('  No room types found.');
    } else {
      roomTypes.forEach(rt => {
        console.log(`  - ${rt.name}: ${rt.base_price}`);
      });
    }
  }
}

checkRooms();
