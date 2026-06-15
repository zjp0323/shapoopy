import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';

interface Toast {
  id: string;
  message: string;
}

interface ToastContextType {
  toast: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

let toastFunction: (message: string) => void;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    toastFunction = (message: string) => {
      const id = Math.random().toString(36).substr(2, 9);
      setToasts((prev) => [...prev, { id, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toast: (msg) => toastFunction(msg) }}>
      {children}
      <div className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center justify-start p-4 pointer-events-none gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="bg-slate-900 border border-white/20 shadow-2xl shadow-indigo-500/20 text-white rounded-lg px-4 py-3 min-w-[250px] text-center font-medium pointer-events-auto"
            >
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function ToastViewport() {
  return null;
}
