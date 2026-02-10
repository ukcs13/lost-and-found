-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- ----------------------------
-- 1. Profiles Table
-- ----------------------------
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  avatar_url text,
  updated_at timestamptz,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
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

-- Trigger to handle new user signup
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


-- ----------------------------
-- 2. Items Table (Lost & Found)
-- ----------------------------
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

-- Indexes for search performance
create index items_type_idx on public.items (type);
create index items_category_idx on public.items (category);
create index items_status_idx on public.items (status);
create index items_date_idx on public.items (date_lost_found);
create index items_location_idx on public.items (latitude, longitude);

-- RLS for Items
alter table public.items enable row level security;

create policy "Items are viewable by everyone"
  on public.items for select
  using ( true );

create policy "Users can insert their own items"
  on public.items for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own items"
  on public.items for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own items"
  on public.items for delete
  using ( auth.uid() = user_id );


-- ----------------------------
-- 3. Messages Table
-- ----------------------------
create table if not exists public.messages (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references auth.users not null,
  receiver_id uuid references auth.users not null,
  item_id uuid references public.items not null,
  content text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- RLS for Messages
alter table public.messages enable row level security;

create policy "Users can see their own messages"
  on public.messages for select
  using ( auth.uid() = sender_id or auth.uid() = receiver_id );

create policy "Users can send messages"
  on public.messages for insert
  with check ( auth.uid() = sender_id );

alter table public.messages add column if not exists is_read boolean default false;
alter table public.messages drop column if exists read;

-- ----------------------------
-- 4. Geospatial Search
-- ----------------------------
-- Function to find items within a radius (in km)
-- Uses Haversine formula
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
