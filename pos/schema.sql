-- Shop POS — database schema for Supabase (free tier)
-- Run once in the Supabase SQL editor of a NEW project (already applied to project "shop-pos").

create extension if not exists pgcrypto;

-- ============ TABLES ============
create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text default '',
  phone text default '',
  tax_id text default '',
  vat_mode text default 'none' check (vat_mode in ('none','included','excluded')),
  vat_rate numeric default 7,
  promptpay_id text default '',
  receipt_header text default '',
  receipt_footer text default 'ขอบคุณที่ใช้บริการ / Thank you',
  points_per_baht numeric default 0.04,   -- 1 point per 25 baht
  baht_per_point numeric default 1,        -- 1 point = 1 baht discount
  paper_width int default 58,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists public.shop_members (
  shop_id uuid references public.shops(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','manager','cashier','stock')),
  display_name text default '',
  email text default '',
  created_at timestamptz default now(),
  primary key (shop_id, user_id)
);

create table if not exists public.shop_invites (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references public.shops(id) on delete cascade,
  email text not null,
  role text not null check (role in ('manager','cashier','stock')),
  display_name text default '',
  created_at timestamptz default now(),
  accepted_at timestamptz,
  unique (shop_id, email)
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  color text default '#6366f1',
  sort int default 0
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  phone text default '',
  contact text default '',
  note text default '',
  created_at timestamptz default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  sku text default '',
  barcode text default '',
  price numeric not null default 0,
  cost numeric not null default 0,
  stock numeric not null default 0,
  low_stock numeric default 5,
  unit text default 'ชิ้น',
  image_url text default '',
  track_stock boolean default true,
  active boolean default true,
  created_at timestamptz default now()
);
create index if not exists products_shop_idx on public.products(shop_id);
create index if not exists products_barcode_idx on public.products(shop_id, barcode);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  phone text default '',
  points numeric default 0,
  total_spent numeric default 0,
  visits int default 0,
  note text default '',
  created_at timestamptz default now()
);
create index if not exists customers_shop_idx on public.customers(shop_id, phone);

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  kind text not null default 'percent' check (kind in ('percent','amount')),
  value numeric not null default 0,
  min_total numeric default 0,
  members_only boolean default false,
  active boolean default true,
  starts_on date,
  ends_on date
);

create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  user_id uuid references auth.users(id),
  user_name text default '',
  opened_at timestamptz default now(),
  opening_cash numeric default 0,
  closed_at timestamptz,
  closing_cash numeric,
  expected_cash numeric,
  note text default ''
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  bill_no text not null,
  cashier_id uuid references auth.users(id),
  cashier_name text default '',
  customer_id uuid references public.customers(id) on delete set null,
  shift_id uuid references public.shifts(id) on delete set null,
  subtotal numeric default 0,
  discount numeric default 0,
  points_used numeric default 0,
  points_earned numeric default 0,
  vat numeric default 0,
  total numeric default 0,
  cost_total numeric default 0,
  paid numeric default 0,
  change numeric default 0,
  payment_method text default 'cash',
  status text default 'paid' check (status in ('paid','void')),
  note text default '',
  created_at timestamptz default now()
);
create index if not exists sales_shop_date_idx on public.sales(shop_id, created_at desc);

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  qty numeric not null,
  price numeric not null,
  cost numeric default 0,
  discount numeric default 0
);
create index if not exists sale_items_sale_idx on public.sale_items(sale_id);
create index if not exists sale_items_shop_idx on public.sale_items(shop_id);

create table if not exists public.stock_moves (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  product_name text default '',
  kind text not null check (kind in ('in','out','adjust','sale','void')),
  qty numeric not null,
  cost numeric default 0,
  supplier_id uuid references public.suppliers(id) on delete set null,
  ref text default '',
  note text default '',
  user_id uuid references auth.users(id),
  created_at timestamptz default now()
);
create index if not exists stock_moves_shop_idx on public.stock_moves(shop_id, created_at desc);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  category text default 'ทั่วไป',
  amount numeric not null,
  note text default '',
  spent_on date default current_date,
  user_id uuid references auth.users(id),
  created_at timestamptz default now()
);

