import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Snowflake, Loader2 } from "lucide-react";
import { SplashScreen } from "@/components/SplashScreen";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — FrostCash" },
      { name: "description", content: "Acesse sua conta FrostCash." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [showSplash, setShowSplash] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Demo: aceita qualquer email com senha "frost123"
      if (password === "frost123") {
        navigate({ to: "/" });
      } else {
        setError(true);
        setTimeout(() => setError(false), 600);
      }
    }, 900);
  };

  const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <>
      <AnimatePresence>
        {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
      </AnimatePresence>

      <div className="min-h-screen flex">
        {/* Lado decorativo */}
        <div className="hidden lg:flex flex-1 relative overflow-hidden bg-splash">
          <div className="absolute inset-0">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-white/10 blur-3xl"
                style={{
                  width: 280 + i * 60,
                  height: 280 + i * 60,
                  left: `${10 + i * 12}%`,
                  top: `${5 + i * 15}%`,
                }}
                animate={{
                  x: [0, 30, 0],
                  y: [0, -20, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 8 + i * 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.3,
                }}
              />
            ))}
          </div>
          <div className="relative z-10 flex flex-col justify-between p-12 text-white">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center">
                <Snowflake className="h-5 w-5" />
              </div>
              <span className="font-bold text-xl">FrostCash</span>
            </div>
            <div className="space-y-3">
              <h2 className="text-4xl font-bold leading-tight max-w-md">
                Sua sorveteria nunca foi tão organizada.
              </h2>
              <p className="text-white/80 max-w-md">
                Vendas, estoque e fluxo de caixa em um único lugar — com a fluidez de um app premium.
              </p>
            </div>
            <div className="flex gap-1.5">
              <span className="h-1.5 w-8 rounded-full bg-white" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
            </div>
          </div>
        </div>

        {/* Formulário */}
        <div className="flex-1 flex items-center justify-center p-5 lg:p-10">
          <motion.div
            initial="hidden"
            animate={showSplash ? "hidden" : "show"}
            variants={{ show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } }}
            className="glass-strong w-full max-w-md rounded-3xl p-7 lg:p-9 space-y-5"
          >
            <motion.div variants={item} className="lg:hidden flex items-center gap-2 mb-2">
              <div className="h-9 w-9 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Snowflake className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg text-gradient">FrostCash</span>
            </motion.div>

            <motion.div variants={item} className="space-y-1">
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
                Bem-vindo de volta 👋
              </h1>
              <p className="text-sm text-muted-foreground">
                Entre para gerenciar sua sorveteria.
              </p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <motion.div variants={item}>
                <FloatingInput
                  icon={Mail}
                  type="email"
                  label="E-mail"
                  value={email}
                  onChange={setEmail}
                  required
                />
              </motion.div>

              <motion.div variants={item}>
                <FloatingInput
                  icon={Lock}
                  type={showPwd ? "text" : "password"}
                  label="Senha"
                  value={password}
                  onChange={setPassword}
                  shake={error}
                  error={error}
                  required
                  trailing={
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />
                {error && (
                  <p className="text-xs text-destructive mt-1.5 ml-1">
                    Senha incorreta. Dica: use <code>frost123</code>.
                  </p>
                )}
              </motion.div>

              <motion.div variants={item} className="flex justify-end">
                <a
                  href="#"
                  className="text-xs text-muted-foreground relative group"
                >
                  Esqueci minha senha
                  <span className="absolute left-0 -bottom-0.5 h-px w-0 bg-primary group-hover:w-full transition-all duration-300" />
                </a>
              </motion.div>

              <motion.button
                variants={item}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="relative w-full h-12 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-glow overflow-hidden disabled:opacity-70"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Entrando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </span>
                <span className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-transparent" />
                <motion.span
                  className="absolute inset-y-0 -left-1/2 w-1/2 bg-white/30 skew-x-[-20deg]"
                  animate={{ x: ["0%", "300%"] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                />
              </motion.button>

              <motion.div variants={item} className="flex items-center gap-3">
                <span className="h-px flex-1 bg-white/10" />
                <span className="text-xs text-muted-foreground">ou continue com</span>
                <span className="h-px flex-1 bg-white/10" />
              </motion.div>

              <motion.div variants={item} className="flex gap-3 justify-center">
                <SocialButton provider="google" />
                <SocialButton provider="apple" />
              </motion.div>
            </form>

            <motion.p variants={item} className="text-center text-xs text-muted-foreground">
              Não tem conta?{" "}
              <a href="#" className="text-primary font-medium hover:underline">
                Criar conta
              </a>
            </motion.p>
          </motion.div>
        </div>
      </div>
    </>
  );
}

function FloatingInput({
  icon: Icon,
  label,
  type,
  value,
  onChange,
  required,
  shake,
  error,
  trailing,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  shake?: boolean;
  error?: boolean;
  trailing?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  const active = focused || value.length > 0;

  return (
    <div
      className={`relative ${shake ? "animate-shake" : ""}`}
    >
      <div
        className={`relative flex items-center rounded-xl border bg-white/5 transition-all duration-200 ${
          error
            ? "border-destructive shadow-[0_0_0_3px_oklch(0.7_0.2_25/20%)]"
            : focused
              ? "border-primary shadow-[0_0_0_3px_oklch(0.86_0.09_185/20%)]"
              : "border-white/10"
        }`}
      >
        <Icon className={`h-4 w-4 ml-3.5 transition-colors ${focused ? "text-primary" : "text-muted-foreground"}`} />
        <input
          type={type}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="peer w-full bg-transparent px-3 pt-5 pb-2 text-sm outline-none"
        />
        <label
          className={`pointer-events-none absolute left-10 transition-all duration-200 ${
            active
              ? "top-1.5 text-[10px] tracking-wider uppercase text-muted-foreground"
              : "top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
          }`}
        >
          {label}
        </label>
        {trailing && <div className="mr-3.5">{trailing}</div>}
      </div>
    </div>
  );
}

function SocialButton({ provider }: { provider: "google" | "apple" }) {
  return (
    <motion.button
      type="button"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.95 }}
      className="h-12 w-12 rounded-xl glass flex items-center justify-center hover:bg-white/10 transition-colors"
      aria-label={`Entrar com ${provider}`}
    >
      {provider === "google" ? (
        <svg viewBox="0 0 24 24" className="h-5 w-5">
          <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.4 14.6 2.5 12 2.5 6.8 2.5 2.6 6.7 2.6 12s4.2 9.5 9.4 9.5c5.4 0 9-3.8 9-9.2 0-.6-.1-1.1-.2-1.6H12z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
          <path d="M16.4 12.7c0-2.4 2-3.6 2.1-3.6-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.2 1-4 2.4-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3.1 2.4 1.2 0 1.7-.8 3.2-.8s1.9.8 3.2.8c1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.3-2.8-.1 0-2.6-1-2.7-4zM14 4.8c.7-.8 1.1-1.9 1-3-1 0-2.2.6-2.9 1.5-.6.7-1.2 1.9-1 2.9 1.1.1 2.2-.6 2.9-1.4z" />
        </svg>
      )}
    </motion.button>
  );
}