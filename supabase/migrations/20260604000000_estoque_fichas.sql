-- ── Estoque de ingredientes ───────────────────────────────────────────────────
create table if not exists estoque (
  id          bigint generated always as identity primary key,
  nome        text not null,
  unidade     text not null default 'g',   -- g | kg | un | L | ml | cx
  quantidade  numeric(12,3) not null default 0,
  qtd_minima  numeric(12,3) not null default 0,  -- alerta estoque baixo
  custo_unit  numeric(10,4) not null default 0,  -- custo por unidade (R$/g, R$/un…)
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── Fichas técnicas (receita vinculada a produto) ─────────────────────────────
create table if not exists fichas_tecnicas (
  id           bigint generated always as identity primary key,
  produto      text not null,
  rendimento   numeric(8,2) not null default 1, -- unidades que o lote produz
  unidade_prod text not null default 'un',       -- un | kg | g | L
  ativo        boolean not null default true,
  created_at   timestamptz default now()
);

-- ── Ingredientes da ficha técnica ─────────────────────────────────────────────
create table if not exists ficha_ingredientes (
  id               bigint generated always as identity primary key,
  ficha_id         bigint not null references fichas_tecnicas(id) on delete cascade,
  estoque_id       bigint references estoque(id) on delete set null,
  nome_ingrediente text not null,   -- nome manual (fallback se estoque_id null)
  quantidade       numeric(12,3) not null,  -- quantidade por lote completo
  unidade          text not null default 'g'
);

-- ── Movimentações de estoque ──────────────────────────────────────────────────
create table if not exists movimentacoes_estoque (
  id          bigint generated always as identity primary key,
  estoque_id  bigint not null references estoque(id) on delete cascade,
  tipo        text not null,         -- 'entrada' | 'saida' | 'ajuste' | 'desperdicio'
  quantidade  numeric(12,3) not null,
  saldo_apos  numeric(12,3),         -- saldo após a movimentação
  motivo      text,                  -- 'venda iFood', 'venda balcão', 'compra', etc.
  pedido_ref  text,                  -- numero_pedido que gerou a saída
  created_at  timestamptz default now()
);

-- ── Trigger: atualiza updated_at do estoque ───────────────────────────────────
create or replace function atualizar_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists estoque_updated_at on estoque;
create trigger estoque_updated_at
  before update on estoque
  for each row execute procedure atualizar_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table estoque                enable row level security;
alter table fichas_tecnicas        enable row level security;
alter table ficha_ingredientes     enable row level security;
alter table movimentacoes_estoque  enable row level security;

create policy "estoque public"           on estoque               for all using (true) with check (true);
create policy "fichas public"            on fichas_tecnicas       for all using (true) with check (true);
create policy "ficha_ingredientes public"on ficha_ingredientes    for all using (true) with check (true);
create policy "movimentacoes public"     on movimentacoes_estoque for all using (true) with check (true);
