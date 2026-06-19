'use client';

import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Bell, Gift, Trophy, Clock, Banknote } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationItem {
  id: string;
  type: 'CONTRIBUTION_RECEIVED' | 'CAMPAIGN_GOAL_REACHED' | 'CAMPAIGN_EXPIRED' | 'WITHDRAWAL_STATUS';
  title: string;
  message: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  CONTRIBUTION_RECEIVED: <Gift className="w-4 h-4 text-primary" />,
  CAMPAIGN_GOAL_REACHED: <Trophy className="w-4 h-4 text-success" />,
  CAMPAIGN_EXPIRED: <Clock className="w-4 h-4 text-muted" />,
  WITHDRAWAL_STATUS: <Banknote className="w-4 h-4 text-body" />,
};

function TimeAgo({ date }: { date: string }) {
  const now = useSyncExternalStore(
    (cb) => {
      const id = setInterval(cb, 60000);
      return () => clearInterval(id);
    },
    () => Date.now(),
  );
  const diff = now - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return <span className="font-body text-[11px] text-body/30 mt-1">Just now</span>;
  if (mins < 60) return <span className="font-body text-[11px] text-body/30 mt-1">{mins}m ago</span>;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return <span className="font-body text-[11px] text-body/30 mt-1">{hours}h ago</span>;
  const days = Math.floor(hours / 24);
  return <span className="font-body text-[11px] text-body/30 mt-1">{days}d ago</span>;
}

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=10');
      if (res.ok) {
        const json = await res.json();
        setNotifications(json.data.notifications);
        setTotalUnread(json.data.totalUnread);
      }
    } catch {
      // silent fail
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await fetchNotifications();
      setLoading(false);
    };
    init();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  async function markAllRead() {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setTotalUnread(0);
    } catch {
      // silent fail
    }
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-body/40 hover:text-body transition-colors p-1"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {totalUnread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-surface border border-gray-200 rounded-2xl shadow-lg z-50 max-h-[70vh] flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-soft shrink-0">
            <h3 className="font-display font-medium text-sm text-body">Notifications</h3>
            {totalUnread > 0 && (
              <button
                onClick={markAllRead}
                className="font-body text-xs text-primary hover:text-primary-hover font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="w-8 h-8 text-muted mx-auto mb-2" />
                <p className="font-body text-sm text-body/40">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const icon = typeIcons[notif.type];
                const content = (
                  <>
                    <div className="shrink-0 mt-0.5">{icon}</div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'font-body text-sm',
                          notif.isRead ? 'text-body/70' : 'text-body font-medium'
                        )}
                      >
                        {notif.title}
                      </p>
                      {notif.message && (
                        <p className="font-body text-xs text-body/50 mt-0.5 line-clamp-2">{notif.message}</p>
                      )}
                      <TimeAgo date={notif.createdAt} />
                    </div>
                    {!notif.isRead && (
                      <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                    )}
                  </>
                );

                if (notif.link) {
                  return (
                    <Link
                      key={notif.id}
                      href={notif.link}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        'flex items-start gap-3 px-4 py-3 transition-colors border-b border-border-soft last:border-b-0',
                        notif.isRead ? 'hover:bg-ghost/30' : 'bg-primary/[0.02] hover:bg-primary/[0.04]'
                      )}
                    >
                      {content}
                    </Link>
                  );
                }

                return (
                  <div
                    key={notif.id}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 transition-colors border-b border-border-soft last:border-b-0',
                      notif.isRead ? 'hover:bg-ghost/30' : 'bg-primary/[0.02] hover:bg-primary/[0.04]'
                    )}
                  >
                    {content}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
