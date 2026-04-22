import { useSyncExternalStore } from "react";

// ============================================================
// FrostCash — Store local (useState + localStorage)
// Preparado para Supabase: cada mutação tem um TODO indicando
// onde inserir o insert/update na tabela correspondente.
// ============================================================

export type Unit = "kg" | "g" | "lt" | "ml" | "un";

export interface StockItem {
  id: string;
  name: string;
  qty: number;            // quantidade atual na unidade base
  unit: Unit;             // unidade base (kg, lt, un...)
  minQty: number;         // limite mínimo p/ alerta
  costPerUnit: number;    // custo por unidade base (R$/kg, R$/lt...)
  totalSpent: number;     // total já gasto comprando esse insumo
  totalLoss: number;      // total perdido (R$)
}

// Receita: insumos consumidos por 1 venda do produto no PDV
export interface RecipeItem {
  stockId: string;
  qty: number; // na unidade base do insumo
}

export interface Product {
  id: string;
  name: string;
  category: "Massa" | "Picolé" | "Bebidas" | "Acompanhamentos";
  price: number;
  recipe: RecipeItem[]; // pode ser vazio
}

export type TxKind = "sale" | "expense" | "loss";

export interface Transaction {
  id: string;
  kind: TxKind;
  date: string;        // ISO
  description: string;
  category: string;    // "Vendas" | "Insumos" | ...
  amount: number;      // positivo p/ entrada, negativo p/ saída
  cost?: number;       // CMV (apenas vendas) — sempre positivo
  items?: { name: string; qty: number; price: number }[];
  payment?: "Dinheiro" | "Cartão" | "PIX";
}

interface State {
  stock: StockItem[];
  products: Product[];
  transactions: Transaction[];
}

// ----- Seed inicial -----
const seedStock: StockItem[] = [
  { id: "s_acai", name: "Polpa de Açaí", qty: 18, unit: "kg", minQty: 5, costPerUnit: 22, totalSpent: 396, totalLoss: 0 },
  { id: "s_casq", name: "Casquinhas", qty: 240, unit: "un", minQty: 80, costPerUnit: 0.4, totalSpent: 96, totalLoss: 0 },
  { id: "s_leite", name: "Leite Condensado", qty: 12, unit: "lt", minQty: 6, costPerUnit: 14, totalSpent: 168, totalLoss: 0 },
  { id: "s_chocc", name: "Cobertura Chocolate", qty: 4, unit: "lt", minQty: 5, costPerUnit: 28, totalSpent: 112, totalLoss: 0 },
  { id: "s_gran", name: "Granulado", qty: 6, unit: "kg", minQty: 2, costPerUnit: 18, totalSpent: 108, totalLoss: 0 },
  { id: "s_copo", name: "Copos 300ml", qty: 85, unit: "un", minQty: 100, costPerUnit: 0.25, totalSpent: 21.25, totalLoss: 0 },
  { id: "s_morango", name: "Polpa de Morango", qty: 9, unit: "kg", minQty: 4, costPerUnit: 20, totalSpent: 180, totalLoss: 0 },
  { id: "s_acucar", name: "Açúcar", qty: 22, unit: "kg", minQty: 5, costPerUnit: 5, totalSpent: 110, totalLoss: 0 },
];

