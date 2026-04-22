import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Package, AlertTriangle, Plus, TrendingDown } from "lucide-react";
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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [lossOpen, setLossOpen] = useState<StockItem | null>(null);
  const [lossQty, setLossQty] = useState("");
  const [lossReason, setLossReason] = useState("");

  const [form, setForm] = useState({
    name: "",
    qty: "",
    unit: "kg" as Unit,
    cost: "",
    minQty: "",
  });

  const lowStock = items.filter((i) => i.qty <= i.minQty).length;
  const valor = stockValue(items);

  // TODO(supabase): substituir por insert em `inventory_items` (e gera trigger de despesa)
  function handleSaveItem() {
    const qty = parseFloat(form.qty.replace(",", "."));
    const cost = parseFloat(form.cost.replace(",", "."));
    if (!form.name || !qty || !cost) {
      toast.error("Preencha nome, quantidade e custo total.");
      return;
    }
    addStockPurchase({
      name: form.name,
      unit: form.unit,
      qty,
      totalCost: cost,
      minQty: form.minQty ? parseFloat(form.minQty.replace(",", ".")) : undefined,
    });
    toast.success("Compra registrada!", {
      description: `${qty} ${form.unit} de ${form.name} · ${fmt(cost)} (custo: ${fmt(cost / qty)}/${form.unit})`,
    });
    setSheetOpen(false);
    setForm({ name: "", qty: "", unit: "kg", cost: "", minQty: "" });
  }

  function handleSaveLoss() {
    if (!lossOpen) return;
    const qty = parseFloat(lossQty.replace(",", "."));
    if (!qty || qty <= 0) {
      toast.error("Informe a quantidade perdida.");
      return;
    }
    const valor = qty * lossOpen.costPerUnit;
    registerLoss(lossOpen.id, qty, lossReason || undefined);
    toast.success("Perda registrada", {
      description: `${qty} ${lossOpen.unit} de ${lossOpen.name} · prejuízo ${fmt(valor)}`,
    });
    setLossOpen(null);
    setLossQty("");
    setLossReason("");
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
          <Button variant="gradient" className="rounded-xl" onClick={() => setSheetOpen(true)}>
            <Plus className="h-4 w-4" /> Comprar Insumo
          </Button>
        </header>

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
                <p className="text-xs text-muted-foreground">Estoque Baixo</p>
                <p className="text-xl font-bold">{lowStock}</p>
              </div>
            </div>
          </GlassCard>
          <GlassCard className="col-span-2 lg:col-span-1">
            <p className="text-xs text-muted-foreground">Valor em Estoque</p>
            <p className="text-xl font-bold text-gradient mt-1">{fmt(valor)}</p>
          </GlassCard>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {items.map((item, i) => {
            const pct = stockPercent(item);
            const isLow = item.qty <= item.minQty;
            const color = isLow
              ? "from-secondary to-secondary/40"
              : pct < 60
                ? "from-chart-4 to-chart-4/40"
                : "from-success to-success/40";
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
                      <p className="font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.qty.toFixed(item.unit === "un" ? 0 : 2)} {item.unit} · custo {fmt(item.costPerUnit)}/{item.unit}
                      </p>
                      {item.totalLoss > 0 && (
                        <p className="text-[10px] text-secondary mt-0.5">
                          Perdas: {fmt(item.totalLoss)}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-sm font-bold ${
                        isLow ? "text-secondary" : pct < 60 ? "text-chart-4" : "text-success"
                      }`}
                    >
                      {pct}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.9, ease: "easeOut" }}
                      className={`h-full bg-gradient-to-r ${color}`}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    {isLow ? (
                      <p className="text-xs text-secondary flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Abaixo do mínimo ({item.minQty} {item.unit})
                      </p>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">Mín: {item.minQty} {item.unit}</p>
                    )}
                    <button
                      onClick={() => setLossOpen(item)}
                      className="text-[11px] text-muted-foreground hover:text-secondary flex items-center gap-1 transition"
                    >
                      <TrendingDown className="h-3 w-3" /> Registrar perda
                    </button>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Sheet: nova compra */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="glass-strong border-white/10 overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Comprar Insumo</SheetTitle>
            <SheetDescription>
              Registra a compra, atualiza o estoque e gera uma despesa automática.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Nome</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Polpa de Açaí"
                className="w-full glass rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Quantidade</label>
                <input
                  value={form.qty}
                  onChange={(e) => setForm((f) => ({ ...f, qty: e.target.value }))}
                  placeholder="10"
                  inputMode="decimal"
                  className="w-full glass rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Unidade</label>
                <select
                  value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value as Unit }))}
                  className="w-full glass rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="lt">lt</option>
                  <option value="ml">ml</option>
                  <option value="un">un</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Custo total da compra (R$)</label>
              <input
                value={form.cost}
                onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
                placeholder="50,00"
                inputMode="decimal"
                className="w-full glass rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              {form.qty && form.cost && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  Custo unitário:{" "}
                  <span className="text-primary font-medium">
                    {fmt(parseFloat(form.cost.replace(",", ".")) / parseFloat(form.qty.replace(",", ".") || "1"))}
                  </span>
                  /{form.unit}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Estoque mínimo (opcional)</label>
              <input
                value={form.minQty}
                onChange={(e) => setForm((f) => ({ ...f, minQty: e.target.value }))}
                placeholder="2"
                inputMode="decimal"
                className="w-full glass rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
          <SheetFooter className="mt-6">
            <Button variant="gradient" size="lg" className="w-full rounded-xl" onClick={handleSaveItem}>
              <Plus className="h-4 w-4" /> Registrar Compra
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Sheet: registrar perda */}
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
    </AppLayout>
  );
}