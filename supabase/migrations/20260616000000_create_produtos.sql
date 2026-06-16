-- Tabela de produtos do cardápio público
CREATE TABLE IF NOT EXISTS public.produtos (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome        TEXT NOT NULL,
  descricao   TEXT DEFAULT '',
  preco       DECIMAL(10,2) NOT NULL DEFAULT 0,
  categoria   TEXT NOT NULL DEFAULT 'Outros',
  foto_url    TEXT DEFAULT '',
  ativo       BOOLEAN DEFAULT true,
  ordem       INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: leitura pública, escrita apenas autenticados
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "produtos_select_public"
  ON public.produtos FOR SELECT
  USING (true);

CREATE POLICY "produtos_insert_auth"
  ON public.produtos FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "produtos_update_auth"
  ON public.produtos FOR UPDATE
  TO authenticated USING (true);

CREATE POLICY "produtos_delete_auth"
  ON public.produtos FOR DELETE
  TO authenticated USING (true);

-- Storage bucket para fotos dos produtos (público)
INSERT INTO storage.buckets (id, name, public)
VALUES ('produtos', 'produtos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "produtos_storage_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'produtos');

CREATE POLICY "produtos_storage_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'produtos');

CREATE POLICY "produtos_storage_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'produtos');
