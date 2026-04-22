import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, Search, Filter } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { GlassCard } from "@/components/GlassCard";

export const Route = createFileRoute("/lancamentos")({
  head: () => ({ meta: [{ title: "Lançamentos — FrostCash" }] }),
  component: Lancamentos,
});

const data = [
  { date: "22/04", desc: "Venda — Picolé Chocolate", cat: "Vendas", v: 28, in: true },
  { date: "22/04", desc: "Venda — Sundae", cat: "Vendas", v: 12, in: true },
  { date: "22/04", desc: "Conta de Luz", cat: "Despesa Fixa", v: -320.5, in: false },
  { date: "21/04", desc: "Venda — Açaí 500ml", cat: "Vendas", v: 18, in: true },
  { date: "21/04", desc: "Compra de Polpas", cat: "Insumos", v: -480, in: false },
  { date: "21/04", desc: "Venda — Casquinha", cat: "Vendas", v: 6, in: true },
  { date: "20/04", desc: "Venda — Milkshake", cat: "Vendas", v: 18, in: true },
  { date: "20/04", desc: "Funcionário — Salário", cat: "Folha", v: -1500, in: false },
];

const filters = ["Todos", "Hoje", "7 dias", "Mês"] as const;

function Lancamentos() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("Todos");

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
                placeholder="Buscar..."
                className="glass rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 w-full lg:w-64"
              />
            </div>
            <button className="glass h-10 w-10 rounded-xl flex items-center justify-center">
              <Filter className="h-4 w-4" />
            </button>
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
            <p className="text-2xl font-bold mt-1 text-success">R$ 4.280,00</p>
          </GlassCard>
          <GlassCard className="bg-gradient-to-br from-secondary/20 to-transparent">
            <p className="text-xs text-muted-foreground">Saídas</p>
            <p className="text-2xl font-bold mt-1 text-secondary">R$ 2.300,50</p>
          </GlassCard>
          <GlassCard className="col-span-2 lg:col-span-1 bg-gradient-to-br from-primary/20 to-transparent">
            <p className="text-xs text-muted-foreground">Saldo</p>
            <p className="text-2xl font-bold mt-1 text-gradient">R$ 1.979,50</p>
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
                {data.map((row, i) => (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-white/5 last:border-0 hover:bg-white/5 transition"
                  >
                    <td className="px-5 py-3 text-muted-foreground">{row.date}</td>
                    <td className="px-5 py-3 font-medium flex items-center gap-2">
                      <span
                        className={`h-7 w-7 rounded-lg flex items-center justify-center ${
                          row.in ? "bg-success/15 text-success" : "bg-secondary/15 text-secondary"
                        }`}
                      >
                        {row.in ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                      </span>
                      {row.desc}
                    </td>
                    <td className="px-5 py-3 hidden sm:table-cell">
                      <span className="glass px-2 py-1 rounded-md text-xs">{row.cat}</span>
                    </td>
                    <td
                      className={`px-5 py-3 text-right font-semibold ${
                        row.in ? "text-success" : "text-secondary"
                      }`}
                    >
                      {row.in ? "+" : ""}R$ {Math.abs(row.v).toFixed(2)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </AppLayout>
  );
}
