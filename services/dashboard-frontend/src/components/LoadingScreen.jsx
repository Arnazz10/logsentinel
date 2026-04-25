import React from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

const LoadingScreen = () => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a0a0a]"
    >
      <div className="relative">
        {/* Animated Rings */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="w-32 h-32 rounded-full border-t-2 border-r-2 border-accent-red opacity-50"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute inset-2 rounded-full border-b-2 border-l-2 border-accent-orange opacity-40"
        />
        
        {/* Center Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Shield className="w-10 h-10 text-white" />
          </motion.div>
        </div>
      </div>

      {/* Text Branding */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="mt-8 flex flex-col items-center"
      >
        <h1 className="text-2xl font-bold tracking-tighter text-white">
          LOG<span className="text-accent-red">SENTINEL</span>
        </h1>
        <p className="mt-2 text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground opacity-50">
          Initializing Neural Infrastructure
        </p>
      </motion.div>

      {/* Progress Line */}
      <div className="mt-12 w-48 h-[1px] bg-white/5 relative overflow-hidden">
        <motion.div
          initial={{ left: "-100%" }}
          animate={{ left: "100%" }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 w-24 bg-gradient-to-r from-transparent via-accent-red to-transparent"
        />
      </div>
    </motion.div>
  );
};

export default LoadingScreen;
