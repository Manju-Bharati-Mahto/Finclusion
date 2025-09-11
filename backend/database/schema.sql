-- Create profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade,
  name text,
  email text,
  pan_id text,
  date_of_birth date,
  profile_image text,
  profile_completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);

-- Set up row level security for profiles
alter table public.profiles enable row level security;
create policy "Users can view their own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- Create categories table
create table if not exists public.categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  color text,
  icon text,
  budget numeric(10,2),
  user_id uuid references auth.users on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(name, type, user_id)
);

-- Set up row level security for categories
alter table public.categories enable row level security;
create policy "Users can view their own categories" on public.categories
  for select using (auth.uid() = user_id);
create policy "Users can create their own categories" on public.categories
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own categories" on public.categories
  for update using (auth.uid() = user_id);
create policy "Users can delete their own categories" on public.categories
  for delete using (auth.uid() = user_id);

-- Create transactions table
create table if not exists public.transactions (
  id uuid default uuid_generate_v4() primary key,
  type text not null check (type in ('income', 'expense')),
  amount numeric(10,2) not null,
  category_id uuid references public.categories on delete cascade not null,
  description text,
  date date not null,
  user_id uuid references auth.users on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up row level security for transactions
alter table public.transactions enable row level security;
create policy "Users can view their own transactions" on public.transactions
  for select using (auth.uid() = user_id);
create policy "Users can create their own transactions" on public.transactions
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own transactions" on public.transactions
  for update using (auth.uid() = user_id);
create policy "Users can delete their own transactions" on public.transactions
  for delete using (auth.uid() = user_id);

-- Create function to auto-update updated_at timestamp
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer;

-- Create triggers for updated_at
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_categories_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

create trigger set_transactions_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();