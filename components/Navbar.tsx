
import React, { useState, useEffect, useRef } from 'react';
import { Menu, LogOut, Bell, Check, AlertTriangle, Info, XCircle } from 'lucide-react';
import { AppNotification } from '../types';
import { getNotifications, markAllNotificationsRead } from '../services/dataService';

interface NavbarProps {
  toggleSidebar: () => void;
  onLogout: () => void;
  refreshTrigger?: number; // Prop to trigger re-render of notifications
}

export const Navbar: React.FC<NavbarProps> = ({ toggleSidebar, onLogout, refreshTrigger }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    setNotifications(getNotifications());
  }, [showNotifications, refreshTrigger]);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpenNotifications = () => {
      setShowNotifications(!showNotifications);
      if (!showNotifications) {
          // Sync logic if needed
      }
  };

  const handleMarkAllRead = () => {
      const updated = markAllNotificationsRead();
      setNotifications(updated);
  };

  const getIcon = (type: string) => {
      switch(type) {
          case 'success': return <Check size={16} className="text-green-500" />;
          case 'warning': return <AlertTriangle size={16} className="text-yellow-500" />;
          case 'error': return <XCircle size={16} className="text-red-500" />;
          default: return <Info size={16} className="text-blue-500" />;
      }
  };

  return (
    <nav className="bg-white border-b border-gray-200 fixed w-full z-30 top-0 left-0 h-16 shadow-sm">
      <div className="flex items-center justify-between px-4 h-full">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100 lg:hidden focus:outline-none"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📚</span>
            <h1 className="text-xl font-bold text-brand-900 hidden sm:block">
              Demir Hocam Çalışma Salonu
            </h1>
            <h1 className="text-xl font-bold text-brand-900 sm:hidden">Demir Hocam</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
                <button 
                    onClick={handleOpenNotifications}
                    className="p-2 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-colors relative"
                >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                            {unreadCount}
                        </span>
                    )}
                </button>

                {/* Dropdown */}
                {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-50">
                        <div className="p-3 bg-gray-50 border-b flex justify-between items-center">
                            <h3 className="text-sm font-semibold text-gray-700">Bildirimler</h3>
                            {unreadCount > 0 && (
                                <button onClick={handleMarkAllRead} className="text-xs text-brand-600 hover:underline">
                                    Tümünü Okundu İşaretle
                                </button>
                            )}
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-4 text-center text-gray-500 text-sm">
                                    Bildirim yok.
                                </div>
                            ) : (
                                <ul>
                                    {notifications.map(n => (
                                        <li key={n.id} className={`p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-blue-50/50' : ''}`}>
                                            <div className="flex gap-3">
                                                <div className="mt-1 flex-shrink-0">
                                                    {getIcon(n.type)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-800">{n.title}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                                                    <p className="text-[10px] text-gray-400 mt-1">{new Date(n.date).toLocaleString('tr-TR')}</p>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="h-6 w-px bg-gray-300 mx-1"></div>

            <button
            onClick={onLogout}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors flex items-center gap-2"
            title="Güvenli Çıkış"
            >
            <LogOut size={20} />
            <span className="hidden md:inline text-sm font-medium">Çıkış</span>
            </button>
        </div>
      </div>
    </nav>
  );
};
