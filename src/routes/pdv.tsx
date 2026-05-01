import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, CreditCard, Banknote, Smartphone, IceCream, Plus, Minus, Settings, X, Save, Edit, Check, Scale, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Product, ProductIngredient, registerSale, useStore, addProduct, removeProduct, updateProduct, StockItem, updateBuffetRecipe } from "@/lib/store";

export const Route = createFileRoute("/pdv")({
  head: () => ({ meta: [{ title: "PDV — FrostCash" }] }),
  component: PDV,
});

type PaymentMethod = "Dinheiro" | "Cartão" | "PIX" | "Fiado";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface CartLine {
  id: string; // único por linha
  productId: string;
  name: string;
  price: number;
  qty: number;
}

function getCategoryColor(cat: string) {
  const lower = cat.toLowerCase();
  if (lower.includes("açaí") || lower.includes("acai")) return "from-purple-500 to-purple-700 text-purple-100";
  if (lower.includes("sorvete") || lower.includes("massa")) return "from-pink-400 to-pink-600 text-pink-100";
  if (lower.includes("bebida")) return "from-blue-400 to-blue-600 text-blue-100";
  if (lower.includes("picolé")) return "from-teal-400 to-teal-600 text-teal-100";
  return "from-slate-600 to-slate-800 text-slate-100"; // fallback
}