-- ============ HELPERS ============
create or replace function public.has_role(p_shop uuid, p_roles text[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from shop_members m
    where m.shop_id = p_shop and m.user_id = auth.uid() and m.role = any(p_roles));
$$;

create or replace function public.is_member(p_shop uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from shop_members m where m.shop_id = p_shop and m.user_id = auth.uid());
$$;

-- owner auto-added as member when shop created
create or replace function public.on_shop_created() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into shop_members(shop_id, user_id, role, display_name, email)
  values (new.id, new.owner_id, 'owner',
    coalesce((select raw_user_meta_data->>'name' from auth.users where id = new.owner_id), ''),
    coalesce((select email from auth.users where id = new.owner_id), ''))
  on conflict do nothing;
  insert into categories(shop_id, name, color, sort) values (new.id, 'ทั่วไป', '#6366f1', 0);
  return new;
end $$;
create trigger trg_shop_created after insert on public.shops
for each row execute function public.on_shop_created();

-- staff joins shops they were invited to (by email)
create or replace function public.accept_invites() returns int
language plpgsql security definer set search_path = public as $$
declare n int := 0; v_email text;
begin
  select email into v_email from auth.users where id = auth.uid();
  if v_email is null then return 0; end if;
  insert into shop_members(shop_id, user_id, role, display_name, email)
  select i.shop_id, auth.uid(), i.role, i.display_name, v_email
  from shop_invites i where lower(i.email) = lower(v_email) and i.accepted_at is null
  on conflict (shop_id, user_id) do update set role = excluded.role;
  get diagnostics n = row_count;
  update shop_invites set accepted_at = now() where lower(email) = lower(v_email) and accepted_at is null;
  return n;
end $$;

-- ============ CHECKOUT (atomic) ============
create or replace function public.create_sale(p_shop uuid, p jsonb)
returns public.sales language plpgsql security definer set search_path = public as $$
declare
  s public.sales; it jsonb; v_no text; v_cost numeric := 0; v_prod products;
  v_name text; v_count int;
begin
  if not is_member(p_shop) then raise exception 'not allowed'; end if;
  perform pg_advisory_xact_lock(hashtext(p_shop::text));
  select count(*) into v_count from sales where shop_id = p_shop
    and (created_at at time zone 'Asia/Bangkok')::date = (now() at time zone 'Asia/Bangkok')::date;
  v_no := to_char(now() at time zone 'Asia/Bangkok', 'YYMMDD') || '-' || lpad((v_count + 1)::text, 4, '0');
  select coalesce(nullif(display_name,''), email) into v_name from shop_members where shop_id = p_shop and user_id = auth.uid();

  insert into sales(shop_id, bill_no, cashier_id, cashier_name, customer_id, shift_id, subtotal, discount,
    points_used, points_earned, vat, total, paid, change, payment_method, note)
  values (p_shop, v_no, auth.uid(), v_name, nullif(p->>'customer_id','')::uuid, nullif(p->>'shift_id','')::uuid,
    (p->>'subtotal')::numeric, coalesce((p->>'discount')::numeric,0), coalesce((p->>'points_used')::numeric,0),
    coalesce((p->>'points_earned')::numeric,0), coalesce((p->>'vat')::numeric,0), (p->>'total')::numeric,
    coalesce((p->>'paid')::numeric,0), coalesce((p->>'change')::numeric,0), coalesce(p->>'payment_method','cash'),
    coalesce(p->>'note',''))
  returning * into s;

  for it in select * from jsonb_array_elements(p->'items') loop
    v_prod := null;
    select * into v_prod from products where id = nullif(it->>'product_id','')::uuid and shop_id = p_shop;
    insert into sale_items(sale_id, shop_id, product_id, name, qty, price, cost, discount)
    values (s.id, p_shop, v_prod.id, coalesce(v_prod.name, it->>'name'), (it->>'qty')::numeric,
      (it->>'price')::numeric, coalesce(v_prod.cost, 0), coalesce((it->>'discount')::numeric, 0));
    v_cost := v_cost + coalesce(v_prod.cost, 0) * (it->>'qty')::numeric;
    if v_prod.id is not null and v_prod.track_stock then
      update products set stock = stock - (it->>'qty')::numeric where id = v_prod.id;
      insert into stock_moves(shop_id, product_id, product_name, kind, qty, cost, ref, user_id)
      values (p_shop, v_prod.id, v_prod.name, 'sale', -(it->>'qty')::numeric, v_prod.cost, v_no, auth.uid());
    end if;
  end loop;

  update sales set cost_total = v_cost where id = s.id returning * into s;

  if s.customer_id is not null then
    update customers set points = greatest(0, points - s.points_used + s.points_earned),
      total_spent = total_spent + s.total, visits = visits + 1
    where id = s.customer_id and shop_id = p_shop;
  end if;
  return s;
end $$;

create or replace function public.void_sale(p_sale uuid, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
declare s sales; it sale_items;
begin
  select * into s from sales where id = p_sale for update;
  if s.id is null or s.status = 'void' then raise exception 'not found'; end if;
  if not has_role(s.shop_id, array['owner','manager']) then raise exception 'not allowed'; end if;
  update sales set status = 'void', note = trim(note || ' VOID: ' || coalesce(p_reason,'')) where id = s.id;
  for it in select * from sale_items where sale_id = s.id loop
    if it.product_id is not null then
      update products set stock = stock + it.qty where id = it.product_id and track_stock;
      insert into stock_moves(shop_id, product_id, product_name, kind, qty, cost, ref, user_id)
      values (s.shop_id, it.product_id, it.name, 'void', it.qty, it.cost, s.bill_no, auth.uid());
    end if;
  end loop;
  if s.customer_id is not null then
    update customers set points = greatest(0, points + s.points_used - s.points_earned),
      total_spent = greatest(0, total_spent - s.total), visits = greatest(0, visits - 1)
    where id = s.customer_id;
  end if;
end $$;

-- receive / adjust stock
create or replace function public.stock_move(p_shop uuid, p_product uuid, p_kind text, p_qty numeric,
  p_cost numeric, p_supplier uuid, p_note text)
returns void language plpgsql security definer set search_path = public as $$
declare v_prod products; v_delta numeric;
begin
  if not has_role(p_shop, array['owner','manager','stock']) then raise exception 'not allowed'; end if;
  select * into v_prod from products where id = p_product and shop_id = p_shop for update;
  if v_prod.id is null then raise exception 'product not found'; end if;
  if p_kind = 'in' then v_delta := abs(p_qty);
  elsif p_kind = 'out' then v_delta := -abs(p_qty);
  elsif p_kind = 'adjust' then v_delta := p_qty - v_prod.stock;  -- p_qty = counted stock
  else raise exception 'bad kind'; end if;
  update products set stock = stock + v_delta,
    cost = case when p_kind = 'in' and coalesce(p_cost,0) > 0 then
      coalesce(round(((greatest(v_prod.stock,0) * v_prod.cost) + (abs(p_qty) * p_cost)) / nullif(greatest(v_prod.stock,0) + abs(p_qty),0), 2), p_cost)
      else cost end
  where id = p_product;
  insert into stock_moves(shop_id, product_id, product_name, kind, qty, cost, supplier_id, note, user_id)
  values (p_shop, p_product, v_prod.name, p_kind, v_delta, coalesce(p_cost, v_prod.cost), p_supplier, coalesce(p_note,''), auth.uid());
end $$;

-- ============ ROW LEVEL SECURITY ============
alter table public.shops enable row level security;
alter table public.shop_members enable row level security;
alter table public.shop_invites enable row level security;
alter table public.categories enable row level security;
alter table public.suppliers enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.promotions enable row level security;
alter table public.shifts enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.stock_moves enable row level security;
alter table public.expenses enable row level security;

-- shops
create policy shops_sel on public.shops for select to authenticated using (is_member(id) or owner_id = auth.uid());
create policy shops_ins on public.shops for insert to authenticated with check (owner_id = auth.uid());
create policy shops_upd on public.shops for update to authenticated using (has_role(id, array['owner','manager']));
create policy shops_rm  on public.shops for delete to authenticated using (owner_id = auth.uid());

-- members / invites (owner manages staff)
create policy mem_sel on public.shop_members for select to authenticated using (is_member(shop_id));
create policy mem_upd on public.shop_members for update to authenticated using (has_role(shop_id, array['owner']) and role <> 'owner') with check (role <> 'owner');
create policy mem_rm  on public.shop_members for delete to authenticated using (has_role(shop_id, array['owner']) and role <> 'owner');
create policy inv_sel on public.shop_invites for select to authenticated using (has_role(shop_id, array['owner']));
create policy inv_ins on public.shop_invites for insert to authenticated with check (has_role(shop_id, array['owner']));
create policy inv_upd on public.shop_invites for update to authenticated using (has_role(shop_id, array['owner'])) with check (has_role(shop_id, array['owner']));
create policy inv_rm  on public.shop_invites for delete to authenticated using (has_role(shop_id, array['owner']));

-- every member can read; listed roles can write
do $$
declare t text; w text[];
begin
  for t, w in select * from (values
    ('categories', array['owner','manager','stock']),
    ('suppliers',  array['owner','manager','stock']),
    ('products',   array['owner','manager','stock']),
    ('customers',  array['owner','manager','cashier']),
    ('promotions', array['owner','manager']),
    ('expenses',   array['owner','manager'])
  ) as x(t, w) loop
    execute format('create policy %1$s_sel on public.%1$s for select to authenticated using (is_member(shop_id))', t);
    execute format('create policy %1$s_ins on public.%1$s for insert to authenticated with check (has_role(shop_id, %2$L))', t, w);
    execute format('create policy %1$s_upd on public.%1$s for update to authenticated using (has_role(shop_id, %2$L)) with check (has_role(shop_id, %2$L))', t, w);
  end loop;
end $$;
create policy categories_rm on public.categories for delete to authenticated using (has_role(shop_id, array['owner','manager','stock']));
create policy suppliers_rm  on public.suppliers  for delete to authenticated using (has_role(shop_id, array['owner','manager','stock']));
create policy products_rm   on public.products   for delete to authenticated using (has_role(shop_id, array['owner','manager','stock']));
create policy customers_rm  on public.customers  for delete to authenticated using (has_role(shop_id, array['owner','manager']));
create policy promotions_rm on public.promotions for delete to authenticated using (has_role(shop_id, array['owner','manager']));
create policy expenses_rm   on public.expenses   for delete to authenticated using (has_role(shop_id, array['owner','manager']));

-- shifts: any member opens/closes own shift
create policy shifts_sel on public.shifts for select to authenticated using (is_member(shop_id));
create policy shifts_ins on public.shifts for insert to authenticated with check (is_member(shop_id) and user_id = auth.uid());
create policy shifts_upd on public.shifts for update to authenticated using (user_id = auth.uid() or has_role(shop_id, array['owner','manager']));

-- sales / items / stock history: read-only (writes only through create_sale / void_sale / stock_move)
create policy sales_sel on public.sales for select to authenticated using (is_member(shop_id));
create policy items_sel on public.sale_items for select to authenticated using (is_member(shop_id));
create policy moves_sel on public.stock_moves for select to authenticated using (is_member(shop_id));

-- every function checks shop membership/role with auth.uid(), so anonymous calls do nothing.

-- ============ CLOSED REGISTRATION ============
-- Public email/password sign-up is blocked; only Google sign-ups (and accounts made by the admin in SQL) are allowed.
create or replace function app_private.block_email_signup() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if current_user = 'supabase_auth_admin' and coalesce(new.raw_app_meta_data->>'provider', 'email') = 'email' then
    raise exception 'Email registration is disabled. Please sign in with Google.';
  end if;
  return new;
end $$;
create trigger trg_block_email_signup before insert on auth.users
for each row execute function app_private.block_email_signup();


-- ============ v3 (applied as migrations pos_09 … pos_13) ============
-- Widened checks (roles admin/accountant; sale statuses refunded/partial_refund/pending; stock kinds refund/purchase/damaged/expired/transfer_in/transfer_out/return_supplier)
-- New columns on shops/products/customers/suppliers/sales/sale_items/expenses (branch, logo, era, decimals, payment_methods, permissions, units, promo/wholesale price,
--   expiry/lot, tax info, credit limit/balance, client_id idempotency, invoice_type, refunded_qty, receipt_url, approval)
-- New tables: sale_payments, refunds, refund_items, purchases, purchase_items, supplier_payments, cash_moves, customer_payments, audit_log (all RLS-protected)
-- Functions: create_sale v2 (idempotent, split payments, units, store credit, negative-stock rule), confirm_payment, void_sale v2, refund_sale,
--   stock_move v2, transfer_stock, receive_purchase, pay_supplier, customer_pay, issue_tax_invoice, log_action, doc_no; audit triggers on products & staff.
-- Full SQL is stored in the Supabase project's migration history (supabase_migrations.schema_migrations).
