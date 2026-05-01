import { useSyncExternalStore } from "react";
import { syncVenda, syncDespesa, syncEstoque } from "./sync";

// ============================================================
// FrostCash — Store local + Supabase + SheetDB
// Fluxo: localStorage (instant) → Supabase → SheetDB (backup)
// ============================================================

export type Unit = "kg" | "g" | "lt" | "ml" | "un";

export interface StockItem {
  id: string;
  name: string;
  qty: number;            // quantidade atual na unidade base
  unit: Unit;             // unidade base (kg, lt, un...)
  minQty: number;         // limite mínimo p/ alerta
  maxQty: number;         // capacidade máxima p/ barra de progresso
  costPerUnit: number;    // custo por unidade base (R$/kg, R$/lt...)
  totalSpent: number;     // total já gasto comprando esse insumo
  totalLoss: number;      // total perdido (R$)
}

export interface ProductIngredient {
  stockId: string;
  defaultQty: number; // Quantidade padrão selecionada ao abrir o modal (0 = opcional)
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  creditLimit: number;
  debt: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  color?: string; // Para diferenciação visual
  ingredients: ProductIngredient[];
}

export type TxKind = "sale" | "expense" | "loss" | "debt_payment";

export interface Transaction {
  id: string;
  kind: TxKind;
  date: string;        // ISO
  description: string;
  category: string;    // "Vendas" | "Insumos" | ...
  amount: number;      // positivo p/ entrada, negativo p/ saída
  cost?: number;       // CMV (apenas vendas) — sempre positivo
  items?: { name: string; qty: number; price: number }[];
  payment?: "Dinheiro" | "Cartão" | "PIX" | "Fiado";
  clientId?: string;
}

interface Profile {
  name: string;
  address: string;
  phone: string;
}

interface State {
  profile: Profile;
  stock: StockItem[];
  products: Product[];
  transactions: Transaction[];
  clients: Client[];
  buffetRecipe?: { stockId: string; qtyPerKg: number }[];
}

// ----- Seed inicial -----
const seedStock: StockItem[] = [
  {
    id: "s_base_sorvete",
    name: "Base de Sorvete (Geral)",
    qty: 0,
    unit: "kg",
    minQty: 5,
    maxQty: 50,
    costPerUnit: 15,
    totalSpent: 0,
    totalLoss: 0,
  }
];

const seedProducts: Product[] = [];

const getUserId = () => {
  if (typeof window === "undefined") return "guest";
  return sessionStorage.getItem("frostcash:auth") || "guest";
};

const getStorageKey = () => `frostcash:state:v3:${getUserId()}`;