function PDV() {
  const products = useStore((s) => s.products);
  const stock = useStore((s) => s.stock);
  const buffetRecipe = useStore((s) => s.buffetRecipe || []);

  // Deriva categorias únicas
  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category))), [products]);
  const [cat, setCat] = useState<string>("");

  // Determina a categoria ativa sem causar loop de re-renderização
  const activeCat = categories.includes(cat) ? cat : (categories[0] || "");

  const visible = products.filter((p) => p.category === activeCat);

  const [cart, setCart] = useState<CartLine[]>([]);
  const [payment, setPayment] = useState<PaymentMethod>("Dinheiro");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const clients = useStore((s) => s.clients);

  // Buffet
  const [pesoGrama, setPesoGrama] = useState<string>("");
  const [precoKg, setPrecoKg] = useState<string>("79.90");

  function addBuffetToCart() {
    const pGrama = parseFloat(pesoGrama.replace(',', '.'));
    const pKg = parseFloat(precoKg.replace(',', '.'));
    
    if (isNaN(pGrama) || pGrama <= 0) return;
    const kgVendidos = pGrama / 1000;
    const val = kgVendidos * (isNaN(pKg) ? 0 : pKg);

    setCart(c => [...c, {
      id: Math.random().toString(),
      productId: "buffet",
      name: `Buffet a Quilo (${pGrama}g)`,
      price: val,
      qty: 1
    }]);
    
    setPesoGrama(""); // resetar para o próximo cliente
    toast.success(`Buffet (${pGrama}g) adicionado!`);
  }

  // Modais
  const [showConfig, setShowConfig] = useState(false);
  const [customizingItem, setCustomizingItem] = useState<Product | null>(null);

  function openCustomization(p: Product) {
    addCartLine(p);
  }

  function addCartLine(p: Product) {
    setCart((c) => {
      const existing = c.findIndex((i) => i.productId === p.id);
      if (existing >= 0) {
        const newCart = [...c];
        newCart[existing].qty += 1;
        return newCart;
      }
      return [...c, { id: Math.random().toString(), productId: p.id, name: p.name, price: p.price, qty: 1 }];
    });
  }

  function changeLineQty(lineId: string, delta: number) {
    setCart((c) =>
      c.map((i) => (i.id === lineId ? { ...i, qty: i.qty + delta } : i)).filter((i) => i.qty > 0),
    );
  }

  function removeLine(lineId: string) {
    setCart((c) => c.filter((i) => i.id !== lineId));
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const total = subtotal;
  const lucroEstimado = total;

  async function handleSaveSale() {
    if (cart.length === 0) return;
    if (payment === "Fiado" && !selectedClientId) {
      toast.error("Selecione um cliente para a venda fiada.");
      return;
    }
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 300));
      registerSale(cart, payment, payment === "Fiado" ? selectedClientId : undefined);
      toast.success("Venda registrada com sucesso!");
      setCart([]);
      setPayment("Dinheiro");
      setSelectedClientId("");
    } catch {
      toast.error("Não foi possível registrar a venda.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Frente de <span className="text-gradient">Caixa</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Selecione os produtos para iniciar uma venda.</p>
          </div>
          <Button variant="secondary" onClick={() => setShowConfig(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Configurar Cardápio
          </Button>
        </header>

        {products.length === 0 ? (
          <GlassCard className="text-center py-16">
            <IceCream className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">Cardápio Vazio</h3>
            <p className="text-muted-foreground mb-6">Você precisa configurar os produtos que serão vendidos no PDV.</p>
            <Button onClick={() => setShowConfig(true)}>Adicionar Produtos</Button>
          </GlassCard>
        ) : (
          <div className="grid lg:grid-cols-[1fr_380px] gap-6">
            <div className="space-y-4">
              {/* Opção de Venda por Peso */}
              <GlassCard className="border-primary/20 bg-primary/5 p-4 rounded-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <Scale className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg text-foreground">Venda por Peso (Buffet)</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Peso (Gramas)</label>
                    <input 
                      type="text" 
                      inputMode="decimal"
                      value={pesoGrama} 
                      onChange={(e) => setPesoGrama(e.target.value)} 
                      placeholder="Ex: 350"
                      className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Preço / Kg (R$)</label>
                    <input 
                      type="text" 
                      inputMode="decimal"
                      value={precoKg} 
                      onChange={(e) => setPrecoKg(e.target.value)} 
                      className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="pb-1">
                    <p className="text-xs text-muted-foreground mb-0.5">Total Calculado</p>
                    <p className="text-xl font-bold text-gradient">
                      {pesoGrama ? fmt((parseFloat(pesoGrama.replace(',', '.')) / 1000) * parseFloat(precoKg.replace(',', '.'))) : "R$ 0,00"}
                    </p>
                  </div>
                  <Button 
                    variant="gradient" 
                    disabled={!pesoGrama} 
                    onClick={addBuffetToCart}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Adicionar</span>
                  </Button>
                </div>
              </GlassCard>

              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 mt-6">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCat(c)}
                    className={`relative px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
                      activeCat === c ? "text-primary-foreground" : "glass text-muted-foreground"
                    }`}
                  >
                    {activeCat === c && (
                      <motion.div
                        layoutId="cat-pill"
                        className={`absolute inset-0 rounded-xl shadow-glow bg-gradient-to-br ${getCategoryColor(c)} opacity-80`}
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
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => openCustomization(p)}
                    className="glass rounded-2xl p-5 text-left hover:shadow-glow transition-all relative overflow-hidden group"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500 from-transparent via-primary/50 to-transparent" />
                    <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${getCategoryColor(p.category)} flex items-center justify-center mb-4 shadow-lg shadow-black/10`}>
                      <IceCream className="h-6 w-6 drop-shadow-md" />
                    </div>
                    <p className="font-semibold text-[15px] leading-tight text-foreground">{p.name}</p>
                    <p className="text-sm font-bold text-muted-foreground mt-1.5">{fmt(p.price)}</p>
                  </motion.button>
                ))}
              </div>
            </div>

            <GlassCard hover={false} className="h-fit lg:sticky lg:top-4">
              <h3 className="font-semibold mb-4">Comanda</h3>
              <div className="space-y-2 mb-4 min-h-[120px] max-h-[400px] overflow-y-auto pr-1">
                <AnimatePresence>
                  {cart.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Toque em um produto para começar.
                    </p>
                  )}
                  {cart.map((i) => (
                    <motion.div
                      key={i.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex flex-col glass rounded-lg p-2.5 gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm min-w-0 flex-1">
                          <p className="font-medium truncate">{i.name}</p>
                          <p className="text-xs text-muted-foreground">{fmt(i.price)}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => changeLineQty(i.id, -1)}
                            className="h-6 w-6 rounded-md glass flex items-center justify-center hover:bg-white/10"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-sm font-semibold w-5 text-center">{i.qty}</span>
                          <button
                            onClick={() => changeLineQty(i.id, 1)}
                            className="h-6 w-6 rounded-md glass flex items-center justify-center hover:bg-white/10"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="text-sm font-semibold whitespace-nowrap ml-2 w-16 text-right">
                          {fmt(i.price * i.qty)}
                        </span>
                        <button
                          onClick={() => removeLine(i.id)}
                          className="text-muted-foreground hover:text-destructive transition ml-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="border-t border-white/10 pt-4 mb-4 space-y-1">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="font-semibold">Total</span>
                  <span className="text-2xl font-bold text-gradient">{fmt(total)}</span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-3">
                {[
                  { l: "Dinheiro" as const, i: Banknote },
                  { l: "Cartão" as const, i: CreditCard },
                  { l: "PIX" as const, i: Smartphone },
                  { l: "Fiado" as const, i: BookOpen },
                ].map(({ l, i: Ic }) => {
                  const active = payment === l;
                  return (
                    <button
                      key={l}
                      onClick={() => setPayment(l)}
                      className={`relative rounded-xl p-2 flex flex-col items-center gap-1 transition-all active:scale-95 ${
                        active
                          ? "bg-gradient-primary text-primary-foreground shadow-glow"
                          : "glass text-foreground hover:bg-white/10"
                      }`}
                    >
                      <Ic className={`h-4 w-4 ${active ? "text-primary-foreground" : "text-primary"}`} />
                      <span className="text-[10px] font-medium">{l}</span>
                    </button>
                  );
                })}
              </div>

              {payment === "Fiado" && (
                <div className="mb-4">
                  <label className="text-xs text-muted-foreground block mb-1">Selecione o Cliente</label>
                  {clients && clients.length > 0 ? (
                    <select
                      value={selectedClientId}
                      onChange={(e) => setSelectedClientId(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                    >
                      <option value="">-- Selecione --</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">Nenhum cliente cadastrado. Cadastre em "Contas a Receber".</p>
                  )}
                </div>
              )}
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
        )}

        <ItemCustomizationModal 
          product={customizingItem} 
          stock={stock}
          onClose={() => setCustomizingItem(null)} 
          onAdd={(consumed) => {
            addCartLine(customizingItem!, consumed);
            setCustomizingItem(null);
          }}
        />

        <MenuConfigurationModal 
          isOpen={showConfig} 
          onClose={() => setShowConfig(false)} 
          products={products}
          stock={stock}
          buffetRecipe={buffetRecipe}
        />
      </div>
    </AppLayout>
  );
}

// ============================================================================
// Modal: O que vai nele? (Customização do Item na Venda)
// ============================================================================
function ItemCustomizationModal({ product, stock, onClose, onAdd }: { 
  product: Product | null; 
  stock: StockItem[];
  onClose: () => void; 
  onAdd: (consumed: { stockId: string, qty: number }[]) => void;
}) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useMemo(() => {
    if (!product) return;
    const initial: Record<string, number> = {};
    product.ingredients.forEach(ing => {
      initial[ing.stockId] = ing.defaultQty;
    });
    setQuantities(initial);
  }, [product]);

  if (!product) return null;

  function updateQty(stockId: string, delta: number) {
    setQuantities(prev => {
      const current = prev[stockId] || 0;
      const st = stock.find(s => s.id === stockId);
      let step = 1;
      
      // Se for g, ml, kg, lt, tenta usar passos fracionados dependendo do comum
      if (st && (st.unit === "kg" || st.unit === "lt")) step = 0.1;

      const newQty = Math.max(0, current + (delta * step));
      
      // Arredonda para evitar problemas de ponto flutuante
      const finalQty = Math.round(newQty * 100) / 100;

      if (st && finalQty > st.qty) {
        toast.warning(`Estoque insuficiente de ${st.name}! Restam apenas ${st.qty} ${st.unit}.`);
        return prev; // não permite passar do estoque
      }
      
      return { ...prev, [stockId]: finalQty };
    });
  }

  function handleConfirm() {
    const consumed = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([stockId, qty]) => ({ stockId, qty }));
    onAdd(consumed);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[90vh]"
      >
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
          <div>
            <h3 className="font-semibold text-lg">{product.name}</h3>
            <p className="text-xs text-muted-foreground">O que vai nele?</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-3">
          {product.ingredients.length === 0 ? (
            <p className="text-sm text-center text-muted-foreground py-4">Este item não possui insumos configurados.</p>
          ) : (
            product.ingredients.map(ing => {
              const st = stock.find(s => s.id === ing.stockId);
              if (!st) return null;
              
              const currentQty = quantities[st.id] || 0;
              const isOutOfStock = st.qty <= 0;
              const maxReached = currentQty >= st.qty;

              return (
                <div key={st.id} className="flex items-center justify-between glass p-3 rounded-xl border border-white/5 relative overflow-hidden">
                  {isOutOfStock && <div className="absolute inset-0 bg-destructive/10 pointer-events-none" />}
                  
                  <div>
                    <p className={`font-medium text-sm ${isOutOfStock ? 'text-destructive' : ''}`}>
                      {st.name} {isOutOfStock && "(Esgotado)"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      No estoque: <span className={isOutOfStock ? "text-destructive font-bold" : ""}>{st.qty} {st.unit}</span>
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQty(st.id, -1)}
                      disabled={currentQty <= 0}
                      className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 disabled:opacity-30 transition"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <div className="w-14 text-center text-sm font-semibold">
                      {currentQty} {st.unit}
                    </div>
                    <button
                      onClick={() => updateQty(st.id, 1)}
                      disabled={isOutOfStock || maxReached}
                      className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 disabled:opacity-30 transition"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-white/5 bg-white/5">
          <Button variant="gradient" className="w-full" onClick={handleConfirm}>
            Confirmar e Adicionar
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================================
// Modal: Configuração do Cardápio
// ============================================================================
function MenuConfigurationModal({ isOpen, onClose, products, stock, buffetRecipe }: { 
  isOpen: boolean; 
  onClose: () => void; 
  products: Product[];
  stock: StockItem[];
  buffetRecipe: { stockId: string; qtyPerKg: number }[];
}) {
  const [activeTab, setActiveTab] = useState<"produtos" | "buffet">("produtos");
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Açaí");
  const [price, setPrice] = useState("");
  const [ingredients, setIngredients] = useState<ProductIngredient[]>([]);

  // Buffet state
  const [buffetIngs, setBuffetIngs] = useState<{stockId: string, qtyPerKg: number}[]>(buffetRecipe);

  useMemo(() => {
    if (isOpen) {
      setBuffetIngs(buffetRecipe);
    }
  }, [isOpen, buffetRecipe]);

  if (!isOpen) return null;

  function edit(p: Product) {
    setEditingId(p.id);
    setName(p.name);
    setCategory(p.category);
    setPrice(p.price.toString());
    setIngredients(p.ingredients);
  }

  function resetForm() {
    setEditingId(null);
    setName("");
    setCategory("Açaí");
    setPrice("");
    setIngredients([]);
  }

  function toggleIngredient(stockId: string) {
    setIngredients(prev => {
      const exists = prev.find(i => i.stockId === stockId);
      if (exists) return prev.filter(i => i.stockId !== stockId);
      
      const st = stock.find(s => s.id === stockId);
      const defaultQ = (st?.unit === 'kg' || st?.unit === 'lt') ? 0.1 : 1;
      return [...prev, { stockId, defaultQty: defaultQ }];
    });
  }

  function updateIngDefaultQty(stockId: string, qty: number) {
    setIngredients(prev => prev.map(i => i.stockId === stockId ? { ...i, defaultQty: qty } : i));
  }

  function save() {
    if (!name || !price) {
      toast.error("Preencha nome e preço.");
      return;
    }
    const parsedPrice = parseFloat(price.replace(",", "."));
    
    if (editingId) {
      updateProduct(editingId, { name, category, price: parsedPrice, ingredients });
      toast.success("Produto atualizado!");
    } else {
      addProduct({ name, category, price: parsedPrice, ingredients });
      toast.success("Produto adicionado!");
    }
    resetForm();
  }

  function saveBuffet() {
    updateBuffetRecipe(buffetIngs);
    toast.success("Ficha Técnica do Buffet atualizada!");
  }

  function toggleBuffetIngredient(stockId: string) {
    setBuffetIngs(prev => {
      const exists = prev.find(i => i.stockId === stockId);
      if (exists) return prev.filter(i => i.stockId !== stockId);
      
      const st = stock.find(s => s.id === stockId);
      const defaultQ = (st?.unit === 'kg' || st?.unit === 'lt') ? 0.1 : 50;
      return [...prev, { stockId, qtyPerKg: defaultQ }];
    });
  }

  function updateBuffetIngQty(stockId: string, qty: number) {
    setBuffetIngs(prev => prev.map(i => i.stockId === stockId ? { ...i, qtyPerKg: qty } : i));
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[90vh]"
      >
        <div className="p-4 border-b border-white/5 flex flex-col gap-4 bg-white/5">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-lg">Configuração de Cardápio</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("produtos")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${activeTab === "produtos" ? "bg-primary text-primary-foreground" : "glass text-muted-foreground hover:bg-white/10"}`}
            >
              Produtos
            </button>
            <button
              onClick={() => setActiveTab("buffet")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${activeTab === "buffet" ? "bg-primary text-primary-foreground" : "glass text-muted-foreground hover:bg-white/10"}`}
            >
              Ficha Técnica do Buffet
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-[500px]">
          {activeTab === "produtos" ? (
            <>
              {/* Lado Esquerdo: Lista de Produtos */}
              <div className="w-full md:w-5/12 border-r border-white/5 overflow-y-auto p-4 space-y-2 bg-black/10">
            <Button variant="outline" className="w-full mb-4" onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
            
            {products.length === 0 ? (
              <p className="text-sm text-center text-muted-foreground mt-10">Nenhum produto cadastrado no cardápio ainda.</p>
            ) : (
              products.map(p => (
                <div key={p.id} className="glass p-3 rounded-xl flex flex-col gap-2 relative group">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.category} · {fmt(p.price)}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => edit(p)} className="p-1.5 rounded-md hover:bg-white/10 text-blue-400">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => removeProduct(p.id)} className="p-1.5 rounded-md hover:bg-destructive/20 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-[10px] text-muted-foreground flex flex-wrap gap-1">
                    {p.ingredients.length === 0 ? "Sem insumos configurados" : p.ingredients.map(ing => {
                      const st = stock.find(s => s.id === ing.stockId);
                      return st ? <span key={ing.stockId} className="bg-white/5 px-1 rounded">{ing.defaultQty}{st.unit} {st.name}</span> : null;
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Lado Direito: Formulário */}
          <div className="w-full md:w-7/12 p-6 overflow-y-auto bg-white/[0.01]">
            <h3 className="font-medium mb-6 text-gradient flex items-center">
              {editingId ? <><Edit className="w-4 h-4 mr-2" /> Editando: {name}</> : <><Plus className="w-4 h-4 mr-2" /> Criar Novo Produto</>}
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Nome do Produto</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Açaí 300ml, Sorvete 2 Bolas..."
                  className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Preço de Venda (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Categoria</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Ex: Açaí, Sorvete, Bebidas..."
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <label className="text-sm font-semibold mb-1 block text-foreground">Receita / Insumos do Estoque</label>
                <p className="text-xs text-muted-foreground mb-4">
                  Selecione quais itens do estoque o cliente pode adicionar ou já vêm por padrão. No momento da venda, o sistema perguntará "O que vai nele?".
                </p>
                
                {stock.length === 0 ? (
                  <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-4 text-center">
                    <p className="text-sm text-secondary">Seu estoque está vazio.</p>
                    <p className="text-xs text-muted-foreground mt-1">Cadastre insumos na aba Estoque primeiro para vincular a produtos.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {stock.map(st => {
                      const ing = ingredients.find(i => i.stockId === st.id);
                      const isSelected = !!ing;
                      
                      return (
                        <div key={st.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isSelected ? 'glass border-primary/50 bg-primary/5' : 'bg-black/20 border-white/5 hover:border-white/10'}`}>
                          <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => toggleIngredient(st.id)}>
                            <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${isSelected ? 'bg-primary border-primary' : 'bg-black/40 border-white/20'}`}>
                              {isSelected && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                            </div>
                            <div>
                              <span className="text-sm font-medium">{st.name}</span>
                              <p className="text-[10px] text-muted-foreground">Estoque: {st.qty} {st.unit}</p>
                            </div>
                          </div>
                          
                          {isSelected && (
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Qtd. Padrão ({st.unit})</span>
                              <input 
                                type="number" 
                                step="any"
                                value={ing.defaultQty} 
                                onChange={(e) => updateIngDefaultQty(st.id, parseFloat(e.target.value) || 0)}
                                className="w-20 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:border-primary"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-white/5">
                <Button variant="gradient" className="w-full" onClick={save}>
                  <Save className="h-4 w-4 mr-2" />
                  {editingId ? "Salvar Alterações" : "Salvar Novo Produto"}
                </Button>
              </div>
            </div>
          </div>
          </>
          ) : (
            <div className="w-full p-6 overflow-y-auto bg-white/[0.01]">
              <h3 className="font-medium mb-2 text-gradient flex items-center">
                <Scale className="w-4 h-4 mr-2" /> Receita do Buffet (Venda por Peso)
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Defina o que será abatido do estoque automaticamente para cada <b>1kg</b> de sorvete vendido no Buffet. (A Base Geral de Sorvete já é abatida proporcionalmente ao peso vendido).
              </p>

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {stock.filter(s => s.name !== "Base de Sorvete (Geral)").map(st => {
                  const ing = buffetIngs.find(i => i.stockId === st.id);
                  const isSelected = !!ing;
                  
                  return (
                    <div key={st.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isSelected ? 'glass border-primary/50 bg-primary/5' : 'bg-black/20 border-white/5 hover:border-white/10'}`}>
                      <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => toggleBuffetIngredient(st.id)}>
                        <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${isSelected ? 'bg-primary border-primary' : 'bg-black/40 border-white/20'}`}>
                          {isSelected && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                        </div>
                        <div>
                          <span className="text-sm font-medium">{st.name}</span>
                          <p className="text-[10px] text-muted-foreground">Estoque: {st.qty} {st.unit}</p>
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Gasto a cada 1kg ({st.unit})</span>
                          <input 
                            type="number" 
                            step="any"
                            value={ing.qtyPerKg} 
                            onChange={(e) => updateBuffetIngQty(st.id, parseFloat(e.target.value) || 0)}
                            className="w-20 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:border-primary"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-6 mt-4 border-t border-white/5">
                <Button variant="gradient" className="w-full md:w-auto" onClick={saveBuffet}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Ficha Técnica do Buffet
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}