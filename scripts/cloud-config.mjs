export function validateCloudConfig(env) {
  const url = env.VITE_SUPABASE_URL?.trim() ?? '';
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? '';
  if (!url && !key) return;
  if (!url || !key) throw new Error('Set both public Supabase variables.');
  const parsed = new URL(url);
  if (
    parsed.protocol !== 'https:' ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash ||
    parsed.pathname !== '/'
  )
    throw new Error('Supabase URL must be an HTTPS project origin.');
  let anonymous = false;
  try {
    anonymous = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()).role === 'anon';
  } catch {
    /* Modern keys are not JWTs. */
  }
  if (!key.startsWith('sb_publishable_') && !anonymous)
    throw new Error(
      'Only a Supabase publishable or legacy anon key can enter a browser build. Never use a secret/service_role key.',
    );
}
