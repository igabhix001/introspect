const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error('Error listing auth users:', authError);
    return;
  }

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, role, full_name');

  if (profileError) {
    console.error('Error fetching profiles:', profileError);
    return;
  }

  const profileIds = new Set(profiles.map(p => p.id));

  console.log('Users in auth.users without profiles:');
  const missing = [];
  for (const u of users) {
    if (!profileIds.has(u.id)) {
      missing.push({ id: u.id, email: u.email, created_at: u.created_at });
    }
  }
  console.log(JSON.stringify(missing, null, 2));
}

check();
