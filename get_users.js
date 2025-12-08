
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ssmcagewssgtfknyrjmx.supabase.co';
// Using Service Role Key to access auth.users
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzbWNhZ2V3c3NndGZrbnlyam14Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTAzNjA3MiwiZXhwIjoyMDgwNjEyMDcyfQ.DQesBq2QenO4cB8YqbO4Ut707mRU5zSy48xDN1UWdz8';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function listUsers() {
  console.log('Fetching users...');
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error('Error fetching users:', error);
    return;
  }

  console.log('Found users:', users.length);
  users.forEach(u => {
    console.log(`- ID: ${u.id}, Email: ${u.email}`);
  });
}

listUsers();
