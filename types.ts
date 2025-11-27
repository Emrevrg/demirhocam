
export enum SubscriptionType {
  MONTHLY = 'Aylık',
  YEARLY = 'Yıllık',
  TRIAL = 'Deneme',
}

export enum PaymentStatus {
  PAID = 'Ödendi',
  PENDING = 'Ödeme Bekliyor',
  OVERDUE = 'Gecikmiş',
}

export enum StudentStatus {
  ACTIVE = 'Aktif',
  INACTIVE = 'Pasif',
}

export interface Student {
  id: string;
  fullName: string;
  parentName: string;
  studentPhone: string;
  parentPhone: string;
  dob: string; // ISO Date string
  registrationDate: string; // ISO Date string
  lastPaymentDate?: string; // Son ödeme tarihi
  nextPaymentDate?: string; // Bir sonraki ödeme tarihi
  subscriptionType: SubscriptionType;
  paymentStatus: PaymentStatus;
  deskNumber: number | null;
  notes?: string;
  email?: string;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: 'income' | 'expense';
  category: 'Aylık Abonelik' | 'Yıllık Abonelik' | 'Koçluk' | 'Diğer Gelir' | 'Kira' | 'Fatura' | 'Personel' | 'Diğer Gider';
  description: string;
  studentId?: string;
}

export interface Message {
  id: string;
  studentId?: string;
  recipient: string;
  subject?: string;
  body: string;
  type: 'email' | 'sms';
  direction: 'inbound' | 'outbound';
  date: string;
  isRead: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  date: string;
  isRead: boolean;
}

export interface PricingConfig {
  monthlyPrice: number;
  yearlyPrice: number;
  trialPrice: number;
}

export interface AppSettings {
  netgsm: {
    apiKey: string;
    username: string;
    password: string;
    header: string;
  };
  smtp: {
    email: string;
    appPassword: string;
  };
  security: {
    adminPin: string;
  };
  pricing: PricingConfig;
}

export interface DashboardStats {
  totalStudents: number;
  emptyDesks: number;
  monthlyRevenue: number;
  birthdaysToday: Student[];
}
