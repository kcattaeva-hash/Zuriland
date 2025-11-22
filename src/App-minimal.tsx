import { useState } from 'react';
import { Button } from './components/ui/button';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-amber-50 to-green-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl mb-4">Тест минимального приложения</h1>
        <p className="mb-4">Счётчик: {count}</p>
        <Button onClick={() => setCount(c => c + 1)}>
          Увеличить счётчик
        </Button>
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <p className="text-sm">
            ✅ Если вы видите эту страницу без ошибок в консоли, значит базовая система работает.
          </p>
          <p className="text-sm mt-2">
            ❌ Если ошибки devtools_worker всё ещё есть, проблема в Figma Make, а не в вашем коде.
          </p>
        </div>
      </div>
    </div>
  );
}
