
# Supabase Setup Instructions

To run this application, you need to set up a Supabase project and run the following SQL in the SQL Editor.

1.  **Create Project**: Go to [Supabase](https://supabase.com) and create a new project.
2.  **Environment Variables**: Create a `.env` file in your project root (or set in Vercel/Netlify):
    ```
    VITE_SUPABASE_URL=your_project_url
    VITE_SUPABASE_ANON_KEY=your_anon_key
    ```
3.  **Run SQL**: Copy and paste the script below into the Supabase SQL Editor to create the necessary tables and policies.

```sql
-- 1. Create Rooms Table
create table rooms (
  code text primary key,
  status text not null default 'LOBBY',
  current_round int default 0,
  round_end_time timestamptz,
  winner text,
  settings jsonb default '{"rounds": 3, "round_lengths": [300, 180, 60], "min_players": 6, "debug_mode": false}',
  custom_roles jsonb
);

-- 2. Create Players Table
create table players (
  id uuid primary key default gen_random_uuid(),
  room_code text references rooms(code) on delete cascade,
  name text not null,
  role jsonb,
  team text,
  is_god boolean default false,
  is_revealed boolean default false,
  condition_met boolean default false,
  joined_at timestamptz default now(),
  room_number int,
  is_leader boolean default false,
  verification_code text
);

-- 3. Create Card Sets Table (New)
create table card_sets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  roles jsonb not null,
  created_at timestamptz default now()
);

-- 4. Enable Realtime
-- You must enable Realtime for these tables in the Supabase Dashboard -> Database -> Replication
-- OR run:
alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table card_sets;

-- 5. Row Level Security (RLS)
-- For simplicity in this demo, we allow public access. 
-- In production, you should restrict this using auth.uid().

alter table rooms enable row level security;
create policy "Public Access Rooms" on rooms for all using (true) with check (true);

alter table players enable row level security;
create policy "Public Access Players" on players for all using (true) with check (true);

alter table card_sets enable row level security;
create policy "Public Access Card Sets" on card_sets for all using (true) with check (true);
```
