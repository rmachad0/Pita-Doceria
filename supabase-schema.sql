-- Pita Doceria — Schema Supabase
-- Cole este SQL no SQL Editor do seu projeto Supabase e clique em Run

create table if not exists precificacoes (
  id               bigint generated always as identity primary key,
  created_at       timestamptz default now(),
  produto          text not null,
  custo_base       numeric(10,2),
  preco_final      numeric(10,2),
  margem_liquida   numeric(6,2),
  saude            text,
  canal            text,
  margem_desejada  numeric(6,2),
  imposto_nf       numeric(6,2)
);

create table if not exists pedidos (
  id               bigint generated always as identity primary key,
  created_at       timestamptz default now(),
  numero_pedido    text not null,
  nome_cliente     text not null,
  telefone         text,
  produto          text not null,
  quantidade       int default 1,
  valor_total      numeric(10,2),
  data_entrega     date,
  forma_pagamento  text default 'Pix',
  observacoes      text,
  status           text default 'Recebido'
);

create table if not exists alertas_margem (
  id          bigint generated always as identity primary key,
  created_at  timestamptz default now(),
  produto     text,
  margem      numeric(6,2),
  custo_base  numeric(10,2)
);

-- Habilitar acesso público (anon key) de leitura e escrita
alter table precificacoes enable row level security;
alter table pedidos       enable row level security;
alter table alertas_margem enable row level security;

create policy "acesso publico precificacoes" on precificacoes for all using (true) with check (true);
create policy "acesso publico pedidos"       on pedidos       for all using (true) with check (true);
create policy "acesso publico alertas"       on alertas_margem for all using (true) with check (true);
