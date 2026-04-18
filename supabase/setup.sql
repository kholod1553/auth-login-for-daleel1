create table if not exists public.categories (
  id text primary key,
  name text not null unique,
  description text
);

alter table public.services enable row level security;
alter table public.categories enable row level security;

drop policy if exists "Allow public read services" on public.services;
create policy "Allow public read services"
on public.services
for select
using (true);

drop policy if exists "Allow authenticated insert services" on public.services;
create policy "Allow authenticated insert services"
on public.services
for insert
to authenticated
with check (true);

drop policy if exists "Allow authenticated update services" on public.services;
create policy "Allow authenticated update services"
on public.services
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Allow authenticated delete services" on public.services;
create policy "Allow authenticated delete services"
on public.services
for delete
to authenticated
using (true);

drop policy if exists "Allow public read categories" on public.categories;
create policy "Allow public read categories"
on public.categories
for select
using (true);

insert into public.categories (id, name, description)
values
  ('cat-cleaning', 'Cleaning', 'Home and office cleaning services.'),
  ('cat-maintenance', 'Maintenance', 'Repair and technical maintenance services.'),
  ('cat-education', 'Education', 'Tutoring, training, and educational support.'),
  ('cat-delivery', 'Delivery', 'Shipping, delivery, and transportation services.')
on conflict (id) do update
set
  name = excluded.name,
  description = excluded.description;

insert into public.services (name, description, price, image_url)
select *
from (
  values
    (
      'Home Cleaning',
      'Professional home cleaning for apartments and small offices.',
      250,
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952'
    ),
    (
      'Plumbing Repair',
      'Fix leaking taps, clogged drains, and common plumbing issues.',
      300,
      'https://images.unsplash.com/photo-1621905252507-b35492cc74b4'
    ),
    (
      'Private Math Tutor',
      'One-on-one math lessons for middle and high school students.',
      180,
      'https://images.unsplash.com/photo-1509062522246-3755977927d7'
    )
) as seed_data (name, description, price, image_url)
where not exists (
  select 1
  from public.services
);