function loadState(): State {
  if (typeof window === "undefined") {
    return { profile: { name: "Minha Sorveteria", address: "", phone: "" }, stock: seedStock, products: seedProducts, transactions: [], clients: [] };
  }
  try {
    const raw = localStorage.getItem(getStorageKey());
    if (raw) {
      const parsed = JSON.parse(raw) as State;
      
      if (parsed.stock) {
        const hasBase = parsed.stock.some(s => s.name === "Base de Sorvete (Geral)");
        if (!hasBase) {
          parsed.stock.push({
            id: "s_base_sorvete",
            name: "Base de Sorvete (Geral)",
            qty: 0,
            unit: "kg",
            minQty: 5,
            maxQty: 50,
            costPerUnit: 15,
            totalSpent: 0,
            totalLoss: 0,
          });
        }
      }

      if (!parsed.buffetRecipe) {
        parsed.buffetRecipe = [];
      }

      if (parsed.products) {
        const oldSeedIds = ["p_casq", "p_sundae", "p_1bola", "p_2bolas", "p_split", "p_milk", "p_pic_f", "p_pic_c", "p_pic_p", "p_acai500", "p_refri", "p_agua", "p_suco", "p_calda", "p_gran", "p_cob"];
        parsed.products = parsed.products
          .filter(p => !oldSeedIds.includes(p.id))
          .map(p => ({
            ...p,
            ingredients: p.ingredients || (p as any).recipe?.map((r: any) => ({ stockId: r.stockId, defaultQty: r.qty })) || []
          }));
      }
      if (!parsed.profile) {
        parsed.profile = { name: "Minha Sorveteria", address: "", phone: "" };
      }
      if (!parsed.clients) {
        parsed.clients = [];
      }
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return { profile: { name: "Minha Sorveteria", address: "", phone: "" }, stock: seedStock, products: seedProducts, transactions: [], clients: [], buffetRecipe: [] };
}

let state: State = loadState();
const listeners = new Set<() => void>();

function persist() {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(state));
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

export function resetData() {
  setState(() => ({ 
    profile: { name: "Minha Sorveteria", address: "", phone: "" }, 
    stock: seedStock, 
    products: seedProducts, 
    transactions: [], 
    clients: [],
    buffetRecipe: [] 
  }));
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
  return txs.reduce((sum, t) => sum + ((t.payment === "Fiado" && t.kind === "sale") ? 0 : t.amount), 0);
}

export function calculateProfit(txs: Transaction[]): number {
  // Lucro líquido = Total de Entradas (Vendas + Recebimentos) - Total de Saídas (Despesas + Perdas)
  let totalIn = 0;
  let totalOut = 0;
  for (const t of txs) {
    if (t.kind === "sale" || t.kind === "debt_payment") {
      totalIn += t.amount;
    } else {
      totalOut += Math.abs(t.amount);
    }
  }
  return totalIn - totalOut;
}

export function stockPercent(item: StockItem): number {
  if (!item.maxQty || item.maxQty <= 0) return 100;
  return Math.min(100, Math.round((item.qty / item.maxQty) * 100));
}

export function stockValue(stock: StockItem[]): number {
  return stock.reduce((s, i) => s + i.qty * i.costPerUnit, 0);
}

// CMV de uma lista de itens vendidos com ingredientes dinâmicos
function computeCMV(items: { consumedStock: { stockId: string; qty: number }[]; qty: number }[], stock: StockItem[]): number {
  let cost = 0;
  for (const it of items) {
    for (const r of it.consumedStock) {
      const s = stock.find((x) => x.id === r.stockId);
      if (s) {
        cost += r.qty * s.costPerUnit * it.qty;
      }
    }
  }
  return cost;
}

// ============================================================
// Mutations
// ============================================================

// Registrar venda do PDV (focado em fluxo de caixa, sem estoque)
export function registerSale(
  cart: { productId: string; name: string; price: number; qty: number }[],
  payment: "Dinheiro" | "Cartão" | "PIX" | "Fiado",
  clientId?: string
) {
  if (cart.length === 0) return;
  setState((s) => {
    const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

    const tx: Transaction = {
      id: uid(),
      kind: "sale",
      date: new Date().toISOString(),
      description: cart.length === 1 ? `Venda — ${cart[0].name}` : `Venda — ${cart.length} itens`,
      category: "Vendas",
      amount: total,
      payment,
      items: cart.map((c) => ({ name: c.name, qty: c.qty, price: c.price })),
      clientId
    };

    let newClients = s.clients;
    if (payment === "Fiado" && clientId) {
      newClients = s.clients.map(c => c.id === clientId ? { ...c, debt: c.debt + total } : c);
    }

    // 🔄 Sync: Supabase + SheetDB
    syncVenda(tx);

    return { ...s, clients: newClients, transactions: [tx, ...s.transactions] };
  });
}

// Clients
export function addClient(client: Omit<Client, "id" | "debt">) {
  setState(s => ({
    ...s,
    clients: [...s.clients, { ...client, id: uid(), debt: 0 }]
  }));
}

export function payDebt(clientId: string, amount: number) {
  setState(s => {
    const client = s.clients.find(c => c.id === clientId);
    if (!client) return s;
    
    const tx: Transaction = {
      id: uid(),
      kind: "debt_payment",
      date: new Date().toISOString(),
      description: `Pagamento de Fiado — ${client.name}`,
      category: "Recebimentos",
      amount: amount,
      payment: "Dinheiro",
      clientId
    };
    
    return {
      ...s,
      clients: s.clients.map(c => c.id === clientId ? { ...c, debt: Math.max(0, c.debt - amount) } : c),
      transactions: [tx, ...s.transactions]
    };
  });
}

// Despesa avulsa (não vinculada a estoque)
export function addExpense(input: { description: string; amount: number; category: string; fornecedor?: string }) {
  setState((s) => {
    const tx: Transaction = {
      id: uid(),
      kind: "expense",
      date: new Date().toISOString(),
      description: input.description,
      category: input.category,
      amount: -Math.abs(input.amount),
    };

    // 🔄 Sync: Supabase + SheetDB
    syncDespesa(tx, input.fornecedor);

    return { ...s, transactions: [tx, ...s.transactions] };
  });
}

// Compra de mercadoria: registra apenas como despesa no sistema simplificado
export function addStockPurchase(input: {
  name: string;
  qty?: number;
  unit?: Unit;
  totalCost: number;
}) {
  addExpense({
    description: `Compra — ${input.name}`,
    amount: input.totalCost,
    category: "Insumos"
  });
}

// Registrar perda/desperdício
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

    // 🔄 Sync: Supabase + SheetDB
    syncDespesa(tx);
    syncEstoque(item);

    return { ...s, stock: newStock, transactions: [tx, ...s.transactions] };
  });
}

