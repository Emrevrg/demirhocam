
import React, { useState } from 'react';
import { DESK_LAYOUT, DESK_COLORS } from '../constants';
import { Student } from '../types';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { LayoutTemplate, Grid3X3, User } from 'lucide-react';
import { updateStudentService } from '../services/dataService';

interface DeskMapProps {
  students: Student[];
  refreshData: () => void;
}

export const DeskMap: React.FC<DeskMapProps> = ({ students, refreshData }) => {
  const [selectedDesk, setSelectedDesk] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'custom' | 'grid'>('custom');

  // Helper to find student at a desk
  const getStudentAtDesk = (deskNum: number) => students.find(s => s.deskNumber === deskNum);

  // Helper to get color class
  const getDeskColor = (deskNum: number) => {
    const student = getStudentAtDesk(deskNum);
    if (!student) return DESK_COLORS.EMPTY;
    return DESK_COLORS[student.subscriptionType] || 'bg-gray-400';
  };

  // Unassigned students for modal
  const unassignedStudents = students.filter(s => s.deskNumber === null);
  const studentAtSelectedDesk = selectedDesk ? getStudentAtDesk(selectedDesk) : null;

  const handleDeskClick = (deskNum: number) => {
    setSelectedDesk(deskNum);
  };

  const handleAssignment = (studentId: string) => {
    if (selectedDesk) {
        // 1. Find student
        const student = students.find(s => s.id === studentId);
        if (student) {
            // 2. Update via service
            const updatedStudent = { ...student, deskNumber: selectedDesk };
            updateStudentService(updatedStudent);
            // 3. Force App Refresh
            refreshData();
            setSelectedDesk(null);
        }
    }
  };

  const handleRemove = () => {
    if (selectedDesk && studentAtSelectedDesk) {
        const updatedStudent = { ...studentAtSelectedDesk, deskNumber: null };
        updateStudentService(updatedStudent);
        refreshData();
        setSelectedDesk(null);
    }
  };

  const renderDesk = (num: number) => {
    const student = getStudentAtDesk(num);
    const isSelected = selectedDesk === num;
    
    return (
      <div
        key={num}
        onClick={() => handleDeskClick(num)}
        className={`
          w-12 h-12 sm:w-16 sm:h-16 rounded-xl shadow-md flex items-center justify-center relative
          cursor-pointer text-white font-bold text-sm sm:text-base 
          transition-all duration-500 ease-out transform
          ${getDeskColor(num)}
          ${isSelected 
              ? 'ring-4 ring-offset-2 ring-brand-400 scale-110 z-10' 
              : 'hover:scale-105 hover:shadow-lg'}
        `}
      >
        <span className="relative z-10 drop-shadow-md">{num}</span>
        
        {/* Animated Student Indicator Icon */}
        <div className={`
            absolute -top-2 -right-2 bg-white rounded-full p-0.5 shadow-sm text-brand-600
            transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)
            ${student ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-0 translate-y-2'}
        `}>
           <User size={14} fill="currentColor" />
        </div>

        {/* Shine effect for active desks */}
        {student && (
            <div className="absolute inset-0 rounded-xl bg-white opacity-10 animate-pulse pointer-events-none"></div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-800">Masa Düzeni</h2>
            
            {/* View Toggle */}
            <div className="bg-gray-200 p-1 rounded-lg flex text-sm">
                <button 
                    onClick={() => setViewMode('custom')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all duration-300 ${viewMode === 'custom' ? 'bg-white shadow text-brand-900 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <LayoutTemplate size={16} />
                    <span className="hidden sm:inline">Özel Plan</span>
                </button>
                <button 
                    onClick={() => setViewMode('grid')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all duration-300 ${viewMode === 'grid' ? 'bg-white shadow text-brand-900 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Grid3X3 size={16} />
                    <span className="hidden sm:inline">Sıralı (1-35)</span>
                </button>
            </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded transition-colors duration-300"></div> Boş</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded transition-colors duration-300"></div> Aylık</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-purple-400 rounded transition-colors duration-300"></div> Yıllık</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-400 rounded transition-colors duration-300"></div> Deneme</div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        {viewMode === 'custom' ? (
            /* Custom Layout View */
            <div className="min-w-[600px] flex justify-around gap-8 p-4 bg-gray-100 rounded-xl border border-gray-200 shadow-inner">
            
            {/* Left Column: 1-12 */}
            <div className="flex flex-col gap-3">
                <h3 className="text-center text-gray-500 text-sm font-semibold mb-2">Sol</h3>
                <div className="grid grid-cols-2 gap-3">
                {DESK_LAYOUT.leftColumn.map(renderDesk)}
                </div>
            </div>

            {/* Mid Left: 13-20 + 35 */}
            <div className="flex flex-col gap-3">
                <h3 className="text-center text-gray-500 text-sm font-semibold mb-2">Orta Sol</h3>
                <div className="grid grid-cols-2 gap-3">
                {DESK_LAYOUT.midLeftColumn.map(renderDesk)}
                </div>
            </div>

            {/* Mid Right: 21-25 + 31-34 */}
            <div className="flex flex-col gap-3">
                <h3 className="text-center text-gray-500 text-sm font-semibold mb-2">Orta Sağ</h3>
                <div className="grid grid-cols-2 gap-3">
                {DESK_LAYOUT.midRightColumn.map(renderDesk)}
                </div>
            </div>

            {/* Right Column: 26-30 */}
            <div className="flex flex-col gap-3">
                <h3 className="text-center text-gray-500 text-sm font-semibold mb-2">Sağ</h3>
                <div className="grid grid-cols-1 gap-3 justify-items-center">
                {DESK_LAYOUT.rightColumn.map(renderDesk)}
                </div>
            </div>
            </div>
        ) : (
            /* Grid Layout View (1-35) */
            <div className="p-6 bg-gray-100 rounded-xl border border-gray-200 shadow-inner">
                <h3 className="text-center text-gray-500 text-sm font-semibold mb-4">Sıralı Görünüm</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-4 justify-items-center">
                    {Array.from({ length: 35 }, (_, i) => i + 1).map(renderDesk)}
                </div>
            </div>
        )}
      </div>

      {/* Assignment Modal */}
      <Modal
        isOpen={selectedDesk !== null}
        onClose={() => setSelectedDesk(null)}
        title={`Masa ${selectedDesk} İşlemleri`}
      >
        <div className="space-y-4">
          {studentAtSelectedDesk ? (
            <div className="bg-brand-50 p-4 rounded-lg transform transition-all duration-300 scale-100 opacity-100">
              <p className="text-sm text-gray-600">Bu masada oturan:</p>
              <div className="flex items-center gap-3 mt-2">
                 <div className="w-10 h-10 rounded-full bg-brand-200 flex items-center justify-center text-brand-700">
                    <User size={20} />
                 </div>
                 <div>
                    <p className="text-lg font-bold text-brand-900 leading-tight">{studentAtSelectedDesk.fullName}</p>
                    <p className="text-sm text-gray-500">{studentAtSelectedDesk.subscriptionType} Üyelik</p>
                 </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button variant="danger" size="sm" onClick={handleRemove}>Masayı Boşalt</Button>
              </div>
            </div>
          ) : (
            <div>
              <p className="mb-2 text-gray-700 font-medium">Öğrenci Yerleştir:</p>
              {unassignedStudents.length === 0 ? (
                <p className="text-gray-500 italic text-sm">Masası olmayan aktif öğrenci bulunamadı.</p>
              ) : (
                <div className="max-h-60 overflow-y-auto border rounded-md divide-y scroll-smooth">
                  {unassignedStudents.map(s => (
                    <button
                      key={s.id}
                      onClick={() => handleAssignment(s.id)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex justify-between items-center transition-colors duration-150 group"
                    >
                      <span className="group-hover:text-brand-700 transition-colors">{s.fullName}</span>
                      <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 group-hover:bg-brand-100 group-hover:text-brand-800 transition-all">{s.subscriptionType}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
