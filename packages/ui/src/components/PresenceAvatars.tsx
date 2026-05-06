import { cn } from '../cn.js';

export interface Presence {
  userId: string;
  displayName: string;
  color: string;
  avatarUrl?: string;
}

export function PresenceAvatars({
  users,
  max = 5,
  className,
}: {
  users: Presence[];
  max?: number;
  className?: string;
}) {
  const visible = users.slice(0, max);
  const overflow = users.length - visible.length;

  return (
    <div className={cn('flex items-center -space-x-2', className)}>
      {visible.map((u) => (
        <div
          key={u.userId}
          title={u.displayName}
          className="relative inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-bg-canvas text-xs font-semibold"
          style={{ background: u.color, color: '#0E0F12' }}
        >
          {u.avatarUrl ? (
            <img
              src={u.avatarUrl}
              alt=""
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            u.displayName.charAt(0).toUpperCase()
          )}
        </div>
      ))}
      {overflow > 0 && (
        <div className="relative inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-bg-canvas bg-bg-elevated text-xs text-text-muted">
          +{overflow}
        </div>
      )}
    </div>
  );
}
