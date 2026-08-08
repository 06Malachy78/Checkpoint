'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    let active = true;

    const fetchNotifications = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch('/api/notifications?limit=50');
        const data = await response.json();

        if (!active) return;

        if (!response.ok) {
          setError(data?.error || 'Unable to load notifications.');
          setNotifications([]);
        } else {
          setNotifications(Array.isArray(data?.notifications) ? data.notifications : []);
        }
      } catch (err) {
        if (!active) return;
        setError('Unable to load notifications.');
        setNotifications([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchNotifications();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#09090b] text-white px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-[0.16em] text-white">Notifications</h1>
            <p className="text-sm text-zinc-400">Your recent activity and friend updates.</p>
          </div>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-zinc-300 hover:border-[#00FF88] hover:text-[#00FF88] transition-colors"
          >
            Back
          </button>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/90 shadow-[0_20px_60px_rgba(0,0,0,0.45)] overflow-hidden">
          <div className="border-b border-zinc-800 px-4 py-4 sm:px-6">
            <p className="text-[10px] uppercase tracking-[0.24em] text-zinc-500">Notifications</p>
            <p className="mt-1 text-xs text-zinc-400">{loading ? 'Loading...' : `${notifications.length} item${notifications.length === 1 ? '' : 's'}`}</p>
          </div>

          <div className="max-h-[70vh] overflow-y-auto">
            {loading && (
              <div className="px-4 py-6 text-sm text-zinc-400">Loading notifications...</div>
            )}

            {error && (
              <div className="px-4 py-6 text-sm uppercase tracking-[0.16em] text-red-400">{error}</div>
            )}

            {!loading && !error && notifications.length === 0 && (
              <div className="px-4 py-6 text-sm text-zinc-400">No recent friend activity.</div>
            )}

            {!loading && !error && notifications.length > 0 && (
              <div className="divide-y divide-zinc-800">
                {notifications.map((item) => {
                  const initials = (item.actorUsername || 'U').slice(0, 2).toUpperCase();
                  return (
                    <Link
                      key={item.id}
                      href={item.href || '/profile'}
                      className="flex items-start gap-3 px-4 py-4 hover:bg-zinc-900/80 transition-colors"
                    >
                      {item.actorAvatarUrl ? (
                        <img
                          src={item.actorAvatarUrl}
                          alt={`${item.actorUsername || 'User'} avatar`}
                          className="h-11 w-11 rounded-full border border-zinc-800 object-cover"
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-sm font-black uppercase text-zinc-300">
                          {initials}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-100 break-words">{item.title}</p>
                        <p className="mt-1 text-xs text-zinc-400 truncate">{item.subtitle}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-zinc-600">{new Date(item.createdAt).toLocaleString()}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
