// ============================================================
// FrostCash — Sync Layer
// Regra de Ouro: Supabase PRIMEIRO, depois SheetDB (backup).
// Todas as operações são fire-and-forget (nunca bloqueiam a UI).
// ============================================================
// Fluxo:
//   1. localStorage é atualizado INSTANTANEAMENTE (store.ts)
//   2. Este módulo envia para Supabase (async, sem bloquear)
//   3. Depois envia cópia para Google Sheets via SheetDB
// ============================================================

import { insertDespesa, insertEstoque, type DespesaRow, type EstoqueRow } from "./supabase";
import { backupVenda, backupDespesa, backupEstoque } from "./sheetdb";
import type { StockItem, Transaction } from "./store";

// Formata data para planilha (humano): "DD/MM/AAAA HH:MM"
function fmtDateSheet(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Formata data para Supabase (ISO 8601 timestamptz)
function fmtDateSupabase(iso: string): string {
  return new Date(iso).toISOString();
}

// Formata moeda para "R$ 0,00"
function fmtCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

// ============================================================
// Sync de Vendas (apenas SheetDB — tabela não existe no Supabase)
// ============================================================
export function syncVenda(tx: Transaction) {
  if (tx.kind !== "sale" || !tx.items || tx.items.length === 0) return;

  for (const item of tx.items) {
    const sheetRow = {
      data: fmtDateSheet(tx.date),
      item: item.name,
      categoria: "Vendas",
      quantidade: item.qty,
      valor_unitario: fmtCurrency(item.price),
      valor_total: fmtCurrency(item.price * item.qty),
      metodo_pagamento: tx.payment ?? "Dinheiro",
      lucro_estimado: fmtCurrency((item.price * item.qty) - (tx.cost ?? 0) / (tx.items?.length ?? 1)),
    };

    // Vendas → apenas SheetDB (tabela vendas não existe no Supabase)
    backupVenda(sheetRow)
      .then(() => console.info("[Sync] ✓ Venda → SheetDB:", item.name))
      .catch((err) => console.warn("[Sync] ✗ Venda SheetDB:", err));
  }
}

// ============================================================
// Sync de Despesas
// ============================================================
export function syncDespesa(tx: Transaction, fornecedor = "") {
  if (tx.kind !== "expense" && tx.kind !== "loss") return;

  // 1️⃣ Supabase (colunas reais: data, descrição, categoria, valor, fornecedor)
  const supaRow: DespesaRow = {
    data: fmtDateSupabase(tx.date),
    "descrição": tx.description,
    categoria: tx.category,
    valor: Math.abs(tx.amount),
    fornecedor: fornecedor || "—",
  };

  insertDespesa(supaRow)
    .then((result) => {
      if (result) console.info("[Sync] ✓ Despesa → Supabase:", tx.description);
      else console.warn("[Sync] ⚠ Despesa Supabase bloqueada (RLS?) — salvando em SheetDB");
    })
    .catch((err) => console.warn("[Sync] ✗ Despesa Supabase:", err))
    .finally(() => {
      // 2️⃣ Backup no SheetDB (sempre tenta com valores em R$ para ficar organizado na planilha)
      backupDespesa({
        data: fmtDateSheet(tx.date),
        descricao: tx.description,
        categoria: tx.category,
        valor: fmtCurrency(Math.abs(tx.amount)),
        fornecedor: fornecedor || "—",
      }).catch(() => {});
    });
}

// ============================================================
// Sync de Estoque
// ============================================================
export function syncEstoque(item: StockItem) {
  // 1️⃣ Supabase (colunas reais: nome_produto, unidade, quantidade_atual)
  const supaRow: EstoqueRow = {
    nome_produto: item.name,
    unidade: item.unit,
    quantidade_atual: item.qty,
  };

  insertEstoque(supaRow)
    .then((result) => {
      if (result) console.info("[Sync] ✓ Estoque → Supabase:", item.name);
      else console.warn("[Sync] ⚠ Estoque Supabase bloqueada (RLS?) — salvando em SheetDB");
    })
    .catch((err) => console.warn("[Sync] ✗ Estoque Supabase:", err))
    .finally(() => {
      // 2️⃣ Backup no SheetDB
      backupEstoque({
        nome: item.name,
        unidade: item.unit,
        quantidade_atual: `${item.qty} ${item.unit}`,
        quantidade_maxima: `${item.maxQty} ${item.unit}`,
        custo_unitario: fmtCurrency(item.costPerUnit),
      }).catch(() => {});
    });
}
