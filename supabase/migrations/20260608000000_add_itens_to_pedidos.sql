-- Adiciona suporte a múltiplos itens dentro de um mesmo pedido
-- Cada item: { produto: text, qty: int, unitPrice: numeric }
-- Os campos produto/quantidade legados permanecem para compatibilidade

alter table pedidos
  add column if not exists itens jsonb default null;
