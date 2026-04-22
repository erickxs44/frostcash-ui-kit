import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, TrendingDown, IceCream2, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Step = "menu" | "venda" | "despesa";

const categorias = ["Insumos", "Folha", "Despesa Fixa", "Marketing", "Outros"] as const;

export function QuickActionModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [step, setStep] = useState<Step>("menu");
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [categoria, setCategoria] = useState<(typeof categorias)[number]>("Insumos");

  function reset() {
    setTimeout(() => {
      setStep("menu");
      setAmount("");
      setDesc("");
      setCategoria("Insumos");
    }, 200);
  }

  function close() {
    onOpenChange(false);
    reset();
  }

  // TODO(supabase): conectar ao insert de `sales` ou `expenses`
  async function handleSubmit() {
    if (!amount || !desc) {
      toast.error("Preencha todos os campos.");
      return;
    }
    if (step === "venda") {
      toast.success("Venda registrada com sucesso!", { description: `${desc} · R$ ${amount}` });
    } else {
      toast.success("Despesa registrada!", { description: `${desc} · ${categoria} · R$ ${amount}` });
    }
    close();
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
                {step !== "menu" && (
                  <button
                    onClick={() => setStep("menu")}
                    className="h-8 w-8 rounded-full glass flex items-center justify-center hover:bg-white/10 transition"
                    aria-label="Voltar"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                )}
                <IceCream2 className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">
                  {step === "menu" ? "Ação Rápida" : step === "venda" ? "Nova Venda" : "Nova Despesa"}
                </h3>
              </div>
              <button
                onClick={close}
                className="h-8 w-8 rounded-full glass flex items-center justify-center hover:bg-white/10 transition"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <AnimatePresence mode="wait">
              {step === "menu" && (
                <motion.div
                  key="menu"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  className="grid grid-cols-2 gap-3"
                >
                  <button
                    onClick={() => setStep("venda")}
                    className="glass rounded-2xl p-5 flex flex-col items-center gap-2 hover:bg-white/10 active:scale-95 transition-all"
                  >
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-success/30 to-success/10 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-success" />
                    </div>
                    <p className="font-medium text-sm">Nova Venda</p>
                    <p className="text-[11px] text-muted-foreground text-center">Registrar entrada</p>
                  </button>
                  <button
                    onClick={() => setStep("despesa")}
                    className="glass rounded-2xl p-5 flex flex-col items-center gap-2 hover:bg-white/10 active:scale-95 transition-all"
                  >
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-secondary/40 to-secondary/10 flex items-center justify-center">
                      <TrendingDown className="h-6 w-6 text-secondary" />
                    </div>
                    <p className="font-medium text-sm">Nova Despesa</p>
                    <p className="text-[11px] text-muted-foreground text-center">Registrar saída</p>
                  </button>
                </motion.div>
              )}

              {(step === "venda" || step === "despesa") && (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  className="space-y-3"
                >
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
                      placeholder={step === "venda" ? "Ex: Picolé chocolate" : "Ex: Conta de luz"}
                      className="w-full glass rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  {step === "despesa" && (
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">Categoria</label>
                      <div className="flex flex-wrap gap-2">
                        {categorias.map((c) => {
                          const active = categoria === c;
                          return (
                            <button
                              key={c}
                              onClick={() => setCategoria(c)}
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
                  )}
                  <Button onClick={handleSubmit} variant="gradient" size="lg" className="w-full mt-2 rounded-xl">
                    Registrar {step === "venda" ? "Venda" : "Despesa"}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
