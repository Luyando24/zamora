const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Try to load environment variables
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
  } else {
    require('dotenv').config(); 
  }
} catch (e) {
  // dotenv might not be installed
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: Missing environment variables.');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixPropertyStaff() {
  console.log('Syncing profiles to property_staff...');

  // 1. Fetch all profiles with a property_id
  const { data: profiles, error: fetchError } = await supabase
    .from('profiles')
    .select('id, property_id, role')
    .not('property_id', 'is', null);

  if (fetchError) {
    console.error('Error fetching profiles:', fetchError.message);
    process.exit(1);
  }

  console.log(`Found ${profiles.length} profiles with property_id.`);

  let addedCount = 0;
  let errorCount = 0;

  for (const profile of profiles) {
    // 2. Check if exists in property_staff
    const { data: staff, error: checkError } = await supabase
      .from('property_staff')
      .select('id')
      .eq('property_id', profile.property_id)
      .eq('user_id', profile.id)
      .maybeSingle();
      
    if (checkError) {
        console.error(`Error checking staff for user ${profile.id}:`, checkError.message);
        continue;
    }

    if (!staff) {
      // 3. Insert if missing
      console.log(`Adding user ${profile.id} (${profile.role}) to property ${profile.property_id}`);
      
      const { error: insertError } = await supabase
        .from('property_staff')
        .insert({
          property_id: profile.property_id,
          user_id: profile.id,
          role: profile.role || 'cashier' // Default to cashier if null, or keep role
        });

      if (insertError) {
        console.error(`Failed to insert: ${insertError.message}`);
        errorCount++;
      } else {
        addedCount++;
      }
    }
  }

  console.log('------------------------------------------------');
  console.log(`Sync complete.`);
  console.log(`Added: ${addedCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log('------------------------------------------------');
}

fixPropertyStaff();
