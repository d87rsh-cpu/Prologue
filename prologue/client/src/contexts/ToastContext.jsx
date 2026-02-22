import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';

const TOAST_DURATION = 4000;

const types = {
  success: { bg: 'bg-cyan-500/20', border: 'border-cyan-500/50', text: 'text-cyan-200', bar: 'bg-cyan-400' },
  warning: { bg: 'bg-amber-500/20', border: 'border-amber-500/50', text: 'text-amber-200', bar: 'bg-amber-400' },
  error: { bg: 'bg-red-500/20', border: 'border-red-500/50', text: 'text-red-200', bar: 'bg-red-400' },
  info: { bg: 'bg-sky-900/40', border: 'border-sky-600/50', text: 'text-sky-200', bar: 'bg-sky-400' },
};

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, progress: 100 }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message, type = 'info') => addToast(message, type),
    [addToast]
  );

  toast.success = (msg) => addToast(msg, 'success');
  toast.error = (msg) => addToast(msg, 'error');
  toast.warning = (msg) => addToast(msg, 'warning');
  toast.info = (msg) => addToast(msg, 'info');

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {createPortal(
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm pointer-events-none">
          {toasts.map((t) => (
            <ToastItem key={t.id} {...t} onClose={() => removeToast(t.id)} />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

function ToastItem({ id, message, type, onClose }) {
  const [progress, setProgress] = useState(100);
  const style = types[type] ?? types.info;

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.max(0, 100 - (elapsed / TOAST_DURATION) * 100);
      setProgress(p);
      if (p <= 0) {
        clearInterval(interval);
        onClose();
      }
    }, 50);
    return () => clearInterval(interval);
  }, [onClose]);

  return (
    <div
      className={`rounded-lg border px-4 py-3 shadow-lg ${style.bg} ${style.border} ${style.text} pointer-events-auto animate-[fadeIn_0.2s_ease-out]`}
    >
      <p className="text-sm font-medium">{message}</p>
      <div className="mt-2 h-1 rounded-full bg-white/20 overflow-hidden">
        <div
          className={`h-full rounded-full ${style.bar} transition-all duration-75`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) return { toast: (m) => console.log(m), success: (m) => console.log(m), error: (m) => console.error(m), warning: (m) => console.warn(m), info: (m) => console.log(m) };
  return ctx;
}
