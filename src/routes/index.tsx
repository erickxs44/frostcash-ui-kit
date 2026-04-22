import { createFileRoute, redirect } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  IceCream,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import { AppLayout } from "@/components/AppLayout";
import { GlassCard } from "@/components/GlassCard";
import { calculateBalance, calculateProfit, useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !sessionStorage.getItem("frostcash:auth")) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [
      { title: "Dashboard — FrostCash" },
      { name: "description", content: "Visão geral do seu fluxo de caixa diário." },
    ],
  }),
  component: Dashboard,
});

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Dashboard() {
  const transactions = useStore((s) => s.transactions);

  const today = new Date().toDateString();
  const todaysTx = transactions.filter((t) => new Date(t.date).toDateString() === today);

  const balance = calculateBalance(transactions);
  const profit = calculateProfit(transactions);

  const entradasHoje = todaysTx.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const saidasHoje = todaysTx.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const itensVendidos = todaysTx
    .filter((t) => t.kind === "sale")
    .reduce((s, t) => s + (t.items?.reduce((a, i) => a + i.qty, 0) ?? 0), 0);

  // Faturamento últimos 7 dias
  const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const chartData = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - idx));
    const key = d.toDateString();
    const v = transactions
      .filter((t) => t.kind === "sale" && new Date(t.date).toDateString() === key)
      .reduce((s, t) => s + t.amount, 0);
    return { day: days[d.getDay()], v };
  });

  // Top produtos (todas as vendas)
  const productCount: Record<string, number> = {};
  for (const t of transactions) {
    if (t.kind !== "sale" || !t.items) continue;
    for (const i of t.items) productCount[i.name] = (productCount[i.name] ?? 0) + i.qty;
  }
  const topProducts = Object.entries(productCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  const maxSold = topProducts[0]?.[1] ?? 1;

  const recent = transactions.slice(0, 4);

  const stats = [
    {
      label: "Saldo Atual",
      value: fmt(balance),
      delta: profit >= 0 ? `Lucro ${fmt(profit)}` : `Prejuízo ${fmt(profit)}`,
      up: balance >= 0,
      icon: Wallet,
      accent: "from-primary/30 to-primary/5",
    },
    {
      label: "Entradas Hoje",
      value: fmt(entradasHoje),
      delta: `${todaysTx.filter((t) => t.amount > 0).length} mov.`,
      up: true,
      icon: TrendingUp,
      accent: "from-success/30 to-success/5",
    },
    {
      label: "Saídas Hoje",
      value: fmt(saidasHoje),
      delta: `${todaysTx.filter((t) => t.amount < 0).length} mov.`,
      up: false,
      icon: TrendingDown,
      accent: "from-secondary/40 to-secondary/5",
    },
    {
      label: "Itens Vendidos",
      value: String(itensVendidos),
      delta: "hoje",
      up: true,
      icon: IceCream,
      accent: "from-chart-5/30 to-chart-5/5",
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-8">
        <header className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">Bom dia, Sorveteria Rio 🍦</p>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
            Resumo de <span className="text-gradient">hoje</span>
          </h1>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <GlassCard className={`bg-gradient-to-br ${s.accent} relative overflow-hidden`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="h-9 w-9 rounded-lg glass flex items-center justify-center">
                    <s.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span
                    className={`text-[10px] font-medium flex items-center gap-0.5 ${
                      s.up ? "text-success" : "text-secondary"
                    }`}
                  >
                    {s.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {s.delta}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl lg:text-2xl font-bold mt-1">{s.value}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        <GlassCard hover={false}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-lg">Faturamento da Semana</h2>
              <p className="text-xs text-muted-foreground">Vendas diárias em R$</p>
            </div>
            <div className="flex gap-1 glass rounded-lg p-1 text-xs">
              <button className="px-3 py-1 rounded-md bg-gradient-primary text-primary-foreground font-medium">
                7d
              </button>
              <button className="px-3 py-1 rounded-md text-muted-foreground">30d</button>
              <button className="px-3 py-1 rounded-md text-muted-foreground">90d</button>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.86 0.09 185)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.86 0.09 185)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 6%)" />
                <XAxis dataKey="day" stroke="oklch(0.72 0.02 250)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.72 0.02 250)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.22 0.03 250 / 90%)",
                    border: "1px solid oklch(1 0 0 / 10%)",
                    borderRadius: 12,
                    backdropFilter: "blur(10px)",
                  }}
                  labelStyle={{ color: "oklch(0.97 0.01 240)" }}
                  formatter={(v: number) => fmt(v)}
                />
                <Area type="monotone" dataKey="v" stroke="oklch(0.86 0.09 185)" strokeWidth={2.5} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <div className="grid lg:grid-cols-2 gap-4">
          <GlassCard>
            <h3 className="font-semibold mb-4">Top Produtos</h3>
            {topProducts.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">
                Sem vendas ainda. Registre uma venda no PDV.
              </p>
            ) : (
              <div className="space-y-3">
                {topProducts.map(([name, sold]) => (
                  <div key={name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{name}</span>
                      <span className="text-muted-foreground">{sold}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(sold / maxSold) * 100}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full bg-gradient-primary"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          <GlassCard>
            <h3 className="font-semibold mb-4">Movimentações Recentes</h3>
            {recent.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">Nenhuma movimentação.</p>
            ) : (
              <div className="space-y-2">
                {recent.map((m) => (
                  <div key={m.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <span className="text-sm truncate pr-2">{m.description}</span>
                    <span className={`text-sm font-medium whitespace-nowrap ${m.amount >= 0 ? "text-success" : "text-secondary"}`}>
                      {m.amount >= 0 ? "+" : ""}
                      {fmt(m.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </AppLayout>
  );
}