create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price text not null,
  original_price text,
  category text,
  tag text,
  description text not null,
  image_url text,
  featured boolean not null default false,
  in_stock boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.products enable row level security;

create policy "public can read products"
on public.products
for select
using (true);

create policy "authenticated users can insert products"
on public.products
for insert
to authenticated
with check (auth.uid() = created_by);

create policy "authenticated users can update own products"
on public.products
for update
to authenticated
using (auth.uid() = created_by)
with check (auth.uid() = created_by);

create policy "authenticated users can delete own products"
on public.products
for delete
to authenticated
using (auth.uid() = created_by);

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "public can view product images"
on storage.objects
for select
using (bucket_id = 'product-images');

create policy "authenticated users can upload product images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'product-images');
