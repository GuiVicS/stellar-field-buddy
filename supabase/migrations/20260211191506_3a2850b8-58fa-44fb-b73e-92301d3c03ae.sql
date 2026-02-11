
-- Tabela de feedback/pesquisa de satisfação
CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  os_id UUID NOT NULL REFERENCES public.service_orders(id),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice para busca por token
CREATE INDEX idx_feedback_token ON public.feedback(token);

-- RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode ler/atualizar pelo token (página pública)
CREATE POLICY "Public can read feedback by token"
  ON public.feedback FOR SELECT
  USING (true);

CREATE POLICY "Public can submit feedback"
  ON public.feedback FOR UPDATE
  USING (true);

-- Authenticated pode inserir (sistema cria ao concluir OS)
CREATE POLICY "Authenticated can insert feedback"
  ON public.feedback FOR INSERT
  WITH CHECK (true);

-- Tabela de configurações do sistema (Evolution API etc)
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage settings"
  ON public.system_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gerente'));

CREATE POLICY "Authenticated can read settings"
  ON public.system_settings FOR SELECT
  USING (true);

-- Inserir configurações padrão da Evolution API
INSERT INTO public.system_settings (key, value) VALUES
  ('evolution_api_url', ''),
  ('evolution_api_key', ''),
  ('evolution_instance', ''),
  ('feedback_email_enabled', 'true'),
  ('feedback_whatsapp_enabled', 'true');
