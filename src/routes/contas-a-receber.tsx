import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useStore, addClient, payDebt, registerSale, removeClient } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/GlassCard";
import { toast } from "sonner";
import { UserPlus, User, Phone, CheckCircle, CreditCard, Plus, X } from "lucide-react";

export const Route = createFileRoute("/contas-a-receber")({
  head: () => ({ meta: [{ title: "Fiados — FrostCash" }] }),
  component: ContasAReceber,
});

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function ContasAReceber() {
  const clients = useStore(s => s.clients);
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");

  const handleAddClient = () => {
    if (!newClientName) {
      toast.error("O nome do cliente é obrigatório");
      return;
    }
    addClient({ name: newClientName, phone: newClientPhone, creditLimit: 0 });
    toast.success("Cliente cadastrado com sucesso!");
    setNewClientName("");
    setNewClientPhone("");
    setShowAddClient(false);
  };

  const handlePayDebt = (clientId: string, currentDebt: number) => {
    const input = prompt(`Quanto o cliente está pagando? (Dívida total: ${fmt(currentDebt)})`, currentDebt.toString());
    
    if (input === null) return; // cancelou

    const amount = parseFloat(input.replace(',', '.'));
    
    if (isNaN(amount) || amount <= 0) {
      toast.error("Valor inválido.");
      return;
    }

    if (amount > currentDebt) {
      if (!confirm(`O valor pago (${fmt(amount)}) é maior que a dívida (${fmt(currentDebt)}). Deseja prosseguir e deixar o saldo positivo?`)) {
        return;
      }
    }

    payDebt(clientId, amount);
    toast.success(amount >= currentDebt ? "Dívida quitada com sucesso!" : `Pagamento de ${fmt(amount)} registrado. Saldo atualizado.`);
  };

  const handleAddFiado = (clientId: string, clientName: string) => {
    const inputDesc = prompt(`Descrição da venda para ${clientName}:`, "Venda Balcão");
    if (!inputDesc) return;
    
    const inputVal = prompt(`Qual o valor da venda fiada?`);
    if (!inputVal) return;
    
    const amount = parseFloat(inputVal.replace(',', '.'));
    
    if (isNaN(amount) || amount <= 0) {
      toast.error("Valor inválido.");
      return;
    }
    
    registerSale([{ productId: "manual", name: inputDesc, price: amount, qty: 1 }], "Fiado", clientId);
    toast.success(`Venda de ${fmt(amount)} registrada para ${clientName}!`);
  };

  const handleRemoveClient = (clientId: string, clientName: string) => {
    if (confirm(`Deseja realmente remover o cliente "${clientName}" e todos os seus dados de dívida?`)) {
      removeClient(clientId);
      toast.success("Cliente removido com sucesso.");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Gestão de <span className="text-gradient">Fiados</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Gerencie clientes e cobranças pendentes.</p>
          </div>
          <Button variant="gradient" onClick={() => setShowAddClient(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        </header>

        {showAddClient && (
          <GlassCard className="mb-6 border-primary/20 bg-primary/5 p-6">
            <h3 className="font-semibold mb-4 text-lg">Cadastrar Novo Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground block">Nome do Cliente</label>
                <input 
                  type="text" 
                  value={newClientName} 
                  onChange={(e) => setNewClientName(e.target.value)} 
                  placeholder="Ex: João Silva"
                  className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground block">WhatsApp / Telefone</label>
                <input 
                  type="text" 
                  value={newClientPhone} 
                  onChange={(e) => setNewClientPhone(e.target.value)} 
                  placeholder="Ex: (83) 99999-9999"
                  className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setShowAddClient(false)} className="rounded-xl">Cancelar</Button>
              <Button variant="gradient" onClick={handleAddClient} className="rounded-xl px-8 shadow-glow">Salvar Cliente</Button>
            </div>
          </GlassCard>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {(!clients || clients.length === 0) ? (
            <div className="col-span-full py-12 text-center text-muted-foreground glass rounded-2xl border border-dashed border-white/10">
              <User className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-base">Nenhum cliente cadastrado ainda.</p>
              <p className="text-xs opacity-60">Comece adicionando seu primeiro cliente de fiado.</p>
            </div>
          ) : (
            clients
              .sort((a, b) => b.debt - a.debt) // Mostrar quem deve mais no topo
              .map(client => (
              <GlassCard key={client.id} className="relative group hover:scale-[1.01] transition-transform duration-300 border-white/5 overflow-hidden">
                <button 
                  onClick={() => handleRemoveClient(client.id, client.name)}
                  className="absolute top-1.5 right-1.5 h-5 w-5 flex items-center justify-center rounded-full text-muted-foreground/30 hover:text-red-500 hover:bg-red-500/10 transition-all z-10"
                  title="Remover cliente"
                >
                  <X className="h-3 w-3" />
                </button>

                <div className="p-3 flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold text-base border border-primary/10 shadow-inner">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm truncate tracking-tight">{client.name}</h3>
                    {client.phone ? (
                      <p className="text-[10px] text-muted-foreground flex items-center opacity-70">
                        <Phone className="h-2 w-2 mr-1 text-primary" />
                        {client.phone}
                      </p>
                    ) : (
                      <p className="text-[9px] text-muted-foreground italic opacity-50">Sem fone</p>
                    )}
                  </div>

                  <div className="flex-1 flex justify-center">
                    <button 
                      onClick={() => handleAddFiado(client.id, client.name)}
                      className="h-8 w-8 rounded-full glass flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors border border-white/5 shadow-sm"
                      title="Nova venda fiada"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="text-right shrink-0 px-2 border-l border-white/5">
                    <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider mb-0.5">Dívida</p>
                    <p className={`text-sm font-black tracking-tight ${client.debt > 0 ? "text-red-500 drop-shadow-[0_0_4px_rgba(239,68,68,0.2)]" : "text-emerald-500"}`}>
                      {fmt(client.debt)}
                    </p>
                  </div>

                  <div className="shrink-0">
                    {client.debt > 0 ? (
                      <Button 
                        variant="gradient" 
                        size="sm"
                        className="h-8 w-8 rounded-lg p-0 shadow-glow flex items-center justify-center"
                        onClick={() => handlePayDebt(client.id, client.debt)}
                        title="Dar Baixa"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    ) : (
                      <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
                        <CreditCard className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                </div>
                {client.debt > 0 && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-red-500/40" title="Pagamento Pendente"></div>
                )}
              </GlassCard>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