// Cadastrar novo item no estoque (sem compra, apenas registro)
export function registerNewStockItem(input: {
  name: string;
  unit: Unit;
  maxQty: number;
  minQty?: number;
  initialQty?: number;
}) {
  setState((s) => {
    const exists = s.stock.find((x) => x.name.toLowerCase() === input.name.toLowerCase());
    if (exists) return s;
    const newItem: StockItem = {
      id: `s_${uid()}`,
      name: input.name,
      qty: input.initialQty ?? 0,
      unit: input.unit,
      minQty: input.minQty ?? Math.max(1, Math.round(input.maxQty * 0.2)),
      maxQty: input.maxQty,
      costPerUnit: 0,
      totalSpent: 0,
      totalLoss: 0,
    };

    // 🔄 Sync: Supabase + SheetDB
    syncEstoque(newItem);

    return { ...s, stock: [...s.stock, newItem] };
  });
}

// ============================================================
// Configuração de Cardápio (Produtos)
// ============================================================

export function addProduct(p: Omit<Product, "id">) {
  setState((s) => ({
    ...s,
    products: [...s.products, { ...p, id: `p_${uid()}` }],
  }));
}

export function updateProduct(id: string, updates: Partial<Omit<Product, "id">>) {
  setState((s) => ({
    ...s,
    products: s.products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
  }));
}

export function removeProduct(id: string) {
  setState((s) => ({
    ...s,
    products: s.products.filter((p) => p.id !== id),
  }));
}

export function updateStockItem(id: string, updates: Partial<StockItem>) {
  setState((s) => {
    const newStock = s.stock.map(item => item.id === id ? { ...item, ...updates } : item);
    const updatedItem = newStock.find(item => item.id === id);
    if (updatedItem) syncEstoque(updatedItem);
    return { ...s, stock: newStock };
  });
}

export function updateBuffetRecipe(recipe: { stockId: string; qtyPerKg: number }[]) {
  setState((s) => ({
    ...s,
    buffetRecipe: recipe
  }));
}

export function updateProfile(profile: Profile) {
  setState((s) => {
    // 🔄 Sync: Supabase
    import("./supabase").then((m) => m.upsertPerfil(getUserId(), profile));
    return { ...s, profile };
  });
}

export function reloadStore() {
  state = loadState();
  emit();
}

// Reset (debug)
export function resetStore() {
  state = { profile: { name: "Minha Sorveteria", address: "", phone: "" }, stock: seedStock, products: seedProducts, transactions: [], buffetRecipe: [] };
  emit();
}