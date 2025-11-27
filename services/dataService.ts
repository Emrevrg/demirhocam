
import { Student, Transaction, AppSettings, Message, AppNotification } from '../types';
import { DEFAULT_SETTINGS } from '../constants';

const STORAGE_KEYS = {
  STUDENTS: 'demir_students',
  TRANSACTIONS: 'demir_transactions',
  SETTINGS: 'demir_settings',
  MESSAGES: 'demir_messages',
  NOTIFICATIONS: 'demir_notifications',
};

// --- STUDENTS CRUD ---
export const getStudents = (): Student[] => {
  const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
  return data ? JSON.parse(data) : [];
};

export const saveStudents = (students: Student[]) => {
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
};

export const addStudentService = (student: Student) => {
    const students = getStudents();
    students.push(student);
    saveStudents(students);
    return students;
};

export const updateStudentService = (updatedStudent: Student) => {
    const students = getStudents();
    const index = students.findIndex(s => s.id === updatedStudent.id);
    if (index !== -1) {
        students[index] = updatedStudent;
        saveStudents(students);
    }
    return students;
};

export const deleteStudentService = (id: string) => {
    let students = getStudents();
    students = students.filter(s => s.id !== id);
    saveStudents(students);
    return students;
};

// --- TRANSACTIONS ---
export const getTransactions = (): Transaction[] => {
  const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
  return data ? JSON.parse(data) : [];
};

export const saveTransactions = (transactions: Transaction[]) => {
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
};

export const addTransaction = (transaction: Transaction) => {
  const current = getTransactions();
  current.push(transaction);
  saveTransactions(current);
  return current;
};

// --- MESSAGES ---
export const getMessages = (): Message[] => {
  const data = localStorage.getItem(STORAGE_KEYS.MESSAGES);
  return data ? JSON.parse(data) : [];
};

export const saveMessage = (message: Message) => {
  const current = getMessages();
  current.push(message);
  localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(current));
};

// --- NOTIFICATIONS ---
export const getNotifications = (): AppNotification[] => {
  const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
  return data ? JSON.parse(data) : [];
};

export const saveNotifications = (notifications: AppNotification[]) => {
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
};

export const addNotification = (title: string, message: string, type: 'success' | 'warning' | 'error' | 'info') => {
  const current = getNotifications();
  const newNotif: AppNotification = {
    id: crypto.randomUUID(),
    title,
    message,
    type,
    date: new Date().toISOString(),
    isRead: false
  };
  // Add to beginning
  current.unshift(newNotif);
  // Keep last 50
  if (current.length > 50) current.pop();
  saveNotifications(current);
  return newNotif;
};

export const markAllNotificationsRead = () => {
    const current = getNotifications();
    const updated = current.map(n => ({...n, isRead: true}));
    saveNotifications(updated);
    return updated;
};

// --- SETTINGS ---
export const getSettings = (): AppSettings => {
  const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  if (data) {
    const parsed = JSON.parse(data);
    if (!parsed.pricing) {
        return { ...parsed, pricing: DEFAULT_SETTINGS.pricing };
    }
    return parsed;
  }
  return DEFAULT_SETTINGS;
};

export const saveSettings = (settings: AppSettings) => {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
};

