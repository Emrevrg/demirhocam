
import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { DeskMap } from './pages/DeskMap';
import { StudentList } from './pages/StudentList';
import { Finance } from './pages/Finance';
import { Messages } from './pages/Messages';
import { Settings } from './pages/Settings';
import { getStudents, getTransactions, addNotification, saveStudents } from './services/dataService';
import { Student, Transaction, PaymentStatus } from './types';

function App() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginPin, setLoginPin] = useState('');
  
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Central Data Loader
  // This ensures that whenever refreshTrigger changes, we fetch the LATEST data from Storage.
  useEffect(() => {
    setStudents(getStudents());
    setTransactions(getTransactions());
  }, [refreshTrigger]);

  // IMPORTANT: We REMOVED the useEffect that autosaves students. 
  // Saving is now handled explicitly by the pages via dataService to prevent race conditions.

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  const refreshData = () => {
    // Force re-fetch from LocalStorage
    setRefreshTrigger(prev => prev + 1);
  };

  // Handle overdue logic in App level for dashboard alerts
  const checkOverduePayments = () => {
    const currentStudents = getStudents(); // Read from DB, not just state
    const today = new Date();
    let updatedCount = 0;
    let hasChanges = false;

    const updatedStudents = currentStudents.map(student => {
      if (student.nextPaymentDate) {
          const nextDate = new Date(student.nextPaymentDate);
          if (today > nextDate && student.paymentStatus !== PaymentStatus.OVERDUE) {
              updatedCount++;
              hasChanges = true;
              return { ...student, paymentStatus: PaymentStatus.OVERDUE };
          }
      }
      return student;
    });

    if (hasChanges) {
      saveStudents(updatedStudents); // Save to DB
      refreshData(); // Update UI
      addNotification('Otomatik Kontrol', `${updatedCount} öğrenci gecikmiş ödeme durumuna alındı.`, 'warning');
    } else {
      addNotification('Kontrol Tamamlandı', 'Tüm ödemeler güncel görünüyor.', 'info');
    }
  };

  // Simple Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-brand-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-brand-900 mb-2">Demir Hocam</h1>
          <p className="text-gray-500 mb-6">Çalışma Salonu Yönetim Sistemi</p>
          <input
            type="password"
            placeholder="Admin PIN (1234)"
            className="w-full p-3 border rounded-lg mb-4 text-center text-lg tracking-widest"
            value={loginPin}
            onChange={(e) => setLoginPin(e.target.value)}
          />
          <button
            onClick={() => {
              if (loginPin === '1234') setIsAuthenticated(true);
              else alert('Hatalı PIN');
            }}
            className="w-full bg-brand-600 text-white py-3 rounded-lg font-bold hover:bg-brand-700"
          >
            Giriş Yap
          </button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard 
          students={students} 
          transactions={transactions} 
          onCheckOverdue={checkOverduePayments}
        />;
      case 'desks':
        return <DeskMap 
            students={students} 
            refreshData={refreshData} 
        />;
      case 'students':
        return <StudentList 
            students={students} 
            refreshData={refreshData}
        />;
      case 'finance':
        return <Finance transactions={transactions} />;
      case 'messages':
        return <Messages />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard 
          students={students} 
          transactions={transactions} 
          onCheckOverdue={checkOverduePayments}
        />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <Navbar 
        toggleSidebar={toggleSidebar} 
        onLogout={() => setIsAuthenticated(false)} 
        refreshTrigger={refreshTrigger} // Pass trigger so Navbar updates notification count
      />
      
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isSidebarOpen} 
        setIsOpen={setSidebarOpen}
      />

      <main className="pt-16 lg:pl-64 transition-all duration-300">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
