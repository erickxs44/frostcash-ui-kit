import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, TrendingDown, IceCream2, ArrowLeft, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { addExpense, addStockPurchase, registerSale, useStore, type Unit } from "@/lib/store";

type Step = "menu" | "venda" | "despesa";

const categorias = ["Insumos", "Folha", "Despesa Fixa", "Marketing", "Outros"] as const;

export function QuickActionModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const products = useStore((s) => s.products);
  const stock = useStore((s) => s.stock);
  const [step, setStep] = useState<Step>("menu");
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [productId, setProductId] = useState<string>("");
  const [categoria, setCategoria] = useState<(typeof categorias)[number]>("Insumos");

  // Garante que o productId inicial seja o primeiro produto disponível
  useEffect(() => {
    if (products.length > 0 && !productId) {
      setProductId(products[0].id);
    }
  }, [products, productId]);

  // Estados para Insumos
  const [selectedStockId, setSelectedStockId] = useState<string>("");
  const [itemQty, setItemQty] = useState("");
  const [isRegisteringNew, setIsRegisteringNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUnit, setNewUnit] = useState<Unit>("kg");
  const [newMin, setNewMin] = useState("");
  const [newMax, setNewMax] = useState("");

  function reset() {
    setTimeout(() => {
      setStep("menu");
      setAmount("");
      setDesc("");
      setCategoria("Insumos");
      setSelectedStockId("");
      setItemQty("");
      setIsRegisteringNew(false);
      setNewName("");
      setNewUnit("kg");
      setNewMin("");
      setNewMax("");
    }, 200);
  }

  function close() {
    onOpenChange(false);
    reset();
  }

  function handleSubmit() {
    const value = parseFloat(amount.replace(",", "."));
    if (!value || value <= 0) {
      toast.error("Informe um valor válido.");
      return;
    }

    if (step === "venda") {
      const prod = products.find((p) => p.id === productId);
      if (!prod) {
        toast.error("Selecione um produto.");
        return;
      }
      const qty = Math.max(1, Math.round(value / prod.price)) || 1;
      const consumedStock = prod.ingredients.map(ing => ({ 
        stockId: ing.stockId, 
        qty: ing.defaultQty 
      }));
      registerSale([{ productId: prod.id, name: prod.name, price: prod.price, qty, consumedStock }], "Dinheiro");
      toast.success("Venda registrada!", { description: `${qty}x ${prod.name}` });
    } else {
      if (categoria === "Insumos") {
        if (isRegisteringNew) {
          if (!newName || !itemQty) {
            toast.error("Preencha o nome e a quantidade do novo insumo.");
            return;
          }
          addStockPurchase({
            name: newName,
            unit: newUnit,
            qty: parseFloat(itemQty.replace(",", ".")),
            totalCost: value,
            minQty: parseFloat(newMin) || undefined,
            maxQty: parseFloat(newMax) || undefined,
          });
          toast.success("Novo insumo cadastrado e estoque atualizado!");
        } else {
          const item = stock.find((s) => s.id === selectedStockId);
          if (!item || !itemQty) {
            toast.error("Selecione um item e a quantidade.");
            return;
          }
          addStockPurchase({
            stockId: item.id,
            name: item.name,
            unit: item.unit,
            qty: parseFloat(itemQty.replace(",", ".")),
            totalCost: value,
          });
          toast.success("Estoque atualizado!", { description: `+${itemQty}${item.unit} de ${item.name}` });
        }
      } else {
        if (!desc) {
          toast.error("Informe a descrição.");
          return;
        }
        addExpense({ description: desc, amount: value, category: categoria });
        toast.success("Despesa registrada!", { description: `${desc} · R$ ${value.toFixed(2)}` });
      }
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
                  {step === "venda" && (
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">Produto</label>
                      <select
                        value={productId}
                        onChange={(e) => setProductId(e.target.value)}
                        className="w-full glass rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} — R$ {p.price.toFixed(2)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
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
                  {step === "despesa" && (
                    <>
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

                      {categoria === "Insumos" ? (
                        <div className="space-y-3 pt-2">
                          {!isRegisteringNew ? (
                            <>
                              <div className="flex items-center justify-between">
                                <label className="text-xs text-muted-foreground block">Selecione o Insumo (Atalho)</label>
                                <button
                                  onClick={() => setIsRegisteringNew(true)}
                                  className="text-[10px] text-primary flex items-center gap-1 hover:underline"
                                >
                                  <Plus className="h-3 w-3" /> Novo Produto
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                                {stock.map((item) => (
                                  <button
                                    key={item.id}
                                    onClick={() => setSelectedStockId(item.id)}
                                    className={`p-3 rounded-xl text-xs font-medium transition text-left border ${
                                      selectedStockId === item.id
                                        ? "bg-primary/20 border-primary shadow-glow-sm"
                                        : "glass border-transparent hover:bg-white/5 active:scale-95"
                                    }`}
                                  >
                                    <div className="flex flex-col gap-1">
                                      <span className="truncate">{item.name}</span>
                                      <span className="text-[10px] text-muted-foreground font-normal">Estoque: {item.qty}{item.unit}</span>
                                    </div>
                                  </button>
                                ))}
                                {stock.length === 0 && (
                                  <p className="col-span-2 text-center py-4 text-[11px] text-muted-foreground glass rounded-xl border-dashed border border-white/10">
                                    Nenhum produto cadastrado.
                                  </p>
                                )}
                              </div>
                              {selectedStockId && (
                                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
                                  <label className="text-xs text-muted-foreground mb-1.5 block">Quanto você comprou?</label>
                                  <input
                                    value={itemQty}
                                    onChange={(e) => setItemQty(e.target.value)}
                                    placeholder={`ex: 10 ${stock.find(s => s.id === selectedStockId)?.unit || ""}`}
                                    inputMode="decimal"
                                    className="w-full glass rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                                  />
                                </motion.div>
                              )}
                            </>
                          ) : (
                            <div className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/10">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold">Cadastrar Novo Produto</h4>
                                <button
                                  onClick={() => setIsRegisteringNew(false)}
                                  className="text-[10px] text-primary hover:underline"
                                >
                                  Voltar aos atalhos
                                </button>
                              </div>
                              <input
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="Nome do Insumo (ex: Leite Condensado)"
                                className="w-full glass rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <select
                                  value={newUnit}
                                  onChange={(e) => setNewUnit(e.target.value as Unit)}
                                  className="glass rounded-xl px-3 py-2 text-sm focus:outline-none bg-black"
                                >
                                  <option value="kg">kg</option>
                                  <option value="lt">L</option>
                                  <option value="un">un</option>
                                </select>
                                <input
                                  value={newMax}
                                  onChange={(e) => setNewMax(e.target.value)}
                                  placeholder="Qtd Máxima (100%)"
                                  inputMode="decimal"
                                  className="glass rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-muted-foreground mb-1 block">Estoque Inicial</label>
                                <input
                                  value={itemQty}
                                  onChange={(e) => setItemQty(e.target.value)}
                                  placeholder="Quanto você tem agora?"
                                  inputMode="decimal"
                                  className="w-full glass rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <label className="text-xs text-muted-foreground mb-1.5 block">Descrição</label>
                          <input
                            value={desc}
                            onChange={(e) => setDesc(e.target.value)}
                            placeholder="Ex: Conta de luz"
                            className="w-full glass rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                          />
                        </div>
                      )}
                    </>
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