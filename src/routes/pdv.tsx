import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, CreditCard, Banknote, Smartphone, IceCream, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Product, registerSale, useStore } from "@/lib/store";

export const Route = createFileRoute("/pdv")({
  head: () => ({ meta: [{ title: "PDV — FrostCash" }] }),
  component: PDV,
});

const categories = ["Massa", "Picolé", "Bebidas", "Acompanhamentos"] as const;
type Cat = (typeof categories)[number];
type PaymentMethod = "Dinheiro" | "Cartão" | "PIX";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface CartLine {
  productId: string;
  name: string;
  price: number;
  qty: number;
}

function PDV() {
  const products = useStore((s) => s.products);
  const stock = useStore((s) => s.stock);
  const [cat, setCat] = useState<Cat>("Massa");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [payment, setPayment] = useState<PaymentMethod>("Dinheiro");
  const [saving, setSaving] = useState(false);

  const visible = products.filter((p) => p.category === cat);

  function addToCart(p: Product) {
    setCart((c) => {
      const found = c.find((i) => i.productId === p.id);
      if (found) return c.map((i) => (i.productId === p.id ? { ...i, qty: i.qty + 1 } : i));
      return [...c, { productId: p.id, name: p.name, price: p.price, qty: 1 }];
    });
  }

  function changeQty(productId: string, delta: number) {
    setCart((c) =>
      c
        .map((i) => (i.productId === productId ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0),
    );
  }

  function removeLine(productId: string) {
    setCart((c) => c.filter((i) => i.productId !== productId));
  }

  // Subtotal e total — recalculados em tempo real
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const total = subtotal;

  // CMV estimado da comanda atual (custo dos insumos)
  const cmv = cart.reduce((sum, line) => {
    const prod = products.find((p) => p.id === line.productId);
    if (!prod) return sum;
    return (
      sum +
      prod.recipe.reduce((rs, r) => {
        const s = stock.find((x) => x.id === r.stockId);
        return s ? rs + r.qty * s.costPerUnit * line.qty : rs;
      }, 0)
    );
  }, 0);
  const lucroEstimado = total - cmv;

  // TODO(supabase): substituir por insert em `sales` + `sale_items` (RPC para baixa de estoque)
  async function handleSaveSale() {
    if (cart.length === 0) return;
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 300));
      registerSale(cart, payment);
      toast.success("Venda registrada com sucesso!", {
        description: `${cart.reduce((s, i) => s + i.qty, 0)} item(ns) · ${payment} · ${fmt(total)} · Lucro ${fmt(lucroEstimado)}`,
      });
      setCart([]);
      setPayment("Dinheiro");
    } catch {
      toast.error("Não foi possível registrar a venda.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">
            Frente de <span className="text-gradient">Caixa</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Registre vendas com poucos toques.</p>
        </header>

        <div className="grid lg:grid-cols-[1fr_380px] gap-6">
          <div className="space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`relative px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
                    cat === c ? "text-primary-foreground" : "glass text-muted-foreground"
                  }`}
                >
                  {cat === c && (
                    <motion.div
                      layoutId="cat-pill"
                      className="absolute inset-0 bg-gradient-primary rounded-xl shadow-glow"
                    />
                  )}
                  <span className="relative">{c}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {visible.map((p) => (
                <motion.button
                  key={p.id}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => addToCart(p)}
                  className="glass rounded-2xl p-4 text-left hover:shadow-glow transition-shadow"
                >
                  <div className="h-10 w-10 rounded-lg bg-gradient-primary/20 flex items-center justify-center mb-3">
                    <IceCream className="h-5 w-5 text-primary" />
                  </div>
                  <p className="font-medium text-sm">{p.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{fmt(p.price)}</p>
                </motion.button>
              ))}
            </div>
          </div>

          <GlassCard hover={false} className="h-fit lg:sticky lg:top-4">
            <h3 className="font-semibold mb-4">Comanda</h3>
            <div className="space-y-2 mb-4 min-h-[120px] max-h-[300px] overflow-y-auto">
              <AnimatePresence>
                {cart.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Toque em um produto para começar.
                  </p>
                )}
                {cart.map((i) => (
                  <motion.div
                    key={i.productId}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center justify-between glass rounded-lg p-2.5 gap-2"
                  >
                    <div className="text-sm min-w-0 flex-1">
                      <p className="font-medium truncate">{i.name}</p>
                      <p className="text-xs text-muted-foreground">{fmt(i.price)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => changeQty(i.productId, -1)}
                        className="h-6 w-6 rounded-md glass flex items-center justify-center hover:bg-white/10"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-sm font-semibold w-5 text-center">{i.qty}</span>
                      <button
                        onClick={() => changeQty(i.productId, 1)}
                        className="h-6 w-6 rounded-md glass flex items-center justify-center hover:bg-white/10"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="text-sm font-semibold whitespace-nowrap">{fmt(i.price * i.qty)}</span>
                    <button
                      onClick={() => removeLine(i.productId)}
                      className="text-muted-foreground hover:text-destructive transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="border-t border-white/10 pt-4 mb-4 space-y-1">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span>{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>CMV (custo)</span>
                <span>{fmt(cmv)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Lucro estimado</span>
                <span className={lucroEstimado >= 0 ? "text-success font-medium" : "text-secondary font-medium"}>
                  {fmt(lucroEstimado)}
                </span>
              </div>
              <div className="flex justify-between mt-2">
                <span className="font-semibold">Total</span>
                <span className="text-2xl font-bold text-gradient">{fmt(total)}</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mb-2">Forma de pagamento</p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { l: "Dinheiro" as const, i: Banknote },
                { l: "Cartão" as const, i: CreditCard },
                { l: "PIX" as const, i: Smartphone },
              ].map(({ l, i: Ic }) => {
                const active = payment === l;
                return (
                  <button
                    key={l}
                    onClick={() => setPayment(l)}
                    className={`relative rounded-xl p-3 flex flex-col items-center gap-1 transition-all active:scale-95 ${
                      active
                        ? "bg-gradient-primary text-primary-foreground shadow-glow"
                        : "glass text-foreground hover:bg-white/10"
                    }`}
                  >
                    <Ic className={`h-5 w-5 ${active ? "text-primary-foreground" : "text-primary"}`} />
                    <span className="text-xs font-medium">{l}</span>
                  </button>
                );
              })}
            </div>
            <Button
              variant="gradient"
              size="lg"
              className="w-full rounded-xl"
              disabled={cart.length === 0 || saving}
              onClick={handleSaveSale}
            >
              {saving ? "Registrando..." : "Finalizar Venda"}
            </Button>
          </GlassCard>
        </div>
      </div>
    </AppLayout>
  );
}