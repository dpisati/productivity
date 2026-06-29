import { NavLink } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnreadCount } from '@/features/notifications/hooks';
import { navItems } from './nav';

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { data: unread } = useUnreadCount();
  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex h-14 items-center gap-2 border-b px-6 font-semibold">
        <Wallet className="h-5 w-5 text-primary" />
        Productivity
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )
            }
          >
            <item.icon className="h-4 w-4" />
            <span className="flex-1">{item.label}</span>
            {item.to === '/notifications' && !!unread?.count && (
              <span className="rounded-full bg-destructive px-1.5 text-xs font-semibold text-destructive-foreground">
                {unread.count}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
