import { createFileRoute } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { User, Store, Bell, Lock, CreditCard, LogOut, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — FrostCash" }] }),
  component: Configuracoes,
});

const sections = [
  { icon: Store, title: "Dados da Sorveteria", desc: "Nome, CNPJ, endereço" },
  { icon: User, title: "Perfil", desc: "Suas informações pessoais" },
  { icon: Bell, title: "Notificações", desc: "Alertas de vendas e estoque" },
  { icon: Lock, title: "Segurança", desc: "Senha e autenticação" },
  { icon: CreditCard, title: "Plano e Faturamento", desc: "Plano Pro · R$ 49/mês" },
];

function Configuracoes() {
  const navigate = useNavigate();

  function handleLogout() {
    if (typeof window !== "undefined") sessionStorage.removeItem("frostcash:auth");
    toast.success("Sessão encerrada");
    navigate({ to: "/login" });
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-gradient">Configurações</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie sua conta e preferências.</p>
        </header>

        <GlassCard hover={false} className="bg-gradient-to-br from-primary/15 to-secondary/10">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-primary flex items-center justify-center text-2xl font-bold text-primary-foreground shadow-glow">
              SR
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-lg">Sorveteria Rio</h2>
              <p className="text-sm text-muted-foreground">contato@sorveteriario.com</p>
              <span className="inline-block mt-1.5 text-[10px] uppercase tracking-wider glass px-2 py-0.5 rounded-full">
                Plano Pro
              </span>
            </div>
          </div>
        </GlassCard>

        <div className="space-y-2">
          {sections.map((s, i) => (
            <motion.button
              key={s.title}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ x: 4 }}
              className="w-full glass rounded-2xl p-4 flex items-center gap-4 text-left hover:bg-white/5 transition"
            >
              <div className="h-10 w-10 rounded-xl bg-gradient-primary/20 flex items-center justify-center">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </motion.button>
          ))}
        </div>

        <Button variant="glass" className="w-full rounded-xl text-secondary" onClick={handleLogout}>
          <LogOut className="h-4 w-4" /> Sair da conta
        </Button>

        <p className="text-center text-xs text-muted-foreground pt-4">FrostCash v1.0 · feito com ❤️ e gelo</p>
      </div>
    </AppLayout>
  );
}
