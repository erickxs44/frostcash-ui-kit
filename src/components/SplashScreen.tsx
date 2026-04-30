import { motion, AnimatePresence } from "framer-motion";
import { IceCream } from "lucide-react";
import { useEffect, useState } from "react";

const PHRASES = [
  "Gelando o banco de dados...",
  "Preparando a calda de morango...",
  "Organizando as bolas de sorvete...",
  "Quase lá... o freezer está pronto!"
];

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const [phraseIdx, setPhraseIdx] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const duration = 2800;
    
    // Altera as frases suavemente
    const phraseId = setInterval(() => {
      setPhraseIdx(p => Math.min(p + 1, PHRASES.length - 1));
    }, 700);

    const id = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(id);
        clearInterval(phraseId);
        setTimeout(onDone, 500);
      }
    }, 16);
    
    return () => {
      clearInterval(id);
      clearInterval(phraseId);
    };
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ scale: 1.3, opacity: 0, filter: "blur(20px)" }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[#0A0A0F]"
    >
      {/* 1. Fundo: Mesh Gradient Animado */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ x: ['-20%', '20%', '-20%'], y: ['-20%', '20%', '-20%'] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-1/4 -left-1/4 w-[120%] h-[120%] bg-[#7C3AED] rounded-full mix-blend-screen filter blur-[120px] opacity-30" 
        />
        <motion.div 
          animate={{ x: ['20%', '-20%', '20%'], y: ['20%', '-20%', '20%'] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
          className="absolute top-1/4 -right-1/4 w-[100%] h-[100%] bg-[#00D4FF] rounded-full mix-blend-screen filter blur-[130px] opacity-20" 
        />
        <motion.div 
          animate={{ x: ['-10%', '10%', '-10%'], y: ['20%', '-20%', '20%'] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          className="absolute -bottom-1/4 left-1/4 w-[100%] h-[100%] bg-[#FF007A] rounded-full mix-blend-screen filter blur-[120px] opacity-20" 
        />
      </div>

      {/* Glassmorphism Backdrop Overlay */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[50px] z-0" />

      {/* Conteúdo Principal */}
      <div className="relative z-10 flex flex-col items-center">
        
        {/* 2. Loader: Efeito Liquid Fill */}
        <div className="relative mb-10">
          {/* Efeito de Ping (Pulsação) */}
          <div className="absolute inset-0 bg-[#7C3AED] rounded-[2.5rem] animate-ping opacity-30 scale-110" style={{ animationDuration: '2s' }} />
          
          <div className="relative h-32 w-32 rounded-[2.5rem] bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_0_50px_rgba(124,58,237,0.2)] flex items-center justify-center overflow-hidden">
            
            {/* Contorno Inicial */}
            <IceCream className="absolute h-16 w-16 text-white/20" strokeWidth={1.5} />
            
            {/* Preenchimento Líquido */}
            <div 
              className="absolute inset-0 flex items-center justify-center overflow-hidden transition-all duration-75"
              style={{ clipPath: `inset(${100 - progress}% 0 0 0)` }}
            >
              <IceCream 
                className="h-16 w-16 text-[#7C3AED] drop-shadow-[0_0_15px_rgba(124,58,237,0.8)]" 
                fill="currentColor" 
                strokeWidth={1.5} 
              />
            </div>
          </div>
        </div>

        {/* Branding */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl tracking-tight mb-3 text-white font-[800]"
          style={{ textShadow: '0 0 30px rgba(255,255,255,0.4)', fontFamily: 'Inter, sans-serif' }}
        >
          FrostCash
        </motion.h1>

        {/* 3. Tipografia e Micro-copy */}
        <div className="h-8 relative w-80 flex justify-center items-center overflow-hidden">
          <AnimatePresence mode="popLayout">
            <motion.p
              key={phraseIdx}
              initial={{ y: 20, opacity: 0, filter: "blur(5px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              exit={{ y: -20, opacity: 0, filter: "blur(5px)" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="text-[#E2E8F0] text-[15px] font-[600] text-center absolute"
              style={{ textShadow: '0 0 12px rgba(255,255,255,0.4)', fontFamily: 'Inter, sans-serif' }}
            >
              {PHRASES[phraseIdx]}
            </motion.p>
          </AnimatePresence>
        </div>

      </div>
    </motion.div>
  );
}