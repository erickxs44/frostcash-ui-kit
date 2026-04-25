// ============================================================
// FrostCash — SheetDB Client (backup em Google Sheets)
// Endpoint: https://sheetdb.io/api/v1/uscqccuk14340
// ============================================================
// O SheetDB exige que a primeira linha da aba tenha os headers
// correspondentes às chaves do JSON enviado.
// Se a aba específica falhar, tenta a aba padrão (Sheet1).
// ============================================================

const SHEETDB_URL = "https://sheetdb.io/api/v1/uscqccuk14340";

interface SheetRow {
  [key: string]: string | number;
}

/**
 * Envia uma linha para a planilha via SheetDB.
 * Tenta primeiro na aba específica, depois na aba padrão.
 */
async function postToSheet(data: SheetRow, sheet?: string): Promise<void> {
  // Tenta na aba específica primeiro
  if (sheet) {
    try {
      const url = `${SHEETDB_URL}?sheet=${encodeURIComponent(sheet)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: [data] }),
      });
      if (res.ok) {
        console.info(`[SheetDB] ✓ Backup salvo na aba "${sheet}"`);
        return;
      }
      const errText = await res.text();
      console.warn(`[SheetDB] Aba "${sheet}" falhou (${res.status}):`, errText);
    } catch (err) {
      console.warn(`[SheetDB] Aba "${sheet}" erro de rede:`, err);
    }
  }

  // Fallback: aba padrão (Sheet1)
  try {
    const res = await fetch(SHEETDB_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [data] }),
    });
    if (res.ok) {
      console.info(`[SheetDB] ✓ Backup salvo na aba padrão`);
    } else {
      const errText = await res.text();
      console.warn(`[SheetDB] Aba padrão falhou (${res.status}):`, errText);
    }
  } catch (err) {
    // Backup é best-effort — nunca bloqueia a operação principal
    console.warn("[SheetDB] Erro de rede total (backup ignorado):", err);
  }
}

// ============================================================
// API pública
// ============================================================

export async function backupVenda(data: {
  data: string;
  item: string;
  categoria: string;
  quantidade: number;
  valor_unitario: number | string;
  valor_total: number | string;
  metodo_pagamento: string;
  lucro_estimado: number | string;
}): Promise<void> {
  await postToSheet(
    {
      data: data.data,
      "item ": data.item,
      categoria: data.categoria,
      quantidade: data.quantidade,
      "valor ": data.valor_total,
      valor_unitario: data.valor_unitario,
      valor_total: data.valor_total,
      metodo_pagamento: data.metodo_pagamento,
      lucro_estimado: data.lucro_estimado,
    },
    "vendas",
  );
}

export async function backupDespesa(data: {
  data: string;
  descricao: string;
  categoria: string;
  valor: number | string;
  fornecedor: string;
}): Promise<void> {
  await postToSheet(
    {
      data: data.data,
      "descrição": data.descricao,
      categoria: data.categoria,
      valor: data.valor,
      fornecedor: data.fornecedor,
    },
    "despesas",
  );
}

export async function backupEstoque(data: {
  nome: string;
  unidade: string;
  quantidade_atual: string | number;
  quantidade_maxima: string | number;
  custo_unitario: number | string;
}): Promise<void> {
  await postToSheet(
    {
      nome: data.nome,
      unidade: data.unidade,
      quantidade_atual: data.quantidade_atual,
      quantidade_maxima: data.quantidade_maxima,
      custo_unitario: data.custo_unitario,
    },
    "estoque",
  );
}
