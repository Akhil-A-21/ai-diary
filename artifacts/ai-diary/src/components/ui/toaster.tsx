import { useToast } from "../../hooks/use-toast";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="rounded-xl shadow-lg p-4 pr-10 relative border"
            style={{
              background: "hsl(var(--card))",
              borderColor: "hsl(var(--border))",
              color: "hsl(var(--card-foreground))",
            }}
          >
            {toast.title && <p className="font-semibold text-sm">{toast.title}</p>}
            {toast.description && <p className="text-sm mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{toast.description}</p>}
            <button
              onClick={() => dismiss(toast.id)}
              className="absolute top-3 right-3 opacity-50 hover:opacity-100 transition-opacity"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
