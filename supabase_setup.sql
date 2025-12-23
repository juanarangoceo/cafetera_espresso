-- Create table for leads if it doesn't exist
create table if not exists public.leads (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  source text default 'barista_masterclass',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint leads_email_key unique (email)
);

-- Set up Row Level Security (RLS)
alter table public.leads enable row level security;

-- Policy to allow anonymous inserts (public submission)
create policy "Allow public inserts"
  on public.leads
  for insert
  to anon
  with check (true);

-- Policy to allow service_role to view all (for admin usage)
create policy "Allow service_role to view all"
  on public.leads
  for select
  to service_role
  using (true);
