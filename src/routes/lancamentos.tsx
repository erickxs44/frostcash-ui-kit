import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, Search, Plus } from "lucide-react";
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
import { addExpense, calculateBalance, useStore } from "@/lib/store";

export const Route = createFileRoute("/lancamentos")({
  head: () => ({ meta: [{ title: "Lançamentos — FrostCash" }] }),
  component: Lancamentos,
});

const filters = ["Todos", "Hoje", "7 dias", "Mês"] as const;
const categorias = ["Insumos", "Folha", "Despesa Fixa", "Marketing", "Outros"] as const;

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

function Lancamentos() {
  const transactions = useStore((s) => s.transactions);
  const [filter, setFilter] = useState<(typeof filters)[number]>("Todos");
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState({ desc: "", amount: "", category: "Insumos" as (typeof categorias)[number] });

  const filtered = useMemo(() => {
    const now = Date.now();
    return transactions.filter((t) => {
      const age = (now - new Date(t.date).getTime()) / (1000 * 60 * 60 * 24);
      if (filter === "Hoje" && age > 1) return false;
      if (filter === "7 dias" && age > 7) return false;
      if (filter === "Mês" && age > 30) return false;
      if (search && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [transactions, filter, search]);

  const entradas = filtered.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const saidas = filtered.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const saldo = calculateBalance(transactions);

  function handleSaveExpense() {
    const value = parseFloat(form.amount.replace(",", "."));
    if (!form.desc || !value || value <= 0) {
      toast.error("Preencha descrição e valor.");
      return;
    }
    addExpense({ description: form.desc, amount: value, category: form.category });
    toast.success("Despesa registrada!", { description: `${form.desc} · ${fmt(value)}` });
    setForm({ desc: "", amount: "", category: "Insumos" });
    setSheetOpen(false);
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              <span className="text-gradient">Lançamentos</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Entradas e saídas detalhadas.</p>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1 lg:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="glass rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 w-full lg:w-64"
              />
            </div>
            <Button variant="gradient" className="rounded-xl" onClick={() => setSheetOpen(true)}>
              <Plus className="h-4 w-4" /> Despesa
            </Button>
          </div>
        </header>

        <div className="flex gap-2 overflow-x-auto">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`relative px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
                filter === f ? "text-primary-foreground" : "glass text-muted-foreground"
              }`}
            >
              {filter === f && (
                <motion.div
                  layoutId="filter-pill"
                  className="absolute inset-0 bg-gradient-primary rounded-xl shadow-glow"
                />
              )}
              <span className="relative">{f}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <GlassCard className="bg-gradient-to-br from-success/20 to-transparent">
            <p className="text-xs text-muted-foreground">Entradas</p>
            <p className="text-2xl font-bold mt-1 text-success">{fmt(entradas)}</p>
          </GlassCard>
          <GlassCard className="bg-gradient-to-br from-secondary/20 to-transparent">
            <p className="text-xs text-muted-foreground">Saídas</p>
            <p className="text-2xl font-bold mt-1 text-secondary">{fmt(saidas)}</p>
          </GlassCard>
          <GlassCard className="col-span-2 lg:col-span-1 bg-gradient-to-br from-primary/20 to-transparent">
            <p className="text-xs text-muted-foreground">Saldo Total</p>
            <p className="text-2xl font-bold mt-1 text-gradient">{fmt(saldo)}</p>
          </GlassCard>
        </div>

        <GlassCard hover={false} className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-white/5">
                  <th className="px-5 py-3 font-medium">Data</th>
                  <th className="px-5 py-3 font-medium">Descrição</th>
                  <th className="px-5 py-3 font-medium hidden sm:table-cell">Categoria</th>
                  <th className="px-5 py-3 font-medium text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-muted-foreground text-sm">
                      Nenhum lançamento encontrado.
                    </td>
                  </tr>
                )}
                {filtered.map((row, i) => {
                  const isIn = row.amount >= 0;
                  return (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.02, 0.4) }}
                      className="border-b border-white/5 last:border-0 hover:bg-white/5 transition"
                    >
                      <td className="px-5 py-3 text-muted-foreground">{fmtDate(row.date)}</td>
                      <td className="px-5 py-3 font-medium">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-7 w-7 rounded-lg flex items-center justify-center ${
                              isIn ? "bg-success/15 text-success" : "bg-secondary/15 text-secondary"
                            }`}
                          >
                            {isIn ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                          </span>
                          {row.description}
                        </div>
                      </td>
                      <td className="px-5 py-3 hidden sm:table-cell">
                        <span className="glass px-2 py-1 rounded-md text-xs">{row.category}</span>
                      </td>
                      <td className={`px-5 py-3 text-right font-semibold ${isIn ? "text-success" : "text-secondary"}`}>
                        {isIn ? "+" : ""}
                        {fmt(row.amount)}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="glass-strong border-white/10">
          <SheetHeader>
            <SheetTitle>Nova Despesa</SheetTitle>
            <SheetDescription>Registre uma saída de caixa.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Descrição</label>
              <input
                value={form.desc}
                onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))}
                placeholder="Ex: Conta de luz"
                className="w-full glass rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Valor (R$)</label>
              <input
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="0,00"
                inputMode="decimal"
                className="w-full glass rounded-xl px-4 py-3 text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Categoria</label>
              <div className="flex flex-wrap gap-2">
                {categorias.map((c) => {
                  const active = form.category === c;
                  return (
                    <button
                      key={c}
                      onClick={() => setForm((f) => ({ ...f, category: c }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        active
                          ? "bg-gradient-primary text-primary-foreground shadow-glow"
                          : "glass text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <SheetFooter className="mt-6">
            <Button variant="gradient" size="lg" className="w-full rounded-xl" onClick={handleSaveExpense}>
              <Plus className="h-4 w-4" /> Registrar Despesa
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}