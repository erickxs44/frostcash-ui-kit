import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Package, AlertTriangle, Plus, TrendingDown, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  StockItem,
  Unit,
  addStockPurchase,
  registerNewStockItem,
  registerLoss,
  stockPercent,
  stockValue,
  useStore,
} from "@/lib/store";

export const Route = createFileRoute("/estoque")({
  head: () => ({ meta: [{ title: "Estoque — FrostCash" }] }),
  component: Estoque,
});

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Estoque() {
  const items = useStore((s) => s.stock);

  // Sheet: cadastrar novo produto
  const [newOpen, setNewOpen] = useState(false);
  const [newForm, setNewForm] = useState({ name: "", unit: "kg" as Unit, maxQty: "", minQty: "" });

  // Sheet: comprar insumo (reposição)
  const [buyOpen, setBuyOpen] = useState(false);
  const [buyStockId, setBuyStockId] = useState("");
  const [buyQty, setBuyQty] = useState("");
  const [buyCost, setBuyCost] = useState("");

  // Sheet: perda
  const [lossOpen, setLossOpen] = useState<StockItem | null>(null);
  const [lossQty, setLossQty] = useState("");
  const [lossReason, setLossReason] = useState("");

  // Modal: editar
  const [editOpen, setEditOpen] = useState<StockItem | null>(null);
  const [editMinQty, setEditMinQty] = useState("");

  const lowStock = items.filter((i) => i.qty <= i.minQty).length;
  const valor = stockValue(items);

  // --- Handlers ---
  function handleNewProduct() {
    const maxQty = parseFloat(newForm.maxQty.replace(",", "."));
    if (!newForm.name.trim()) {
      toast.error("Informe o nome do produto.");
      return;
    }
    if (!maxQty || maxQty <= 0) {
      toast.error("Informe a quantidade máxima.");
      return;
    }
    const exists = items.find((x) => x.name.toLowerCase() === newForm.name.trim().toLowerCase());
    if (exists) {
      toast.error("Esse produto já existe no estoque.");
      return;
    }
    const minQty = newForm.minQty ? parseFloat(newForm.minQty.replace(",", ".")) : undefined;
    registerNewStockItem({ name: newForm.name.trim(), unit: newForm.unit, maxQty, minQty });
    toast.success("Produto cadastrado!", { description: `${newForm.name} · máx ${maxQty}${newForm.unit}` });
    setNewOpen(false);
    setNewForm({ name: "", unit: "kg", maxQty: "", minQty: "" });
  }

  function handleBuy() {
    const item = items.find((x) => x.id === buyStockId);
    if (!item) {
      toast.error("Selecione um produto.");
      return;
    }
    const qty = parseFloat(buyQty.replace(",", "."));
    const cost = parseFloat(buyCost.replace(",", "."));
    if (!qty || qty <= 0) {
      toast.error("Informe a quantidade comprada.");
      return;
    }
    if (!cost || cost <= 0) {
      toast.error("Informe o custo da compra.");
      return;
    }
    addStockPurchase({ stockId: item.id, name: item.name, unit: item.unit, qty, totalCost: cost });
    toast.success("Compra registrada!", { description: `+${qty}${item.unit} de ${item.name} · ${fmt(cost)}` });
    setBuyOpen(false);
    setBuyStockId("");
    setBuyQty("");
    setBuyCost("");
  }

  function handleSaveLoss() {
    if (!lossOpen) return;
    const qty = parseFloat(lossQty.replace(",", "."));
    if (!qty || qty <= 0) {
      toast.error("Informe a quantidade perdida.");
      return;
    }
    const valorPerda = qty * lossOpen.costPerUnit;
    registerLoss(lossOpen.id, qty, lossReason || undefined);
    toast.success("Perda registrada", {
      description: `${qty} ${lossOpen.unit} de ${lossOpen.name} · prejuízo ${fmt(valorPerda)}`,
    });
    setLossOpen(null);
    setLossQty("");
    setLossReason("");
  }

  function handleSaveEdit() {
    if (!editOpen) return;
    import("@/lib/store").then(m => {
      const parsedMin = parseFloat(editMinQty.replace(",", "."));
      if (!isNaN(parsedMin)) {
        m.updateStockItem(editOpen.id, { minQty: parsedMin });
        toast.success("Item atualizado com sucesso!");
      }
      setEditOpen(null);
      setEditMinQty("");
    });
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Gestão de <span className="text-gradient">Estoque</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Controle de insumos em tempo real.</p>
          </div>
          <div className="flex gap-2">
            {items.length > 0 && (
              <Button variant="outline" className="rounded-xl glass border-white/10" onClick={() => setBuyOpen(true)}>
                <ShoppingCart className="h-4 w-4" /> Comprar Insumo
              </Button>
            )}
            <Button variant="gradient" className="rounded-xl" onClick={() => setNewOpen(true)}>
              <Plus className="h-4 w-4" /> Novo Produto
            </Button>
          </div>
        </header>

        {/* Resumo cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <GlassCard>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Itens</p>
                <p className="text-xl font-bold">{items.length}</p>
              </div>
            </div>
          </GlassCard>
          <GlassCard>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-secondary/15 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Estoque Crítico</p>
                <p className="text-xl font-bold">{lowStock}</p>
              </div>
            </div>
          </GlassCard>
          <GlassCard className="col-span-2 lg:col-span-1">
            <p className="text-xs text-muted-foreground">Valor em Estoque</p>
            <p className="text-xl font-bold text-gradient mt-1">{fmt(valor)}</p>
          </GlassCard>
        </div>

        {/* Lista de estoque */}
        <div className="grid sm:grid-cols-2 gap-3">
          {items.map((item, i) => {
            const pct = stockPercent(item);
            const color = item.qty <= item.minQty
              ? "from-secondary to-secondary/40"
              : pct >= 50
                ? "from-success to-success/40"
                : "from-chart-4 to-chart-4/40";
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
              >
                <GlassCard>
                  <div className="flex justify-between items-start mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{item.name}</p>
                        <button onClick={() => { setEditOpen(item); setEditMinQty(item.minQty.toString()); }} className="text-muted-foreground hover:text-primary transition">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.qty.toFixed(item.unit === "un" ? 0 : 2)} / {item.maxQty} {item.unit}
                      </p>
                      {item.totalLoss > 0 && (
                        <p className="text-[10px] text-secondary mt-0.5">
                          Perdas: {fmt(item.totalLoss)}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-sm font-bold ${
                        item.qty <= item.minQty ? "text-secondary" : pct >= 50 ? "text-success" : "text-chart-4"
                      }`}
                    >
                      {pct}%
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      key={`bar-${item.id}-${pct}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.9, ease: "easeOut" }}
                      className={`h-full bg-gradient-to-r ${color}`}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    {item.qty <= item.minQty ? (
                      <p className="text-xs text-secondary flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Crítico!
                      </p>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">Mín: {item.minQty} {item.unit}</p>
                    )}
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setBuyStockId(item.id);
                          setBuyOpen(true);
                        }}
                        className="text-[11px] text-primary hover:underline flex items-center gap-1 transition"
                      >
                        <ShoppingCart className="h-3 w-3" /> Repor
                      </button>
                      <button
                        onClick={() => setLossOpen(item)}
                        className="text-[11px] text-muted-foreground hover:text-secondary flex items-center gap-1 transition"
                      >
                        <TrendingDown className="h-3 w-3" /> Perda
                      </button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}

          {items.length === 0 && (
            <div className="col-span-full py-16 flex flex-col items-center justify-center glass rounded-3xl border-dashed border-2 border-white/10">
              <Package className="h-14 w-14 text-muted-foreground mb-4 opacity-20" />
              <p className="text-lg font-medium text-muted-foreground mb-2">Seu estoque está vazio</p>
              <p className="text-sm text-muted-foreground/60 mb-6 text-center max-w-xs">
                Cadastre seus produtos para começar a controlar insumos, compras e vendas.
              </p>
              <Button variant="gradient" onClick={() => setNewOpen(true)} className="rounded-xl">
                <Plus className="h-4 w-4" /> Cadastrar Primeiro Produto
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ============================================= */}
      {/* Sheet: + Novo Produto (cadastro)              */}
      {/* ============================================= */}
      <Sheet open={newOpen} onOpenChange={setNewOpen}>
        <SheetContent className="glass-strong border-white/10 overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Novo Produto</SheetTitle>
            <SheetDescription>
              Cadastre um insumo para controlar no estoque. A Quantidade Máxima define o 100% da barra.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Nome do Produto</label>
              <input
                value={newForm.name}
                onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Leite Condensado"
                className="w-full glass rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Unidade</label>
                <select
                  value={newForm.unit}
                  onChange={(e) => setNewForm((f) => ({ ...f, unit: e.target.value as Unit }))}
                  className="w-full glass rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="kg">kg</option>
                  <option value="lt">L (litros)</option>
                  <option value="un">un (unidades)</option>
                  <option value="g">g (gramas)</option>
                  <option value="ml">ml</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Qtd Máxima (100%)</label>
                <input
                  value={newForm.maxQty}
                  onChange={(e) => setNewForm((f) => ({ ...f, maxQty: e.target.value }))}
                  placeholder="Ex: 50"
                  inputMode="decimal"
                  className="w-full glass rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Peso Mínimo (Alerta)</label>
                <input
                  value={newForm.minQty}
                  onChange={(e) => setNewForm((f) => ({ ...f, minQty: e.target.value }))}
                  placeholder="Opcional (ex: 5)"
                  inputMode="decimal"
                  className="w-full glass rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
            {newForm.maxQty && !newForm.minQty && (
              <p className="text-[11px] text-muted-foreground">
                Alerta automático abaixo de{" "}
                <span className="text-secondary font-medium">
                  {Math.max(1, Math.round(parseFloat(newForm.maxQty.replace(",", ".") || "0") * 0.2))} {newForm.unit}
                </span>{" "}
                (20% do máximo)
              </p>
            )}
          </div>
          <SheetFooter className="mt-6">
            <Button variant="gradient" size="lg" className="w-full rounded-xl" onClick={handleNewProduct}>
              <Plus className="h-4 w-4" /> Cadastrar Produto
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ============================================= */}
      {/* Sheet: Comprar Insumo (reposição com atalhos) */}
      {/* ============================================= */}
      <Sheet open={buyOpen} onOpenChange={(o) => { setBuyOpen(o); if (!o) { setBuyStockId(""); setBuyQty(""); setBuyCost(""); } }}>
        <SheetContent className="glass-strong border-white/10 overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Comprar Insumo</SheetTitle>
            <SheetDescription>
              Selecione o produto, informe a quantidade e o valor pago. O estoque será atualizado automaticamente.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            {/* Atalhos dinâmicos */}
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Selecione o Produto</label>
              <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                {items.map((item) => {
                  const pct = stockPercent(item);
                  const selected = buyStockId === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setBuyStockId(item.id)}
                      className={`p-3 rounded-xl text-left transition-all border ${
                        selected
                          ? "bg-primary/20 border-primary shadow-[0_0_20px_rgba(134,239,172,0.15)]"
                          : "glass border-transparent hover:bg-white/5 active:scale-[0.97]"
                      }`}
                    >
                      <p className="text-xs font-medium truncate">{item.name}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${
                              item.qty <= item.minQty ? "from-secondary to-secondary/40" : pct >= 50 ? "from-success to-success/40" : "from-chart-4 to-chart-4/40"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className={`text-[10px] font-bold ${item.qty <= item.minQty ? "text-secondary" : pct >= 50 ? "text-success" : "text-chart-4"}`}>
                          {pct}%
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">{item.qty}/{item.maxQty}{item.unit}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {buyStockId && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 pt-2 border-t border-white/5">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Quantidade comprada</label>
                  <input
                    value={buyQty}
                    onChange={(e) => setBuyQty(e.target.value)}
                    placeholder={`Ex: 10 ${items.find((x) => x.id === buyStockId)?.unit || ""}`}
                    inputMode="decimal"
                    className="w-full glass rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Custo total (R$)</label>
                  <input
                    value={buyCost}
                    onChange={(e) => setBuyCost(e.target.value)}
                    placeholder="Ex: 50,00"
                    inputMode="decimal"
                    className="w-full glass rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  {buyQty && buyCost && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Custo unitário:{" "}
                      <span className="text-primary font-medium">
                        {fmt(parseFloat(buyCost.replace(",", ".")) / parseFloat(buyQty.replace(",", ".") || "1"))}
                      </span>
                      /{items.find((x) => x.id === buyStockId)?.unit || "un"}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </div>
          <SheetFooter className="mt-6">
            <Button variant="gradient" size="lg" className="w-full rounded-xl" onClick={handleBuy} disabled={!buyStockId}>
              <ShoppingCart className="h-4 w-4" /> Registrar Compra
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ============================================= */}
      {/* Sheet: Registrar perda                        */}
      {/* ============================================= */}
      <Sheet open={!!lossOpen} onOpenChange={(o) => !o && setLossOpen(null)}>
        <SheetContent className="glass-strong border-white/10">
          <SheetHeader>
            <SheetTitle>Registrar Perda</SheetTitle>
            <SheetDescription>
              {lossOpen ? `${lossOpen.name} · custo ${fmt(lossOpen.costPerUnit)}/${lossOpen.unit}` : ""}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Quantidade perdida ({lossOpen?.unit})
              </label>
              <input
                value={lossQty}
                onChange={(e) => setLossQty(e.target.value)}
                placeholder="0"
                inputMode="decimal"
                className="w-full glass rounded-xl px-4 py-3 text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              {lossOpen && lossQty && (
                <p className="text-[11px] text-secondary mt-1">
                  Prejuízo estimado:{" "}
                  {fmt(parseFloat(lossQty.replace(",", ".") || "0") * lossOpen.costPerUnit)}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Motivo (opcional)</label>
              <input
                value={lossReason}
                onChange={(e) => setLossReason(e.target.value)}
                placeholder="Ex: Caiu no chão"
                className="w-full glass rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
          <SheetFooter className="mt-6">
            <Button variant="gradient" size="lg" className="w-full rounded-xl" onClick={handleSaveLoss}>
              <TrendingDown className="h-4 w-4" /> Confirmar Perda
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ============================================= */}
      {/* Sheet: Editar Item                            */}
      {/* ============================================= */}
      <Sheet open={!!editOpen} onOpenChange={(o) => !o && setEditOpen(null)}>
        <SheetContent className="glass-strong border-white/10">
          <SheetHeader>
            <SheetTitle>Editar {editOpen?.name}</SheetTitle>
            <SheetDescription>Altere as configurações do insumo.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Peso Mínimo para Alerta ({editOpen?.unit})</label>
              <input
                value={editMinQty}
                onChange={(e) => setEditMinQty(e.target.value)}
                placeholder="Ex: 5"
                inputMode="decimal"
                className="w-full glass rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
          <SheetFooter className="mt-6">
            <Button variant="gradient" size="lg" className="w-full rounded-xl" onClick={handleSaveEdit}>
              Salvar Alterações
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}