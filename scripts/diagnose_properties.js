const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load env vars
try {
  const envConfig = dotenv.parse(fs.readFileSync(path.resolve(__dirname, '../.env.local')));
  process.env.NEXT_PUBLIC_SUPABASE_URL = envConfig.NEXT_PUBLIC_SUPABASE_URL;
  process.env.SUPABASE_SERVICE_ROLE_KEY = envConfig.SUPABASE_SERVICE_ROLE_KEY;
} catch (e) {
  console.log('Could not load .env.local, checking process.env...');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function diagnose() {
  console.log('--- DIAGNOSTIC START ---');
  
  // 1. Check Properties (Service Role)
  const { data: props, error: pError } = await supabase.from('properties').select('id, name, created_by');
  if (pError) console.error('Error properties:', pError);
  else console.log(`Properties found (Service Role): ${props.length}`);

  // 2. Check Staff
  const { data: staff, error: sError } = await supabase.from('property_staff').select('*');
  if (sError) console.error('Error staff:', sError);
  else console.log(`Staff assignments found: ${staff.length}`);

  // 3. Check Admin User
  const { data: { users }, error: uError } = await supabase.auth.admin.listUsers();
  const adminUser = users.find(u => u.email === 'admin@zamora.com');
  
  if (adminUser) {
    console.log(`Admin User ID: ${adminUser.id}`);
    
    // Check Profile Role
    const { data: profile, error: prError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', adminUser.id)
      .single();
      
    if (prError) console.error('Error fetching admin profile:', prError);
    else console.log(`Admin Profile Role: ${profile.role}, Property ID: ${profile.property_id}`);
    
    // Check if in staff
    const adminStaff = staff.find(s => s.user_id === adminUser.id);
    console.log(`Admin in Property Staff? ${adminStaff ? 'Yes (' + adminStaff.role + ')' : 'No'}`);
  } else {
    console.log('Admin user not found!');
  }

  console.log('--- DIAGNOSTIC END ---');
}

diagnose();
