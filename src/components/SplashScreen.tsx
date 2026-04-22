import { motion } from "framer-motion";
import { IceCream } from "lucide-react";
import { useEffect, useState } from "react";

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const duration = 1800;
    const id = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(id);
        setTimeout(onDone, 350);
      }
    }, 30);
    return () => clearInterval(id);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ scale: 1.4, opacity: 0, borderRadius: "50%" }}
      transition={{ duration: 0.7, ease: [0.65, 0, 0.35, 1] }}
      className="fixed inset-0 z-[100] bg-splash flex flex-col items-center justify-center overflow-hidden"
    >
      <motion.div
        animate={{ y: [0, -14, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        className="h-24 w-24 rounded-3xl bg-white/20 backdrop-blur-xl border border-white/30 shadow-2xl flex items-center justify-center mb-8"
      >
        <IceCream className="h-12 w-12 text-white" strokeWidth={2.2} />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-bold text-white tracking-tight mb-1"
      >
        FrostCash
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-white/80 text-sm mb-10"
      >
        Gestão gelada para sua sorveteria
      </motion.p>

      <div className="w-56 h-1 rounded-full bg-white/20 overflow-hidden">
        <motion.div
          className="h-full bg-white progress-shine rounded-full"
          style={{ width: `${progress}%` }}
          transition={{ ease: "linear" }}
        />
      </div>
      <p className="text-white/70 text-xs mt-3 font-medium tabular-nums">
        {Math.round(progress)}%
      </p>
    </motion.div>
  );
}