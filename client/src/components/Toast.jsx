import { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';

const Toast = ({ message, duration = 2500, onClose }) => {
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => onClose?.(), duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300 shadow-lg backdrop-blur">
        <CheckCircle2 className="h-4 w-4" />
        {message}
        <button onClick={() => onClose?.()} className="ml-2 text-emerald-300/60 hover:text-emerald-200" aria-label="Dismiss">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
