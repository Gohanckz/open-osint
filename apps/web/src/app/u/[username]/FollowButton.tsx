'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { useT } from '@/i18n/client';

export function FollowButton({
  username,
  initialFollowing,
}: {
  username: string;
  initialFollowing: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);
  const [hover, setHover] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/follows', {
        method: following ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      if (!r.ok) {
        const data = (await r.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `Error ${r.status}`);
      }
      setFollowing(!following);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      {following ? (
        <button
          onClick={toggle}
          disabled={loading}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          className={`inline-flex min-w-[120px] items-center justify-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-all ${
            hover
              ? 'border border-danger/40 bg-danger/10 text-danger'
              : 'border border-border-subtle bg-bg-surface text-text-primary'
          }`}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
          {hover ? t.profile.unfollow : t.profile.following}
        </button>
      ) : (
        <button
          onClick={toggle}
          disabled={loading}
          className="inline-flex min-w-[120px] items-center justify-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
          {t.profile.follow}
        </button>
      )}
      {error && (
        <span className="text-[10px] text-danger">{error}</span>
      )}
    </div>
  );
}
