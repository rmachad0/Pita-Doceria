-- Tabela para gastos extras / imprevistos (consertos, reposição de equipamentos, etc.)
CREATE TABLE IF NOT EXISTS gastos_extras (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao   TEXT        NOT NULL,
  valor       NUMERIC     NOT NULL CHECK (valor > 0),
  data        DATE        NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
