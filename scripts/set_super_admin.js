const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Try to load environment variables from .env.local
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
  } else {
    require('dotenv').config(); // Fallback to .env
  }
} catch (e) {
  // dotenv might not be installed or needed if env vars are passed directly
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: Missing environment variables.');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
  console.error('You can define them in .env.local or pass them as environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setSuperAdmin() {
  const email = process.argv[2];

  if (!email) {
    console.error('Usage: node scripts/set_super_admin.js <email>');
    process.exit(1);
  }

  console.log(`Looking up user with email: ${email}`);

  // 1. Find the user by email
  // auth.admin.listUsers() is pagination based, but for a specific email search it's not directly supported in all versions easily without looping or getUserById.
  // Actually, listUsers supports generic filtering? No, usually not.
  // But we can just use the profiles table if we trust it, BUT profiles is linked to auth.users.
  // Best way with admin client:
  
  // Note: listUsers() might be slow if there are thousands of users, but usually okay for admin scripts.
  // A better way is strictly by email if available, but listUsers is the standard admin method.
  
  // Actually, let's try to query the profiles table first to find the ID, as that's often easier if the user has logged in.
  // But if we want to be sure, we check auth.
  
  // Let's use listUsers and filter.
  // We fetch up to 1000 users to ensure we find the target.
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });

  if (listError) {
    console.error('Error listing users:', listError.message);
    process.exit(1);
  }

  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    console.error(`User with email ${email} not found in Auth system.`);
    console.log('Please sign up the user first or check the email address.');
    process.exit(1);
  }

  console.log(`Found user: ${user.id}`);

  // 2. Update the profile role
  console.log('Updating profile role to super_admin...');

  // Check if profile exists
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found" for single()
    console.error('Error fetching profile:', fetchError.message);
    process.exit(1);
  }

  if (profile) {
    // Update existing profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'super_admin' })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to update profile:', updateError.message);
      process.exit(1);
    }
    console.log('Successfully updated existing profile to super_admin.');
  } else {
    // Create new profile if it doesn't exist (unlikely if they logged in, but possible)
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: email,
        role: 'super_admin',
        first_name: 'Admin', // Placeholder
        last_name: 'User'    // Placeholder
      });

    if (insertError) {
      console.error('Failed to create profile:', insertError.message);
      process.exit(1);
    }
    console.log('Created new profile with super_admin role.');
  }

  console.log('Done.');
}

setSuperAdmin();
