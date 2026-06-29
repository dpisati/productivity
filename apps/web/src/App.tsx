import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

type HealthState = 'loading' | 'ok' | 'error';

/**
 * M1 placeholder shell. Confirms the frontend boots, Tailwind tokens render,
 * and the Vite proxy reaches the API health endpoint. Replaced by the real
 * router + layout in M6.
 */
export default function App() {
  const [health, setHealth] = useState<HealthState>('loading');

  useEffect(() => {
    fetch('/api/health')
      .then((r) => (r.ok ? setHealth('ok') : setHealth('error')))
      .catch(() => setHealth('error'));
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Productivity Platform</h1>
        <p className="text-muted-foreground">Personal finance, tasks &amp; reminders</p>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground px-6 py-4 flex items-center gap-3">
        {health === 'loading' && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
        {health === 'ok' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
        {health === 'error' && <XCircle className="h-5 w-5 text-destructive" />}
        <span className="text-sm">
          API status:{' '}
          <span className="font-medium">
            {health === 'loading' ? 'checking…' : health === 'ok' ? 'connected' : 'unreachable'}
          </span>
        </span>
      </div>

      <p className="text-xs text-muted-foreground">Milestone 1 — monorepo skeleton</p>
    </main>
  );
}
