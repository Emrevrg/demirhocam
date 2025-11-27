
import React, { useMemo } from 'react';
import { Transaction } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

interface FinanceProps {
  transactions: Transaction[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const Finance: React.FC<FinanceProps> = ({ transactions }) => {
  
  const summary = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const monthlyData = useMemo(() => {
    const data: Record<string, { name: string; gelir: number; gider: number }> = {};
    
    // Sort transactions by date first
    const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sorted.forEach(t => {
      const date = new Date(t.date);
      const key = `${date.getMonth() + 1}/${date.getFullYear()}`;
      if (!data[key]) data[key] = { name: key, gelir: 0, gider: 0 };
      
      if (t.type === 'income') data[key].gelir += t.amount;
      else data[key].gider += t.amount;
    });

    return Object.values(data);
  }, [transactions]);

  const categoryData = useMemo(() => {
    const data: Record<string, number> = {};
    transactions.filter(t => t.type === 'income').forEach(t => {
      data[t.category] = (data[t.category] || 0) + t.amount;
    });
    return Object.keys(data).map(key => ({ name: key, value: data[key] }));
  }, [transactions]);

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
         <h2 className="text-2xl font-bold text-gray-800">Finansal Durum</h2>
         <span className="text-sm text-gray-500">Son güncelleme: {new Date().toLocaleTimeString()}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 text-green-600 rounded-full"><TrendingUp size={20}/></div>
            <span className="text-gray-500 font-medium">Toplam Gelir</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{summary.income.toLocaleString('tr-TR')} ₺</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 text-red-600 rounded-full"><TrendingDown size={20}/></div>
            <span className="text-gray-500 font-medium">Toplam Gider</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{summary.expense.toLocaleString('tr-TR')} ₺</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-full"><Wallet size={20}/></div>
            <span className="text-gray-500 font-medium">Net Kasa</span>
          </div>
          <p className={`text-3xl font-bold ${summary.balance >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
            {summary.balance.toLocaleString('tr-TR')} ₺
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80">
          <h3 className="text-lg font-semibold mb-4">Aylık Gelir/Gider</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `${value} ₺`} />
                <Bar dataKey="gelir" fill="#10b981" name="Gelir" />
                <Bar dataKey="gider" fill="#ef4444" name="Gider" />
                </BarChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-full flex items-center justify-center text-gray-400">Veri yok</div>
          )}
        </div>

        {/* Income Categories Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80">
          <h3 className="text-lg font-semibold mb-4">Gelir Dağılımı</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                >
                    {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip formatter={(value) => `${value} ₺`} />
                </PieChart>
            </ResponsiveContainer>
           ) : (
            <div className="h-full flex items-center justify-center text-gray-400">Veri yok</div>
         )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Son Hareketler</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-6 py-3">Tarih</th>
                <th className="px-6 py-3">Kategori</th>
                <th className="px-6 py-3">Açıklama</th>
                <th className="px-6 py-3 text-right">Tutar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.length === 0 ? (
                  <tr>
                      <td colSpan={4} className="p-6 text-center text-gray-400">Henüz finansal işlem bulunmuyor.</td>
                  </tr>
              ) : (
                transactions.slice().reverse().slice(0, 10).map(t => (
                    <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3">{new Date(t.date).toLocaleDateString('tr-TR')}</td>
                    <td className="px-6 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${t.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {t.category}
                        </span>
                    </td>
                    <td className="px-6 py-3">{t.description}</td>
                    <td className={`px-6 py-3 text-right font-medium ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.type === 'income' ? '+' : '-'}{t.amount} ₺
                    </td>
                    </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
