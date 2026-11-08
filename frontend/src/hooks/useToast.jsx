import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const push = useCallback((type, message) => {
    const id = Math.random().toString(36).slice(2);
    setItems((l) => [...l, { id, type, message }]);
    setTimeout(() => setItems((l) => l.filter((t) => t.id !== id)), type === 'error' ? 6000 : 3500);
  }, []);

  const api = useMemo(() => ({ success: (m) => push('success', m), error: (m) => push('error', m) }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className="pointer-events-auto flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-lg">
            {t.type === 'success'
              ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
              : <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />}
            <p className="flex-1 text-sm text-slate-700">{t.message}</p>
            <button onClick={() => setItems((l) => l.filter((x) => x.id !== t.id))} aria-label="Dismiss" className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
