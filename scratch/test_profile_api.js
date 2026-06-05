const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function test() {
  const targetEmail = 'abhiraj707078@gmail.com';
  console.log(`Checking profile and role for: ${targetEmail}`);

  // Fetch the user from auth.users
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }

  const user = users.find(u => u.email === targetEmail);
  if (!user) {
    console.error(`User with email ${targetEmail} not found in auth.users`);
    return;
  }

  console.log(`Found auth user ID: ${user.id}`);

  // Query profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('Error fetching profile:', profileError);
  } else {
    console.log('Profile details:', JSON.stringify(profile, null, 2));
    console.log(`Role: ${profile.role}`);
    console.log(`Is Admin: ${profile.role === 'admin'}`);
  }
}

test();
