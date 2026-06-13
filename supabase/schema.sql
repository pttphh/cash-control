-- Supabase SQL Editor에서 실행하세요.

-- 사용자 프로필 (Supabase auth.users 연동)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  role text not null check (role in ('admin', 'jibgye', 'sales')),
  created_at timestamptz default now()
);

-- 거래처
create table if not exists clients (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  created_at timestamptz default now()
);

-- 출고 기입
create table if not exists shipments (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references clients(id) on delete cascade not null,
  item text not null check (item in ('학18', '순옥18', '순콩18', '순카18')),
  quantity integer not null default 0,
  amount integer not null default 0,
  entry_date date not null,
  year_month text not null,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- 발행 기입
create table if not exists issuances (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references clients(id) on delete cascade not null,
  quantity integer not null default 0,
  amount integer not null default 0,
  entry_date date not null,
  year_month text not null,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- 수금 기입
create table if not exists collections (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references clients(id) on delete cascade not null,
  amount integer not null default 0,
  vault text not null check (vault in ('A', 'B')),
  entry_date date not null,
  year_month text not null,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- 출금
create table if not exists withdrawals (
  id uuid default gen_random_uuid() primary key,
  type text not null check (type in ('중간', '최종')),
  vault text not null check (vault in ('A', 'B', 'AB')),
  amount_a integer not null default 0,
  amount_b integer not null default 0,
  note text,
  entry_date date not null,
  year_month text not null,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- RLS 활성화
alter table profiles enable row level security;
alter table clients enable row level security;
alter table shipments enable row level security;
alter table issuances enable row level security;
alter table collections enable row level security;
alter table withdrawals enable row level security;

-- profiles 정책
create policy "로그인 사용자 프로필 읽기" on profiles
  for select using (auth.uid() is not null);

create policy "admin 프로필 관리" on profiles
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- clients 정책
create policy "로그인 사용자 읽기" on clients
  for select using (auth.uid() is not null);

create policy "누구나 삽입" on clients
  for insert with check (auth.uid() is not null);

create policy "admin만 수정/삭제 clients" on clients
  for update using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "admin만 삭제 clients" on clients
  for delete using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- shipments 정책
create policy "로그인 사용자 읽기 shipments" on shipments
  for select using (auth.uid() is not null);

create policy "누구나 삽입 shipments" on shipments
  for insert with check (auth.uid() is not null);

create policy "admin만 수정 shipments" on shipments
  for update using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "admin만 삭제 shipments" on shipments
  for delete using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- issuances 정책
create policy "로그인 사용자 읽기 issuances" on issuances
  for select using (auth.uid() is not null);

create policy "누구나 삽입 issuances" on issuances
  for insert with check (auth.uid() is not null);

create policy "admin만 수정 issuances" on issuances
  for update using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "admin만 삭제 issuances" on issuances
  for delete using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- collections 정책
create policy "로그인 사용자 읽기 collections" on collections
  for select using (auth.uid() is not null);

create policy "누구나 삽입 collections" on collections
  for insert with check (auth.uid() is not null);

create policy "admin만 수정 collections" on collections
  for update using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "admin만 삭제 collections" on collections
  for delete using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- withdrawals 정책
create policy "로그인 사용자 읽기 withdrawals" on withdrawals
  for select using (auth.uid() is not null);

create policy "누구나 삽입 withdrawals" on withdrawals
  for insert with check (auth.uid() is not null);

create policy "admin만 수정 withdrawals" on withdrawals
  for update using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "admin만 삭제 withdrawals" on withdrawals
  for delete using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- 최초 관리자 계정은 Supabase Dashboard > Authentication에서 생성 후
-- profiles 테이블에 수동으로 INSERT:
-- insert into profiles (id, name, role) values ('<auth-user-uuid>', '관리자', 'admin');
