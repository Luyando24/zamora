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
  // dotenv might not be installed or needed
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

async function migrateRoles() {
  console.log('Migrating "staff" roles to "cashier"...');

  const { error } = await supabase
    .from('profiles')
    .update({ role: 'cashier' })
    .eq('role', 'staff');

  if (error) {
    console.error('Error migrating roles:', error.message);
    process.exit(1);
  }

  console.log('Successfully migrated all "staff" roles to "cashier".');
}

migrateRoles();
