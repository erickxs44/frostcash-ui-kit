import { createFileRoute, redirect } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  IceCream,
  ArrowUpRight,
  ArrowDownRight,
  Lock,
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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { calculateBalance, calculateProfit, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
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
  const stock = useStore((s) => s.stock);
  const [isClosing, setIsClosing] = useState(false);
  const [range, setRange] = useState<1 | 7 | 30>(1);

  const today = new Date().toDateString();
  const todaysTx = transactions.filter((t) => new Date(t.date).toDateString() === today);

  const balance = calculateBalance(transactions);
  const profit = calculateProfit(transactions);

  const entradasHoje = todaysTx.filter((t) => t.amount > 0 && t.payment !== "Fiado").reduce((s, t) => s + t.amount, 0);
  const saidasHoje = todaysTx.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const itensVendidos = todaysTx
    .filter((t) => t.kind === "sale")
    .reduce((s, t) => s + (t.items?.reduce((a, i) => a + i.qty, 0) ?? 0), 0);

  // Movimentação (Tendência Consolidada)
  const chartData = useMemo(() => {
    if (range === 1) {
      const sorted = [...todaysTx].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      let acc = 0;
      const points = sorted.map(t => {
        const actualAmount = t.payment === "Fiado" ? 0 : t.amount;
        acc += actualAmount;
        return {
          label: new Date(t.date).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' }),
          v: acc,
          type: actualAmount >= 0 ? "Venda" : "Despesa",
          delta: actualAmount
        };
      });
      if (points.length === 0) {
        return [
          { label: "Abertura", v: 0, type: "Início", delta: 0 },
          { label: new Date().toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' }), v: 0, type: "Atual", delta: 0 }
        ];
      }
      return [{ label: "Abertura", v: 0, type: "Início", delta: 0 }, ...points];
    } else {
      let acc = 0;
      return Array.from({ length: range }).map((_, idx) => {
        const d = new Date();
        d.setDate(d.getDate() - (range - 1 - idx));
        
        const key = d.toDateString();
        const dayTxs = transactions.filter((t) => new Date(t.date).toDateString() === key);
        
        const dayNet = dayTxs.reduce((s, t) => s + (t.payment === "Fiado" ? 0 : t.amount), 0);
        acc += dayNet;
        
        const label = range === 7 
          ? ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][d.getDay()]
          : d.toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' });
        
        return { 
          label, 
          v: acc,
          type: dayNet >= 0 ? "Lucro" : "Prejuízo",
          delta: dayNet
        };
      });
    }
  }, [range, todaysTx, transactions]);

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
      label: "Lucro Líquido",
      value: fmt(profit),
      delta: balance >= 0 ? `Saldo em Caixa: ${fmt(balance)}` : `Saldo em Caixa: ${fmt(balance)}`,
      up: profit >= 0,
      icon: Wallet,
      accent: "from-primary/30 to-primary/5",
    },
    {
      label: "Total de Entradas",
      value: fmt(entradasHoje),
      delta: "Hoje",
      up: true,
      icon: TrendingUp,
      accent: "from-success/30 to-success/5",
    },
    {
      label: "Total de Saídas",
      value: fmt(saidasHoje),
      delta: "Hoje",
      up: false,
      icon: TrendingDown,
      accent: "from-secondary/40 to-secondary/5",
    },
  ];

  const handleFecharCaixa = async (days: number) => {
    setIsClosing(true);
    try {
      let targetTxs = transactions;
      let dateLabel = "";
      
      if (days === 1) {
        targetTxs = todaysTx;
        dateLabel = `Hoje (${new Date().toLocaleDateString("pt-BR")})`;
      } else {
        const d = new Date();
        d.setDate(d.getDate() - days);
        targetTxs = transactions.filter(t => new Date(t.date) >= d);
        dateLabel = `Últimos ${days} dias`;
      }

      const pix = targetTxs.filter(t => (t.kind === "sale" || t.kind === "debt_payment") && t.payment === "PIX").reduce((sum, t) => sum + t.amount, 0);
      const cartao = targetTxs.filter(t => (t.kind === "sale" || t.kind === "debt_payment") && t.payment === "Cartão").reduce((sum, t) => sum + t.amount, 0);
      const dinheiro = targetTxs.filter(t => (t.kind === "sale" || t.kind === "debt_payment") && t.payment === "Dinheiro").reduce((sum, t) => sum + t.amount, 0);
      
      const totalVendas = pix + cartao + dinheiro;
      const saidasPeriodo = targetTxs.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
      const lucroPeriodo = totalVendas - saidasPeriodo;
      
      const { sendCloseRegisterReport } = await import("@/lib/resend");
      const { sendWhatsAppMessage } = await import("@/lib/twilio");
      
      const emailResult = await sendCloseRegisterReport({
        pix,
        cartao,
        dinheiro,
        totalVendas,
        totalDespesas: saidasPeriodo,
        lucroEstimado: lucroPeriodo,
        dateStr: dateLabel
      });

      const fmtStr = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

      let msg = `*🧊 Relatório de Fechamento - FrostCash*\n`;
      msg += `📅 *Período:* ${dateLabel}\n\n`;
      msg += `*💰 Resumo de Vendas:*\n`;
      msg += `🟩 *PIX:* ${fmtStr(pix)}\n`;
      msg += `💳 *Cartão:* ${fmtStr(cartao)}\n`;
      msg += `💵 *Dinheiro:* ${fmtStr(dinheiro)}\n\n`;
      msg += `📈 *Total em Vendas:* ${fmtStr(totalVendas)}\n`;
      msg += `🔥 *Total de Despesas:* ${fmtStr(saidasPeriodo)}\n`;
      msg += `✅ *Lucro (Vendas - Despesas):* ${fmtStr(lucroPeriodo)}\n`;

      const wppResult = await sendWhatsAppMessage(msg);

      if (emailResult.success && wppResult.success) {
        toast.success(`Relatório (${dateLabel}) enviado por E-mail e WhatsApp.`);
      } else {
        if (!emailResult.success) toast.error(`Erro no E-mail: ${emailResult.error}`);
        if (!wppResult.success) toast.warning(`Aviso no WhatsApp: ${wppResult.error}`);
        if (emailResult.success) toast.success("Relatório salvo e enviado por E-mail.");
        if (wppResult.success) toast.success("Relatório salvo e enviado por WhatsApp.");
      }
    } catch (err) {
      toast.error("Ocorreu um erro ao processar o fechamento.");
      console.error(err);
    } finally {
      setIsClosing(false);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass p-3 rounded-xl border border-white/10 shadow-xl backdrop-blur-xl">
          <p className="text-xs text-muted-foreground font-medium mb-1">{data.label}</p>
          <div className="flex items-center justify-between gap-4 mb-2">
            <span className="text-sm font-semibold">{data.type}</span>
            <span className={`text-sm font-bold ${data.delta >= 0 ? 'text-success' : 'text-secondary'}`}>
              {data.delta > 0 ? '+' : ''}{fmt(data.delta)}
            </span>
          </div>
          <div className="pt-2 border-t border-white/10 flex justify-between gap-4 mt-2">
            <span className="text-xs text-muted-foreground">Saldo Acumulado</span>
            <span className="text-xs font-bold text-primary">{fmt(data.v)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">Bom dia, Sorveteria Rio 🍦</p>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
              Resumo de <span className="text-gradient">hoje</span>
            </h1>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="gradient" 
                disabled={isClosing}
                className="shadow-glow"
              >
                <Lock className="w-4 h-4 mr-2" />
                {isClosing ? "Gerando..." : "Fechar Caixa (Relatório)"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 glass border-white/10">
              <DropdownMenuItem onClick={() => handleFecharCaixa(1)} className="hover:bg-white/10 cursor-pointer">
                📅 Relatório de Hoje
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFecharCaixa(7)} className="hover:bg-white/10 cursor-pointer">
                📅 Últimos 7 dias
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFecharCaixa(30)} className="hover:bg-white/10 cursor-pointer">
                📅 Últimos 30 dias
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <div className="grid grid-cols-2 gap-4 lg:gap-6">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={i === 0 ? "col-span-2" : "col-span-1"}
            >
              <GlassCard 
                className={cn(
                  "bg-gradient-to-br relative overflow-hidden flex flex-col justify-between transition-all",
                  s.accent,
                  i === 0 ? "p-6 min-h-[140px]" : "p-5 aspect-square items-center justify-center text-center"
                )}
              >
                <div className={cn(
                  "flex items-start justify-between w-full",
                  i !== 0 && "flex-col items-center gap-2 mb-2"
                )}>
                  <div className={cn(
                    "rounded-2xl glass flex items-center justify-center shadow-sm",
                    i === 0 ? "h-12 w-12" : "h-10 w-10"
                  )}>
                    <s.icon className={cn(i === 0 ? "h-6 w-6" : "h-5 w-5", "text-primary")} />
                  </div>
                  <div className={cn(
                    "flex flex-col",
                    i === 0 ? "items-end text-right" : "items-center text-center"
                  )}>
                    <span
                      className={cn(
                        "text-[10px] font-bold flex items-center gap-0.5",
                        s.up ? "text-success" : "text-secondary"
                      )}
                    >
                      {s.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {s.delta}
                    </span>
                    {i === 0 && (
                       <span className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider font-medium">Hoje</span>
                    )}
                  </div>
                </div>
                
                <div className={i !== 0 ? "flex flex-col items-center" : ""}>
                  <p className={cn(
                    "text-muted-foreground font-medium mb-0.5",
                    i === 0 ? "text-xs" : "text-[11px]"
                  )}>{s.label}</p>
                  <p className={cn(
                    "font-black tracking-tight",
                    i === 0 ? "text-3xl" : "text-xl"
                  )}>{s.value}</p>
                </div>
                
                {i === 0 && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[80px] rounded-full -mr-16 -mt-16" />
                )}
              </GlassCard>
            </motion.div>
          ))}
        </div>

        <GlassCard hover={false}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-lg text-gradient">Fluxo de Caixa</h2>
              <p className="text-xs text-muted-foreground">Entradas e saídas acumuladas</p>
            </div>
            <div className="flex gap-1 glass rounded-lg p-1 text-xs">
              {[1, 7, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => setRange(d as any)}
                  className={`px-3 py-1 rounded-md transition-all font-medium ${
                    range === d ? "bg-gradient-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-white/5"
                  }`}
                >
                  {d === 1 ? 'Hoje' : `${d}d`}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 6%)" vertical={false} />
                <XAxis 
                  dataKey="label" 
                  stroke="oklch(0.72 0.02 250)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                />
                <YAxis 
                  stroke="oklch(0.72 0.02 250)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(v) => `R$ ${v}`}
                  domain={['auto', 'auto']}
                  padding={{ top: 30, bottom: 30 }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'oklch(1 0 0 / 10%)', strokeWidth: 1 }} />
                <Area 
                  type="monotone" 
                  dataKey="v" 
                  stroke="var(--primary)" 
                  strokeWidth={3.5} 
                  fill="url(#g1)"
                  animationDuration={1500}
                  connectNulls={true}
                  dot={{ r: 4, strokeWidth: 2, fill: 'var(--background)', stroke: 'var(--primary)' }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--primary)' }}
                />
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