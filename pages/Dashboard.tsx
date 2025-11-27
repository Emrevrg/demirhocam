import React, { useMemo } from 'react';
import { Student, SubscriptionType, PaymentStatus } from '../types';
import { ALL_DESK_NUMBERS } from '../constants';
import { Users, Armchair, CreditCard, Cake, RefreshCw, Database, MessageSquare } from 'lucide-react';

interface DashboardProps {
  students: Student[];
  transactions: any[]; // Simplified for dashboard usage
  onCheckOverdue: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ students, onCheckOverdue }) => {
  const stats = useMemo(() => {
    const today = new Date();
    const totalStudents = students.length;
    const occupiedDesks = students.filter(s => s.deskNumber !== null).length;
    const emptyDesks = ALL_DESK_NUMBERS.length - occupiedDesks;
    
    const monthlySubs = students.filter(s => s.subscriptionType === SubscriptionType.MONTHLY).length;
    const yearlySubs = students.filter(s => s.subscriptionType === SubscriptionType.YEARLY).length;
    
    const birthdays = students.filter(s => {
      const dob = new Date(s.dob);
      return dob.getDate() === today.getDate() && dob.getMonth() === today.getMonth();
    });

    const overduePayments = students.filter(s => s.paymentStatus === PaymentStatus.OVERDUE).length;

    return {
      totalStudents,
      emptyDesks,
      monthlySubs,
      yearlySubs,
      birthdays,
      overduePayments
    };
  }, [students]);

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Genel Bakış</h2>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-full text-blue-600">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Toplam Öğrenci</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalStudents}</p>
            <p className="text-xs text-gray-400">{stats.monthlySubs} Aylık, {stats.yearlySubs} Yıllık</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-green-100 rounded-full text-green-600">
            <Armchair size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Boş Masa</p>
            <p className="text-2xl font-bold text-gray-800">{stats.emptyDesks}</p>
            <p className="text-xs text-gray-400">Toplam {ALL_DESK_NUMBERS.length} Kapasite</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-red-100 rounded-full text-red-600">
            <CreditCard size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Gecikmiş Ödeme</p>
            <p className="text-2xl font-bold text-gray-800">{stats.overduePayments}</p>
            <p className="text-xs text-gray-400">Acil aksiyon gerekli</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-purple-100 rounded-full text-purple-600">
            <Cake size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Doğum Günü</p>
            <p className="text-2xl font-bold text-gray-800">{stats.birthdays.length}</p>
            <p className="text-xs text-gray-400">Bugün kutlanacaklar</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Birthdays List */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Cake className="text-purple-500" size={20} />
            Bugün Doğanlar
          </h3>
          {stats.birthdays.length > 0 ? (
            <ul className="space-y-3">
              {stats.birthdays.map(s => (
                <li key={s.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <span className="font-medium text-purple-900">{s.fullName}</span>
                  <button className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded hover:bg-purple-300">
                    SMS Gönder
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">Bugün doğum günü olan öğrenci yok.</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Hızlı İşlemler</h3>
          <div className="grid grid-cols-2 gap-4">
             <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center flex flex-col items-center justify-center gap-2 transition-colors">
                <MessageSquare size={24} className="text-blue-500" />
                <span className="block font-medium">Toplu SMS</span>
                <span className="text-xs text-gray-400">Ödeme hatırlatması</span>
             </button>
             <button 
                onClick={onCheckOverdue}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center flex flex-col items-center justify-center gap-2 transition-colors"
             >
                <RefreshCw size={24} className="text-orange-500" />
                <span className="block font-medium">Ödeme Kontrolü</span>
                <span className="text-xs text-gray-400">Gecikmişleri güncelle</span>
             </button>
             <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center flex flex-col items-center justify-center gap-2 transition-colors col-span-2 sm:col-span-1">
                <Database size={24} className="text-green-600" />
                <span className="block font-medium">Yedekle</span>
                <span className="text-xs text-gray-400">Verileri koru</span>
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};