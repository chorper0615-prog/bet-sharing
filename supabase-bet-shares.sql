create table if not exists public.bet_shares (
  code text primary key check (code ~ '^[0-9]{5}$'),
  bet jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.bet_shares enable row level security;

drop policy if exists "Anyone can create bet shares" on public.bet_shares;
create policy "Anyone can create bet shares"
on public.bet_shares
for insert
to anon
with check (true);

drop policy if exists "Anyone can read bet shares" on public.bet_shares;
create policy "Anyone can read bet shares"
on public.bet_shares
for select
to anon
using (true);

drop policy if exists "Anyone can update bet shares" on public.bet_shares;
create policy "Anyone can update bet shares"
on public.bet_shares
for update
to anon
using (true)
with check (true);

drop policy if exists "Anyone can update bet shares" on public.bet_shares;
create policy "Anyone can update bet shares"
on public.bet_shares
for update
to anon
with check (true);

-- Enable realtime for bet_shares table
-- Note: IF NOT EXISTS not supported on all PG versions
alter publication supabase_realtime add table bet_shares;

-- For the realtime subscription to work
alter table public.bet_shares replica identity full;
