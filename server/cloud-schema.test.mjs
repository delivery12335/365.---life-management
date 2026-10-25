import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { validateCloudConfig } from '../scripts/cloud-config.mjs';

test('cloud schema isolates owners, starts empty, checks revisions and rejects anonymous access', async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon;
      create role authenticated;
      create schema auth;
      create table auth.users(id uuid primary key, raw_user_meta_data jsonb);
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      $$;
      grant usage on schema auth to authenticated;
      insert into auth.users values
        ('00000000-0000-4000-8000-000000000001', '{"name":"First"}'),
        ('00000000-0000-4000-8000-000000000002', '{"name":"Second"}');
    `);
    const schema = readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8');
    await db.exec(schema);
    await db.exec(schema); // Setup is safe to repeat without clearing user records.
    const login = async (id) => {
      await db.exec('reset role; set role authenticated;');
      await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
    };
    await login('00000000-0000-4000-8000-000000000001');
    const loaded = (await db.query('select public.load_365_data() as result')).rows[0].result;
    assert.equal(loaded.data.name, 'First');
    for (const key of ['tasks', 'habits', 'goals', 'events', 'health', 'transactions', 'notes'])
      assert.deepEqual(loaded.data[key], []);
    const firstData = { ...loaded.data, name: 'Edited first' };
    const saved = await db.query('select public.save_365_data($1::jsonb, 0) as result', [
      JSON.stringify(firstData),
    ]);
    assert.equal(saved.rows[0].result.revision, 1);
    await assert.rejects(
      db.query('select public.save_365_data($1::jsonb, 0)', [JSON.stringify(firstData)]),
      /data_conflict/,
    );
    await assert.rejects(
      db.query('select public.save_365_data($1::jsonb, 1)', [
        JSON.stringify({ ...firstData, tasks: 'wrong' }),
      ]),
      /invalid_data/,
    );
    await login('00000000-0000-4000-8000-000000000002');
    assert.equal((await db.query('select * from public.life_data')).rows.length, 0);
    const second = (await db.query('select public.load_365_data() as result')).rows[0].result;
    assert.equal(second.data.name, 'Second');
    const visible = (await db.query('select user_id from public.life_data')).rows;
    assert.deepEqual(
      visible.map((row) => row.user_id),
      ['00000000-0000-4000-8000-000000000002'],
    );
    await assert.rejects(db.query('update public.life_data set revision=0'), /permission denied/);
    await db.exec('reset role; set role anon;');
    await assert.rejects(db.query('select public.load_365_data()'), /permission denied/);
    await assert.rejects(db.query('select * from public.life_data'), /permission denied/);
    await db.exec('reset role;');
    assert.equal(
      (
        await db.query(
          "select data->>'name' as name from public.life_data where user_id='00000000-0000-4000-8000-000000000001'",
        )
      ).rows[0].name,
      'Edited first',
    );
  } finally {
    await db.close();
  }
});

test('browser builds reject secret keys and partial cloud configuration', () => {
  assert.doesNotThrow(() => validateCloudConfig({}));
  assert.throws(() => validateCloudConfig({ VITE_SUPABASE_URL: 'https://example.supabase.co' }));
  assert.throws(() =>
    validateCloudConfig({
      VITE_SUPABASE_URL: 'https://example.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_never_browser',
    }),
  );
  const jwt = `header.${Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url')}.signature`;
  assert.throws(() =>
    validateCloudConfig({
      VITE_SUPABASE_URL: 'https://example.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: jwt,
    }),
  );
  assert.doesNotThrow(() =>
    validateCloudConfig({
      VITE_SUPABASE_URL: 'https://example.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
    }),
  );
});
