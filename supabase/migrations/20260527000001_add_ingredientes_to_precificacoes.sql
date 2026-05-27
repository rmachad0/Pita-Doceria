-- Armazena ingredientes, embalagem, rendimento e tempo de preparo
-- de cada precificação salva, para permitir edição posterior.
ALTER TABLE precificacoes
  ADD COLUMN IF NOT EXISTS ingredientes JSONB;
