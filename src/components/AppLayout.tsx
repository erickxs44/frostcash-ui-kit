import { ReactNode, useState } from "react";
import { Link, useLocation, useRouter } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ShoppingCart,
  ArrowLeftRight,
  Package,
  Settings,
  Plus,
  Snowflake,
  Bell,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { QuickActionModal } from "./QuickActionModal";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/pdv", label: "PDV", icon: ShoppingCart },
  { to: "/lancamentos", label: "Lançamentos", icon: ArrowLeftRight },
  { to: "/contas-a-receber", label: "A Receber", icon: Users },
  { to: "/estoque", label: "Estoque", icon: Package },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [quickOpen, setQuickOpen] = useState(false);

  return (
    <div className="min-h-screen flex w-full text-foreground">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-64 p-4 sticky top-0 h-screen">
        <div className="glass rounded-2xl flex-1 flex flex-col p-5">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <Snowflake className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight text-gradient">FrostCash</h1>
              <p className="text-[10px] text-muted-foreground tracking-wider uppercase">Gestão Gelada</p>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const active = location.pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                    active
                      ? "text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5",
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute inset-0 bg-gradient-primary rounded-xl shadow-glow"
                      transition={{ type: "spring", duration: 0.5 }}
                    />
                  )}
                  <Icon className="h-4 w-4 relative z-10" />
                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto glass rounded-xl p-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-secondary/40 flex items-center justify-center text-sm font-bold">
              SR
            </div>
            <div className="text-xs">
              <p className="font-semibold">Sorveteria Rio</p>
              <p className="text-muted-foreground">Plano Pro</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Conteúdo */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-30 glass-strong px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Snowflake className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-gradient">FrostCash</span>
          </div>
          <button className="h-9 w-9 glass rounded-full flex items-center justify-center">
            <Bell className="h-4 w-4" />
          </button>
        </header>

        <main className="flex-1 p-4 lg:p-8 pb-28 lg:pb-8 max-w-7xl w-full mx-auto">
          <PageTransition pathname={location.pathname}>{children}</PageTransition>
        </main>
      </div>

      {/* Bottom bar mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 px-3 pb-3 pt-2">
        <div className="glass-strong rounded-2xl flex items-center justify-around px-2 py-2 relative">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.08, rotate: 90 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setQuickOpen(true)}
        className="fixed bottom-24 lg:bottom-8 right-5 lg:right-8 z-40 h-14 w-14 rounded-full bg-gradient-primary shadow-glow flex items-center justify-center"
        aria-label="Ação rápida"
      >
        <Plus className="h-6 w-6 text-primary-foreground" />
      </motion.button>

      <QuickActionModal open={quickOpen} onOpenChange={setQuickOpen} />
    </div>
  );
}

function PageTransition({ pathname, children }: { pathname: string; children: ReactNode }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -16 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
