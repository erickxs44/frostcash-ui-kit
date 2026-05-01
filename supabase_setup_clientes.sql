-- Execute este script no SQL Editor do seu painel do Supabase para criar a tabela de clientes

CREATE TABLE public.clientes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    telefone TEXT,
    limite_credito NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configuração de Row Level Security (RLS) para permitir leitura/escrita
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura para todos" ON public.clientes
    FOR SELECT USING (true);

CREATE POLICY "Permitir inserção/atualização para todos" ON public.clientes
    FOR ALL USING (true);
