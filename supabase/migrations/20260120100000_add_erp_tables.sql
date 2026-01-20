-- Create Suppliers Table
create table if not exists suppliers (
  id uuid default gen_random_uuid() primary key,
  property_id uuid references properties(id) on delete cascade not null,
  name text not null,
  contact_name text,
  email text,
  phone text,
  address text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create Inventory Items Table
create table if not exists inventory_items (
  id uuid default gen_random_uuid() primary key,
  property_id uuid references properties(id) on delete cascade not null,
  supplier_id uuid references suppliers(id) on delete set null,
  name text not null,
  sku text,
  category text, -- 'food', 'beverage', 'cleaning', 'amenity', 'other'
  unit text, -- 'kg', 'liter', 'pack', 'unit', etc.
  quantity numeric default 0,
  min_quantity numeric default 0, -- Reorder point
  cost_per_unit numeric default 0,
  location text, -- 'kitchen', 'bar', 'storage_room', etc.
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create Inventory Transactions (Log)
create table if not exists inventory_transactions (
  id uuid default gen_random_uuid() primary key,
  item_id uuid references inventory_items(id) on delete cascade not null,
  type text not null check (type in ('in', 'out', 'adjustment', 'waste')),
  quantity numeric not null,
  reason text,
  cost_at_time numeric,
  performed_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Enable RLS
alter table suppliers enable row level security;
alter table inventory_items enable row level security;
alter table inventory_transactions enable row level security;

-- Policies for Suppliers
create policy "Suppliers viewable by property members"
  on suppliers for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.property_id = suppliers.property_id
    )
  );

create policy "Suppliers editable by managers"
  on suppliers for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.property_id = suppliers.property_id
      and profiles.role in ('admin', 'manager', 'owner')
    )
  );

-- Policies for Inventory Items
create policy "Inventory items viewable by property members"
  on inventory_items for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.property_id = inventory_items.property_id
    )
  );

create policy "Inventory items editable by managers and staff"
  on inventory_items for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.property_id = inventory_items.property_id
      and profiles.role in ('admin', 'manager', 'owner', 'staff', 'chef', 'bartender')
    )
  );

-- Policies for Inventory Transactions
create policy "Inventory transactions viewable by property members"
  on inventory_transactions for select
  using (
    exists (
      select 1 from profiles p
      join inventory_items i on i.property_id = p.property_id
      where p.id = auth.uid()
      and i.id = inventory_transactions.item_id
    )
  );

create policy "Inventory transactions creatable by staff"
  on inventory_transactions for insert
  with check (
    exists (
      select 1 from profiles p
      join inventory_items i on i.property_id = p.property_id
      where p.id = auth.uid()
      and i.id = inventory_transactions.item_id
      and p.role in ('admin', 'manager', 'owner', 'staff', 'chef', 'bartender')
    )
  );
