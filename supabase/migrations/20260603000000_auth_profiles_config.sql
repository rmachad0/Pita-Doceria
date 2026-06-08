-- ── Profiles (espelha auth.users com campo role) ─────────────────────────────
create table if not exists profiles (
  id         uuid references auth.users(id) on delete cascade primary key,
  email      text,
  role       text not null default 'user',   -- 'admin' | 'user'
  created_at timestamptz default now()
);

-- Trigger: cria perfil automaticamente ao registrar usuário
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ── Configurações da empresa (logo, etc.) ────────────────────────────────────
create table if not exists configuracoes (
  id         int primary key default 1,
  logo_data  text,          -- base64 data URL da logo customizada
  updated_at timestamptz default now()
);

insert into configuracoes (id) values (1) on conflict do nothing;

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table profiles      enable row level security;
alter table configuracoes enable row level security;

-- Profiles: autenticados lêem tudo; admin pode escrever
drop policy if exists "profiles select" on profiles;
create policy "profiles select" on profiles
  for select using (auth.role() = 'authenticated');

drop policy if exists "profiles insert" on profiles;
create policy "profiles insert" on profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles update admin" on profiles;
create policy "profiles update admin" on profiles
  for update using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Configuracoes: qualquer um lê (para carregar logo sem login); admin escreve
drop policy if exists "config select" on configuracoes;
create policy "config select" on configuracoes
  for select using (true);

drop policy if exists "config write admin" on configuracoes;
create policy "config write admin" on configuracoes
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  ) with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ── iFood config (adicionado na configuracoes) ────────────────────────────────
-- Os campos abaixo são adicionados à tabela configuracoes já existente
alter table configuracoes add column if not exists ifood_client_id     text;
alter table configuracoes add column if not exists ifood_client_secret  text;
alter table configuracoes add column if not exists ifood_merchant_id    text;
alter table configuracoes add column if not exists ifood_token          text;
alter table configuracoes add column if not exists ifood_token_expires  timestamptz;
alter table configuracoes add column if not exists ifood_polling_active boolean default false;
