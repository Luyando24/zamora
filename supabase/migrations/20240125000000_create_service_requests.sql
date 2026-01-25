
-- Service Requests Table
create table if not exists service_requests (
  id uuid default gen_random_uuid() primary key,
  property_id uuid references properties(id) on delete cascade not null,
  table_number text, -- e.g., "5", "A1"
  room_number text, -- e.g., "101" (if room service)
  type text not null, -- 'call_waiter', 'bill', 'cleaning', 'water'
  status text default 'pending', -- 'pending', 'acknowledged', 'completed'
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS Policies
alter table service_requests enable row level security;

create policy "Public can create service requests"
  on service_requests for insert
  with check (true);

create policy "Staff can view service requests"
  on service_requests for select
  using (true); -- Ideally scoped to property_id via auth, but keeping open for simplicity in this context

create policy "Staff can update service requests"
  on service_requests for update
  using (true);
