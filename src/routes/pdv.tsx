import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, CreditCard, Banknote, Smartphone, IceCream } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/pdv")({
  head: () => ({ meta: [{ title: "PDV — FrostCash" }] }),
  component: PDV,
});

const categories = ["Massa", "Picolé", "Bebidas", "Acompanhamentos"] as const;
type Cat = (typeof categories)[number];

const products: Record<Cat, { name: string; price: number }[]> = {
  Massa: [
    { name: "Casquinha Simples", price: 6 },
    { name: "Sundae Chocolate", price: 12 },
    { name: "1 Bola Pote", price: 8 },
    { name: "2 Bolas Pote", price: 14 },
    { name: "Banana Split", price: 22 },
    { name: "Milkshake 400ml", price: 18 },
  ],
  Picolé: [
    { name: "Picolé Frutas", price: 5 },
    { name: "Picolé Chocolate", price: 7 },
    { name: "Picolé Premium", price: 9 },
  ],
  Bebidas: [
    { name: "Refrigerante Lata", price: 6 },
    { name: "Água 500ml", price: 4 },
    { name: "Suco Natural", price: 10 },
  ],
  Acompanhamentos: [
    { name: "Calda Extra", price: 2 },
    { name: "Granulado", price: 1.5 },
    { name: "Cobertura Morango", price: 3 },
  ],
};

type PaymentMethod = "Dinheiro" | "Cartão" | "PIX";

function PDV() {
  const [cat, setCat] = useState<Cat>("Massa");
  const [cart, setCart] = useState<{ name: string; price: number; qty: number }[]>([]);
  const [payment, setPayment] = useState<PaymentMethod>("Dinheiro");
  const [saving, setSaving] = useState(false);

  // TODO(supabase): substituir pelo fetch de produtos do banco
  // async function fetchProducts() {}

  useEffect(() => {
    // TODO(supabase): carregar produtos/categorias do banco ao montar a tela
  }, []);

  function add(p: { name: string; price: number }) {
    setCart((c) => {
      const found = c.find((i) => i.name === p.name);
      if (found) return c.map((i) => (i.name === p.name ? { ...i, qty: i.qty + 1 } : i));
      return [...c, { ...p, qty: 1 }];
    });
  }

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  // TODO(supabase): conectar ao endpoint de vendas (insert em `sales` + `sale_items`)
  async function handleSaveSale() {
    if (cart.length === 0) return;
    setSaving(true);
    try {
      // const { error } = await supabase.from("sales").insert({ ... });
      await new Promise((r) => setTimeout(r, 400));
      toast.success("Venda registrada com sucesso!", {
        description: `${cart.reduce((s, i) => s + i.qty, 0)} item(ns) · ${payment} · R$ ${total.toFixed(2)}`,
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
              {products[cat].map((p) => (
                <motion.button
                  key={p.name}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => add(p)}
                  className="glass rounded-2xl p-4 text-left hover:shadow-glow transition-shadow"
                >
                  <div className="h-10 w-10 rounded-lg bg-gradient-primary/20 flex items-center justify-center mb-3">
                    <IceCream className="h-5 w-5 text-primary" />
                  </div>
                  <p className="font-medium text-sm">{p.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">R$ {p.price.toFixed(2)}</p>
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
                    key={i.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center justify-between glass rounded-lg p-2.5"
                  >
                    <div className="text-sm">
                      <p className="font-medium">{i.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {i.qty}x R$ {i.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">R$ {(i.price * i.qty).toFixed(2)}</span>
                      <button
                        onClick={() => setCart((c) => c.filter((x) => x.name !== i.name))}
                        className="text-muted-foreground hover:text-destructive transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="border-t border-white/10 pt-4 mb-4">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mt-2">
                <span className="font-semibold">Total</span>
                <span className="text-2xl font-bold text-gradient">R$ {total.toFixed(2)}</span>
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
