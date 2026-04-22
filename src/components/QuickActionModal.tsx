import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, TrendingDown, IceCream2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type Mode = "venda" | "despesa";

export function QuickActionModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [mode, setMode] = useState<Mode>("venda");
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");

  function close() {
    onOpenChange(false);
    setTimeout(() => {
      setAmount("");
      setDesc("");
      setMode("venda");
    }, 200);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={close}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="relative w-full max-w-md glass-strong rounded-3xl p-6"
            initial={{ y: 40, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 40, scale: 0.96, opacity: 0 }}
            transition={{ type: "spring", damping: 22, stiffness: 280 }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <IceCream2 className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Ação Rápida</h3>
              </div>
              <button
                onClick={close}
                className="h-8 w-8 rounded-full glass flex items-center justify-center hover:bg-white/10 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-5 p-1 glass rounded-xl">
              <button
                onClick={() => setMode("venda")}
                className={`relative py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  mode === "venda" ? "text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {mode === "venda" && (
                  <motion.div
                    layoutId="mode-pill"
                    className="absolute inset-0 bg-gradient-primary rounded-lg"
                  />
                )}
                <span className="relative flex items-center justify-center gap-1.5">
                  <TrendingUp className="h-4 w-4" /> Venda
                </span>
              </button>
              <button
                onClick={() => setMode("despesa")}
                className={`relative py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  mode === "despesa" ? "text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {mode === "despesa" && (
                  <motion.div
                    layoutId="mode-pill"
                    className="absolute inset-0 bg-gradient-primary rounded-lg"
                  />
                )}
                <span className="relative flex items-center justify-center gap-1.5">
                  <TrendingDown className="h-4 w-4" /> Despesa
                </span>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Valor (R$)</label>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  inputMode="decimal"
                  className="w-full glass rounded-xl px-4 py-3 text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Descrição</label>
                <input
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder={mode === "venda" ? "Ex: Picolé chocolate" : "Ex: Conta de luz"}
                  className="w-full glass rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <Button onClick={close} variant="gradient" size="lg" className="w-full mt-2 rounded-xl">
                Registrar {mode === "venda" ? "Venda" : "Despesa"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
