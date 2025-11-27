
import React from 'react';
import { LayoutDashboard, Users, Armchair, Wallet, Settings, Mail } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, setIsOpen }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Özet Panel', icon: LayoutDashboard },
    { id: 'desks', label: 'Masa Düzeni', icon: Armchair },
    { id: 'students', label: 'Öğrenciler', icon: Users },
    { id: 'finance', label: 'Gelir / Gider', icon: Wallet },
    { id: 'messages', label: 'Mesajlar', icon: Mail },
    { id: 'settings', label: 'Ayarlar', icon: Settings },
  ];

  const handleNav = (id: string) => {
    setActiveTab(id);
    // Close sidebar on mobile when clicked
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <aside className={`fixed top-16 left-0 z-20 w-64 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="h-full px-3 py-4 overflow-y-auto bg-gray-50">
          <ul className="space-y-2 font-medium">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleNav(item.id)}
                    className={`flex items-center w-full p-3 rounded-lg group transition-colors ${
                      isActive 
                        ? 'bg-brand-500 text-white' 
                        : 'text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-900'}`} />
                    <span className="ml-3">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          
          <div className="mt-auto absolute bottom-4 px-3 w-full left-0 text-xs text-gray-400 text-center">
            v1.1.0 - Connected Mode
          </div>
        </div>
      </aside>
    </>
  );
};
