-- Creates table for storing web push subscriptions
create table if not exists public.push_subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null,
  keys jsonb not null,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now())
);

create unique index if not exists idx_push_subscriptions_user_endpoint
  on public.push_subscriptions (user_id, endpoint);

alter table public.push_subscriptions
  enable row level security;

create policy "Allow users to manage their push subscriptions"
  on public.push_subscriptions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