const seedProducts: Product[] = [
  { id: "p_casq", name: "Casquinha Simples", category: "Massa", price: 6, recipe: [{ stockId: "s_casq", qty: 1 }, { stockId: "s_leite", qty: 0.05 }] },
  { id: "p_sundae", name: "Sundae Chocolate", category: "Massa", price: 12, recipe: [{ stockId: "s_chocc", qty: 0.05 }, { stockId: "s_leite", qty: 0.08 }] },
  { id: "p_1bola", name: "1 Bola Pote", category: "Massa", price: 8, recipe: [{ stockId: "s_copo", qty: 1 }] },
  { id: "p_2bolas", name: "2 Bolas Pote", category: "Massa", price: 14, recipe: [{ stockId: "s_copo", qty: 1 }] },
  { id: "p_split", name: "Banana Split", category: "Massa", price: 22, recipe: [{ stockId: "s_chocc", qty: 0.08 }, { stockId: "s_gran", qty: 0.02 }] },
  { id: "p_milk", name: "Milkshake 400ml", category: "Massa", price: 18, recipe: [{ stockId: "s_leite", qty: 0.1 }, { stockId: "s_morango", qty: 0.08 }] },
  { id: "p_pic_f", name: "Picolé Frutas", category: "Picolé", price: 5, recipe: [{ stockId: "s_morango", qty: 0.08 }] },
  { id: "p_pic_c", name: "Picolé Chocolate", category: "Picolé", price: 7, recipe: [{ stockId: "s_chocc", qty: 0.04 }] },
  { id: "p_pic_p", name: "Picolé Premium", category: "Picolé", price: 9, recipe: [{ stockId: "s_chocc", qty: 0.05 }, { stockId: "s_leite", qty: 0.03 }] },
  { id: "p_acai500", name: "Açaí 500ml", category: "Massa", price: 18, recipe: [{ stockId: "s_acai", qty: 0.5 }, { stockId: "s_copo", qty: 1 }] },
  { id: "p_refri", name: "Refrigerante Lata", category: "Bebidas", price: 6, recipe: [] },
  { id: "p_agua", name: "Água 500ml", category: "Bebidas", price: 4, recipe: [] },
  { id: "p_suco", name: "Suco Natural", category: "Bebidas", price: 10, recipe: [{ stockId: "s_morango", qty: 0.1 }] },
  { id: "p_calda", name: "Calda Extra", category: "Acompanhamentos", price: 2, recipe: [{ stockId: "s_chocc", qty: 0.02 }] },
  { id: "p_gran", name: "Granulado", category: "Acompanhamentos", price: 1.5, recipe: [{ stockId: "s_gran", qty: 0.01 }] },
  { id: "p_cob", name: "Cobertura Morango", category: "Acompanhamentos", price: 3, recipe: [{ stockId: "s_morango", qty: 0.03 }] },
];

const STORAGE_KEY = "frostcash:state:v1";

function loadState(): State {
  if (typeof window === "undefined") {
    return { stock: seedStock, products: seedProducts, transactions: [] };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as State;
  } catch {
    /* ignore */
  }
  return { stock: seedStock, products: seedProducts, transactions: [] };
}

let state: State = loadState();
const listeners = new Set<() => void>();

function persist() {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

function setState(updater: (s: State) => State) {
  state = updater(state);
  emit();
}

// ============================================================
// Subscriptions / hook
// ============================================================
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function getSnapshot() {
  return state;
}

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(state),
  );
}

// ============================================================
// Helpers de cálculo
// ============================================================
const uid = () => Math.random().toString(36).slice(2, 10);

export function calculateBalance(txs: Transaction[]): number {
  return txs.reduce((sum, t) => sum + t.amount, 0);
}

export function calculateProfit(txs: Transaction[]): number {
  // Lucro líquido = entradas - despesas - CMV das vendas - perdas
  let profit = 0;
  for (const t of txs) {
    if (t.kind === "sale") profit += t.amount - (t.cost ?? 0);
    else profit += t.amount; // despesas e perdas já são negativas
  }
  return profit;
}

export function stockPercent(item: StockItem): number {
  // referência: 100% = 2x o limite mínimo (heurística)
  const ref = Math.max(item.minQty * 2, item.qty, 1);
  return Math.min(100, Math.round((item.qty / ref) * 100));
}

export function stockValue(stock: StockItem[]): number {
  return stock.reduce((s, i) => s + i.qty * i.costPerUnit, 0);
}

// CMV de uma lista de itens vendidos
function computeCMV(items: { productId: string; qty: number }[], products: Product[], stock: StockItem[]): number {
  let cost = 0;
  for (const it of items) {
    const prod = products.find((p) => p.id === it.productId);
    if (!prod) continue;
    for (const r of prod.recipe) {
      const s = stock.find((x) => x.id === r.stockId);
      if (!s) continue;
      cost += r.qty * s.costPerUnit * it.qty;
    }
  }
  return cost;
}

// ============================================================
// Mutations
// ============================================================

