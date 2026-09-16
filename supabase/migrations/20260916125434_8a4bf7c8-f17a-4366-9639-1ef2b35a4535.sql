create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  device_fingerprint text,
  user_agent text,
  platform text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

grant select, insert, update, delete on public.push_subscriptions to authenticated;
grant all on public.push_subscriptions to service_role;
grant insert on public.push_subscriptions to anon;

alter table public.push_subscriptions enable row level security;

create policy "Anyone can register a push token"
  on public.push_subscriptions for insert
  to anon, authenticated
  with check (true);

create policy "Anyone can update their own token heartbeat"
  on public.push_subscriptions for update
  to anon, authenticated
  using (true)
  with check (true);

create policy "Admins can read all push tokens"
  on public.push_subscriptions for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete push tokens"
  on public.push_subscriptions for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));


create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  link text,
  category text not null default 'general',
  created_at timestamptz not null default now(),
  created_by uuid,
  is_archived boolean not null default false
);

grant select on public.notifications to anon, authenticated;
grant all on public.notifications to service_role;

alter table public.notifications enable row level security;

create policy "Anyone can read notifications"
  on public.notifications for select
  to anon, authenticated
  using (not coalesce(is_archived, false));

create policy "Admins can insert notifications"
  on public.notifications for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update notifications"
  on public.notifications for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete notifications"
  on public.notifications for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create index if not exists notifications_created_at_idx
  on public.notifications (created_at desc);