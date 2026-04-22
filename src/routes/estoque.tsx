import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Package, AlertTriangle, Plus } from "lucide-react";
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

export const Route = createFileRoute("/estoque")({
  head: () => ({ meta: [{ title: "Estoque — FrostCash" }] }),
  component: Estoque,
});

const initialItems = [
  { name: "Polpa de Açaí", qty: "18 kg", pct: 82, color: "from-success to-success/40" },
  { name: "Casquinhas", qty: "240 un", pct: 65, color: "from-primary to-primary/40" },
  { name: "Leite Condensado", qty: "12 lt", pct: 48, color: "from-chart-4 to-chart-4/40" },
  { name: "Cobertura Chocolate", qty: "4 lt", pct: 22, color: "from-secondary to-secondary/40" },
  { name: "Granulado", qty: "6 kg", pct: 75, color: "from-success to-success/40" },
  { name: "Copos 300ml", qty: "85 un", pct: 18, color: "from-secondary to-secondary/40" },
  { name: "Polpa de Morango", qty: "9 kg", pct: 55, color: "from-primary to-primary/40" },
  { name: "Açúcar", qty: "22 kg", pct: 90, color: "from-success to-success/40" },
];

function Estoque() {
  const [items, setItems] = useState(initialItems);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState({ name: "", qty: "", unit: "kg" });
  const lowStock = items.filter((i) => i.pct < 30).length;

  // TODO(supabase): substituir mock por select em `inventory_items`
  async function fetchStockData() {
    // const { data } = await supabase.from("inventory_items").select("*");
    // if (data) setItems(data.map(...))
  }

  useEffect(() => {
    fetchStockData();
  }, []);

  // TODO(supabase): insert em `inventory_items`
  async function handleSaveItem() {
    if (!form.name || !form.qty) {
      toast.error("Preencha nome e quantidade.");
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        name: form.name,
        qty: `${form.qty} ${form.unit}`,
        pct: 100,
        color: "from-success to-success/40",
      },
    ]);
    toast.success("Insumo cadastrado!", { description: form.name });
    setSheetOpen(false);
    setForm({ name: "", qty: "", unit: "kg" });
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
            <Plus className="h-4 w-4" /> Novo Insumo
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
            <p className="text-xs text-muted-foreground">Valor Estimado</p>
            <p className="text-xl font-bold text-gradient mt-1">R$ 8.420,00</p>
          </GlassCard>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {items.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <GlassCard>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.qty} disponível</p>
                  </div>
                  <span
                    className={`text-sm font-bold ${
                      item.pct < 30 ? "text-secondary" : item.pct < 60 ? "text-chart-4" : "text-success"
                    }`}
                  >
                    {item.pct}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.pct}%` }}
                    transition={{ duration: 0.9, ease: "easeOut", delay: i * 0.04 }}
                    className={`h-full bg-gradient-to-r ${item.color}`}
                  />
                </div>
                {item.pct < 30 && (
                  <p className="text-xs text-secondary mt-2 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Repor com urgência
                  </p>
                )}
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
