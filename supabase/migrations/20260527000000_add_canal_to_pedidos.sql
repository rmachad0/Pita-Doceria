-- Adiciona coluna de canal de venda na tabela pedidos
-- Valores: 'direto' (Venda Direta / Balcão) ou 'ifood' (iFood)
ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS canal TEXT NOT NULL DEFAULT 'direto'
  CHECK (canal IN ('direto', 'ifood'));
