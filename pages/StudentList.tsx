
import React, { useState } from 'react';
import { Student, SubscriptionType, PaymentStatus } from '../types';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { 
    getSettings, 
    addTransaction, 
    processOutboundMessage, 
    addNotification,
    addStudentService,
    updateStudentService,
    deleteStudentService
} from '../services/dataService';
import { Edit2, Trash2, UserPlus, MessageSquare, Mail, Smartphone, Wallet, AlertCircle } from 'lucide-react';

interface StudentListProps {
  students: Student[];
  refreshData: () => void; 
}

const INITIAL_FORM: Partial<Student> = {
  fullName: '',
  parentName: '',
  studentPhone: '',
  parentPhone: '',
  subscriptionType: SubscriptionType.MONTHLY,
  paymentStatus: PaymentStatus.PENDING,
  deskNumber: null,
  notes: '',
  email: '',
};

export const StudentList: React.FC<StudentListProps> = ({ students, refreshData }) => {
  // CRUD Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isContractOpen, setIsContractOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Student>>(INITIAL_FORM);
  const [contractAccepted, setContractAccepted] = useState(false);

  // Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentStudent, setPaymentStudent] = useState<Student | null>(null);

  // Messaging Modal States
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [messagingStudent, setMessagingStudent] = useState<Student | null>(null);
  const [messageChannel, setMessageChannel] = useState<'sms' | 'email'>('sms');
  const [messageBody, setMessageBody] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [isSending, setIsSending] = useState(false);

  // --- CRUD HANDLERS ---

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId && !contractAccepted) {
      addNotification('Sözleşme Hatası', 'Lütfen öğrenci kayıt sözleşmesini onaylayın.', 'warning');
      refreshData();
      return;
    }

    if (editingId) {
      // Update existing
      const updated = { ...formData, id: editingId } as Student;
      updateStudentService(updated);
      addNotification('Güncelleme Başarılı', `${formData.fullName} bilgileri güncellendi.`, 'success');
    } else {
      // Create new
      const newStudent: Student = {
        ...formData,
        id: crypto.randomUUID(),
        registrationDate: new Date().toISOString(),
        dob: formData.dob || new Date().toISOString(),
        deskNumber: null,
        nextPaymentDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
      } as Student;
      addStudentService(newStudent);
      addNotification('Kayıt Başarılı', `${formData.fullName} sisteme eklendi.`, 'success');
    }
    closeModal();
    refreshData();
  };

  const handleEdit = (student: Student) => {
    setFormData(student);
    setEditingId(student.id);
    setContractAccepted(true); 
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bu öğrenciyi silmek istediğinize emin misiniz?')) {
      deleteStudentService(id);
      addNotification('Silindi', 'Öğrenci kaydı silindi.', 'info');
      refreshData();
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData(INITIAL_FORM);
    setContractAccepted(false);
  };

  const calculateRemainingDays = (student: Student) => {
    if (!student.nextPaymentDate) return '-';
    
    const nextDate = new Date(student.nextPaymentDate);
    const today = new Date();
    
    // Saat bileşenlerini sıfırla, sadece gün farkına bak
    nextDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (isNaN(nextDate.getTime())) return '-';

    const diffTime = nextDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // --- PAYMENT HANDLERS ---
  const openPaymentModal = (student: Student) => {
      setPaymentStudent(student);
      setIsPaymentModalOpen(true);
  };

  const processPayment = () => {
      if (!paymentStudent) return;
      
      const settings = getSettings();
      let price = 0;
      let category: any = 'Diğer Gelir';

      if (paymentStudent.subscriptionType === SubscriptionType.MONTHLY) {
          price = settings.pricing.monthlyPrice;
          category = 'Aylık Abonelik';
      } else if (paymentStudent.subscriptionType === SubscriptionType.YEARLY) {
          price = settings.pricing.yearlyPrice;
          category = 'Yıllık Abonelik';
      } else {
          price = settings.pricing.trialPrice;
          category = 'Diğer Gelir';
      }

      // 1. Add Transaction to DB
      addTransaction({
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          amount: price,
          type: 'income',
          category: category,
          description: `${paymentStudent.fullName} - ${paymentStudent.subscriptionType} Ödemesi`,
          studentId: paymentStudent.id
      });

      // 2. Update Student in DB
      const today = new Date();
      const nextDate = new Date();
      nextDate.setDate(today.getDate() + 30); // Extend 30 days

      const updatedStudent = {
          ...paymentStudent,
          paymentStatus: PaymentStatus.PAID,
          lastPaymentDate: today.toISOString(),
          nextPaymentDate: nextDate.toISOString()
      };
      
      updateStudentService(updatedStudent);

      setIsPaymentModalOpen(false);
      setPaymentStudent(null);
      
      addNotification('Ödeme Alındı', `${price} TL tutarında ödeme başarıyla kaydedildi.`, 'success');
      refreshData();
  };

  // --- MESSAGING HANDLERS ---
  const handleOpenMessage = (student: Student) => {
    setMessagingStudent(student);
    setMessageBody('');
    setEmailSubject(`${student.fullName} - Bilgilendirme`);
    setIsMessageModalOpen(true);
  };

  const handleSendMessage = async () => {
    if (!messageBody.trim()) { 
        addNotification('Hata', 'Mesaj içeriği boş olamaz.', 'error');
        refreshData();
        return; 
    }
    
    setIsSending(true);
    const target = messageChannel === 'email' ? messagingStudent?.email : messagingStudent?.studentPhone;
    
    if (!target) {
        addNotification('Hata', 'Öğrencinin iletişim bilgisi eksik.', 'error');
        setIsSending(false);
        refreshData();
        return;
    }

    // Mesajı veritabanına kaydet
    await processOutboundMessage(
        target,
        emailSubject,
        messageBody,
        messageChannel,
        messagingStudent?.id
    );

    setIsSending(false);
    setIsMessageModalOpen(false);
    
    // Eğer E-posta ise, kullanıcının mail istemcisini aç
    if (messageChannel === 'email') {
        const mailtoLink = `mailto:${target}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(messageBody)}`;
        window.location.href = mailtoLink;
        addNotification('E-Posta Hazırlandı', 'E-posta programınız açıldı. Lütfen gönder butonuna basınız.', 'info');
    } else {
        // SMS ise zaten processOutboundMessage içinde gönderildi (veya hata döndü)
    }
    
    setMessageBody('');
    refreshData();
  };

  const getPriceForStudent = (s: Student | null) => {
      if(!s) return 0;
      const settings = getSettings();
      if (s.subscriptionType === SubscriptionType.MONTHLY) return settings.pricing.monthlyPrice;
      if (s.subscriptionType === SubscriptionType.YEARLY) return settings.pricing.yearlyPrice;
      return settings.pricing.trialPrice;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Öğrenci Listesi</h2>
        <Button onClick={() => setIsModalOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Yeni Kayıt
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 uppercase">
              <tr>
                <th className="px-6 py-3">Öğrenci</th>
                <th className="px-6 py-3">Abonelik</th>
                <th className="px-6 py-3">Masa</th>
                <th className="px-6 py-3">Bitiş Tarihi</th>
                <th className="px-6 py-3">Durum</th>
                <th className="px-6 py-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map(student => {
                const remainingDays = calculateRemainingDays(student);
                const isUrgent = typeof remainingDays === 'number' && remainingDays < 5;
                const isOverdue = typeof remainingDays === 'number' && remainingDays < 0;
                
                return (
                <tr key={student.id} className="hover:bg-gray-50 group">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{student.fullName}</div>
                    <div className="text-xs text-gray-400">{student.studentPhone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      student.subscriptionType === SubscriptionType.TRIAL ? 'bg-yellow-100 text-yellow-800' : 
                      student.subscriptionType === SubscriptionType.MONTHLY ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {student.subscriptionType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {student.deskNumber ? (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">Masa {student.deskNumber}</span>
                    ) : (
                        <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {student.nextPaymentDate ? new Date(student.nextPaymentDate).toLocaleDateString('tr-TR') : '-'}
                    <div className={`text-xs ${isOverdue ? 'text-red-600 font-extrabold' : isUrgent ? 'text-orange-500 font-bold' : 'text-gray-400'}`}>
                        ({typeof remainingDays === 'number' ? (remainingDays < 0 ? `${Math.abs(remainingDays)} gün geçti` : `${remainingDays} gün kaldı`) : remainingDays})
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-2">
                         <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            student.paymentStatus === PaymentStatus.PAID ? 'bg-green-100 text-green-700' : 
                            student.paymentStatus === PaymentStatus.OVERDUE ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-orange-100 text-orange-700'
                         }`}>
                            {student.paymentStatus}
                         </span>
                         {student.paymentStatus !== PaymentStatus.PAID && (
                             <button 
                                onClick={() => openPaymentModal(student)}
                                className="p-1 bg-green-600 text-white rounded-full hover:bg-green-700 shadow-sm transform hover:scale-110 transition-all"
                                title="Ödeme Al"
                             >
                                <Wallet size={14} />
                             </button>
                         )}
                     </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleOpenMessage(student)} 
                        className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded"
                        title="İletişim"
                      >
                        <MessageSquare size={18} />
                      </button>
                      <button 
                        onClick={() => handleEdit(student)} 
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Düzenle"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(student.id)} 
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Sil"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              )})}
              {students.length === 0 && (
                  <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500 italic">Henüz kayıtlı öğrenci yok.</td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Confirmation Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Ödeme Tahsilatı"
      >
        {paymentStudent && (
            <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                    <Wallet size={32} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900">{paymentStudent.fullName}</h3>
                    <p className="text-gray-500">{paymentStudent.subscriptionType} Abonelik Yenileme</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 my-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Birim Fiyat:</span>
                        <span className="font-bold text-lg">{getPriceForStudent(paymentStudent)} ₺</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>Yeni Bitiş Tarihi:</span>
                        <span>{new Date(new Date().setDate(new Date().getDate() + 30)).toLocaleDateString('tr-TR')}</span>
                    </div>
                </div>

                <div className="text-xs text-left text-gray-400 bg-yellow-50 p-2 rounded border border-yellow-100 flex gap-2">
                    <AlertCircle size={14} className="flex-shrink-0 text-yellow-600" />
                    Bu işlem kasaya gelir olarak işlenecek ve öğrenci durumu "Ödendi" olarak güncellenecektir.
                </div>

                <div className="flex gap-3 mt-6">
                    <Button variant="secondary" onClick={() => setIsPaymentModalOpen(false)} className="flex-1">İptal</Button>
                    <Button variant="success" onClick={processPayment} className="flex-1">Ödemeyi Onayla</Button>
                </div>
            </div>
        )}
      </Modal>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingId ? "Öğrenci Düzenle" : "Yeni Öğrenci Kaydı"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Öğrenci Adı Soyadı</label>
                <input required type="text" className="mt-1 w-full p-2 border rounded" 
                value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
            </div>
             <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Email (Gmail)</label>
                <input type="email" className="mt-1 w-full p-2 border rounded" placeholder="ornek@gmail.com"
                value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Veli Adı</label>
              <input required type="text" className="mt-1 w-full p-2 border rounded"
                 value={formData.parentName} onChange={e => setFormData({...formData, parentName: e.target.value})} />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700">Doğum Tarihi</label>
              <input required type="date" className="mt-1 w-full p-2 border rounded"
                 value={formData.dob ? formData.dob.split('T')[0] : ''} onChange={e => setFormData({...formData, dob: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
               <label className="block text-sm font-medium text-gray-700">Öğrenci Tel</label>
               <input required type="tel" className="mt-1 w-full p-2 border rounded"
                  value={formData.studentPhone} onChange={e => setFormData({...formData, studentPhone: e.target.value})} />
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700">Veli Tel</label>
               <input required type="tel" className="mt-1 w-full p-2 border rounded"
                  value={formData.parentPhone} onChange={e => setFormData({...formData, parentPhone: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-gray-700">Abonelik</label>
               <select className="mt-1 w-full p-2 border rounded"
                  value={formData.subscriptionType} 
                  onChange={e => setFormData({...formData, subscriptionType: e.target.value as SubscriptionType})}>
                  {Object.values(SubscriptionType).map(t => <option key={t} value={t}>{t}</option>)}
               </select>
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700">Durum</label>
               <select className="mt-1 w-full p-2 border rounded"
                  value={formData.paymentStatus} 
                  onChange={e => setFormData({...formData, paymentStatus: e.target.value as PaymentStatus})}>
                  {Object.values(PaymentStatus).map(t => <option key={t} value={t}>{t}</option>)}
               </select>
             </div>
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-700">Notlar</label>
             <textarea className="mt-1 w-full p-2 border rounded"
                value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
          </div>

          {!editingId && (
             <div className="flex items-center gap-2 mt-4 bg-gray-50 p-3 rounded border border-gray-200">
                <input 
                  type="checkbox" 
                  id="contract" 
                  checked={contractAccepted} 
                  onChange={e => setContractAccepted(e.target.checked)}
                  className="h-4 w-4 text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="contract" className="ml-2 text-sm text-gray-700">
                   <button type="button" className="text-brand-600 underline font-medium" onClick={() => setIsContractOpen(true)}>
                     Sözleşme ve Kuralları
                   </button> okudum, kabul ediyorum.
                </label>
             </div>
          )}
          
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="secondary" onClick={closeModal}>İptal</Button>
            <Button type="submit" disabled={!editingId && !contractAccepted}>Kaydet</Button>
          </div>
        </form>
      </Modal>

      {/* Contract Viewer Modal */}
      <Modal
        isOpen={isContractOpen}
        onClose={() => setIsContractOpen(false)}
        title="Kayıt Sözleşmesi"
      >
         <div className="h-64 overflow-y-auto text-sm text-gray-700 space-y-3">
            <h4 className="font-bold">1. Genel Kurallar</h4>
            <p>Salon içerisinde sessizlik zorunludur. Diğer öğrencileri rahatsız edici davranışlar yasaktır.</p>
            <h4 className="font-bold">2. İnternet Kullanımı</h4>
            <p>İnternet sadece eğitim amaçlı kullanılmalıdır. Yasadışı sitelere erişim yasaktır. Log kayıtları 5651 sayılı kanun gereği tutulmaktadır.</p>
            <h4 className="font-bold">3. Ödemeler</h4>
            <p>Ödemeler her ayın 1'i ile 5'i arasında yapılmalıdır. Geciken ödemelerde sistem otomatik SMS gönderir.</p>
            <h4 className="font-bold">4. Demirbaş</h4>
            <p>Masalara ve sandalyelere verilen zararlar öğrenci velisinden tanzim edilir.</p>
         </div>
         <div className="mt-4 flex justify-end">
            <Button onClick={() => { setContractAccepted(true); setIsContractOpen(false); }}>Okudum, Onaylıyorum</Button>
         </div>
      </Modal>

      {/* Messaging Modal */}
      <Modal
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
        title={`Mesaj: ${messagingStudent?.fullName || ''}`}
      >
        <div className="flex flex-col h-[400px]">
            <div className="flex-1 flex flex-col space-y-4 overflow-y-auto p-1">
                <div className="grid grid-cols-2 gap-2">
                    <button 
                        onClick={() => setMessageChannel('sms')}
                        className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${messageChannel === 'sms' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-gray-200'}`}
                    >
                        <Smartphone size={20} /> SMS
                    </button>
                    <button 
                        onClick={() => setMessageChannel('email')}
                        className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${messageChannel === 'email' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white border-gray-200'}`}
                    >
                        <Mail size={20} /> Gmail
                    </button>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 border border-gray-200">
                    <div className="flex justify-between">
                        <span className="font-medium">Alıcı:</span>
                        <span>{messageChannel === 'sms' ? (messagingStudent?.studentPhone || '-') : (messagingStudent?.email || '-')}</span>
                    </div>
                </div>

                {messageChannel === 'email' && (
                    <input 
                        type="text" 
                        className="w-full p-2 border rounded"
                        placeholder="Konu"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                    />
                )}

                <textarea 
                    className="w-full flex-1 p-3 border rounded resize-none"
                    placeholder="Mesajınızı yazın..."
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                ></textarea>

                <div className="text-xs text-gray-400">
                    * Mesaj gönderildiğinde "Mesajlar &gt; Giden Kutusu"na kaydedilecektir.
                </div>

                <Button onClick={handleSendMessage} disabled={isSending} className="w-full justify-center">
                    {isSending ? 'Gönderiliyor...' : 'Gönder'}
                </Button>
            </div>
        </div>
      </Modal>
    </div>
  );
}
