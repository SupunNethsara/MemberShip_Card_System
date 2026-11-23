import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCheck,
  CheckCircle2,
  Info,
  Trash2,
  X,
} from 'lucide-react';
import {
  useDeleteNotificationMutation,
  useMarkAllNotificationsAsReadMutation,
  useMarkNotificationAsReadMutation,
  useNotificationsQuery,
} from '../../app/api';
import { getEcho } from '../../lib/echo';

function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (diffInSeconds < 45) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getNotificationIcon(type) {
  switch (type) {
    case 'success':
      return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
    case 'error':
      return <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />;
    case 'info':
    default:
      return <Info className="h-4 w-4 text-sky-500 shrink-0" />;
  }
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [toastNotification, setToastNotification] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const user = useSelector((s) => s.auth.user);
  const token = useSelector((s) => s.auth.token);

  // Poll every 30s as a resilient fallback if WebSockets is momentarily offline
  const { data, refetch } = useNotificationsQuery(undefined, {
    pollingInterval: 30000,
    skip: !token,
  });

  const [markAsRead] = useMarkNotificationAsReadMutation();
  const [markAllAsRead, { isLoading: isMarkingAll }] = useMarkAllNotificationsAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  const notifications = data?.notifications || [];
  const unreadCount = data?.unread_count || 0;

  // Listen to Reverb WebSockets
  useEffect(() => {
    if (!user?.id || !token) return;

    const echo = getEcho(token);
    if (!echo) return;

    const userChannel = echo.private(`App.Models.User.${user.id}`);

    const handleNewNotification = (notification) => {
      refetch();
      // Show brief pop-up banner
      setToastNotification({
        title: notification.title || 'New Notification',
        message: notification.message || '',
        type: notification.type || 'info',
        link: notification.link || null,
      });

      // Auto-hide popup after 5 seconds
      setTimeout(() => {
        setToastNotification(null);
      }, 5000);
    };

    userChannel.notification(handleNewNotification);
    userChannel.listen('.portal.notification', handleNewNotification);

    return () => {
      try {
        userChannel.stopListening('.portal.notification');
        echo.leave(`App.Models.User.${user.id}`);
      } catch {
        // cleanup safe
      }
    };
  }, [user?.id, token, refetch]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = async (item) => {
    if (!item.read_at) {
      try {
        await markAsRead(item.id).unwrap();
      } catch {
        // silent
      }
    }
    setIsOpen(false);
    if (item.link) {
      navigate(item.link);
    }
  };

  const handleMarkAll = async (e) => {
    e.stopPropagation();
    try {
      await markAllAsRead().unwrap();
    } catch {
      // silent
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteNotification(id).unwrap();
    } catch {
      // silent
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Real-time Toast Banner (when closed) */}
      {toastNotification && !isOpen && (
        <div
          onClick={() => {
            if (toastNotification.link) navigate(toastNotification.link);
            setToastNotification(null);
          }}
          className="fixed top-4 right-4 z-50 flex max-w-sm cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-3.5 shadow-[0_8px_24px_-12px_rgb(15_23_42/0.25)] animate-fade-in"
        >
          {getNotificationIcon(toastNotification.type)}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-800">{toastNotification.title}</p>
            <p className="mt-0.5 line-clamp-2 text-2xs text-slate-600">{toastNotification.message}</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setToastNotification(null);
            }}
            className="text-slate-400 hover:text-slate-600 p-0.5"
            aria-label="Dismiss toast"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setToastNotification(null);
        }}
        className={`relative rounded-lg p-2 transition-colors ${
          isOpen
            ? 'bg-navy-800/10 text-navy-900'
            : 'text-slate-600 hover:bg-slate-100 hover:text-navy-900'
        }`}
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-lg border border-slate-200 bg-white shadow-[0_12px_32px_-12px_rgb(15_23_42/0.25)] z-50 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-navy-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-navy-900/10 px-2 py-0.5 text-2xs font-semibold text-navy-800">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAll}
                disabled={isMarkingAll}
                className="flex items-center gap-1 text-2xs font-medium text-gold-600 hover:text-gold-700 transition-colors disabled:opacity-50"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List of Notifications */}
          <div className="max-h-[380px] divide-y divide-slate-100 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-2">
                  <Bell className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-slate-700">No notifications yet</p>
                <p className="text-2xs text-slate-400 mt-0.5">Updates about your card and payments will show up here.</p>
              </div>
            ) : (
              notifications.map((n) => {
                const isUnread = !n.read_at;
                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`group relative flex cursor-pointer items-start gap-3 p-3.5 transition-colors hover:bg-slate-50 ${
                      isUnread ? 'bg-amber-50/20 font-medium' : ''
                    }`}
                  >
                    <div className="mt-0.5">{getNotificationIcon(n.type)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className={`text-xs ${isUnread ? 'font-semibold text-navy-900' : 'text-slate-800'}`}>
                          {n.title}
                        </p>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                          {formatRelativeTime(n.created_at)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-2xs text-slate-600 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                    </div>

                    {/* Unread indicator & Delete action */}
                    <div className="flex flex-col items-center gap-1 pt-0.5">
                      {isUnread && (
                        <span className="h-2 w-2 rounded-full bg-gold-500" title="Unread" />
                      )}
                      <button
                        onClick={(e) => handleDelete(e, n.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-opacity p-0.5 rounded"
                        title="Delete notification"
                        aria-label="Delete notification"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
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
