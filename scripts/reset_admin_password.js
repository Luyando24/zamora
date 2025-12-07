const { createClient } = require('@supabase/supabase-js');

// Load env vars
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetPassword() {
  const email = 'admin@zamora.com';
  const newPassword = 'admin123';

  console.log(`Finding user ${email}...`);

  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }

  const user = users.find(u => u.email === email);

  if (!user) {
    console.error('User not found! Please create the user first.');
    return;
  }

  console.log(`User found (ID: ${user.id}). Updating password...`);

  const { data, error } = await supabase.auth.admin.updateUserById(
    user.id,
    { password: newPassword }
  );

  if (error) {
    console.error('Error updating password:', error);
  } else {
    console.log('Password updated successfully to: ' + newPassword);
  }
}

resetPassword();
