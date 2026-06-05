const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Admin user ID
const adminId = '502b5fae-bf6b-4293-bf3a-a756aa46debf';

async function test() {
  console.log('Simulating middleware query using ANON client (no auth header)...');
  
  const anonClient = createClient(supabaseUrl, anonKey);
  const { data: data1, error: error1 } = await anonClient
    .from('profiles')
    .select('role')
    .eq('id', adminId)
    .single();
    
  console.log('No auth query result:', { data: data1, error: error1 });

  console.log('\nSimulating middleware query using ANON client WITH user JWT...');
  
  // To simulate authenticated user, we can get a JWT for the admin user
  // Let's use the admin auth API to generate a link or get session info or generate a token
  // A simpler way: we can sign in using service role to generate a token, or we can just sign in with password if we know it?
  // We don't know the password. But we can use the admin client to sign in or get user session.
  // Actually, we can get a token using supabase.auth.admin.generateLink or similar, or just check RLS.
  
  // Let's check the RLS policy definition in pg_policies
  const adminClient = createClient(supabaseUrl, serviceKey);
  const { data: policies, error: policiesError } = await adminClient.from('profiles').select('id').limit(1);
  console.log('Service role client worked:', !policiesError);
}

test();
