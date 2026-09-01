const { createClient } = require('@supabase/supabase-js');
const sb = createClient(
  'https://dxpzvscfbemywhkehpdm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4cHp2c2NmYmVteXdoa2VocGRtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODA5NDY1OCwiZXhwIjoyMTAzNjcwNjU4fQ.l9VJEM2wpaYO6Wrz0774JX3EXJUH7HOG_y2kmIyTEMI'
);

const ADMIN_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4cHp2c2NmYmVteXdoa2VocGRtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODA5NDY1OCwiZXhwIjoyMTAzNjcwNjU4fQ.l9VJEM2wpaYO6Wrz0774JX3EXJUH7HOG_y2kmIyTEMI';
const SUPABASE_URL = 'https://dxpzvscfbemywhkehpdm.supabase.co';

async function go() {
  // 1. Create auth user via Admin API
  const res = await fetch(SUPABASE_URL + '/auth/v1/admin/users', {
    method: 'POST',
    headers: {
      'apikey': ADMIN_KEY,
      'Authorization': 'Bearer ' + ADMIN_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'ayoolaawodeyi@gmail.com',
      password: 'Ayoola123!',
      email_confirm: true,
      user_metadata: { name: 'Ayoola Awodeyi', role: 'client' },
    }),
  });
  const authResult = await res.json();
  
  if (authResult.id) {
    console.log('Auth user created:', authResult.id);
    
    // 2. Create client record
    const { data: client, error: ce } = await sb.from('clients').insert({
      contact_name: 'Ayoola Awodeyi',
      email: 'ayoolaawodeyi@gmail.com',
      company_name: 'Ayoola Properties',
      industry: 'real_estate',
      plan_name: 'growth',
      status: 'active',
      onboarding_status: 'in_progress',
      auth_user_id: authResult.id,
      dashboard_access: true,
    }).select().single();
    
    if (ce) {
      console.log('Client insert error:', ce.message);
      // Try updating existing
      const { data: existing } = await sb.from('clients').select('id').eq('email', 'ayoolaawodeyi@gmail.com').single();
      if (existing) {
        console.log('Client already exists:', existing.id);
      }
      return;
    }
    console.log('Client created:', client.id);
    
    // 3. Assign automations
    const { data: templates } = await sb.from('workflow_templates').select('id, name').in('slug', ['lead_response', 'follow_up', 'booking']);
    if (templates) {
      for (const t of templates) {
        await sb.from('client_automations').insert({
          client_id: client.id,
          template_id: t.id,
          custom_name: t.name,
          status: 'pending',
        });
      }
      console.log('Assigned', templates.length, 'automations');
    }
    
    // 4. Create onboarding pipeline
    const { error: pe } = await sb.from('onboarding_pipeline').insert({
      client_id: client.id,
      current_stage: 'welcome',
      stage_status: 'in_progress',
    });
    console.log('Pipeline:', pe ? pe.message : 'created');
    
  } else {
    console.log('Auth result:', JSON.stringify(authResult));
    
    // User might already exist, get them
    const listRes = await fetch(SUPABASE_URL + '/auth/v1/admin/users', {
      headers: { 'apikey': ADMIN_KEY, 'Authorization': 'Bearer ' + ADMIN_KEY },
    });
    const users = await listRes.json();
    const existing = users.users?.find(u => u.email === 'ayoolaawodeyi@gmail.com');
    if (existing) {
      console.log('User already exists:', existing.id);
    }
  }
}
go().catch(e => console.error(e));
