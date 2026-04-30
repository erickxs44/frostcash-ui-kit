// ============================================================
// FrostCash — Supabase REST Client (fetch puro, sem SDK)
// Tabelas detectadas: estoque, despesas
// Tabela vendas: NÃO EXISTE no Supabase — dados vão só pro SheetDB
// ============================================================
// NOTA SOBRE RLS:
// As tabelas têm Row-Level Security ativado. Com a chave pública
// (anon), INSERT/UPDATE pode ser bloqueado. Se isso acontecer,
// o sync falha silenciosamente e os dados ficam só no localStorage
// + SheetDB. Para resolver definitivamente, desabilite RLS no
// Supabase Dashboard ou crie policies que permitam insert/select.
// ============================================================

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

const headers: Record<string, string> = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

// ---- Tipos do banco (nomes reais das colunas) ----

// Tabela: estoque
// Colunas detectadas: id (bigint auto), nome_produto, unidade, quantidade_atual, created_at
export interface EstoqueRow {
  id?: number;
  nome_produto: string;
  unidade: string;
  quantidade_atual: number;
  created_at?: string;
}

// Tabela: despesas
// Colunas detectadas: id (bigint auto), data, descrição, categoria, valor, fornecedor, created_at
export interface DespesaRow {
  id?: number;
  data: string;
  "descrição": string;
  categoria: string;
  valor: number;
  fornecedor: string;
  created_at?: string;
}

// Vendas não tem tabela no Supabase — será salvo APENAS no SheetDB
export interface VendaRow {
  data: string;
  item: string;
  categoria: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  metodo_pagamento: string;
  lucro_estimado: number;
}

export interface PerfilRow {
  user_id: string;
  nome_loja: string;
  endereco: string;
  telefone: string;
}

// ---- Helpers genéricos ----

async function supabasePost<T>(table: string, data: T): Promise<T | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/${table}`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.text();
      console.warn(`[Supabase] POST ${table} → ${res.status}:`, err);
      return null;
    }
    const json = await res.json();
    return Array.isArray(json) ? json[0] : json;
  } catch (err) {
    console.warn(`[Supabase] POST ${table} falhou (rede):`, err);
    return null;
  }
}

async function supabaseGet<T>(table: string, query = ""): Promise<T[]> {
  try {
    const url = query ? `${SUPABASE_URL}/${table}?${query}` : `${SUPABASE_URL}/${table}`;
    const res = await fetch(url, { method: "GET", headers });
    if (!res.ok) {
      console.warn(`[Supabase] GET ${table} → ${res.status}`);
      return [];
    }
    return res.json();
  } catch (err) {
    console.warn(`[Supabase] GET ${table} falhou (rede):`, err);
    return [];
  }
}

// ============================================================
// API pública
// ============================================================

// ---- Despesas ----
export async function insertDespesa(row: DespesaRow): Promise<DespesaRow | null> {
  return supabasePost("despesas", row);
}

export async function getDespesas(): Promise<DespesaRow[]> {
  return supabaseGet<DespesaRow>("despesas", "order=data.desc");
}

// ---- Estoque ----
export async function insertEstoque(row: EstoqueRow): Promise<EstoqueRow | null> {
  return supabasePost("estoque", row);
}

export async function getEstoque(): Promise<EstoqueRow[]> {
  return supabaseGet<EstoqueRow>("estoque", "order=nome_produto.asc");
}

// ---- Perfil ----
export async function upsertPerfil(user_id: string, profile: { name: string; address: string; phone: string }) {
  try {
    const data: PerfilRow = {
      user_id,
      nome_loja: profile.name,
      endereco: profile.address,
      telefone: profile.phone
    };
    // Tenta atualizar se existir
    const url = `${SUPABASE_URL}/perfil_loja?user_id=eq.${encodeURIComponent(user_id)}`;
    const res = await fetch(url, {
      method: "PATCH",
      headers,
      body: JSON.stringify(data),
    });
    if (res.ok) {
      // Verifica se realmente alterou, senao faz POST
      const text = await res.text();
      if (!text || text === "[]") {
        await supabasePost("perfil_loja", data);
      }
    } else {
      await supabasePost("perfil_loja", data);
    }
  } catch (err) {
    console.warn("Falha ao salvar perfil no supabase", err);
  }
}
