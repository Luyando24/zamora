const { createClient } = require('@supabase/supabase-js');

// Load env vars
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  const email = 'admin@zamora.com';
  const password = 'admin123';

  console.log(`Checking if user ${email} exists...`);

  // 1. List users to check existence (admin API)
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }

  const existingUser = users.find(u => u.email === email);
  let userId;

  if (existingUser) {
    console.log('User already exists. ID:', existingUser.id);
    userId = existingUser.id;
    
    // Update user to be verified
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { email_confirm: true, user_metadata: { first_name: 'Admin', last_name: 'User' } }
    );

    if (updateError) {
        console.error('Error updating user:', updateError);
    } else {
        console.log('User verified successfully.');
    }

  } else {
    console.log('Creating new user...');
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name: 'Admin', last_name: 'User' }
    });

    if (createError) {
      console.error('Error creating user:', createError);
      return;
    }

    console.log('User created successfully. ID:', newUser.user.id);
    userId = newUser.user.id;
  }

  // 2. Promote to super_admin in profiles table
  if (userId) {
    console.log('Promoting to super_admin in profiles table...');
    
    // Check if profile exists
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (profile) {
        const { error: profileError } = await supabase
            .from('profiles')
            .update({ role: 'super_admin' })
            .eq('id', userId);
            
        if (profileError) console.error('Error updating profile role:', profileError);
        else console.log('Profile role updated to super_admin.');
    } else {
        const { error: insertError } = await supabase
            .from('profiles')
            .insert({
                id: userId,
                first_name: 'Admin',
                last_name: 'User',
                email: email,
                role: 'super_admin'
            });
            
        if (insertError) console.error('Error creating profile:', insertError);
        else console.log('Profile created with super_admin role.');
    }
  }
}

createAdminUser();
