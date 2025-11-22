import { useEffect, useState } from 'react';
import { Check, Cloud } from 'lucide-react';

interface AutoSaveIndicatorProps {
  lastSaved: Date | null;
}

export function AutoSaveIndicator({ lastSaved }: AutoSaveIndicatorProps) {
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (lastSaved) {
      setShowSaved(true);
      const timer = setTimeout(() => setShowSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [lastSaved]);

  if (!lastSaved) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg transition-all duration-300 ${
          showSaved
            ? 'bg-green-600 text-white translate-y-0 opacity-100'
            : 'bg-gray-600 text-white translate-y-2 opacity-0'
        }`}
      >
        {showSaved ? (
          <>
            <Check className="w-4 h-4" />
            <span className="text-sm">Сохранено</span>
          </>
        ) : (
          <>
            <Cloud className="w-4 h-4" />
            <span className="text-sm">Автосохранение</span>
          </>
        )}
      </div>
    </div>
  );
}
