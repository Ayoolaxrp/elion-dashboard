const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const tables = [
    'leads', 'audits', 'payments', 'activity_log',
    'workflow_templates', 'clients', 'client_automations', 'client_integrations',
    'client_config', 'client_credentials', 'template_versions',
    'features', 'client_entitlements', 'automation_executions',
    'provisioning_logs',
    'organizations', 'organization_memberships', 'user_profiles'
  ];
  console.log('=== TABLE STATUS ===');
  for (const table of tables) {
    const { count, error } = await sb.from(table).select('*', { count: 'exact', head: true });
    console.log(`  ${table}: ${error ? 'MISSING: ' + error.message.substring(0, 60) : count + ' rows'}`);
  }
  console.log('\n=== TEMPLATES ===');
  const { data: t } = await sb.from('workflow_templates').select('name, slug, category, is_active');
  if (t?.length) t.forEach(x => console.log(`  ${x.name} (${x.category}) active:${x.is_active}`));
  else console.log('  None');
  console.log('\n=== VERSIONS ===');
  const { data: v } = await sb.from('template_versions').select('template_id, version, status');
  if (v?.length) v.forEach(x => console.log(`  ${x.template_id} v${x.version} ${x.status}`));
  else console.log('  None');
  console.log('\n=== FEATURES ===');
  const { data: f } = await sb.from('features').select('key, name, category');
  if (f?.length) f.forEach(x => console.log(`  ${x.key}: ${x.name} (${x.category})`));
  else console.log('  None');
  console.log('\n=== AUTH USERS ===');
  const { data: u } = await sb.auth.admin.listUsers();
  if (u?.users) u.users.forEach(x => console.log(`  ${x.email}`));
})();