// Registrar venda do PDV (decrementa estoque + cria transação)
// TODO(supabase): insert em `sales` + `sale_items`, decrement via RPC.
export function registerSale(
  cart: { productId: string; name: string; price: number; qty: number }[],
  payment: "Dinheiro" | "Cartão" | "PIX",
) {
  if (cart.length === 0) return;
  setState((s) => {
    const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    const cost = computeCMV(cart.map((i) => ({ productId: i.productId, qty: i.qty })), s.products, s.stock);

    // Baixa de estoque
    const newStock = s.stock.map((st) => ({ ...st }));
    for (const it of cart) {
      const prod = s.products.find((p) => p.id === it.productId);
      if (!prod) continue;
      for (const r of prod.recipe) {
        const idx = newStock.findIndex((x) => x.id === r.stockId);
        if (idx >= 0) newStock[idx].qty = Math.max(0, newStock[idx].qty - r.qty * it.qty);
      }
    }

    const tx: Transaction = {
      id: uid(),
      kind: "sale",
      date: new Date().toISOString(),
      description: cart.length === 1 ? `Venda — ${cart[0].name}` : `Venda — ${cart.length} itens`,
      category: "Vendas",
      amount: total,
      cost,
      payment,
      items: cart.map((c) => ({ name: c.name, qty: c.qty, price: c.price })),
    };

    return { ...s, stock: newStock, transactions: [tx, ...s.transactions] };
  });
}

// Despesa avulsa (não vinculada a estoque)
// TODO(supabase): insert em `expenses`.
export function addExpense(input: { description: string; amount: number; category: string }) {
  setState((s) => {
    const tx: Transaction = {
      id: uid(),
      kind: "expense",
      date: new Date().toISOString(),
      description: input.description,
      category: input.category,
      amount: -Math.abs(input.amount),
    };
    return { ...s, transactions: [tx, ...s.transactions] };
  });
}

// Compra de mercadoria: adiciona ao estoque + gera despesa automática
// TODO(supabase): insert em `inventory_purchases` (trigger gera expense)
export function addStockPurchase(input: {
  stockId?: string;       // se já existe, atualiza
  name: string;
  unit: Unit;
  qty: number;
  totalCost: number;
  minQty?: number;
}) {
  setState((s) => {
    const newStock = [...s.stock];
    let target: StockItem | undefined = input.stockId ? newStock.find((x) => x.id === input.stockId) : newStock.find((x) => x.name.toLowerCase() === input.name.toLowerCase());
    if (target) {
      // Custo médio ponderado: (estoqueAtual * custoAtual + qtdComprada * custoNovo) / total
      const novoCustoUnit = input.totalCost / input.qty;
      const valorEstoqueAtual = target.qty * target.costPerUnit;
      const totalQty = target.qty + input.qty;
      target.costPerUnit = totalQty > 0 ? (valorEstoqueAtual + input.totalCost) / totalQty : novoCustoUnit;
      target.qty = totalQty;
      target.totalSpent += input.totalCost;
    } else {
      target = {
        id: `s_${uid()}`,
        name: input.name,
        qty: input.qty,
        unit: input.unit,
        minQty: input.minQty ?? Math.max(1, Math.round(input.qty * 0.2)),
        costPerUnit: input.totalCost / input.qty,
        totalSpent: input.totalCost,
        totalLoss: 0,
      };
      newStock.push(target);
    }

    const tx: Transaction = {
      id: uid(),
      kind: "expense",
      date: new Date().toISOString(),
      description: `Compra — ${input.qty} ${input.unit} de ${input.name}`,
      category: "Insumos",
      amount: -Math.abs(input.totalCost),
    };

    return { ...s, stock: newStock, transactions: [tx, ...s.transactions] };
  });
}

// Registrar perda/desperdício
// TODO(supabase): insert em `inventory_losses` + ledger.
export function registerLoss(stockId: string, qty: number, reason?: string) {
  setState((s) => {
    const newStock = s.stock.map((x) => ({ ...x }));
    const item = newStock.find((x) => x.id === stockId);
    if (!item || qty <= 0) return s;
    const realQty = Math.min(item.qty, qty);
    const lossValue = realQty * item.costPerUnit;
    item.qty -= realQty;
    item.totalLoss += lossValue;

    const tx: Transaction = {
      id: uid(),
      kind: "loss",
      date: new Date().toISOString(),
      description: `Perda — ${realQty} ${item.unit} de ${item.name}${reason ? ` (${reason})` : ""}`,
      category: "Perda",
      amount: -Math.abs(lossValue),
    };

    return { ...s, stock: newStock, transactions: [tx, ...s.transactions] };
  });
}

// Reset (debug)
export function resetStore() {
  state = { stock: seedStock, products: seedProducts, transactions: [] };
  emit();
}