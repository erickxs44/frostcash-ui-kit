import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { User, Store, Bell, Lock, CreditCard, LogOut, ChevronRight, Sun, Moon, Palette, Save, X, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import { useStore, updateProfile, resetData } from "@/lib/store";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — FrostCash" }] }),
  component: Configuracoes,
});

const sections = [
  { icon: Bell, title: "Notificações", desc: "Silenciar alertas (em breve)" },
  { icon: Lock, title: "Segurança", desc: "Alterar senha (em breve)" },
];

function Configuracoes() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const profile = useStore((s) => s.profile);
  const email = typeof window !== "undefined" ? sessionStorage.getItem("frostcash:auth") : "";

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(profile);

  function handleSaveProfile() {
    updateProfile(formData);
    setIsEditing(false);
    toast.success("Perfil atualizado com sucesso!");
  }

  function handleLogout() {
    if (typeof window !== "undefined") sessionStorage.removeItem("frostcash:auth");
    toast.success("Sessão encerrada");
    navigate({ to: "/login" });
  }

  function toggleTheme() {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    toast.success(`Tema ${newTheme === "dark" ? "escuro" : "claro"} ativado`);
  }

  function handleReset() {
    if (confirm("Tem certeza que deseja apagar TODOS os dados (vendas, estoque, receitas)? Essa ação não pode ser desfeita.")) {
      resetData();
      toast.success("Dados do sistema zerados com sucesso.");
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-gradient">Configurações</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie seu perfil e preferências.</p>
        </header>

        <GlassCard hover={false} className="bg-gradient-to-br from-primary/10 to-secondary/5 rounded-2xl shadow-sm dark:shadow-none transition-all duration-300 border border-white/20 dark:border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
             {!isEditing ? (
               <Button variant="ghost" size="icon" onClick={() => { setFormData(profile); setIsEditing(true); }} className="rounded-full hover:bg-primary/20 text-primary">
                 <Edit2 className="w-5 h-5" />
               </Button>
             ) : (
               <div className="flex gap-2">
                 <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)} className="rounded-full hover:bg-destructive/20 text-destructive">
                   <X className="w-5 h-5" />
                 </Button>
                 <Button variant="ghost" size="icon" onClick={handleSaveProfile} className="rounded-full hover:bg-green-500/20 text-green-500">
                   <Save className="w-5 h-5" />
                 </Button>
               </div>
             )}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-2">
            <div className="h-20 w-20 rounded-2xl bg-gradient-primary flex items-center justify-center text-3xl font-bold text-primary-foreground shadow-glow shrink-0">
              {profile.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 w-full space-y-3">
              {isEditing ? (
                <div className="space-y-3 mt-4 sm:mt-0">
                  <div>
                    <label className="text-xs text-muted-foreground ml-1">Nome da Loja</label>
                    <input 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 mt-1 outline-none focus:border-primary transition-colors text-sm"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="Ex: Sorveteria Frost"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground ml-1">Endereço</label>
                    <input 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 mt-1 outline-none focus:border-primary transition-colors text-sm"
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                      placeholder="Ex: Rua das Flores, 123"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground ml-1">Telefone</label>
                    <input 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 mt-1 outline-none focus:border-primary transition-colors text-sm"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      placeholder="Ex: (11) 99999-9999"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <h2 className="font-bold text-2xl tracking-tight">{profile.name || "Minha Loja"}</h2>
                    <p className="text-sm text-muted-foreground">{email || "Usuário"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium bg-white/10 dark:bg-black/20 px-2.5 py-1 rounded-lg">
                      <Store className="w-3.5 h-3.5" />
                      {profile.address || "Endereço não informado"}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium bg-white/10 dark:bg-black/20 px-2.5 py-1 rounded-lg">
                      <User className="w-3.5 h-3.5" />
                      {profile.phone || "Telefone não informado"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </GlassCard>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground px-2 uppercase tracking-wider">Preferências do Sistema</h3>
          
          <motion.button
            onClick={toggleTheme}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full glass rounded-2xl p-4 flex items-center gap-4 text-left hover:bg-white/10 transition shadow-sm dark:shadow-none"
          >
            <div className="h-12 w-12 rounded-xl bg-gradient-primary/10 flex items-center justify-center">
              {theme === "dark" ? (
                <Moon className="h-6 w-6 text-primary" />
              ) : (
                <Sun className="h-6 w-6 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Aparência: Tema {theme === "dark" ? "Escuro" : "Claro"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Clique para alternar o visual do sistema</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground/50" />
          </motion.button>

          {sections.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (i + 1) * 0.1 }}
              className="w-full glass rounded-2xl p-4 flex items-center gap-4 text-left opacity-60 cursor-not-allowed shadow-sm dark:shadow-none"
            >
              <div className="h-12 w-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                <s.icon className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{s.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
              </div>
              <Lock className="h-4 w-4 text-muted-foreground/30" />
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col gap-3 mt-4">
          <Button variant="glass" className="w-full rounded-2xl h-14 text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors font-semibold shadow-sm dark:shadow-none" onClick={handleLogout}>
            <LogOut className="h-5 w-5 mr-2" /> Sair da conta
          </Button>

          <Button variant="ghost" className="w-full rounded-2xl h-14 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors font-medium text-sm" onClick={handleReset}>
            Zerar Dados do Sistema
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground pt-4">FrostCash v1.0 · feito com ❤️ e gelo</p>
      </div>
    </AppLayout>
  );
}
