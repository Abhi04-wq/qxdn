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
      <div className="flex items-center gap-2.5 rounded-xl border border-[#1E493B] bg-[#10352C] px-4 py-2.5 text-sm font-medium text-[#ECFDF5] shadow-[0_10px_35px_rgba(7,28,24,0.6)] backdrop-blur-xl">
        <CheckCircle2 className="h-4 w-4 text-[#34D399] shrink-0" />
        <span>{message}</span>
        <button onClick={() => onClose?.()} className="ml-2 text-[#91A89E] transition hover:text-[#ECFDF5]" aria-label="Dismiss">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
