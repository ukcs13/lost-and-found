-- COMPLETE AND IDEMPOTENT SCHEMA
-- Run this entire file in Supabase SQL Editor to set up or fix your database.

-- 1. Enable necessary extensions
create extension if not exists "uuid-ossp";

-- 2. Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  avatar_url text,
  updated_at timestamptz,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Grants (important for RLS)
grant all on table public.profiles to authenticated;
grant all on table public.profiles to service_role;

-- Profiles Policies
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using ( true );

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check ( auth.uid() = id );

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using ( auth.uid() = id );

-- Trigger for new users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 3. Items Table (Lost & Found)
create table if not exists public.items (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  description text not null,
  type text not null check (type in ('lost', 'found')),
  category text not null,
  status text not null default 'open' check (status in ('open', 'resolved', 'closed')),
  location_name text,
  latitude float,
  longitude float,
  date_lost_found date,
  images text[], -- Array of image URLs
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.items enable row level security;

-- Grants
grant all on table public.items to authenticated;
grant all on table public.items to service_role;

-- Indexes (idempotent)
create index if not exists items_type_idx on public.items (type);
create index if not exists items_category_idx on public.items (category);
create index if not exists items_status_idx on public.items (status);
create index if not exists items_date_idx on public.items (date_lost_found);
create index if not exists items_location_idx on public.items (latitude, longitude);

-- Items Policies
drop policy if exists "Items are viewable by everyone" on public.items;
create policy "Items are viewable by everyone"
  on public.items for select
  using ( true );

drop policy if exists "Users can insert their own items" on public.items;
create policy "Users can insert their own items"
  on public.items for insert
  with check ( auth.uid() = user_id );

drop policy if exists "Users can update their own items" on public.items;
create policy "Users can update their own items"
  on public.items for update
  using ( auth.uid() = user_id );

drop policy if exists "Users can delete their own items" on public.items;
create policy "Users can delete their own items"
  on public.items for delete
  using ( auth.uid() = user_id );


-- 4. Messages Table
create table if not exists public.messages (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references auth.users not null,
  receiver_id uuid references auth.users not null,
  item_id uuid references public.items not null,
  content text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- Fix legacy column name if present
do $$
begin
  if exists(
    select 1 
    from information_schema.columns 
    where table_schema = 'public' and table_name = 'messages' and column_name = 'read'
  ) then
    alter table public.messages rename column read to is_read;
  end if;
end $$;

alter table public.messages enable row level security;

-- Grants
grant all on table public.messages to authenticated;
grant all on table public.messages to service_role;

-- Messages Policies
drop policy if exists "Users can see their own messages" on public.messages;
create policy "Users can see their own messages"
  on public.messages for select
  using ( auth.uid() = sender_id or auth.uid() = receiver_id );

drop policy if exists "Users can send messages" on public.messages;
create policy "Users can send messages"
  on public.messages for insert
  with check ( auth.uid() = sender_id );

drop policy if exists "Users can update messages" on public.messages;
create policy "Users can update messages"
  on public.messages for update
  using ( auth.uid() = receiver_id ); -- e.g. marking as read


-- 5. Geospatial Search Function
create or replace function get_items_nearby(
  lat float,
  long float,
  radius_km float
)
returns setof items
language sql
stable
as $$
  select *
  from items
  where (
    6371 * acos(
      least(1.0, greatest(-1.0,
        cos(radians(lat)) * cos(radians(latitude)) *
        cos(radians(longitude) - radians(long)) +
        sin(radians(lat)) * sin(radians(latitude))
      ))
    )
  ) <= radius_km;
$$;


-- 6. Storage: item-images bucket and policies
do $$
begin
  if not exists (select 1 from storage.buckets where name = 'item-images') then
    perform storage.create_bucket('item-images', public => true);
  end if;
end $$;

drop policy if exists "Public read item-images" on storage.objects;
create policy "Public read item-images"
  on storage.objects for select
  using ( bucket_id = 'item-images' );

drop policy if exists "Authenticated upload item-images" on storage.objects;
create policy "Authenticated upload item-images"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'item-images' );
