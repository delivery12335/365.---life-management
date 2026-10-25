-- Run in the Supabase SQL Editor. No demo rows or accounts are inserted.
begin;
create table if not exists public.life_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  revision bigint not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now()
);
alter table public.life_data enable row level security;
revoke all on public.life_data from anon, authenticated;
grant select on public.life_data to authenticated;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='life_data' and policyname='own_life_data') then
    create policy own_life_data on public.life_data for select to authenticated
      using ((select auth.uid()) = user_id);
  end if;
end $$;

create or replace function public.load_365_data()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare owner_id uuid := auth.uid(); result jsonb;
begin
  if owner_id is null then raise exception 'unauthorized' using errcode = '42501'; end if;
  insert into public.life_data(user_id, data)
  select owner_id, jsonb_build_object(
    'version', 1, 'name', left(coalesce(raw_user_meta_data->>'name', ''), 40),
    'tasks', '[]'::jsonb, 'habits', '[]'::jsonb, 'goals', '[]'::jsonb,
    'events', '[]'::jsonb, 'health', '[]'::jsonb, 'transactions', '[]'::jsonb,
    'notes', '[]'::jsonb, 'openingBalance', 0
  ) from auth.users where id = owner_id
  on conflict (user_id) do nothing;
  select jsonb_build_object('data', data, 'revision', revision) into result
    from public.life_data where user_id = owner_id;
  return result;
end;
$$;

create or replace function public.save_365_data(p_data jsonb, p_revision bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare owner_id uuid := auth.uid(); next_revision bigint; collection text;
begin
  if owner_id is null then raise exception 'unauthorized' using errcode = '42501'; end if;
  if p_revision is null or p_revision < 0 or p_data is null
    or jsonb_typeof(p_data) <> 'object' or octet_length(p_data::text) > 2097152
    or p_data->>'version' is distinct from '1'
    or jsonb_typeof(p_data->'name') is distinct from 'string'
    or length(p_data->>'name') > 40
    or jsonb_typeof(p_data->'openingBalance') is distinct from 'number'
  then raise exception 'invalid_data' using errcode = '22023'; end if;
  if (p_data->>'openingBalance')::numeric < 0 or (p_data->>'openingBalance')::numeric > 1000000000
  then raise exception 'invalid_data' using errcode = '22023'; end if;
  foreach collection in array array['tasks','habits','goals','events','health','transactions','notes'] loop
    if jsonb_typeof(p_data->collection) is distinct from 'array'
    then raise exception 'invalid_data' using errcode = '22023'; end if;
    if jsonb_array_length(p_data->collection) > 10000
      or exists(select 1 from jsonb_array_elements(p_data->collection) item
        where jsonb_typeof(item) <> 'object' or jsonb_typeof(item->'id') is distinct from 'string'
          or length(item->>'id') not between 1 and 100)
      or (select count(*) from jsonb_array_elements(p_data->collection)) <>
         (select count(distinct item->>'id') from jsonb_array_elements(p_data->collection) item)
    then raise exception 'invalid_data' using errcode = '22023'; end if;
  end loop;
  update public.life_data set data = p_data, revision = revision + 1, updated_at = now()
    where user_id = owner_id and revision = p_revision
    returning revision into next_revision;
  if next_revision is null then raise exception 'data_conflict' using errcode = '40001'; end if;
  return jsonb_build_object('revision', next_revision);
end;
$$;
revoke all on function public.load_365_data() from public, anon;
revoke all on function public.save_365_data(jsonb, bigint) from public, anon;
grant execute on function public.load_365_data() to authenticated;
grant execute on function public.save_365_data(jsonb, bigint) to authenticated;
commit;