// --- BACKUP & RESTORE ---
export const createBackup = () => {
  const backup = {
    students: getStudents(),
    transactions: getTransactions(),
    settings: getSettings(),
    messages: getMessages(),
    timestamp: new Date().toISOString(),
    version: '1.1'
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `demir_hocam_yedek_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const restoreBackup = (file: File): Promise<{ success: boolean; message: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        if (data.students && Array.isArray(data.students)) {
            saveStudents(data.students);
            if (data.transactions) saveTransactions(data.transactions);
            if (data.settings) saveSettings(data.settings);
            if (data.messages) localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(data.messages));
            
            resolve({ success: true, message: 'Yedek başarıyla yüklendi.' });
        } else {
            resolve({ success: false, message: 'Geçersiz yedek dosyası formatı.' });
        }
      } catch (err) {
        resolve({ success: false, message: 'Dosya okuma hatası.' });
      }
    };
    reader.readAsText(file);
  });
};

export const generateQRCodeData = (): string => {
    const students = getStudents();
    const fullPayload = {
        students: students
    };
    return JSON.stringify(fullPayload).substring(0, 2500); 
};

export const mergeData = (importedData: any): { success: boolean; message: string } => {
    try {
      if (!importedData) return { success: false, message: 'Veri boş.' };
  
      let updatedCount = 0;
      let newCount = 0;
  
      // 1. Merge Students
      if (importedData.students && Array.isArray(importedData.students)) {
        const currentStudents = getStudents();
        const newStudents = [...currentStudents];
        
        importedData.students.forEach((importedStudent: Student) => {
          const index = newStudents.findIndex(s => s.id === importedStudent.id);
          if (index !== -1) {
            newStudents[index] = { ...newStudents[index], ...importedStudent };
            updatedCount++;
          } else {
            newStudents.push(importedStudent);
            newCount++;
          }
        });
        saveStudents(newStudents);
      }
      return { 
        success: true, 
        message: `Senkronizasyon başarılı: ${newCount} yeni kayıt, ${updatedCount} güncelleme.` 
      };
    } catch (error) {
      console.error("Merge Error:", error);
      return { success: false, message: 'Veri birleştirme hatası oluştu.' };
    }
  };

// --- NETGSM API IMPLEMENTATION ---
const sendNetgsmSMS = async (phone: string, message: string): Promise<{success: boolean, error?: string}> => {
    const settings = getSettings();
    const { username, password, header } = settings.netgsm;

    if (!username || !password || !header) {
        return { success: false, error: 'NetGSM ayarları eksik. Lütfen ayarlardan kullanıcı adı, şifre ve başlık giriniz.' };
    }

    // Telefon numarası temizleme (Boşlukları al, 0 ile başlat)
    let cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone.startsWith('0')) cleanPhone = '0' + cleanPhone;
    if (cleanPhone.length !== 11) {
        return { success: false, error: 'Geçersiz telefon numarası formatı.' };
    }

    // NetGSM API URL (HTTP GET Yöntemi)
    // Mesajın URL encode edilmesi gerekir
    const encodedMessage = encodeURIComponent(message);
    // Not: Gerçek hayatta backend proxy önerilir, fakat bu frontend çözümü için API'ye doğrudan istek atıyoruz.
    const url = `https://api.netgsm.com.tr/sms/send/get/?user=${username}&pass=${password}&msgheader=${header}&msg=${encodedMessage}&no=${cleanPhone}`;

    try {
        const response = await fetch(url);
        const text = await response.text();
        
        // Yanıt kodlarını kontrol et (Dokümantasyona göre)
        // Başarılı format: "00 123456789" (00 boşluk JobID)
        if (text.startsWith('00')) {
            return { success: true };
        }

        // Hata kodları map'lemesi
        const errorMap: Record<string, string> = {
            '20': 'Mesaj metni çok uzun veya karakter sorunu var.',
            '30': 'Geçersiz kullanıcı adı, şifre veya API erişimi yok.',
            '40': 'Mesaj başlığı (Header) sistemde tanımlı değil.',
            '50': 'Abone hesabınızla İYS kontrollü gönderim yapılamaz.',
            '51': 'Aboneliğe ait İYS Marka bilgisi bulunamadı.',
            '60': 'JobID bulunamadı.',
            '70': 'Hatalı sorgulama. Parametreler eksik veya hatalı.',
            '80': 'Gönderim sınır aşımı.',
            '85': 'Mükerrer gönderim sınırı aşıldı (1 dk içinde aynı numaraya çok fazla istek).'
        };

        const errorMsg = errorMap[text.trim()] || `NetGSM Hatası: ${text}`;
        return { success: false, error: errorMsg };

    } catch (error) {
        console.error("NetGSM Network Error:", error);
        // CORS hatası tarayıcıda yaygındır, kullanıcıya bilgi verelim
        return { 
            success: false, 
            error: 'Sunucu bağlantı hatası (CORS). Tarayıcınız NetGSM API isteğini engelliyor olabilir.' 
        };
    }
};

// --- EMAIL/SMS HANDLER ---
export const processOutboundMessage = async (
    to: string, 
    subject: string, 
    body: string, 
    type: 'email' | 'sms',
    studentId?: string
): Promise<boolean> => {
    
    // 1. Önce mesajı kaydet (Giden kutusunda görünsün)
    const newMessage: Message = {
        id: crypto.randomUUID(),
        studentId: studentId,
        recipient: to,
        subject: subject,
        body: body,
        type: type,
        direction: 'outbound',
        date: new Date().toISOString(),
        isRead: true
    };
    saveMessage(newMessage);

    // 2. Eğer SMS ise Gerçek Gönderim Yap
    if (type === 'sms') {
        const result = await sendNetgsmSMS(to, body);
        
        if (!result.success) {
            // Hata bildirimini kullanıcıya göster
            addNotification('SMS Gönderim Hatası', result.error || 'Bilinmeyen hata', 'error');
            return false;
        } else {
            addNotification('SMS İletildi', `NetGSM üzerinden başarıyla gönderildi.`, 'success');
        }
    } else {
        // Email: Sadece kayıt eder, gerçek gönderim UI tarafında mailto ile yapılır.
        // Bu fonksiyon sadece veri tabanı kaydı içindir.
    }

    return true; 
};
