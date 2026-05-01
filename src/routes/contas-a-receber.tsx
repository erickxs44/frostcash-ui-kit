import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useStore, addClient, payDebt } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/GlassCard";
import { toast } from "sonner";
import { UserPlus, User, Phone, CheckCircle, CreditCard } from "lucide-react";

export const Route = createFileRoute("/contas-a-receber")({
  head: () => ({ meta: [{ title: "Contas a Receber — FrostCash" }] }),
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

  const handlePayDebt = (clientId: string, amount: number) => {
    if (confirm(`Confirmar o pagamento de ${fmt(amount)}? Esse valor será adicionado ao caixa de hoje.`)) {
      payDebt(clientId, amount);
      toast.success("Pagamento registrado com sucesso!");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Contas a <span className="text-gradient">Receber</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Gerencie clientes e vendas no fiado.</p>
          </div>
          <Button variant="gradient" onClick={() => setShowAddClient(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        </header>

        {showAddClient && (
          <GlassCard className="mb-6 border-primary/20 bg-primary/5">
            <h3 className="font-semibold mb-4 text-lg">Cadastrar Novo Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Nome</label>
                <input 
                  type="text" 
                  value={newClientName} 
                  onChange={(e) => setNewClientName(e.target.value)} 
                  placeholder="Nome completo"
                  className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Telefone</label>
                <input 
                  type="text" 
                  value={newClientPhone} 
                  onChange={(e) => setNewClientPhone(e.target.value)} 
                  placeholder="(00) 00000-0000"
                  className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setShowAddClient(false)}>Cancelar</Button>
              <Button variant="gradient" onClick={handleAddClient}>Salvar</Button>
            </div>
          </GlassCard>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(!clients || clients.length === 0) ? (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum cliente cadastrado.</p>
            </div>
          ) : (
            clients.map(client => (
              <GlassCard key={client.id} className="flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{client.name}</h3>
                    {client.phone && (
                      <p className="text-xs text-muted-foreground flex items-center mt-1">
                        <Phone className="h-3 w-3 mr-1" />
                        {client.phone}
                      </p>
                    )}
                  </div>
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                
                <div className="mt-auto pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-muted-foreground">Dívida Pendente:</span>
                    <span className={`text-lg font-bold ${client.debt > 0 ? "text-destructive" : "text-success"}`}>
                      {fmt(client.debt)}
                    </span>
                  </div>
                  
                  {client.debt > 0 ? (
                    <Button 
                      variant="gradient" 
                      className="w-full"
                      onClick={() => handlePayDebt(client.id, client.debt)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Dar Baixa (Pagar)
                    </Button>
                  ) : (
                    <Button 
                      variant="secondary" 
                      className="w-full opacity-50"
                      disabled
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Tudo Quitado
                    </Button>
                  )}
                </div>
              </GlassCard>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
